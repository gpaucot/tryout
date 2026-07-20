import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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
});
