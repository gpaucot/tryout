import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
} from '@angular/core';
import { Tabs } from './tabs';
import { tabs } from './tabs.variants';

/**
 * TabPanel — the content region for a selection tab.
 * Project it inside a `<ds-tabs>` and give it the `value` of the tab it belongs
 * to; it shows itself only while that tab is selected and wires the
 * `tabpanel`/`tab` aria relationship through the parent Tabs.
 *
 * Content stays in the DOM (hidden) so panel state — form values, scroll — is
 * preserved across tab switches.
 */
@Component({
    selector: 'ds-tab-panel',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: '<ng-content />',
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
}
