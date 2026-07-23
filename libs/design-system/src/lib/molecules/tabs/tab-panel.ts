import { NgTemplateOutlet } from '@angular/common';
import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    inject,
    input,
    TemplateRef,
} from '@angular/core';
import { Tabs } from './tabs';
import { tabs } from './tabs.variants';

/**
 * TabPanel — the content region for a selection tab.
 * Project it inside a `<ds-tabs>` and give it the `value` of the tab it belongs
 * to; it shows itself only while that tab is selected and wires the
 * `tabpanel`/`tab` aria relationship through the parent Tabs.
 *
 * **Eager (default).** Content is projected directly and stays in the DOM
 * (hidden) so panel state — form values, scroll — is preserved across tab
 * switches:
 *
 * ```html
 * <ds-tab-panel value="overview">…content…</ds-tab-panel>
 * ```
 *
 * **Lazy.** Set `lazy` and wrap the body in an `<ng-template>`; the content is
 * not created until the tab is first activated, then it stays mounted (so
 * state is preserved from that point on) — ideal for expensive panels behind a
 * tab the user may never open:
 *
 * ```html
 * <ds-tab-panel value="reports" lazy>
 *   <ng-template>…expensive content…</ng-template>
 * </ds-tab-panel>
 * ```
 */
@Component({
    selector: 'ds-tab-panel',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet],
    template: `
        @if (lazy()) {
            @if (rendered()) {
                <ng-container [ngTemplateOutlet]="body() ?? null" />
            }
        } @else {
            <ng-content />
        }
    `,
    host: {
        role: 'tabpanel',
        '[class]': 'panelClasses()',
        '[hidden]': '!active()',
        '[id]': 'panelId()',
        '[attr.aria-labelledby]': 'labelledBy()',
        '[attr.tabindex]': 'active() ? 0 : null',
    },
})
export class TabPanel<T> {
    /** The value of the tab this panel belongs to. */
    readonly value = input.required<T>();
    /**
     * Defer creating the content until the tab is first activated. Requires the
     * body to be wrapped in an `<ng-template>` (a bare projection is created
     * eagerly by Angular and cannot be deferred).
     */
    readonly lazy = input(false, { transform: booleanAttribute });

    /** The `<ng-template>` body, present only in lazy mode. */
    protected readonly body = contentChild(TemplateRef);

    private readonly parent = inject<Tabs<T>>(Tabs);

    protected readonly active = computed(() =>
        this.parent.isActiveValue(this.value()),
    );

    protected readonly panelId = computed(() =>
        this.parent.panelId(this.value()),
    );
    protected readonly labelledBy = computed(() =>
        this.parent.tabId(this.value()),
    );
    protected readonly panelClasses = computed(() => tabs.panel());

    /** Latches once the panel has been activated, so lazy content persists. */
    private latched = false;

    /**
     * Whether the lazy body should be in the DOM. Evaluated each change
     * detection (a method, not a computed, so the latch flips within the same
     * pass the tab becomes active — no extra tick, no first-paint flicker).
     * Renders on first activation and stays rendered thereafter.
     */
    protected rendered(): boolean {
        if (this.active()) this.latched = true;
        return this.latched;
    }
}
