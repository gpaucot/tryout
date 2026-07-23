import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    model,
    signal,
    viewChild,
    viewChildren,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { cn } from '@dash/ui-styles';
import type { TabItem, TabItems } from '@dash/util-types';
import { tabs, type TabsOrientation, type TabsSize } from './tabs.variants';

let nextId = 0;

/**
 * Tabs — molecule.
 * A tab group with two kinds of tabs, mixable in one strip:
 *
 * - **Selection tabs** (default): `<button role="tab">`s driven by `[(value)]`.
 *   Pair them with projected `<ds-tab-panel [value]>` children to get a full
 *   tab-panel system, or bind `[(value)]` and render your own content.
 * - **Navigation tabs**: any item with a `link` renders as a routed `<a>` whose
 *   active state follows the router (`routerLinkActive`) — for wiring a
 *   tablist to `<router-outlet>` content.
 *
 * Keyboard: Arrow keys roam the strip (Left/Right when horizontal, Up/Down when
 * vertical), Home/End jump to the ends; selection tabs activate on focus.
 */
@Component({
    selector: 'ds-tabs',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './tabs.html',
    host: { '[class]': 'hostClasses()' },
})
export class Tabs<T> {
    /** The tabs to render, in order. */
    readonly items = input.required<TabItems<T>>();
    /** Selected value of the selection tabs (two-way). Ignored by link tabs. */
    readonly value = model<T | undefined>(undefined);
    readonly orientation = input<TabsOrientation>('horizontal');
    readonly size = input<TabsSize>('md');
    /** Accessible label for the tablist. */
    readonly label = input<string>('');
    /** Extra classes forwarded onto the host element. */
    readonly class = input<string>('');

    private readonly groupId = `ds-tabs-${nextId++}`;
    private readonly tabEls = viewChildren<ElementRef<HTMLElement>>('tabEl');
    private readonly scrollerEl =
        viewChild<ElementRef<HTMLElement>>('scroller');

    /** Index of the active navigation link, reported by `routerLinkActive`. */
    private readonly activeLinkIndex = signal<number | null>(null);

    /** Whether the (horizontal) strip can scroll further in each direction. */
    protected readonly canScrollStart = signal(false);
    protected readonly canScrollEnd = signal(false);
    protected readonly isHorizontal = computed(
        () => this.orientation() === 'horizontal',
    );

    protected readonly hostClasses = computed(() => cn('block', this.class()));
    protected readonly scrollerClasses = computed(() =>
        tabs.scroller({ orientation: this.orientation() }),
    );
    protected readonly listClasses = computed(() =>
        tabs.list({ orientation: this.orientation() }),
    );
    /** Indicator classes shared by selected buttons and active links. */
    protected readonly activeClasses = computed(() => tabs.active());

    /**
     * The single tab that participates in the page tab order (roving tabindex).
     * A tablist exposes exactly one Tab stop: the selected selection tab, else
     * the active navigation link, else the first enabled tab of either kind.
     */
    private readonly rovingIndex = computed(() => {
        const items = this.items();
        const selected = items.findIndex(
            (it) => it.link == null && this.isSelected(it.value),
        );
        if (selected !== -1) return selected;
        const activeLink = this.activeLinkIndex();
        if (activeLink != null && !items[activeLink]?.disabled)
            return activeLink;
        return items.findIndex((it) => !it.disabled);
    });

    constructor() {
        let observer: ResizeObserver | undefined;
        afterNextRender(() => {
            const el = this.scrollerEl()?.nativeElement;
            if (!el) return;
            // Recompute the affordance whenever the strip or its content resizes
            // (viewport change, font load, tabs added/removed).
            if (typeof ResizeObserver !== 'undefined') {
                observer = new ResizeObserver(() => this.updateScroll());
                observer.observe(el);
                if (el.firstElementChild)
                    observer.observe(el.firstElementChild);
            }
            this.updateScroll();
        });
        // Re-measure after the tab set or orientation changes.
        effect(() => {
            this.items();
            this.orientation();
            queueMicrotask(() => this.updateScroll());
        });
        inject(DestroyRef).onDestroy(() => observer?.disconnect());
    }

    protected scrollButtonClasses(side: 'start' | 'end'): string {
        return tabs.scrollButton({ side });
    }

    /** Refresh the can-scroll signals from the scroller's geometry. */
    protected updateScroll(): void {
        const el = this.scrollerEl()?.nativeElement;
        if (!el || !this.isHorizontal()) {
            this.canScrollStart.set(false);
            this.canScrollEnd.set(false);
            return;
        }
        const max = el.scrollWidth - el.clientWidth;
        this.canScrollStart.set(el.scrollLeft > 1);
        this.canScrollEnd.set(el.scrollLeft < max - 1);
    }

