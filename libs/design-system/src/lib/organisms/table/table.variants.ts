import { tv, type VariantProps } from 'tailwind-variants';

/**
 * Private variant definitions for the Table organism.
 * Implementation detail — NOT exported from the design-system public API.
 *
 * Pinning is styled with `position: sticky` (offsets are bound inline from the
 * computed column layout); every pinned cell therefore needs an opaque
 * background to mask the scrolling cells passing underneath it.
 */
export const table = {
    /** The scrolling viewport — the single scroll container for both axes. */
    viewport: tv({
        base: [
            'relative h-full overflow-auto overscroll-contain',
            'rounded-card border border-border bg-surface text-sm',
        ],
    }),
    /** The sticky header row (sticks to the top of the viewport). */
    headerRow: tv({
        base: 'sticky top-0 z-20 flex border-b border-border bg-surface-muted',
    }),
    /** One header cell. Sortable cells host a button (see `sortButton`). */
    headerCell: tv({
        base: [
            'flex shrink-0 items-center overflow-hidden px-3',
            'text-xs font-semibold tracking-wide text-ink-muted select-none',
        ],
        variants: {
            align: {
                left: 'justify-start text-left',
                center: 'justify-center text-center',
                right: 'justify-end text-right',
            },
            pinned: {
                none: '',
                left: 'sticky z-10 bg-surface-muted',
                right: 'sticky z-10 bg-surface-muted',
            },
            // The divider between the pinned block and the scrolling middle.
            edge: {
                none: '',
                left: 'border-r border-border',
                right: 'border-l border-border',
            },
        },
        defaultVariants: { align: 'left', pinned: 'none', edge: 'none' },
    }),
    /** The clickable label inside a sortable header cell. */
    sortButton: tv({
        base: [
            'flex min-w-0 cursor-pointer items-center gap-1 truncate',
            'hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2',
            'focus-visible:outline-brand-600',
        ],
        variants: {
            active: { true: 'text-brand-700 hover:text-brand-700', false: '' },
        },
        defaultVariants: { active: false },
    }),
    /** The virtualized body block (sized to the full data height). */
    body: tv({ base: 'relative' }),
    /**
     * One rendered row, absolutely positioned at its virtual offset. `group`
     * lets pinned cells (which carry their own opaque background) follow the
     * row hover.
     */
    row: tv({
        base: [
            'group absolute left-0 flex border-b border-border bg-surface',
            'hover:bg-surface-muted/60',
        ],
    }),
    /** One body cell. */
    cell: tv({
        base: 'flex shrink-0 items-center overflow-hidden px-3 whitespace-nowrap',
        variants: {
            align: {
                left: 'justify-start text-left',
                center: 'justify-center text-center',
                right: 'justify-end text-right',
            },
            pinned: {
                none: '',
                left: 'sticky z-10 bg-surface group-hover:bg-surface-muted',
                right: 'sticky z-10 bg-surface group-hover:bg-surface-muted',
            },
            edge: {
                none: '',
                left: 'border-r border-border',
                right: 'border-l border-border',
            },
            editable: { true: 'cursor-text', false: '' },
        },
        defaultVariants: {
            align: 'left',
            pinned: 'none',
            edge: 'none',
            editable: false,
        },
    }),
    /** Layout spacers standing in for the virtualized-away columns. */
    spacer: tv({ base: 'shrink-0' }),
    /** Shown when the table has no rows. */
    empty: tv({
        base: 'sticky left-0 flex items-center justify-center p-8 text-ink-muted',
    }),
};

export type TableAlignVariant = NonNullable<
    VariantProps<typeof table.cell>['align']
>;
