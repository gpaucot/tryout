import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { TabItems } from '@dash/util-types';
import { TabPanel } from './tab-panel';
import { Tabs } from './tabs';

// --- selection tabs -------------------------------------------------------

@Component({
    imports: [Tabs, TabPanel],
    template: `<ds-tabs [items]="items()" [(value)]="value" label="Sections">
        <ds-tab-panel value="overview">Overview body</ds-tab-panel>
        <ds-tab-panel value="settings">Settings body</ds-tab-panel>
        <ds-tab-panel value="billing">Billing body</ds-tab-panel>
    </ds-tabs>`,
})
class SelectionHost {
    items = signal<TabItems<string>>([
        { value: 'overview', label: 'Overview' },
        { value: 'settings', label: 'Settings' },
        { value: 'billing', label: 'Billing', disabled: true },
    ]);
    value = signal<string | undefined>('overview');
}

function renderSelection() {
    const fixture = TestBed.createComponent(SelectionHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return { fixture, root };
}

function tabButtons(root: HTMLElement) {
    return Array.from(
        root.querySelectorAll('button[role="tab"]'),
    ) as HTMLButtonElement[];
}

function panels(root: HTMLElement) {
    return Array.from(
        root.querySelectorAll('[role="tabpanel"]'),
    ) as HTMLElement[];
}

describe('Tabs (selection)', () => {
    it('renders a tab per item inside a labelled tablist', () => {
        const { root } = renderSelection();
        expect(
            root.querySelector('[role="tablist"]')?.getAttribute('aria-label'),
        ).toBe('Sections');
        expect(tabButtons(root).map((b) => b.textContent?.trim())).toEqual([
            'Overview',
            'Settings',
            'Billing',
        ]);
    });

    it('marks the value-matching tab selected and shows only its panel', () => {
        const { root } = renderSelection();
        const [overview, settings] = tabButtons(root);
        expect(overview.getAttribute('aria-selected')).toBe('true');
        expect(settings.getAttribute('aria-selected')).toBe('false');

        const visible = panels(root).filter((p) => !p.hidden);
        expect(visible.length).toBe(1);
        expect(visible[0].textContent).toContain('Overview body');
    });

    it('links a tab to its panel via aria-controls / aria-labelledby', () => {
        const { root } = renderSelection();
        const overview = tabButtons(root)[0];
        const panelId = overview.getAttribute('aria-controls');
        const panel = root.querySelector(`#${panelId}`) as HTMLElement;
        expect(panel).not.toBeNull();
        expect(panel.getAttribute('aria-labelledby')).toBe(overview.id);
    });

    it('selects on click and swaps the visible panel', () => {
        const { fixture, root } = renderSelection();
        tabButtons(root)[1].click();
        fixture.detectChanges();

        expect(fixture.componentInstance.value()).toBe('settings');
        const visible = panels(root).filter((p) => !p.hidden);
        expect(visible[0].textContent).toContain('Settings body');
    });

    it('does not select a disabled tab', () => {
        const { fixture, root } = renderSelection();
        const billing = tabButtons(root)[2];
        expect(billing.disabled).toBe(true);
        billing.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.value()).toBe('overview');
    });

    it('uses a roving tabindex — only the selected tab is tabbable', () => {
        const { root } = renderSelection();
        expect(tabButtons(root).map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    });

    it('arrow keys move selection, skipping disabled tabs', () => {
        const { fixture, root } = renderSelection();
        const list = root.querySelector('[role="tablist"]') as HTMLElement;

        tabButtons(root)[0].dispatchEvent(
            new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
        );
        fixture.detectChanges();
        expect(fixture.componentInstance.value()).toBe('settings');

        // From 'settings', ArrowRight skips disabled 'billing' and wraps to 'overview'.
        tabButtons(root)[1].dispatchEvent(
            new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
        );
        fixture.detectChanges();
        expect(fixture.componentInstance.value()).toBe('overview');
        expect(list).toBeTruthy();
    });

    it('scrolls the newly focused tab into view while roaming', () => {
        const { fixture, root } = renderSelection();
        const buttons = tabButtons(root);
        const spy = vi.fn();
        buttons.forEach((b) => (b.scrollIntoView = spy));

        buttons[0].dispatchEvent(
            new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
        );
        fixture.detectChanges();
        expect(spy).toHaveBeenCalled();
    });

    it('pages the strip instantly when reduce-motion is preferred', () => {
        const original = window.matchMedia;
        window.matchMedia = ((query: string) =>
            ({
                matches: true,
                media: query,
            }) as MediaQueryList) as typeof window.matchMedia;
        try {
            const { fixture } = renderSelection();
            const tabs = fixture.debugElement.query(By.directive(Tabs))
                .componentInstance as {
                scrollerEl: () => { nativeElement: HTMLElement };
                scrollTabs: (dir: 1 | -1) => void;
            };
            const scrollBy = vi.fn();
            tabs.scrollerEl().nativeElement.scrollBy = scrollBy;

            tabs.scrollTabs(1);
            expect(scrollBy).toHaveBeenCalledWith(
                expect.objectContaining({ behavior: 'auto' }),
            );
        } finally {
            window.matchMedia = original;
        }
    });
});

// --- navigation tabs ------------------------------------------------------

@Component({
    imports: [Tabs],
    template: `<ds-tabs [items]="items" label="Nav" />`,
})
class NavHost {
    items: TabItems<string> = [
        { value: 'home', label: 'Home', link: '/home', exact: true },
        { value: 'reports', label: 'Reports', link: '/reports' },
    ];
}

describe('Tabs (navigation links)', () => {
    it('renders link tabs as routed anchors and reflects the active route', async () => {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([
                    { path: 'home', component: NavHost },
                    { path: 'reports', component: NavHost },
                ]),
            ],
        });

        const harness = await RouterTestingHarness.create();
        const host = await harness.navigateByUrl('/reports', NavHost);
        harness.detectChanges();

        const root = (harness.routeNativeElement ??
            harness.fixture.nativeElement) as HTMLElement;
        const anchors = Array.from(
            root.querySelectorAll('a[role="tab"]'),
        ) as HTMLAnchorElement[];

        expect(anchors.length).toBe(2);
        expect(anchors.map((a) => a.getAttribute('href'))).toEqual([
            '/home',
            '/reports',
        ]);

        const reports = anchors[1];
        expect(reports.getAttribute('aria-current')).toBe('page');
        expect(reports.getAttribute('aria-selected')).toBe('true');
        expect(anchors[0].getAttribute('aria-selected')).toBe('false');
        expect(host).toBeTruthy();
    });

    it('keeps a single roving tab stop — only the active link is tabbable', async () => {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([
                    { path: 'home', component: NavHost },
                    { path: 'reports', component: NavHost },
                ]),
            ],
        });

        const harness = await RouterTestingHarness.create();
        await harness.navigateByUrl('/reports', NavHost);
        // The active link is recorded in a microtask; flush it, then re-render.
        await Promise.resolve();
        harness.detectChanges();

        const root = (harness.routeNativeElement ??
            harness.fixture.nativeElement) as HTMLElement;
        const anchors = Array.from(
            root.querySelectorAll('a[role="tab"]'),
        ) as HTMLAnchorElement[];

        expect(anchors.map((a) => a.tabIndex)).toEqual([-1, 0]);
    });
});

