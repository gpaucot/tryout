import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { DescriptionPluginRegistry } from './description-list.registry';

/**
 * Generic value outlet. Resolves the plugin component for `type` from the
 * registry and renders it with the value/options, or a dash when empty. This is
 * the only place values are rendered, and container plugins (e.g. 'array') use
 * it recursively — so the core stays entirely type-agnostic.
 */
@Component({
  selector: 'ds-description-value',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet],
  template: `
    @if (component(); as cmp) {
      <ng-container
        [ngComponentOutlet]="cmp"
        [ngComponentOutletInputs]="inputs()"
      ></ng-container>
    } @else {
      {{ fallback() }}
    }
  `,
})
export class DescriptionValue {
  readonly value = input<unknown>(undefined);
  readonly type = input<string>('string');
  readonly options = input<Readonly<Record<string, unknown>>>({});

  private readonly registry = inject(DescriptionPluginRegistry);

  protected readonly component = computed(() =>
    this.value() == null ? null : this.registry.resolve(this.type()),
  );
  protected readonly inputs = computed(() => ({
    value: this.value(),
    options: this.options(),
  }));
  protected readonly fallback = computed(() =>
    this.value() == null ? '—' : String(this.value()),
  );
}
