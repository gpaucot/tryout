# PRD — Angular 21 Modular Foundation

**Status:** Draft · **Owner:** gpaucot · **Date:** 2026-07-19 · **Type:** Technical foundation (no business features)

---

## 1. Overview & Goal

Build the **foundation** for a new Angular 21 application: a modular Nx monorepo, an internal Atomic-Design design system, and a thin dash app that ties them together. The goal is a well-architected, boundary-enforced starting point — _not_ a finished product. Domain/business features come later and are explicitly out of scope here.

The foundation must demonstrate, end to end, one complete **atomic vertical slice**: an atom (Button) composed up through a molecule, organism, and template, into a routed page. That slice proves the architecture, styling, testing, and module boundaries all work together.

**Design philosophy — deep modules.** Following Ousterhout's _A Philosophy of Software Design_: modules should have **narrow interfaces hiding deep implementations**. The user asked for something "very modular" _and_ "deep modules" — two forces that pull in opposite directions if applied naively (atomic design tempts you toward dozens of shallow modules). We reconcile them with one rule:

> **The Nx _library_ is the deep module. Standalone components are its internal units.**

A library exposes a single narrow public API (one `index.ts` barrel) and hides a rich internal implementation (all its components, variants, helpers). We get modularity at the library boundary and depth within it.

---

## 2. Non-Goals

- ❌ No business/domain features (no auth, no real data models, no CRUD).
- ❌ No `data-access` layer yet (HTTP/state) — reserved as a future extension.
- ❌ No Storybook. Components are developed/documented via the dash app and unit tests.
- ❌ No npm publishing. The design system is an **internal** library only.
- ❌ No e2e framework, no CI/CD pipeline, no deployment config in this phase.
- ❌ No SSR/hydration, i18n, or PWA setup in this phase.

---

## 3. Tech Stack & Versions

| Concern         | Choice                                   | Version (Jul 2026)   | Notes                                             |
| --------------- | ---------------------------------------- | -------------------- | ------------------------------------------------- |
| Framework       | Angular                                  | **21.x** (`v21-lts`) | Standalone-only; no `NgModule`.                   |
| Monorepo        | Nx                                       | **~23**              | Bun as PM; inferred (crystal) targets.            |
| Package manager | **Bun**                                  | current              | `packageManager: "bun"` in `nx.json`; `bun.lock`. |
| Build/serve     | `@angular/build`                         | matches Angular      | `:application`, `:dev-server` (esbuild/Vite).     |
| Unit tests      | **Vitest** (AnalogJS runner, see §17)    | Vitest **^4**        | jsdom. `@nx/vitest:test` + `vite.config.mts`.     |
| Styling         | **Tailwind CSS v4**                      | 4.x                  | CSS-first; `@tailwindcss/postcss`.                |
| Variants        | **tailwind-variants** (`tv()`)           | 3.x                  | Peer: `tailwind-merge` **>=3**.                   |
| Lint/boundaries | ESLint flat config + `@nx/eslint-plugin` | matches Nx           | `@nx/enforce-module-boundaries`.                  |

**Experimental / rough-edge flags** (tracked in §15):

- Angular 21's native Vitest builder is _stable but young_; some CJS/directory-import libs choke under it.
- Bun + Nx generators occasionally assume npm-style layouts (postinstall/native binaries) — verify optional peers are installed explicitly.
- Tailwind v4 + `tailwind-merge` versions are coupled — pin them together.

**Workspace npm scope:** `@dash` throughout this document (e.g. `@dash/design-system`). This is a placeholder inherited from the prior workspace name and is trivially changeable — pick the real scope before scaffolding.

---

## 4. Architectural Principles

1. **No NgModules.** Everything is a standalone component/directive/pipe. App wiring is functional: `bootstrapApplication`, `provideRouter`, `provideHttpClient`.
2. **The library is the deep module.** Each Nx lib publishes exactly **one** public entry point (`src/index.ts`). Consumers import only from the barrel (`@dash/design-system`), never a deep path (`@dash/design-system/src/lib/atoms/...`). Deep imports are lint errors.
3. **Narrow surface, deep interior.** Export the minimum: the component class and the _public_ variant/size **types**. Keep implementation details private — `*.variants.ts` (`tv()` configs), private sub-components, internal helpers, directives, pipes.
4. **Dependencies flow one way.** Enforced in two dimensions: across libraries by Nx tags (`type:*` layering) and within the design system by ESLint import rules (atomic direction).
5. **Presentational vs. routed.** The design system is 100% presentational and data-agnostic (atoms → templates). Anything that injects services, holds state, or is routed lives in a **feature** lib, not the design system.
6. **Thin shell.** The app is a host: it configures providers and lazy-loads feature routes. It contains almost no logic.

