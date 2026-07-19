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
