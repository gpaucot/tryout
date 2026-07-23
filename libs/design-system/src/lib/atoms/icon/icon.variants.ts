import { tv, type VariantProps } from 'tailwind-variants';

/**
 * Private variant definition for the Icon atom.
 * `ds-icon` (see `src/styles/icons.css`) selects the Material Symbols Outlined
 * font; a glyph scales with its font-size, so `size` maps to a text-size
 * utility. The optical-size (`opsz`) axis is matched to each size in `icon.ts`.
 */
export const icon = tv({
    base: 'ds-icon inline-block shrink-0 select-none align-middle leading-none',
    variants: {
        size: {
            sm: 'text-[1.25rem]', // 20px
            md: 'text-2xl', // 24px
            lg: 'text-[2.5rem]', // 40px
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

export type IconSize = NonNullable<VariantProps<typeof icon>['size']>;