// --- manual activation ----------------------------------------------------

@Component({
    imports: [Tabs],
    template: `<ds-tabs
        [items]="items"
        [(value)]="value"
        activation="manual"
        label="Sections"
    />`,
})
class ManualHost {
    items: TabItems<string> = [
        { value: 'overview', label: 'Overview' },
        { value: 'settings', label: 'Settings' },
    ];
    value = signal<string | undefined>('overview');
}

describe('Tabs (manual activation)', () => {
    function render() {
        const fixture = TestBed.createComponent(ManualHost);
        fixture.detectChanges();
        const root = fixture.nativeElement as HTMLElement;
        return { fixture, root };
    }

    it('roaming moves focus without changing the value', () => {
        const { fixture, root } = render();
        const buttons = tabButtons(root);
        const focusSpy = vi.spyOn(buttons[1], 'focus');

        buttons[0].dispatchEvent(
            new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
        );
        fixture.detectChanges();

        // Focus moved to 'settings' but the selection is still 'overview'.
        expect(focusSpy).toHaveBeenCalled();
        expect(fixture.componentInstance.value()).toBe('overview');
    });

    it('Enter commits the focused tab', () => {
        const { fixture, root } = render();
        const buttons = tabButtons(root);

        buttons[0].dispatchEvent(
            new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
        );
        buttons[1].dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
        );
        fixture.detectChanges();

        expect(fixture.componentInstance.value()).toBe('settings');
    });

    it('Space commits the focused tab', () => {
        const { fixture, root } = render();
        const buttons = tabButtons(root);

        buttons[1].dispatchEvent(
            new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
        );
        fixture.detectChanges();

        expect(fixture.componentInstance.value()).toBe('settings');
    });
});

// --- icons & badges -------------------------------------------------------

@Component({
    imports: [Tabs],
    template: `<ds-tabs
        [items]="items"
        [value]="'overview'"
        label="Sections"
    />`,
})
class IconBadgeHost {
    items: TabItems<string> = [
        { value: 'overview', label: 'Overview', icon: 'dashboard' },
        { value: 'inbox', label: 'Inbox', badge: 3 },
        { value: 'empty', label: 'Empty', badge: 0 },
    ];
}

