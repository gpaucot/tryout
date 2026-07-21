# ui-styles

Shared styling helpers for composing Tailwind classes.

Public API (`@dash/ui-styles`):

- **`cn`** — the project-wide Tailwind class merger (an `extendTailwindMerge`
  instance). `tailwind-variants` (`tv()`) resolves conflicts _within_ a single
  variant definition; `cn` covers the other case — composing a `tv()` result with
  ad-hoc classes passed in by a consumer (e.g. a molecule forwarding a `class`
  input to an atom) so last-writer-wins semantics stay consistent. Register custom
  token groups in [`src/lib/ui-styles.ts`](./src/lib/ui-styles.ts) if a bespoke
  utility ever needs to participate in conflict resolution.

## Tests

```sh
bunx nx test ui-styles
bunx nx lint ui-styles
```
