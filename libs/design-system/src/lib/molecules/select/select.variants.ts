import { tv, type VariantProps } from 'tailwind-variants';

/**
 * Private variant definitions for the Select molecule.
 * Implementation detail — NOT exported from the design-system public API.
 * Only the derived `SelectSize` type is made public.
 */
export const select = {
  /** The combobox trigger button. Sizes mirror the Input/Button atoms. */
  trigger: tv({
    base: [
      'inline-flex w-full items-center justify-between gap-2 rounded-btn border',
      'bg-surface px-3 text-sm text-current transition-colors',
      'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand-600',
      'disabled:cursor-not-allowed disabled:opacity-50',
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
      open: {
        true: 'outline-2 outline-offset-0 outline-brand-600',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
      open: false,
    },
  }),
  /** The popover that holds the (optionally filtered) options. */
  listbox: tv({
    base: [
      'absolute left-0 right-0 z-10 mt-1 flex max-h-64 flex-col gap-1 overflow-auto',
      'rounded-card border border-border bg-surface p-1 shadow-lg',
    ],
  }),
  /** A single option row. */
  option: tv({
    base: [
      'flex w-full cursor-pointer select-none items-center rounded-btn px-2 py-1.5',
      'text-left text-sm text-current',
    ],
    variants: {
      active: {
        true: 'bg-surface-muted',
        false: '',
      },
      selected: {
        true: 'bg-brand-50 font-medium text-brand-700',
        false: '',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-50',
        false: '',
      },
    },
    defaultVariants: {
      active: false,
      selected: false,
      disabled: false,
    },
  }),
};

export type SelectSize = NonNullable<VariantProps<typeof select.trigger>['size']>;
