# home-feature-shell

The Home feature: routed **pages** that compose the design system into real
screens. Pages are the atomic top level and the only components allowed to own
state and routing — which is why they live in a feature lib rather than the design
system.

Public API (`@dash/home-feature-shell`):

- **`HOME_ROUTES`** — the feature's route definitions, lazy-loaded by the `dash`
  app (which never reaches into the pages directly).

Internally, `HomePage` fills the `ShellLayout` template with content and holds view
state, and demonstrates extending `DescriptionList` with a custom `badge` value
plugin (`StatusBadgeValue`).

## Tests

```sh
bunx nx test home-feature-shell
bunx nx lint home-feature-shell
```
