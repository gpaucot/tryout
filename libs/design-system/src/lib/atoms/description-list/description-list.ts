import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { cn } from '@dash/ui-styles';
import type { DescriptionItems } from '@dash/util-types';
import {
  descriptionList,
  type DescriptionListOrientation,
  type DescriptionListSize,
} from './description-list.variants';

/**
 * DescriptionList — atom.
 * A styled native `<dl>` host that renders term/description pairs from data.
 * `orientation` switches between stacked (term above description) and inline
 * (term/description in aligned columns). Purely presentational.
 */
@Component({
  selector: 'dl[ds-description-list]',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
