import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input as prop,
} from '@angular/core';
import { cn } from '@dash/ui-styles';
import { input, type InputSize } from './input.variants';

/**
 * Input — atom.
 * A styled `<input>` host. `invalid` drives the error visual so molecules
 * (e.g. FormField) can wire validation state without touching class strings.
 */
@Component({
  selector: 'input[ds-input]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  host: {
    '[class]': 'classes()',
    '[attr.aria-invalid]': 'invalid() || null',
  },
})
export class Input {
  readonly size = prop<InputSize>('md');
  readonly invalid = prop<boolean>(false);
  readonly class = prop<string>('');

  protected readonly classes = computed(() =>
    cn(input({ size: this.size(), invalid: this.invalid() }), this.class()),
  );
}
