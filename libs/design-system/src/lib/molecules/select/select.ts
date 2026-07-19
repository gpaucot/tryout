import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { cn } from '@dash/ui-styles';
import type { SelectOption, SelectOptions } from '@dash/util-types';
import { Input } from '../../atoms/input/input';
import { select, type SelectSize } from './select.variants';

let nextId = 0;

/**
 * Select — molecule.
 * A single-select combobox: a trigger button opens a listbox of options.
 * When `filterable`, a search box at the top narrows the list by full-text
 * (case-insensitive substring) match on the option label.
 *
 * Implements `FormValueControl` so it plugs into Signal/Reactive/Template
 * forms via the `Field` directive, and works standalone via `[(value)]`.
 */
@Component({
  selector: 'ds-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Input],
  templateUrl: './select.html',
  host: {
    '[class]': 'hostClasses()',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class Select<T> implements FormValueControl<T | undefined> {
  /** The choices to render. */
  readonly options = input.required<SelectOptions<T>>();
  /** Currently selected value (two-way; also the `FormValueControl` model). */
  readonly value = model<T | undefined>(undefined);
  /** Show a search box that filters the options. */
  readonly filterable = input<boolean>(false);
  /** Trigger text shown when nothing is selected. */
  readonly placeholder = input<string>('Select…');
  /** Placeholder for the filter search box. */
  readonly searchPlaceholder = input<string>('Filter…');
  readonly size = input<SelectSize>('md');
  readonly invalid = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  /** Extra classes forwarded onto the host element. */
  readonly class = input<string>('');

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly trigger =
    viewChild<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly listboxId = `ds-select-listbox-${nextId++}`;
  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(-1);

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.options();
    if (!this.filterable() || q === '') return all;
    return all.filter((o) => o.label.toLowerCase().includes(q));
  });

  /** Trigger label — reads the full option set so a filtered-out selection still shows. */
  protected readonly selectedLabel = computed(() => {
    const v = this.value();
    return this.options().find((o) => Object.is(o.value, v))?.label ?? '';
  });

  protected readonly hostClasses = computed(() =>
    cn('relative block', this.class()),
  );
  protected readonly triggerClasses = computed(() =>
    select.trigger({
      size: this.size(),
      invalid: this.invalid(),
      open: this.open(),
    }),
  );
  protected readonly listboxClasses = computed(() => select.listbox());

  protected optionClasses(opt: SelectOption<T>, index: number): string {
    return select.option({
      active: this.activeIndex() === index,
      selected: Object.is(opt.value, this.value()),
      disabled: !!opt.disabled,
    });
  }

  protected isSelected(v: T): boolean {
    return Object.is(v, this.value());
  }

  protected toggle(): void {
    if (this.disabled()) return;
    if (this.open()) this.close();
    else this.openPanel();
  }

  protected openPanel(): void {
    this.open.set(true);
    this.activeIndex.set(-1);
  }

  protected close(): void {
    this.open.set(false);
    this.query.set('');
    this.activeIndex.set(-1);
  }

  protected onSearch(value: string): void {
    this.query.set(value);
    // Indices shift when the list narrows — drop the highlight.
    this.activeIndex.set(-1);
  }

  protected select(opt: SelectOption<T>): void {
    if (opt.disabled) return;
    this.value.set(opt.value);
    this.close();
    this.trigger()?.nativeElement.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.open()) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        this.openPanel();
      }
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveActive(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.moveActive(1, true);
        break;
      case 'End':
        event.preventDefault();
        this.moveActive(-1, true);
        break;
      case 'Enter': {
        event.preventDefault();
        const opt = this.filtered()[this.activeIndex()];
        if (opt && !opt.disabled) this.select(opt);
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.close();
        this.trigger()?.nativeElement.focus();
        break;
    }
  }

  /** Move the roving highlight to the next enabled option (skipping disabled). */
  private moveActive(dir: 1 | -1, toEnd = false): void {
    const enabled = this.filtered()
      .map((o, i) => (o.disabled ? -1 : i))
      .filter((i) => i >= 0);
    if (!enabled.length) return;
    if (toEnd) {
      this.activeIndex.set(dir > 0 ? enabled[0] : enabled[enabled.length - 1]);
      return;
    }
    const pos = enabled.indexOf(this.activeIndex());
    if (pos === -1) {
      this.activeIndex.set(dir > 0 ? enabled[0] : enabled[enabled.length - 1]);
      return;
    }
    const next = Math.min(Math.max(pos + dir, 0), enabled.length - 1);
    this.activeIndex.set(enabled[next]);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
