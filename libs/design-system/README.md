# design-system

The internal Atomic-Design UI library — the workspace's central **deep module**.
It exposes one narrow public API (`@dash/design-system`) and hides a rich interior
(component templates, `*.variants.ts` styling configs, private sub-components,
helpers). Import only from the barrel; deep paths are lint errors.

## Layers

Components are organised by atomic level; dependencies flow one way (atoms →
molecules → organisms → templates), enforced by ESLint import rules.

| Layer     | Components                                                                  |
| --------- | --------------------------------------------------------------------------- |
| atoms     | `Button`, `Input`, `DescriptionList`                                        |
| molecules | `FormField`, `Select`, `RadioGroup`, `CheckboxGroup`, `Tabs` (+ `TabPanel`) |
| organisms | `AppHeader`                                                                 |
| templates | `ShellLayout`                                                               |

The public surface is the component classes plus their public variant/size
**types** (e.g. `ButtonIntent`, `SelectSize`). Everything else stays private.
See [`src/index.ts`](./src/index.ts) for the exact exports.

## Theme (design tokens)

The visual theme lives entirely in [`src/styles/tokens.css`](./src/styles/tokens.css)
as Tailwind v4 `@theme` variables — a warm "Flup" furniture palette (cream
surfaces, espresso `ink`, a terracotta `brand` accent and a dark `sidebar`
rail). Components never hard-code colours; they compose semantic utilities
(`bg-surface`, `text-ink`, `bg-brand-500`, `bg-sidebar`, `shadow-card`,
`rounded-card`) that resolve to these tokens, so re-skinning the whole system
is a single-file edit. Apps opt in by importing the token sheet (see
`apps/dash/src/styles.css`).

## Extending DescriptionList

`DescriptionList` renders arbitrary value types through a plugin registry. Register
a formatter for a custom `type` without touching the library:

```ts
providers: [
    provideDescriptionValuePlugins({
        type: 'badge',
        component: StatusBadgeValue,
    }),
];
```

## Tests

```sh
bunx nx test design-system
bunx nx lint design-system
```