---

## 5. Workspace Layout

```
@dash workspace/
├─ nx.json                          # packageManager: bun; plugins; target defaults
├─ package.json · bun.lock
├─ tsconfig.base.json               # one path alias per lib barrel
├─ .postcssrc.json                  # { "plugins": { "@tailwindcss/postcss": {} } }
├─ eslint.config.mjs                # flat config + enforce-module-boundaries
│
├─ apps/
│  └─ dash/                        # thin routed host  (type:app, scope:dash)
│     ├─ project.json
│     ├─ tsconfig.app.json · tsconfig.spec.json
│     ├─ index.html
│     └─ src/
│        ├─ main.ts                 # bootstrapApplication(App, appConfig)
│        ├─ styles.css              # @import "tailwindcss"; tokens; @source libs
│        ├─ test-setup.ts           # re-exports @dash/shared/test-setup
│        └─ app/
│           ├─ app.ts               # standalone root <App>
│           ├─ app.html
│           ├─ app.config.ts        # provideRouter, provideHttpClient, ...
│           ├─ app.routes.ts        # lazy routes → feature libs
│           └─ app.spec.ts
│
└─ libs/
   ├─ design-system/                # ONE deep lib  (type:ui, scope:shared)
   │  ├─ project.json · tsconfig.*.json
   │  └─ src/
   │     ├─ index.ts                # NARROW public barrel
   │     ├─ test-setup.ts
   │     ├─ styles/
   │     │  └─ tokens.css           # @theme { --color-*, --radius-*, ... }
   │     └─ lib/
   │        ├─ atoms/
   │        │  └─ button/{button.ts, button.html, button.variants.ts, button.spec.ts}
   │        ├─ molecules/
   │        │  └─ form-field/{form-field.ts, form-field.html, form-field.spec.ts}
   │        ├─ organisms/
   │        │  └─ app-header/{app-header.ts, app-header.html, app-header.spec.ts}
   │        └─ templates/
   │           └─ shell-layout/{shell-layout.ts, shell-layout.html, shell-layout.spec.ts}
   │
   ├─ shared/
   │  ├─ ui-styles/                 # cn() + tailwind-merge config  (type:util, scope:shared)
   │  │  └─ src/{index.ts, lib/cn.ts}
   │  ├─ util-types/                # pure TS types, no Angular      (type:util, scope:shared)
   │  │  └─ src/index.ts
   │  └─ test-setup/                # shared Vitest env setup        (type:util, scope:shared)
   │     └─ src/{index.ts, lib/setup.ts}
   │
   └─ home/
      └─ feature-shell/             # example feature; PAGES live here (type:feature, scope:home)
         └─ src/
            ├─ index.ts             # exports HOME_ROUTES only
            └─ lib/
               ├─ home.routes.ts
               └─ pages/
                  └─ home-page/{home-page.ts, home-page.html, home-page.spec.ts}
```

**Golden rule:** import across libraries only via the barrel alias. Deep imports past `index.ts` are forbidden and linted.

---

## 6. Design System Structure

The design system is a **single Nx library** (`libs/design-system`, `@dash/design-system`), with atomic levels as **internal folders** rather than separate libs. Rationale: a lib-per-level split (`ui-atoms`, `ui-molecules`, …) produces five _shallow_ modules whose interfaces are near-pure pass-through re-exports — the exact anti-pattern deep-module design warns against. One lib with folder-per-level is a single deep module: broad internals, one small stable API.

**Public API policy** — `libs/design-system/src/index.ts` re-exports a curated set only:

