import {
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    input,
    model,
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

    protected readonly hostClasses = computed(() => cn('block', this.class()));
    protected readonly listClasses = computed(() =>
        tabs.list({ orientation: this.orientation() }),
    );
    /** Indicator classes shared by selected buttons and active links. */
    protected readonly activeClasses = computed(() => tabs.active());

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

    /** Roving tabindex: exactly one selection tab is tabbable at a time. */
    protected tabIndex(item: TabItem<T>, index: number): number {
        if (item.link != null) return 0; // links keep their natural tab order
        if (item.disabled) return -1;
        const items = this.items();
        const hasSelection = items.some(
            (it) => it.link == null && this.isSelected(it.value),
        );
        if (hasSelection) return this.isSelected(item.value) ? 0 : -1;
        // Nothing selected yet: make the first enabled selection tab tabbable.
        const first = items.findIndex((it) => it.link == null && !it.disabled);
        return index === first ? 0 : -1;
    }

    protected isSelected(v: T): boolean {
        return Object.is(v, this.value());
    }

    /** A tab is a navigation link when it carries a `link` target. */
    protected isLink(item: TabItem<T>): boolean {
        return item.link !== null && item.link !== undefined;
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
        this.tabEls()[index]?.nativeElement.focus();
        // Selection tabs activate on focus; link tabs only move focus.
        const item = this.items()[index];
        if (item && item.link == null) this.value.set(item.value);
    }
}
