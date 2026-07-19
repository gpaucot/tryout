import { InjectionToken, type Provider } from '@angular/core';

/**
 * The rendering vocabulary a formatter emits. Small and stable: every value
 * type — built-in or custom — reduces to text, a link, or a list of these.
 * The template knows only these three shapes, so new value types never require
 * template changes (Open/Closed).
 */
export type DescriptionRendering =
  | { readonly display: 'text'; readonly text: string }
  | {
      readonly display: 'link';
      readonly href: string;
      readonly label: string;
      readonly external?: boolean;
    }
  | { readonly display: 'list'; readonly items: readonly DescriptionRendering[] };

/**
 * Context handed to every formatter. `options` carries the item's per-value
 * config; `render` lets a container formatter (e.g. 'array') format its
 * children through the same registry without depending on other formatters
 * directly (Dependency Inversion).
 */
export interface DescriptionFormatContext {
  readonly options: Readonly<Record<string, unknown>>;
  render(
    value: unknown,
    type?: string,
    options?: Readonly<Record<string, unknown>>,
  ): DescriptionRendering;
}

/**
 * The single extension point. One formatter handles one value `type`
 * (Single Responsibility) and satisfies one contract (Liskov). Register more
 * via {@link provideDescriptionValueFormatters}; a formatter whose `type`
 * matches a built-in overrides it.
 */
export interface DescriptionValueFormatter {
  /** The `DescriptionItem.type` this formatter handles. */
  readonly type: string;
  format(value: unknown, context: DescriptionFormatContext): DescriptionRendering;
}

/**
 * Multi-provider token the DescriptionList injects. Consumers add formatters
 * without touching the component — the component depends on this abstraction,
 * not on concrete formatters.
 */
export const DESCRIPTION_VALUE_FORMATTERS = new InjectionToken<
  readonly DescriptionValueFormatter[]
>('DESCRIPTION_VALUE_FORMATTERS');

/**
 * Register one or more value formatters for the DescriptionList. Later
 * registrations (and app-level ones) override built-ins with the same `type`.
 *
 * @example
 * providers: [
 *   provideDescriptionValueFormatters(
 *     { type: 'percent', format: (v) => ({ display: 'text', text: `${v}%` }) },
 *   ),
 * ]
 */
export function provideDescriptionValueFormatters(
  ...formatters: readonly DescriptionValueFormatter[]
): Provider[] {
  return formatters.map((formatter) => ({
    provide: DESCRIPTION_VALUE_FORMATTERS,
    useValue: formatter,
    multi: true,
  }));
}
