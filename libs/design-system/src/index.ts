/**
 * Design System — public API (the ONE entry point for this deep module).
 *
 * Exported: component classes + their public variant/size TYPES.
 * NOT exported: `*.variants.ts` (tv configs), templates markup, internals.
 * Consumers import from `@dash/design-system` only — never a deep path.
 */

// atoms
export { Button } from './lib/atoms/button/button';
export type { ButtonIntent, ButtonSize } from './lib/atoms/button/button.variants';
export { Input } from './lib/atoms/input/input';
export type { InputSize } from './lib/atoms/input/input.variants';

// molecules
export { FormField } from './lib/molecules/form-field/form-field';

// organisms
export { AppHeader } from './lib/organisms/app-header/app-header';

// templates
export { ShellLayout } from './lib/templates/shell-layout/shell-layout';
