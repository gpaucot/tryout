import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
} from '@angular/core';
import type { DescriptionValueComponent } from '@dash/design-system';

/**
 * A consumer-authored DescriptionList value plugin: renders a status string as
 * a coloured badge. It lives in this feature lib — the design system is never
 * touched to add a new value type. Registered via
 * `provideDescriptionValuePlugins({ type: 'badge', component: StatusBadgeValue })`.
 */
@Component({
    selector: 'app-status-badge-value',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<span
        class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
        [class]="tone()"
        >{{ label() }}</span
    >`,
})
export class StatusBadgeValue implements DescriptionValueComponent {
    readonly value = input<unknown>(undefined);
    readonly options = input<Readonly<Record<string, unknown>>>({});

    protected readonly label = computed(() => String(this.value() ?? ''));
    protected readonly tone = computed(() => {
        switch (this.label().toLowerCase()) {
            case 'in progress':
            case 'info':
                return 'bg-info-50 text-info-700';
            case 'completed':
            case 'success':
            case 'gold':
                return 'bg-success-50 text-success-700';
            case 'returned':
            case 'warning':
                return 'bg-warning-50 text-warning-700';
            case 'cancelled':
            case 'canceled':
            case 'danger':
                return 'bg-danger-50 text-danger-700';
            default:
                return 'bg-surface-muted text-ink-muted';
        }
    });
}
