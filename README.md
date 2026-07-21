# dash

An Angular 21 modular foundation: an Nx monorepo, an internal Atomic-Design
design system, and a thin `dash` app that composes them. It is a
well-architected, boundary-enforced **starting point** — not a finished product.
Domain/business features are intentionally out of scope (see [`prd.md`](./prd.md)
for the full product requirements).

## Architecture

Two ideas shape the whole workspace:

- **Deep modules (Ousterhout).** The Nx _library_ is the deep module: it exposes
  a single narrow public API — one `index.ts` barrel — and hides a rich interior
  (components, `*.variants.ts` styling configs, helpers). We get modularity at the
  library boundary and depth within it. Consumers import from `@dash/design-system`,
  never a deep path like `@dash/design-system/src/lib/atoms/...` (deep imports are
  lint errors).

- **Atomic design.** Components are layered atoms → molecules → organisms →
  templates → pages. State and routing live only at the **page** level, which is
  why pages sit in a feature lib, not the design system.

Dependencies flow one way, enforced in two dimensions: across libraries by Nx tags
(`@nx/enforce-module-boundaries`) and within the design system by ESLint import
rules (atomic direction).

## Layout

```
apps/
  dash/                     Thin application shell; wires the design system into routes.
libs/
  design-system/            The design system (deep module). One barrel: @dash/design-system.
    src/lib/atoms/          Button, Input, DescriptionList
    src/lib/molecules/      FormField, Select, RadioGroup, CheckboxGroup, Tabs
    src/lib/organisms/      AppHeader
    src/lib/templates/      ShellLayout
  home/feature-shell/       Routed pages (own state/routing). @dash/home-feature-shell
  shared/util-types/        Framework-agnostic TypeScript types. @dash/util-types
  shared/ui-styles/          Styling helpers (e.g. `cn`) and tokens. @dash/ui-styles
```

Each library has its own `README.md` describing its purpose and public surface.

## Prerequisites

- [Bun](https://bun.sh) — the package manager for this workspace (`bun.lock`).

```sh
bun install
```

## Common tasks

Run tasks through Nx. The application project is `dash`; libraries are addressed
by their project name (e.g. `design-system`, `util-types`).

```sh
bunx nx serve dash          # dev server
bunx nx build dash          # production bundle → dist/apps/dash
bunx nx test dash           # unit tests (Vitest)
bunx nx lint dash           # ESLint, incl. module-boundary rules

bunx nx test design-system  # test / lint any library by project name
bunx nx run-many -t test lint   # everything
bunx nx affected -t test lint   # only what your changes touched
```

Formatting is handled by [oxfmt](https://github.com/oxc-project/oxfmt) (4-space
indent):

```sh
bun run format         # write
bun run format:check   # verify (CI-friendly)
```

Explore the project graph with `bunx nx graph`.

## Tech stack

Angular 21 (standalone-only, no `NgModule`) · Nx ~23 · Bun · Vitest ·
Tailwind CSS v4 with [tailwind-variants](https://www.tailwind-variants.org) ·
ESLint flat config. See [`prd.md`](./prd.md) §3 for versions and rationale.
