import { tv, type VariantProps } from 'tailwind-variants';

/**
 * Private variant definitions for the DescriptionList atom.
 * Implementation detail — NOT exported from the design-system public API.
 * Only the derived `DescriptionListOrientation` / `DescriptionListSize` types
 * are made public.
 */
export const descriptionList = {
    /**
     * Outermost wrapper: sequences runs of pairs (`<dl>`) and labelled
     * sections. Carries the text size so section labels inherit it.
     */
    container: tv({
        base: 'flex flex-col text-current',
        variants: {
            size: {
                sm: 'gap-3 text-xs',
                md: 'gap-4 text-sm',
                lg: 'gap-5 text-base',
            },
        },
        defaultVariants: { size: 'md' },
    }),
    /** A labelled nested section (heading + nested list). */
    section: tv({ base: 'flex min-w-0 flex-col gap-2' }),
    /** Header row: label on the left, actions on the right. */
    sectionHeader: tv({ base: 'flex min-w-0 items-center justify-between gap-3' }),
    /** The section heading. Sized relative to the inherited text size. */
    sectionLabel: tv({ base: 'min-w-0 break-words font-semibold text-current' }),
    /** Inline action buttons — hidden on narrow screens. */
    actionsInline: tv({ base: 'hidden shrink-0 items-center gap-1 sm:flex' }),
    /** Overflow-menu anchor — replaces the inline buttons on narrow screens. */
    actionsOverflow: tv({ base: 'relative shrink-0 sm:hidden' }),
    /** The dropdown panel of the overflow menu. */
    actionsMenu: tv({
        base: 'absolute right-0 top-full z-20 mt-1 flex min-w-36 flex-col rounded-card border border-border bg-surface p-1 shadow-card',
    }),
    /** One action inside the overflow menu. */
    actionsMenuItem: tv({
        base: 'flex w-full items-center gap-2 rounded-btn px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50',
    }),
    /** The `<dl>` of a run of term/value pairs. */
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
                // Stacks on narrow screens (iPhone 6) so the term never eats the
                // value's width; becomes a two-column grid from `sm` up.
                inline: 'flex flex-col gap-0.5 sm:grid sm:grid-cols-[minmax(0,10rem)_1fr] sm:items-baseline sm:gap-4',
            },
        },
        defaultVariants: { orientation: 'stacked' },
    }),
    /** The `<dt>` term. */
    term: tv({ base: 'font-medium text-current/60' }),
    /** The `<dd>` description. */
    description: tv({ base: 'min-w-0 break-words text-current' }),
    /** Shared anchor styling for link-shaped value plugins. */
    link: tv({
        base: 'break-words text-brand-700 underline underline-offset-2 hover:text-brand-500',
    }),
    /** Wrapper for list-shaped value plugins (e.g. array). */
    list: tv({ base: 'flex flex-wrap gap-1.5' }),
    /** A single list item / chip. */
    chip: tv({ base: 'rounded bg-surface-muted px-1.5 py-0.5' }),
};

export type DescriptionListSize = NonNullable<
    VariantProps<typeof descriptionList.root>['size']
>;
export type DescriptionListOrientation = NonNullable<
    VariantProps<typeof descriptionList.root>['orientation']
>;
