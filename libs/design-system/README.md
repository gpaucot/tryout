# design-system

The internal Atomic-Design UI library — the workspace's central **deep module**.
It exposes one narrow public API (`@dash/design-system`) and hides a rich interior
(component templates, `*.variants.ts` styling configs, private sub-components,
helpers). Import only from the barrel; deep paths are lint errors.

## Layers

Components are organised by atomic level; dependencies flow one way (atoms →
molecules → organisms → templates), enforced by ESLint import rules.

| Layer     | Components                                                                                     |
| --------- | --------------------------------------------------------------------------------------------- |
| atoms     | `Button`, `Input`, `Icon`, `DescriptionList`                                                   |
| molecules | `FormField`, `Select`, `RadioGroup`, `CheckboxGroup`, `Tabs` (+ `TabPanel`), `MermaidDiagram`  |
| organisms | `AppHeader`, `Table`                                                                           |
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

## Icons

The `Icon` atom renders [Material Symbols](https://fonts.google.com/icons)
(the **Outlined** style) as an icon font. Pass the glyph's ligature name:

```html
<span ds-icon name="settings"></span>
<span ds-icon name="shopping_bag" size="sm" [filled]="true"></span>
```

`size` (`sm` | `md` | `lg`) scales the glyph and matches the optical-size axis;
`filled` toggles the `FILL` axis and `weight` the stroke `wght`. Icons are
decorative (`aria-hidden`) unless given a `label`, which exposes them as
`role="img"`.

The font files load from Google Fonts via a `<link>` in the consuming app's
`index.html`; the `.ds-icon` base class ships in
[`src/styles/icons.css`](./src/styles/icons.css) (apps import it alongside the
token sheet).

## Table

The `Table` organism is a config-driven data grid: pass `data` plus a
`TableColumns<T>` config and it renders, sorts and edits with no templates.
It virtual-scrolls on **both axes** (only the rows and middle columns
intersecting the viewport are in the DOM) with variable sizes — row heights
via `rowHeight` (number or per-row function), column widths via each column's
`width`. The header is pinned, and columns can pin to either edge
(`pin: 'left' | 'right'`). Clicking a `sortable` header cycles
asc → desc → unsorted through the two-way `sort` model; double-clicking an
`editable` cell opens its inline editor (`text` or `number` — Enter/blur
commits, Escape cancels).

The table is _uncontrolled_: it works on an internal copy of `data` (re-seeded
when the input changes), applies sorts and edits itself, and reports back via
`(cellEdit)` (the single change) and `(dataChange)` (the full updated array).
Size the host to bound the grid:

```html
<ds-table
    class="h-96"
    [data]="rows"
    [columns]="columns"
    [rowHeight]="44"
    [(sort)]="sort"
    (cellEdit)="onEdit($event)"
/>
```

Column behaviour is described per column: `value` reads a cell (default
`row[key]`), `format` renders it, `compare` sorts it, `parse`/`update` commit
an edit back onto the row. See `TableColumn<T>` in `@dash/util-types`.

## DescriptionList sections

Entries in a `DescriptionList` can be labelled sections (`{ label, items }`)
that nest arbitrarily. Each section renders its label as a heading followed by
the nested list; the `headingLevel` input (default `3`) sets the level of
top-level labels, and every nesting depth uses the next level down, capped at
`<h6>`.

Sections can also carry `actions` — buttons (icon and/or label) rendered
beside the section label. Below the `sm` breakpoint they collapse behind a
3-dots trigger that opens an overflow menu. Every activation, at any nesting
depth, surfaces through the list's `action` output as
`{ action, section }`:

```html
<ds-description-list [items]="details" (action)="onAction($event)" />
```

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

## Mermaid diagrams

The `MermaidDiagram` molecule renders a [mermaid](https://mermaid.js.org)
diagram from its text `source`, re-rendering whenever the source changes. The
drawing is produced by an injected renderer and its SVG is placed into the
output container; the current state is reflected on the host as `data-status`
(`loading` | `ready` | `error`) and reported through `(rendered)` /
`(errored)`. Pass `label` to expose the diagram to assistive tech as
`role="img"` (omit it and the drawing is decorative):

```html
<ds-mermaid-diagram [source]="'graph TD; A-->B; A-->C'" label="Build flow" />
```

The heavy `mermaid` bundle is loaded lazily on first render, so nothing is
pulled in until a diagram is actually drawn. Configure it once (theme, security
level, …) at any injector scope:

```ts
providers: [provideMermaid({ theme: 'neutral' })];
```

The renderer is an injectable abstraction (`MERMAID_RENDERER`), so a component
can also be given a stub in tests or a bespoke renderer in production. Because
the SVG is written imperatively (Angular's HTML sanitizer would strip the
`<svg>`), the diagram relies on mermaid's own sanitization — keep
`securityLevel` at `strict`/`sandbox` for untrusted input (the default).

## Tests

```sh
bunx nx test design-system
bunx nx lint design-system
```
