import { tv, type VariantProps } from 'tailwind-variants';

/**
 * Private variant definitions for the DescriptionList atom.
 * Implementation detail — NOT exported from the design-system public API.
 * Only the derived `DescriptionListOrientation` / `DescriptionListSize` types
 * are made public.
 */
export const descriptionList = {
  /** The `<dl>` host. */
  root: tv({
    base: 'text-current',
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
      orientation: {
        stacked: 'flex flex-col gap-3',
        inline: 'flex flex-col gap-2',
      },
    },
    defaultVariants: {
      size: 'md',
      orientation: 'stacked',
    },
  }),
  /** A single term/description pair row. */
  row: tv({
    variants: {
      orientation: {
        stacked: 'flex flex-col gap-0.5',
        inline: 'grid grid-cols-[minmax(0,10rem)_1fr] items-baseline gap-4',
      },
    },
    defaultVariants: { orientation: 'stacked' },
  }),
  /** The `<dt>` term. */
  term: tv({ base: 'font-medium text-current/60' }),
  /** The `<dd>` description. */
  description: tv({ base: 'text-current' }),
};

export type DescriptionListSize = NonNullable<
  VariantProps<typeof descriptionList.root>['size']
>;
export type DescriptionListOrientation = NonNullable<
  VariantProps<typeof descriptionList.root>['orientation']
>;