describe('Tabs (icons & badges)', () => {
    function render() {
        const fixture = TestBed.createComponent(IconBadgeHost);
        fixture.detectChanges();
        return fixture.nativeElement as HTMLElement;
    }

    it('renders a leading icon for items that declare one', () => {
        const root = render();
        const [overview, inbox] = tabButtons(root);
        const icon = overview.querySelector('span[ds-icon]');
        expect(icon?.textContent?.trim()).toBe('dashboard');
        // Items without an icon render none.
        expect(inbox.querySelector('span[ds-icon]')).toBeNull();
    });

    it('renders a trailing badge, including the zero count', () => {
        const root = render();
        const badges = Array.from(
            root.querySelectorAll('button[role="tab"] > span:not([ds-icon])'),
        ).map((s) => s.textContent?.trim());
        // 'inbox' → 3, 'empty' → 0 (0 is a real count, not "absent").
        expect(badges).toEqual(['3', '0']);
    });
});

// --- vertical overflow affordance -----------------------------------------

@Component({
    imports: [Tabs],
    template: `<ds-tabs
        [items]="items"
        orientation="vertical"
        label="Sections"
    />`,
})
class VerticalHost {
    items: TabItems<string> = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
    ];
}

describe('Tabs (vertical overflow)', () => {
    interface TabsInternals {
        scrollerEl: () => { nativeElement: HTMLElement };
        updateScroll: () => void;
        scrollTabs: (dir: 1 | -1) => void;
        canScroll: (side: 'start' | 'end') => boolean;
        chevronPath: (side: 'start' | 'end') => string;
    }

    function render() {
        const fixture = TestBed.createComponent(VerticalHost);
        fixture.detectChanges();
        const tabs = fixture.debugElement.query(By.directive(Tabs))
            .componentInstance as unknown as TabsInternals;
        return { fixture, tabs };
    }

    it('derives can-scroll from the vertical (block) axis', () => {
        const { tabs } = render();
        const el = tabs.scrollerEl().nativeElement;
        // Simulate an overflowing strip scrolled to the middle.
        Object.defineProperties(el, {
            scrollTop: { value: 40, configurable: true },
            clientHeight: { value: 100, configurable: true },
            scrollHeight: { value: 200, configurable: true },
        });
        tabs.updateScroll();

        expect(tabs.canScroll('start')).toBe(true);
        expect(tabs.canScroll('end')).toBe(true);
    });

    it('pages along the vertical axis', () => {
        const { tabs } = render();
        const scrollBy = vi.fn();
        tabs.scrollerEl().nativeElement.scrollBy = scrollBy;

        tabs.scrollTabs(1);
        expect(scrollBy).toHaveBeenCalledWith(
            expect.objectContaining({ top: expect.any(Number) }),
        );
        expect(scrollBy.mock.calls[0][0]).not.toHaveProperty('left');
    });

    it('points its chevrons up/down when vertical', () => {
        const { tabs } = render();
        expect(tabs.chevronPath('start')).toBe('M5 12l5-5 5 5'); // up
        expect(tabs.chevronPath('end')).toBe('M5 8l5 5 5-5'); // down
    });
});

// --- lazy tab panels ------------------------------------------------------

let lazyChildBuilds = 0;

@Component({
    selector: 'ds-lazy-child',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: 'lazy body',
})
class LazyChild {
    constructor() {
        lazyChildBuilds++;
    }
}

@Component({
    imports: [Tabs, TabPanel, LazyChild],
    template: `<ds-tabs [items]="items" [(value)]="value" label="Sections">
        <ds-tab-panel value="overview">Overview body</ds-tab-panel>
        <ds-tab-panel value="reports" lazy>
            <ng-template><ds-lazy-child /></ng-template>
        </ds-tab-panel>
    </ds-tabs>`,
})
class LazyHost {
    items: TabItems<string> = [
        { value: 'overview', label: 'Overview' },
        { value: 'reports', label: 'Reports' },
    ];
    value = signal<string | undefined>('overview');
}

describe('Tabs (lazy panels)', () => {
    it('defers content until the tab is first activated, then keeps it', () => {
        lazyChildBuilds = 0;
        const fixture = TestBed.createComponent(LazyHost);
        fixture.detectChanges();
        const root = fixture.nativeElement as HTMLElement;

        // Inactive lazy panel: nothing built yet.
        expect(lazyChildBuilds).toBe(0);
        expect(root.textContent).not.toContain('lazy body');

        // Activate the lazy tab → content mounts once.
        fixture.componentInstance.value.set('reports');
        fixture.detectChanges();
        expect(lazyChildBuilds).toBe(1);
        expect(root.textContent).toContain('lazy body');

        // Switch away and back: the panel stays mounted (state preserved).
        fixture.componentInstance.value.set('overview');
        fixture.detectChanges();
        fixture.componentInstance.value.set('reports');
        fixture.detectChanges();
        expect(lazyChildBuilds).toBe(1);
    });
});
