import {
  InjectionToken,
  type InputSignal,
  type Provider,
  type Type,
} from '@angular/core';

/**
 * The contract every value plugin's component satisfies: a standalone component
 * exposing `value` and `options` signal inputs. The plugin fully owns how the
 * value renders — the core places no constraints on its output.
 */
export interface DescriptionValueComponent {
  readonly value: InputSignal<unknown>;
  readonly options: InputSignal<Readonly<Record<string, unknown>>>;
}

/**
 * A plugin binds a value `type` to the component that renders it.
 * This is the single extension unit — built-ins and user plugins share it.
 */
export interface DescriptionValuePlugin {
  /** The `DescriptionItem.type` this plugin handles (e.g. 'currency'). */
  readonly type: string;
  /** The component that renders values of this type. */
  readonly component: Type<DescriptionValueComponent>;
}

/**
 * Public extension token. Register plugins here (app, route, or component
 * scope) to add or override value types — the core reads only this abstraction
 * and never hardcodes types.
 */
export const DESCRIPTION_VALUE_PLUGINS = new InjectionToken<
  readonly DescriptionValuePlugin[]
>('DESCRIPTION_VALUE_PLUGINS');

/**
 * Internal token the DescriptionList uses to supply the built-in plugins as
 * zero-config defaults. Not part of the public API — consumers use
 * {@link DESCRIPTION_VALUE_PLUGINS} / {@link provideDescriptionValuePlugins}.
 */
export const DESCRIPTION_DEFAULT_VALUE_PLUGINS = new InjectionToken<
  readonly DescriptionValuePlugin[]
>('DESCRIPTION_DEFAULT_VALUE_PLUGINS');

/**
 * Register one or more value plugins for the DescriptionList. A plugin whose
 * `type` matches a built-in overrides it. Provide at any injector scope above
 * the list (bootstrap, route, or a host component's `providers`).
 *
 * @example
 * providers: [
 *   provideDescriptionValuePlugins({ type: 'badge', component: BadgeValue }),
 * ]
 */
export function provideDescriptionValuePlugins(
  ...plugins: readonly DescriptionValuePlugin[]
): Provider[] {
  return plugins.map((plugin) => ({
    provide: DESCRIPTION_VALUE_PLUGINS,
    useValue: plugin,
    multi: true,
  }));
}