    /** Page the strip roughly one viewport toward `dir` (1 = end, -1 = start). */
    protected scrollTabs(dir: 1 | -1): void {
        const el = this.scrollerEl()?.nativeElement;
        if (!el) return;
        const behavior = this.prefersReducedMotion() ? 'auto' : 'smooth';
        el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior });
    }

    /** Honour the user's OS "reduce motion" setting for programmatic scrolls. */
    private prefersReducedMotion(): boolean {
        return (
            typeof matchMedia !== 'undefined' &&
            matchMedia('(prefers-reduced-motion: reduce)').matches
        );
    }

    protected tabClasses(item: TabItem<T>): string {
        const base = tabs.tab({
            size: this.size(),
            orientation: this.orientation(),
            disabled: !!item.disabled,
        });
        // Selection tabs highlight from the model; link tabs highlight via
        // routerLinkActive (see the template), so only style buttons here.
        return item.link == null && this.isSelected(item.value)
            ? cn(base, this.activeClasses())
            : base;
    }

    /**
     * Roving tabindex: exactly one tab — selection tab or nav link — is
     * tabbable at a time, so `Tab` enters/leaves the strip while the arrow keys
     * roam within it.
     */
    protected tabIndex(item: TabItem<T>, index: number): number {
        if (item.disabled) return -1;
        return index === this.rovingIndex() ? 0 : -1;
    }

    /**
     * Track which navigation link the router considers active. Deferred to a
     * microtask so the signal write lands outside the current change-detection
     * pass (`routerLinkActive` emits mid-render), avoiding an expression-changed
     * error while keeping the roving index in sync after navigation.
     */
    protected onLinkActive(index: number, active: boolean): void {
        queueMicrotask(() => {
            if (active) this.activeLinkIndex.set(index);
            else if (this.activeLinkIndex() === index)
                this.activeLinkIndex.set(null);
        });
    }

    protected isSelected(v: T): boolean {
        return Object.is(v, this.value());
    }

    /** A tab is a navigation link when it carries a `link` target. */
    protected isLink(item: TabItem<T>): boolean {
        return item.link != null;
    }

    protected select(item: TabItem<T>): void {
        if (item.disabled || item.link != null) return;
        this.value.set(item.value);
    }

    protected onKeydown(event: KeyboardEvent, index: number): void {
        const horizontal = this.orientation() === 'horizontal';
        const next = horizontal ? 'ArrowRight' : 'ArrowDown';
        const prev = horizontal ? 'ArrowLeft' : 'ArrowUp';

        if (event.key === next) this.moveFocus(index, 1);
        else if (event.key === prev) this.moveFocus(index, -1);
        else if (event.key === 'Home') this.focusEnd(1);
        else if (event.key === 'End') this.focusEnd(-1);
        else return;

        event.preventDefault();
    }

    // --- id linkage (public: read by the projected TabPanel) ---------------

    indexOfValue(v: T): number {
        return this.items().findIndex((it) => Object.is(it.value, v));
    }
    tabId(v: T): string {
        return `${this.groupId}-tab-${this.indexOfValue(v)}`;
    }
    panelId(v: T): string {
        return `${this.groupId}-panel-${this.indexOfValue(v)}`;
    }
    isActiveValue(v: T): boolean {
        return Object.is(v, this.value());
    }

    // --- keyboard roving ----------------------------------------------------

    private enabledIndices(): number[] {
        return this.items()
            .map((it, i) => (it.disabled ? -1 : i))
            .filter((i) => i >= 0);
    }

    private moveFocus(from: number, dir: 1 | -1): void {
        const enabled = this.enabledIndices();
        if (!enabled.length) return;
        const pos = enabled.indexOf(from);
        const nextPos =
            pos === -1 ? 0 : (pos + dir + enabled.length) % enabled.length;
        this.focusIndex(enabled[nextPos]);
    }

    private focusEnd(dir: 1 | -1): void {
        const enabled = this.enabledIndices();
        if (!enabled.length) return;
        this.focusIndex(dir > 0 ? enabled[0] : enabled[enabled.length - 1]);
    }

    private focusIndex(index: number): void {
        const el = this.tabEls()[index]?.nativeElement;
        el?.focus();
        // Keep the roving tab visible on an overflowing strip (instant, so
        // rapid arrow-key roaming doesn't queue smooth-scroll animations).
        el?.scrollIntoView?.({ inline: 'nearest', block: 'nearest' });
        // Selection tabs activate on focus; link tabs only move focus.
        const item = this.items()[index];
        if (item && item.link == null) this.value.set(item.value);
    }
}
