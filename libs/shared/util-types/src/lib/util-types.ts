/**
 * Shared, framework-agnostic types. Pure TypeScript — no Angular, no runtime.
 * Keep this layer dependency-free so any lib can consume it.
 */

/** Marks a value that may not be present. */
export type Maybe<T> = T | null | undefined;

/** A value or an array of values. */
export type OneOrMany<T> = T | readonly T[];

/** Extract the element type of an array. */
export type ElementOf<T extends readonly unknown[]> = T[number];

/**
 * A single choice in a select / radio-group / checkbox-group.
 * `value` should be a primitive or a stable reference — membership and
 * pre-selection compare by identity (`Object.is`).
 */
export interface SelectOption<T> {
    readonly value: T;
    readonly label: string;
    readonly disabled?: boolean;
}

/** A collection of choices. */
export type SelectOptions<T> = readonly SelectOption<T>[];

/**
 * A single term/value pair in a description list.
 *
 * `value` is intentionally `unknown`: how it renders is decided by the
 * formatter selected via `type` (e.g. 'currency', 'email', 'array'). `type`
 * defaults to 'string' and is open-ended — register a formatter for any custom
 * type without changing the component.
 */
export interface DescriptionItem {
    readonly term: string;
    readonly value: unknown;
    /** Formatter discriminator. Defaults to 'string'. */
    readonly type?: string;
    /** Formatter-specific options (currency code, locale, boolean labels, …). */
    readonly options?: Readonly<Record<string, unknown>>;
}

/** A collection of term/value pairs. */
export type DescriptionItems = readonly DescriptionItem[];
