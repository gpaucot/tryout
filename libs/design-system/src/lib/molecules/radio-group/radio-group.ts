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
import { radioGroup, type RadioGroupSize } from './radio-group.variants';

let nextId = 0;

/**
 * RadioGroup — molecule.
 * A single-select group of native radios. When `filterable`, a search box
 * narrows the visible options by full-text (case-insensitive substring) match.
 *
 * Implements `FormValueControl` so it plugs into Signal/Reactive/Template
 * forms via the `Field` directive, and works standalone via `[(value)]`.
 */
@Component({
    selector: 'ds-radio-group',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Input],
    templateUrl: './radio-group.html',
    host: { '[class]': 'hostClasses()' },
})
export class RadioGroup<T> implements FormValueControl<T | undefined> {
    readonly options = input.required<SelectOptions<T>>();
    readonly value = model<T | undefined>(undefined);
    readonly filterable = input<boolean>(false);
    readonly legend = input<string>('');
    readonly searchPlaceholder = input<string>('Filter…');
    readonly size = input<RadioGroupSize>('md');
    readonly invalid = input<boolean>(false);
    readonly disabled = input<boolean>(false);
    readonly required = input<boolean>(false);
    readonly class = input<string>('');

    /** Native `name` that groups the radios. Not the form `name` input. */
    protected readonly groupName = `ds-radio-${nextId++}`;
    protected readonly query = signal('');

    protected readonly filtered = computed(() => {
        const q = this.query().trim().toLowerCase();
        const all = this.options();
        if (!this.filterable() || q === '') return all;
        return all.filter((o) => o.label.toLowerCase().includes(q));
    });

    protected readonly hostClasses = computed(() => cn('block', this.class()));
    protected readonly groupClasses = computed(() => radioGroup.group());
    protected readonly legendClasses = computed(() =>
        radioGroup.legend({ invalid: this.invalid() }),
    );
    protected readonly controlClasses = computed(() => radioGroup.control());

    protected optionClasses(opt: SelectOption<T>): string {
        return radioGroup.option({
            size: this.size(),
            disabled: this.disabled() || !!opt.disabled,
        });
    }

    protected isChecked(v: T): boolean {
        return Object.is(v, this.value());
    }

    protected select(opt: SelectOption<T>): void {
        if (this.disabled() || opt.disabled) return;
        this.value.set(opt.value);
    }
}
