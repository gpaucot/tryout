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

/** A single term/description pair in a description list. */
export interface DescriptionItem {
  readonly term: string;
  readonly description: string;
}

/** A collection of term/description pairs. */
export type DescriptionItems = readonly DescriptionItem[];
