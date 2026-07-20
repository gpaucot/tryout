import { tv, type VariantProps } from 'tailwind-variants';

/**
 * Private variant definitions for the CheckboxGroup molecule.
 * Implementation detail — NOT exported from the design-system public API.
 * Only the derived `CheckboxGroupSize` type is made public.
 */
export const checkboxGroup = {
    /** The fieldset wrapper. */
    group: tv({
        base: 'flex flex-col gap-2 border-0 p-0',
    }),
    /** The group legend/label. */
    legend: tv({
        base: 'mb-1 text-sm font-medium',
        variants: {
            invalid: {
                true: 'text-danger-600',
                false: 'text-current',
            },
        },
        defaultVariants: { invalid: false },
    }),
    /** A single option row (label wrapping a native checkbox). */
    option: tv({
        base: 'flex cursor-pointer items-center gap-2 text-current',
        variants: {
            size: {
                sm: 'text-xs',
                md: 'text-sm',
                lg: 'text-base',
            },
            disabled: {
                true: 'cursor-not-allowed opacity-50',
                false: '',
            },
        },
        defaultVariants: { size: 'md', disabled: false },
    }),
    /** The native checkbox control. */
    control: tv({
        base: [
            'size-4 shrink-0 rounded accent-brand-500',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        ],
    }),
};

export type CheckboxGroupSize = NonNullable<
    VariantProps<typeof checkboxGroup.option>['size']
>;