```ts
// atoms
export { ButtonComponent } from './lib/atoms/button/button';
export type {
    ButtonVariant,
    ButtonSize,
} from './lib/atoms/button/button.variants';
// molecules
export { FormFieldComponent } from './lib/molecules/form-field/form-field';
// organisms
export { AppHeaderComponent } from './lib/organisms/app-header/app-header';
// templates
export { ShellLayoutComponent } from './lib/templates/shell-layout/shell-layout';
```

| Exported (public)                           | Hidden (private)                                  |
| ------------------------------------------- | ------------------------------------------------- |
| Component classes                           | `*.variants.ts` (`tv()` configs)                  |
| Public variant/size **types**               | Private sub-components, internal directives/pipes |
| Design tokens stylesheet (consumed via CSS) | Helper functions, layout internals                |

**When to split into per-level libs later:** only when a real forcing function appears — independent release cadence, ownership boundaries, or build-caching wins at scale. Do not pre-split.

---

## 7. Atomic Design Mapping

| Level        | Definition                                                             | Lives in                    | Example                                                                         |
| ------------ | ---------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------- |
| **Atom**     | Smallest indivisible UI primitive; no composition of other components. | `design-system/atoms/`      | `ButtonComponent` (`ds-button`)                                                 |
| **Molecule** | A small group of atoms working together as a unit.                     | `design-system/molecules/`  | `FormFieldComponent` = label + input + error                                    |
| **Organism** | A distinct, self-contained section composed of molecules/atoms.        | `design-system/organisms/`  | `AppHeaderComponent`                                                            |
| **Template** | A **page skeleton** with content slots and **no real data**.           | `design-system/templates/`  | `ShellLayoutComponent` (`<ng-content select="[header]">`, `[nav]`, `[content]`) |
| **Page**     | A **template instance** wired to real data + routing.                  | `home/feature-shell/pages/` | `HomePageComponent` (routed)                                                    |

**Why templates and pages are split.** A template is presentational and data-agnostic → it belongs with the other UI primitives (`type:ui`). A page injects services and is routed → that's a _feature_ concern; placing it in the design system would drag data-access/routing dependencies into the UI layer and violate the boundary rules (§9). Pages are lazy-loaded standalone components in feature libs; the dash app wires them via routes.

---

## 8. Shell Application

`apps/dash` is a **thin host**. It owns app-level providers and the route table, and delegates everything else to libraries.

```ts
// apps/dash/src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
bootstrapApplication(App, appConfig);
```

```ts
// apps/dash/src/app/app.config.ts
import {
    ApplicationConfig,
    provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(withFetch()),
    ],
};
```

```ts
// apps/dash/src/app/app.routes.ts — lazy feature routes
import { Routes } from '@angular/router';
export const routes: Routes = [
    {
        path: '',
        loadChildren: () =>
            import('@dash/home/feature-shell').then((m) => m.HOME_ROUTES),
    },
];
```

---

## 9. Module Boundaries

Two-dimensional tagging: **`type`** (architectural layer) and **`scope`** (domain). Set in each `project.json`:

| Project                   | tags                         |
| ------------------------- | ---------------------------- |
| `apps/dash`               | `type:app`, `scope:dash`     |
| `libs/design-system`      | `type:ui`, `scope:shared`    |
| `libs/shared/ui-styles`   | `type:util`, `scope:shared`  |
| `libs/shared/util-types`  | `type:util`, `scope:shared`  |
| `libs/shared/test-setup`  | `type:util`, `scope:shared`  |
| `libs/home/feature-shell` | `type:feature`, `scope:home` |

**Layering:** `app → feature → ui → util` (with `data-access` reserved between feature and util for later). Each layer may depend only on layers below. Critically, **`type:ui` never depends on `type:feature` or `type:data-access`** — the design system stays pure.

```js
// eslint.config.mjs (excerpt)
'@nx/enforce-module-boundaries': ['error', {
  depConstraints: [
    { sourceTag: 'type:app',         onlyDependOnLibsWithTags: ['type:feature','type:ui','type:util'] },
    { sourceTag: 'type:feature',     onlyDependOnLibsWithTags: ['type:feature','type:ui','type:data-access','type:util'] },
    { sourceTag: 'type:ui',          onlyDependOnLibsWithTags: ['type:ui','type:util'] },
    { sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:data-access','type:util'] },
    { sourceTag: 'type:util',        onlyDependOnLibsWithTags: ['type:util'] },
    { sourceTag: 'scope:home',       onlyDependOnLibsWithTags: ['scope:home','scope:shared'] },
    { sourceTag: 'scope:dash',      onlyDependOnLibsWithTags: ['scope:dash','scope:home','scope:shared'] },
    { sourceTag: 'scope:shared',     onlyDependOnLibsWithTags: ['scope:shared'] },
  ],
}]
```

