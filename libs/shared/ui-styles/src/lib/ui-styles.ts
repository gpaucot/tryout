import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Project-wide Tailwind class merger.
 *
 * `tailwind-variants` (`tv()`) handles conflict resolution inside a single
 * variant definition. `cn` is for the other case: composing a `tv()` result
 * with ad-hoc classes passed in from a consumer (e.g. a molecule forwarding a
 * `class` input to an atom) so last-writer-wins semantics stay consistent.
 *
 * Register custom token groups here if a bespoke utility ever needs to
 * participate in conflict resolution.
 */
export const cn = extendTailwindMerge({});
