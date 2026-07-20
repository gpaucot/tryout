import { tv, type VariantProps } from 'tailwind-variants';

/**
 * Private variant definitions for the Tabs molecule.
 * Implementation detail — NOT exported from the design-system public API.
 * Only the derived `TabsOrientation` / `TabsSize` types are made public.
 */
export const tabs = {
    /**
     * Wraps the tablist. On narrow screens a horizontal strip overflows here
     * (scrollable, no visible scrollbar) instead of forcing the page wider.
     */
    scroller: tv({
        base: 'max-w-full',
        variants: {
            orientation: {
                horizontal: 'overflow-x-auto scrollbar-none',
                vertical: '',
            },
        },
        defaultVariants: { orientation: 'horizontal' },
    }),
    /** The `role="tablist"` strip. */
    list: tv({
        base: 'flex gap-1',
        variants: {
            orientation: {
                // `w-max min-w-full` lets the row grow past the viewport (so the
                // scroller can scroll it) while its border still spans the full
                // width when the tabs don't fill it.
                horizontal: 'w-max min-w-full flex-row border-b border-border',
                vertical: 'flex-col border-l border-border',
            },
        },
        defaultVariants: { orientation: 'horizontal' },
    }),
    /**
     * A single tab (button or link). The active indicator lives in `active`
     * below and is layered on top — so a selection tab (model-driven) and a
     * navigation tab (routerLinkActive-driven) share the exact same styling.
     */
    tab: tv({
        base: [
            'inline-flex shrink-0 select-none items-center gap-2 whitespace-nowrap font-medium',
            'text-current/70 transition-colors hover:text-current',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600',
            'disabled:cursor-not-allowed disabled:opacity-50',
        ],
        variants: {
            size: {
                sm: 'h-8 px-2 text-xs',
                md: 'h-10 px-3 text-sm',
                lg: 'h-12 px-4 text-base',
            },
            orientation: {
                // No negative margin: the tab's own bottom/left border sits flush
                // against the list border, so the scroller never has to clip a
                // 1px overflow (which would show a stray vertical scrollbar).
                horizontal: 'border-b-2 border-transparent',
                vertical: 'justify-start border-l-2 border-transparent',
            },
            disabled: {
                true: '',
                false: 'cursor-pointer',
            },
        },
        defaultVariants: {
            size: 'md',
            orientation: 'horizontal',
            disabled: false,
        },
    }),
    /**
     * Active-tab indicator. Applied on top of `tab` for the selected tab
     * (selection mode) or the active route (navigation mode). Recolours the
     * transparent border set by `tab`, so it works for both orientations.
     */
    active: tv({
        base: 'border-brand-500 text-brand-700 hover:text-brand-700',
    }),
    /** A `role="tabpanel"` content region. */
    panel: tv({
        base: 'block pt-4 focus-visible:outline-none',
    }),
    /**
     * Edge scroll affordance shown only when a horizontal strip overflows.
     * Overlays the scroller end with a surface→transparent fade so mouse users
     * (no visible scrollbar) can page the tabs into view.
     */
    scrollButton: tv({
        base: [
            'absolute top-0 bottom-px z-10 flex w-9 cursor-pointer items-center',
            'text-current/60 transition-colors hover:text-current',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600',
        ],
        variants: {
            side: {
                start: 'left-0 justify-start bg-gradient-to-r from-surface from-55% to-transparent',
                end: 'right-0 justify-end bg-gradient-to-l from-surface from-55% to-transparent',
            },
        },
    }),
};

export type TabsOrientation = NonNullable<
    VariantProps<typeof tabs.list>['orientation']
>;
export type TabsSize = NonNullable<VariantProps<typeof tabs.tab>['size']>;
