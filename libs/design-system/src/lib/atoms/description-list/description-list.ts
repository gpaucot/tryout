import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { cn } from '@dash/ui-styles';
import type { DescriptionItems } from '@dash/util-types';
import { BUILT_IN_DESCRIPTION_FORMATTERS } from './description-list.formatters';
import {
  DESCRIPTION_VALUE_FORMATTERS,
  type DescriptionFormatContext,
  type DescriptionRendering,
  type DescriptionValueFormatter,
} from './description-list.model';
import {
  descriptionList,
  type DescriptionListOrientation,
  type DescriptionListSize,
} from './description-list.variants';

/**
 * DescriptionList — atom.
 * A styled native `<dl>` host that renders term/value pairs from data. Values
 * of any type (string, number, currency, boolean, phone, url, email, array, …)
 * are rendered by pluggable formatters resolved from DI, so the component never
 * changes when a new value type is added — provide a formatter instead
 * (`provideDescriptionValueFormatters`). Purely presentational.
 */
@Component({
  selector: 'dl[ds-description-list]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './description-list.html',
  host: { '[class]': 'classes()' },
})
export class DescriptionList {
  readonly items = input.required<DescriptionItems>();
  readonly orientation = input<DescriptionListOrientation>('stacked');
  readonly size = input<DescriptionListSize>('md');
  /** Extra classes forwarded by a composing component. */
  readonly class = input<string>('');

  private readonly injected = inject(DESCRIPTION_VALUE_FORMATTERS, {
    optional: true,
  });

  /** Built-ins are the defaults; injected formatters override/extend by type. */
  private readonly registry = computed(() => {
    const byType = new Map<string, DescriptionValueFormatter>();
    for (const formatter of BUILT_IN_DESCRIPTION_FORMATTERS) {
      byType.set(formatter.type, formatter);
    }
    for (const formatter of this.injected ?? []) {
      byType.set(formatter.type, formatter);
    }
    return byType;
  });

  protected readonly rows = computed(() =>
    this.items().map((item) => ({
      term: item.term,
      rendering: this.render(item.value, item.type, item.options),
    })),
  );

  private render(
    value: unknown,
    type = 'string',
    options: Readonly<Record<string, unknown>> = {},
  ): DescriptionRendering {
    if (value == null) return { display: 'text', text: '—' };
    const registry = this.registry();
    const formatter = registry.get(type) ?? registry.get('string');
    if (!formatter) return { display: 'text', text: String(value) };
    const context: DescriptionFormatContext = {
      options,
      render: (v, t, o) => this.render(v, t ?? 'string', o ?? {}),
    };
    return formatter.format(value, context);
  }

  protected readonly classes = computed(() =>
    cn(
      descriptionList.root({
        size: this.size(),
        orientation: this.orientation(),
      }),
      this.class(),
    ),
  );
  protected readonly rowClasses = computed(() =>
    descriptionList.row({ orientation: this.orientation() }),
  );
  protected readonly termClasses = descriptionList.term();
  protected readonly descriptionClasses = descriptionList.description();
}
