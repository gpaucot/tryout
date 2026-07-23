# util-types

Shared, framework-agnostic TypeScript types — pure types, **no Angular and no
runtime code**. This is the workspace's lowest layer, so keeping it
dependency-free lets any library consume it without pulling in a framework.

Public API (`@dash/util-types`):

- **Utility types** — `Maybe<T>`, `OneOrMany<T>`, `ElementOf<T>`.
- **Component data shapes** — `SelectOption<T>` / `SelectOptions<T>` (choices for
  select, radio-group, checkbox-group), `TabItem<T>` / `TabItems<T>` (selection and
  navigation tabs), `DescriptionItem` / `DescriptionSection` / `DescriptionItems`
  (term/value pairs, optionally grouped into labelled nested sections) and
  `DescriptionAction` / `DescriptionActions` (buttons beside a section label).

Values are compared by identity (`Object.is`), so use primitives or stable
references for `value` fields.

## Tests

```sh
bunx nx test util-types
bunx nx lint util-types
```
