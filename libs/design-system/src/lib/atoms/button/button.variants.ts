import { tv, type VariantProps } from 'tailwind-variants';

/**
 * Private variant definition for the Button atom.
 * Implementation detail — NOT exported from the design-system public API.
 * Only the derived `ButtonIntent` / `ButtonSize` types are made public.
 */
export const button = tv({
    base: [
        'inline-flex items-center justify-center gap-2 rounded-btn font-medium',
        'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
        'focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50',
    ],
    variants: {
        intent: {
            primary: 'bg-brand-500 text-white hover:bg-brand-700',
            ghost: 'bg-transparent text-brand-700 hover:bg-brand-50',
            danger: 'bg-danger-600 text-white hover:opacity-90',
        },
        size: {
            sm: 'h-8 px-3 text-sm',
            md: 'h-10 px-4 text-sm',
            lg: 'h-12 px-6 text-base',
        },
    },
    defaultVariants: {
        intent: 'primary',
        size: 'md',
    },
});

export type ButtonIntent = NonNullable<VariantProps<typeof button>['intent']>;
export type ButtonSize = NonNullable<VariantProps<typeof button>['size']>;
