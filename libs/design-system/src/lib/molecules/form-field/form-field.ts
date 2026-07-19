import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { Input } from '../../atoms/input/input';

let nextId = 0;

/**
 * FormField — molecule.
 * Composes a label + the Input atom + an error message into one labelled,
 * accessible field. No data/business logic; state is passed in.
 */
@Component({
  selector: 'ds-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Input],
  templateUrl: './form-field.html',
})
export class FormField {
  readonly label = input.required<string>();
  readonly placeholder = input<string>('');
  readonly error = input<string>('');

  protected readonly fieldId = `ds-field-${nextId++}`;
  protected readonly invalid = computed(() => this.error().length > 0);
}
