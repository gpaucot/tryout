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
    switch (this.label()) {
      case 'gold':
        return 'bg-brand-50 text-brand-700';
      case 'danger':
        return 'bg-danger-600/10 text-danger-600';
      default:
        return 'bg-surface-muted text-current/70';
    }
  });
}
