import { tv, type VariantProps } from 'tailwind-variants';

/** Private variant definition for the Input atom. */
export const input = tv({
  base: [
    'block w-full rounded-btn border bg-surface px-3 text-sm text-current',
    'placeholder:text-current/40 focus-visible:outline-2 focus-visible:outline-offset-0',
    'focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50',
  ],
  variants: {
    size: {
      sm: 'h-8',
      md: 'h-10',
      lg: 'h-12',
    },
    invalid: {
      true: 'border-danger-600 focus-visible:outline-danger-600',
      false: 'border-border',
    },
  },
  defaultVariants: {
    size: 'md',
    invalid: false,
  },
});

export type InputSize = NonNullable<VariantProps<typeof input>['size']>;
