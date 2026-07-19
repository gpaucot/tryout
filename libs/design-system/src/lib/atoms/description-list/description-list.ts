import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { cn } from '@dash/ui-styles';
import type { DescriptionItems } from '@dash/util-types';
import { DescriptionValue } from './description-value';
import { DescriptionPluginRegistry } from './description-list.registry';
import {
  BUILT_IN_DESCRIPTION_PLUGINS,
} from './description-list.plugins';
import { DESCRIPTION_DEFAULT_VALUE_PLUGINS } from './description-list.plugin';
import {
  descriptionList,
  type DescriptionListOrientation,
  type DescriptionListSize,
} from './description-list.variants';

/**
 * DescriptionList — atom.
 * A styled native `<dl>` host that renders term/value pairs from data. It is
 * type-agnostic: each value is rendered by a plugin resolved from the registry,
 * so supporting a new value type never touches this component — register a
 * plugin via `provideDescriptionValuePlugins` instead. Built-ins are supplied
 * here as zero-config defaults through the same plugin contract.
 */
@Component({
  selector: 'dl[ds-description-list]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DescriptionValue],
  providers: [
    DescriptionPluginRegistry,
    {
      provide: DESCRIPTION_DEFAULT_VALUE_PLUGINS,
      useValue: BUILT_IN_DESCRIPTION_PLUGINS,
    },
  ],
  templateUrl: './description-list.html',
  host: { '[class]': 'classes()' },
})
export class DescriptionList {
  readonly items = input.required<DescriptionItems>();
  readonly orientation = input<DescriptionListOrientation>('stacked');
  readonly size = input<DescriptionListSize>('md');
  /** Extra classes forwarded by a composing component. */
  readonly class = input<string>('');

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
