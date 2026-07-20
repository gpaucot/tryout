/**
 * Design System — public API (the ONE entry point for this deep module).
 *
 * Exported: component classes + their public variant/size TYPES.
 * NOT exported: `*.variants.ts` (tv configs), templates markup, internals.
 * Consumers import from `@dash/design-system` only — never a deep path.
 */

// atoms
export { Button } from './lib/atoms/button/button';
export type {
    ButtonIntent,
    ButtonSize,
} from './lib/atoms/button/button.variants';
export { Input } from './lib/atoms/input/input';
export type { InputSize } from './lib/atoms/input/input.variants';
export { DescriptionList } from './lib/atoms/description-list/description-list';
export type {
    DescriptionListOrientation,
    DescriptionListSize,
} from './lib/atoms/description-list/description-list.variants';
export {
    DESCRIPTION_VALUE_PLUGINS,
    provideDescriptionValuePlugins,
} from './lib/atoms/description-list/description-list.plugin';
export type {
    DescriptionValuePlugin,
    DescriptionValueComponent,
} from './lib/atoms/description-list/description-list.plugin';

// molecules
export { FormField } from './lib/molecules/form-field/form-field';
export { Select } from './lib/molecules/select/select';
export type { SelectSize } from './lib/molecules/select/select.variants';
export { RadioGroup } from './lib/molecules/radio-group/radio-group';
export type { RadioGroupSize } from './lib/molecules/radio-group/radio-group.variants';
export { CheckboxGroup } from './lib/molecules/checkbox-group/checkbox-group';
export type { CheckboxGroupSize } from './lib/molecules/checkbox-group/checkbox-group.variants';

// organisms
export { AppHeader } from './lib/organisms/app-header/app-header';

// templates
export { ShellLayout } from './lib/templates/shell-layout/shell-layout';
