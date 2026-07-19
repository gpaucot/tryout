import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { cn } from '@dash/ui-styles';
import type { SelectOption, SelectOptions } from '@dash/util-types';
import { Input } from '../../atoms/input/input';
import {
  checkboxGroup,
  type CheckboxGroupSize,
} from './checkbox-group.variants';

/**
 * CheckboxGroup — molecule.
 * A multi-select group of native checkboxes; `value` is the array of checked
 * option values. When `filterable`, a search box narrows the visible options
 * by full-text (case-insensitive substring) match.
 *
 * Implements `FormValueControl` so it plugs into Signal/Reactive/Template
 * forms via the `Field` directive, and works standalone via `[(value)]`.
 */
@Component({
  selector: 'ds-checkbox-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Input],
  templateUrl: './checkbox-group.html',
  host: { '[class]': 'hostClasses()' },
})
export class CheckboxGroup<T> implements FormValueControl<readonly T[]> {
  readonly options = input.required<SelectOptions<T>>();
  readonly value = model<readonly T[]>([]);
  readonly filterable = input<boolean>(false);
  readonly legend = input<string>('');
  readonly searchPlaceholder = input<string>('Filter…');
  readonly size = input<CheckboxGroupSize>('md');
  readonly invalid = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly class = input<string>('');

  protected readonly query = signal('');

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.options();
    if (!this.filterable() || q === '') return all;
    return all.filter((o) => o.label.toLowerCase().includes(q));
  });

  protected readonly hostClasses = computed(() => cn('block', this.class()));
  protected readonly groupClasses = computed(() => checkboxGroup.group());
  protected readonly legendClasses = computed(() =>
    checkboxGroup.legend({ invalid: this.invalid() }),
  );
  protected readonly controlClasses = computed(() => checkboxGroup.control());

  protected optionClasses(opt: SelectOption<T>): string {
    return checkboxGroup.option({
      size: this.size(),
      disabled: this.disabled() || !!opt.disabled,
    });
  }

  protected isChecked(v: T): boolean {
    return this.value().some((x) => Object.is(x, v));
  }

  protected toggle(opt: SelectOption<T>): void {
    if (this.disabled() || opt.disabled) return;
    const current = this.value();
    // Replace immutably so `model()` emits on the identity change.
    this.value.set(
      this.isChecked(opt.value)
        ? current.filter((x) => !Object.is(x, opt.value))
        : [...current, opt.value],
    );
  }
}