**Atomic direction inside the design system.** Nx tags act on _project_ boundaries, so the one-way atomic arrow (atoms ← molecules ← organisms ← templates) is enforced _within_ the lib via ESLint `no-restricted-imports`, scoped to `libs/design-system/**`:

```js
// atoms must not import upward; molecules must not import organisms/templates; etc.
'no-restricted-imports': ['error', { patterns: [
  { group: ['**/molecules/**','**/organisms/**','**/templates/**'],
    message: 'atoms must not import upward (molecules/organisms/templates)' },
]}]
```

Result: dependency direction is guaranteed both _between_ libraries (Nx graph) and _within_ the design system (ESLint).

---

## 10. Styling System — Tailwind v4

Tailwind v4 is **CSS-first** (no `tailwind.config.js`). With the Angular application builder, use the **PostCSS plugin**, not the Vite plugin (the builder does not expose Vite's plugin array).

**`.postcssrc.json`** (workspace root):

```json
{ "plugins": { "@tailwindcss/postcss": {} } }
```

**Design tokens** — `libs/design-system/src/styles/tokens.css`:

```css
@theme {
    --color-brand-50: oklch(0.98 0.02 265);
    --color-brand-500: oklch(0.62 0.19 265);
    --color-brand-700: oklch(0.48 0.17 265);
    --radius-btn: 0.5rem;
}
```

**App entry** — `apps/dash/src/styles.css`. Because libraries live outside the app root, `@source` directives tell Tailwind v4 where to scan for class names (v4's replacement for the `content` array — this is the #1 Nx + Tailwind-v4 gotcha):

```css
@import 'tailwindcss';
@import '../../libs/design-system/src/styles/tokens.css';

@source "../../libs/design-system/src";
@source "../../libs/home/feature-shell/src";
```

Do **not** add `autoprefixer` or `postcss-import` — v4 handles vendor prefixing and imports internally.

---

## 11. Component Variants — tailwind-variants

Every styled component keeps its class logic in a private `*.variants.ts` file using `tv()`. The variant config is an implementation detail and is **never** exported from the barrel; only the derived **types** are public.

```ts
// libs/design-system/src/lib/atoms/button/button.variants.ts
import { tv, type VariantProps } from 'tailwind-variants';

export const button = tv({
    base: 'inline-flex items-center justify-center rounded-[--radius-btn] font-medium transition disabled:opacity-50',
    variants: {
        intent: {
            primary: 'bg-brand-500 text-white hover:bg-brand-700',
            ghost: 'bg-transparent text-brand-700 hover:bg-brand-50',
        },
        size: {
            sm: 'h-8 px-3 text-sm',
            md: 'h-10 px-4',
            lg: 'h-12 px-6 text-lg',
        },
    },
    defaultVariants: { intent: 'primary', size: 'md' },
});
export type ButtonVariant = VariantProps<typeof button>['intent'];
export type ButtonSize = VariantProps<typeof button>['size'];
```

```ts
// libs/design-system/src/lib/atoms/button/button.ts
import {
    Component,
    ChangeDetectionStrategy,
    computed,
    input,
} from '@angular/core';
import { button, type ButtonVariant, type ButtonSize } from './button.variants';

@Component({
    selector: 'ds-button',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './button.html',
    host: { '[class]': 'classes()' },
})
export class ButtonComponent {
    readonly intent = input<ButtonVariant>('primary');
    readonly size = input<ButtonSize>('md');
    protected readonly classes = computed(() =>
        button({ intent: this.intent(), size: this.size() }),
    );
}
```

**Shared `cn` helper** — `libs/shared/ui-styles/src/lib/cn.ts`. `tv()` merges its own classes internally; `cn` is for ad-hoc composition (e.g. a molecule concatenating a `tv()` result with a consumer-passed class), centralizing `tailwind-merge` config so merges behave consistently:

```ts
import { extendTailwindMerge } from 'tailwind-merge';
export const cn = extendTailwindMerge({
    /* register custom token groups if needed */
});
```

> Keep `tv()` arbitrary-property references (e.g. `rounded-[--radius-btn]`) in sync with the `@theme` token names in `tokens.css`.

---

## 12. Testing Strategy

> **As-built:** the design below describes the native `@angular/build:unit-test` builder. That runner requires buildable libs, so the actual implementation uses the AnalogJS Vitest path (`@nx/vitest:test` + `vite.config.mts`) instead — same Vitest 4 + jsdom. See **§17**.

Unit tests run on **Vitest** (Vitest 4 + jsdom, no Karma).

**Test target** (explicit form; prefer Nx inferred targets where possible):

```json
"test": {
  "executor": "@angular/build:unit-test",
  "options": {
    "runner": "vitest",
    "buildTarget": "dash:build",
    "tsConfig": "apps/dash/tsconfig.spec.json",
    "setupFiles": ["apps/dash/src/test-setup.ts"]
  }
}
```

**`tsconfig.spec.json`** (per project):

```json
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "outDir": "../../dist/out-tsc",
        "types": ["vitest/globals", "node"]
    },
    "include": ["src/**/*.spec.ts", "src/test-setup.ts"]
}
```

**Shared setup lib** — `libs/shared/test-setup` initializes Angular's jsdom test environment once and is re-exported by each project's `test-setup.ts`:

```ts
// libs/shared/test-setup/src/lib/setup.ts
import { getTestBed } from '@angular/core/testing';
import {
    BrowserTestingModule,
    platformBrowserTesting,
} from '@angular/platform-browser/testing';
getTestBed().initTestEnvironment(
    BrowserTestingModule,
    platformBrowserTesting(),
);
```

**Coverage expectation:** every component in the atomic vertical slice ships with a `.spec.ts` (render + variant/interaction assertion). `bun nx run-many -t test` must be green.

---

## 13. Tooling & Conventions

- **Package manager:** Bun. Run tasks via `bun nx <target> <project>` / `bunx nx ...`. `packageManager: "bun"` in `nx.json`.
- **Lint:** ESLint **flat config** (`eslint.config.mjs`) with `@nx/enforce-module-boundaries` + intra-DS `no-restricted-imports`.
- **Nx targets:** prefer inferred (project-crystal) targets from `@angular/build`; add explicit `project.json` targets only when overriding.
- **File naming (Angular 21 style):** `button.ts`, `button.html`, `button.variants.ts`, `button.spec.ts` (no `.component.` infix). One folder per component.
- **Selectors:** design-system components use the `ds-` prefix (`ds-button`, `ds-form-field`); the app uses `app-`.
- **Change detection:** `OnPush` everywhere; app runs zoneless (`provideZonelessChangeDetection`). Prefer signal inputs (`input()`), `computed`, and native control flow (`@if`/`@for`).
- **Barrels:** exactly one `index.ts` per lib; path aliases in `tsconfig.base.json` point at it.

---

## 14. Milestones / Definition of Done

1. **Workspace bootstrapped** — `create-nx-workspace --packageManager bun`, Angular preset, `dash` app builds & serves.
2. **Libraries generated** — `design-system`, `shared/ui-styles`, `shared/util-types`, `shared/test-setup`, `home/feature-shell`; barrels + path aliases wired.
3. **Styling live** — Tailwind v4 via `@tailwindcss/postcss`, tokens + `@source` scanning working; a `ds-button` renders themed classes in the browser.
4. **Atomic vertical slice** — Button (atom) → FormField (molecule) → AppHeader (organism) → ShellLayout (template) → HomePage (page, routed & lazy-loaded).
5. **Boundaries enforced** — tags set; `nx lint` fails on an intentional cross-boundary import and on a deep import; atomic upward-import is blocked.
6. **Tests green** — `bun nx run-many -t test` passes on Vitest for every project.

**Done =** all six milestones met, `nx graph` shows the intended one-way dependency arrows, and the slice renders in the dash app.

---

## 15. Risks & Experimental Flags

| Risk                                          | Impact                                                                           | Mitigation                                                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Angular 21 native Vitest builder is young     | Some libs (CJS/directory-import, e.g. Ionic-class) fail to resolve under esbuild | Keep deps ESM-friendly; fall back to `@nx/vitest`/AnalogJS only if a specific lib breaks.                    |
| Bun + Nx generator edge cases                 | Postinstall/native binaries or optional peers not auto-hoisted                   | Install optional peers explicitly (`vitest`, `jsdom`, `tailwindcss`); re-run `bun install` after generators. |
| Tailwind v4 `@source` scanning misses `libs/` | Classes used only in libraries get purged                                        | Explicit `@source` directives in the app stylesheet (§10); verify in a production build.                     |
| Tailwind v4 ↔ tailwind-merge version coupling | `cn()` mis-merges or `tv()` breaks                                               | Pin `tailwind-variants` 3.x with `tailwind-merge` >=3 together.                                              |
| Deep-import leakage                           | Erodes the deep-module boundary                                                  | `enforce-module-boundaries` + alias-only imports; CI lint gate.                                              |

---

## 16. Future Extensions

- **`data-access` layer** — HTTP + signal-store state libs (`type:data-access`) between feature and util, with `provideHttpClient` interceptors.
- **More domains** — additional `scope:<domain>` feature libs following the `home/feature-shell` pattern.
- **Per-level DS split** — promote `atoms`/`molecules`/… to their own libs _only_ if independent release cadence, ownership, or caching wins justify it.
- **Publishing** — turn `design-system` into a buildable/publishable lib (`@dash/design-system` to a registry) if it needs to be consumed outside this workspace.
- **Beyond unit tests** — component/interaction tests, e2e (Playwright), visual regression, CI pipeline, SSR/hydration.

---

## 17. As-Built Notes (implementation)

The workspace was scaffolded from this spec (`create-nx-workspace@23`, integrated layout with `project.json` + `tsconfig.base.json` path aliases). A few tooling-driven deviations from the spec above, all verified working (`nx run-many -t lint test` green, `nx build dash` green):

- **Vitest runner.** The native `@angular/build:unit-test` (`vitest-angular`) runner **requires libraries to be buildable** (ng-packagr), which is inappropriate for feature libs. So tests use the **AnalogJS Vitest** path instead: `@nx/vitest:test` executor + a per-project `vite.config.mts` (`@analogjs/vite-plugin-angular`). Still **Vitest 4 + jsdom** — only the bootstrap differs from §12's snippet. The app (`dash`) is wired the same way (the app generator adds no test target, so it was added manually).
- **Test setup is per-project.** AnalogJS generates `src/test-setup.ts` per project (`setupTestBed()` from `@analogjs/vitest-angular`), so the separate `shared/test-setup` lib in §5 was **not** created — it would be redundant.
- **Import paths are flat.** npm scopes cannot nest, so aliases are `@dash/design-system`, `@dash/ui-styles`, `@dash/util-types`, `@dash/home-feature-shell` (directories still use the `libs/shared/…`, `libs/home/…` grouping).
- **An `Input` atom was added** (beyond §6's example list) so the `FormField` molecule genuinely composes an atom rather than a raw `<input>`.
- **Atoms use attribute selectors** (`button[ds-button]`, `input[ds-input]`) to host native elements; the design-system `component-selector` lint rule allows `['element','attribute']` with the `ds` prefix.
- **Nx v24 deprecations (non-blocking).** `@nx/vitest:test`, `@nx/eslint:lint`, and the `nxViteTsPaths`/`nxCopyAssetsPlugin` vite plugins log deprecation warnings on Nx 23 and will need `nx g …:convert-to-inferred` migrations before upgrading to Nx 24.

### Verified end-to-end

- `nx run-many -t lint test` → 3 projects, **10 tests pass**, 0 lint errors.
- `nx build dash` → succeeds; `home-feature-shell` emitted as a **lazy chunk**; Tailwind `@source` scanning confirmed (lib-only classes like `bg-brand-500`, `rounded-btn`, `min-h-dvh` present in the compiled CSS).
- Module boundaries confirmed by probe: an atom→molecule import and a `type:ui`→`type:feature` import both **fail lint** as designed.
