import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    linkedSignal,
    model,
    output,
    signal,
    untracked,
    viewChild,
} from '@angular/core';
import { cn } from '@dash/ui-styles';
import type {
    TableCellEdit,
    TableColumn,
    TableColumns,
    TableSort,
} from '@dash/util-types';
import { Input } from '../../atoms/input/input';
import { table } from './table.variants';

/** Fallback column width (px) when a column doesn't specify one. */
const DEFAULT_COL_WIDTH = 160;
/** Narrowest a column is allowed to get. */
const MIN_COL_WIDTH = 48;

/** A window of item indices to render: `[start, end)`. */
interface Window {
    readonly start: number;
    readonly end: number;
}

const sameWindow = (a: Window, b: Window) =>
    a.start === b.start && a.end === b.end;

/** A column prepared for rendering: geometry + precomputed classes. */
interface ColMeta<T> {
    readonly kind: 'col';
    /** Track key (the column key). */
    readonly key: string;
    readonly col: TableColumn<T>;
    readonly width: number;
    /** 1-based visual position (pinned-left, middle, pinned-right order). */
    readonly ariaColIndex: number;
    /** `position: sticky` offset for pinned columns, else null. */
    readonly stickyLeft: number | null;
    readonly stickyRight: number | null;
    readonly headerClass: string;
    readonly cellClass: string;
}

/** Stand-in for a run of virtualized-away middle columns. */
interface SpacerMeta {
    readonly kind: 'spacer';
    readonly key: string;
    readonly width: number;
}

type RenderCol<T> = ColMeta<T> | SpacerMeta;

/** The full column geometry, derived once per `columns` change. */
interface ColumnLayout<T> {
    readonly left: readonly ColMeta<T>[];
    readonly center: readonly ColMeta<T>[];
    readonly right: readonly ColMeta<T>[];
    /** Prefix sums of middle-column widths (length `center.length + 1`). */
    readonly centerOffsets: Float64Array;
    readonly leftWidth: number;
    readonly centerWidth: number;
    readonly rightWidth: number;
    readonly totalWidth: number;
}

/** One row prepared for rendering at its virtual offset. */
interface RowView<T> {
    readonly row: T;
    /** Index into the table's data (original order) — stable under sorting. */
    readonly dataIndex: number;
    /** 1-based ARIA row index (header is row 1). */
    readonly ariaRowIndex: number;
    readonly top: number;
    readonly height: number;
}

/** An in-progress inline cell edit. */
interface EditState {
    readonly dataIndex: number;
    readonly key: string;
    /** The raw string the editor was seeded with. */
    readonly draft: string;
}

function readValue<T>(col: TableColumn<T>, row: T): unknown {
    return col.value
        ? col.value(row)
        : (row as Record<string, unknown>)[col.key];
}

/** Natural compare: numbers numerically, nullish last, strings numeric-aware. */
function defaultCompare(a: unknown, b: unknown): number {
    if (a == null) return b == null ? 0 : 1;
    if (b == null) return -1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (a instanceof Date && b instanceof Date)
        return a.getTime() - b.getTime();
    return String(a).localeCompare(String(b), undefined, {
        numeric: true,
        sensitivity: 'base',
    });
}

/** Last index `i` with `offsets[i] <= target` (offsets ascending, [0] = 0). */
function offsetIndex(offsets: ArrayLike<number>, target: number): number {
    let lo = 0;
    let hi = offsets.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (offsets[mid] <= target) lo = mid;
        else hi = mid - 1;
    }
    return lo;
}

/**
 * Table — organism.
 * A high-level data grid, purely config-driven: pass `data` and a `columns`
 * config; the table renders, sorts and edits without any templates.
 *
 * - **Virtual scrolling on both axes** with variable sizes: only the rows and
 *   middle columns intersecting the viewport are in the DOM. Row heights come
 *   from `rowHeight` (a number or a per-row function); column widths from each
 *   column's `width`. Sizes are config-provided, not DOM-measured.
 * - **Pinned header** (sticks to the top) and **pinned columns**
 *   (`pin: 'left' | 'right'` — stick to an edge under horizontal scroll).
 * - **Sorting**: clicking a `sortable` header cycles asc → desc → unsorted.
 *   The active sort is the two-way `sort` model (`sortChange` emits).
 * - **Inline editing**: double-click an `editable` cell to open its editor
 *   (`text` or `number`); Enter/blur commits, Escape cancels.
 *
 * The table is **uncontrolled**: it keeps a working copy of `data` (re-seeded
 * whenever the input reference changes), sorts it internally and applies
 * committed edits itself, emitting `cellEdit` (the individual change) and
 * `dataChange` (the full updated array, original order) after the fact.
 *
 * Size the host to bound the grid (e.g. `class="h-96"`); the viewport fills it
 * and scrolls both ways.
 */
@Component({
    selector: 'ds-table',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Input],
    templateUrl: './table.html',
    host: { '[class]': 'hostClasses()' },
})
export class Table<T> {
    readonly data = input.required<readonly T[]>();
    readonly columns = input.required<TableColumns<T>>();
    /** Row height in px — a constant, or a function of (row, sorted index). */
    readonly rowHeight = input<number | ((row: T, index: number) => number)>(
        40,
    );
    /** Header row height in px. */
    readonly headerHeight = input(40);
    /** Active sort (two-way). `null` = original data order. */
    readonly sort = model<TableSort | null>(null);
    /** Extra rows/columns rendered beyond each viewport edge. */
    readonly overscan = input(3);
    /** Accessible name for the grid. */
    readonly label = input('');
    /** Shown when `data` is empty. */
    readonly emptyText = input('No data');
    /** Extra classes forwarded onto the host element. */
    readonly class = input<string>('');

    /** A committed inline cell edit (fired alongside `dataChange`). */
    readonly cellEdit = output<TableCellEdit<T>>();
    /** The full working data (original order) after each committed edit. */
    readonly dataChange = output<readonly T[]>();

    private readonly viewportEl =
        viewChild.required<ElementRef<HTMLElement>>('viewport');
    // `read: ElementRef` — `#editor` sits on the Input attribute component,
    // so the default read would resolve to the component, not the element.
    private readonly editorEl = viewChild('editor', { read: ElementRef });
    private readonly injector = inject(Injector);

    /** Working copy of the data — re-seeded when the `data` input changes. */
    private readonly rows = linkedSignal<readonly T[]>(() => this.data());

    private readonly scrollTop = signal(0);
    private readonly scrollLeft = signal(0);
    protected readonly viewportSize = signal({ width: 0, height: 0 });

    protected readonly editing = signal<EditState | null>(null);

    protected readonly hostClasses = computed(() => cn('block', this.class()));
    protected readonly viewportClasses = table.viewport();
    protected readonly headerRowClasses = table.headerRow();
    protected readonly bodyClasses = table.body();
    protected readonly rowClasses = table.row();
    protected readonly spacerClasses = table.spacer();
    protected readonly emptyClasses = table.empty();

    /** Column geometry + per-column classes, in visual order. */
    protected readonly layout = computed<ColumnLayout<T>>(() => {
        const left: ColMeta<T>[] = [];
        const center: ColMeta<T>[] = [];
        const right: ColMeta<T>[] = [];
        for (const col of this.columns()) {
            const bucket =
                col.pin === 'left'
                    ? left
                    : col.pin === 'right'
                      ? right
                      : center;
            bucket.push(this.colMeta(col));
        }
        // Geometry and ARIA positions follow visual order: left, middle, right.
        let ariaColIndex = 0;
        let x = 0;
        const placeLeft = (m: ColMeta<T>, i: number): ColMeta<T> => {
            const placed = {
                ...m,
                ariaColIndex: ++ariaColIndex,
                stickyLeft: x,
                headerClass: this.headerCellClass(
                    m.col,
                    'left',
                    i === left.length - 1,
                ),
                cellClass: this.bodyCellClass(
                    m.col,
                    'left',
                    i === left.length - 1,
                ),
            };
            x += m.width;
            return placed;
        };
        const leftPlaced = left.map(placeLeft);
        const leftWidth = x;

        const centerOffsets = new Float64Array(center.length + 1);
        const centerPlaced = center.map((m, i) => {
            centerOffsets[i + 1] = centerOffsets[i] + m.width;
            return { ...m, ariaColIndex: ++ariaColIndex };
        });
        const centerWidth = centerOffsets[center.length];

        const rightWidth = right.reduce((sum, m) => sum + m.width, 0);
        let fromRight = rightWidth;
        const rightPlaced = right.map((m, i) => {
            fromRight -= m.width;
            return {
                ...m,
                ariaColIndex: ++ariaColIndex,
                stickyRight: fromRight,
                headerClass: this.headerCellClass(m.col, 'right', i === 0),
                cellClass: this.bodyCellClass(m.col, 'right', i === 0),
            };
        });

        return {
            left: leftPlaced,
            center: centerPlaced,
            right: rightPlaced,
            centerOffsets,
            leftWidth,
            centerWidth,
            rightWidth,
            totalWidth: leftWidth + centerWidth + rightWidth,
        };
    });

    /** Data indices in display order (stable sort by the active column). */
    private readonly sortedIndices = computed<readonly number[]>(() => {
        const rows = this.rows();
        const indices = rows.map((_, i) => i);
        const sort = this.sort();
        if (!sort) return indices;
        const col = this.columns().find((c) => c.key === sort.key);
        if (!col) return indices;
        const dir = sort.direction === 'asc' ? 1 : -1;
        const compare = col.compare ?? defaultCompare;
        const values = rows.map((row) => readValue(col, row));
        return indices.sort((a, b) => {
            const c = compare(values[a], values[b]);
            return c !== 0 ? c * dir : a - b;
        });
    });

    /** Prefix sums of row heights over the sorted order (length rows + 1). */
    private readonly rowOffsets = computed(() => {
        const rows = this.rows();
        const order = this.sortedIndices();
        const rowHeight = this.rowHeight();
        const offsets = new Float64Array(order.length + 1);
        if (typeof rowHeight === 'number') {
            for (let i = 0; i < order.length; i++)
                offsets[i + 1] = offsets[i] + rowHeight;
        } else {
            for (let i = 0; i < order.length; i++)
                offsets[i + 1] = offsets[i] + rowHeight(rows[order[i]], i);
        }
        return offsets;
    });

    protected readonly totalHeight = computed(() => {
        const offsets = this.rowOffsets();
        return offsets[offsets.length - 1];
    });

    /**
     * The sorted-row index window to render. Only changes when scrolling moves
     * an edge across a row boundary (custom equality), so intermediate scroll
     * events don't touch the DOM.
     */
    private readonly rowWindow = computed<Window>(
        () => {
            const offsets = this.rowOffsets();
            const count = offsets.length - 1;
            if (count === 0) return { start: 0, end: 0 };
            const top = this.scrollTop();
            const bottom = top + this.viewportSize().height;
            const overscan = this.overscan();
            const first = Math.min(offsetIndex(offsets, top), count - 1);
            const last = Math.min(offsetIndex(offsets, bottom), count - 1);
            return {
                start: Math.max(0, first - overscan),
                end: Math.min(count, last + 1 + overscan),
            };
        },
        { equal: sameWindow },
    );

    /** The middle-column index window to render (pinned always render). */
    private readonly colWindow = computed<Window>(
        () => {
            const { centerOffsets, leftWidth, rightWidth } = this.layout();
            const count = centerOffsets.length - 1;
            if (count === 0) return { start: 0, end: 0 };
            // Visible middle span, in middle-local x: the viewport minus the
            // opaque pinned overlays at each edge.
            const start = this.scrollLeft();
            const span = Math.max(
                0,
                this.viewportSize().width - leftWidth - rightWidth,
            );
            const overscan = this.overscan();
            const first = Math.min(
                offsetIndex(centerOffsets, start),
                count - 1,
            );
            const last = Math.min(
                offsetIndex(centerOffsets, start + span),
                count - 1,
            );
            return {
                start: Math.max(0, first - overscan),
                end: Math.min(count, last + 1 + overscan),
            };
        },
        { equal: sameWindow },
    );

    /**
     * The cells of one rendered row (header and body share this): pinned-left,
     * a spacer standing in for the middle columns scrolled off to the left,
     * the visible middle columns, a trailing spacer, pinned-right.
     */
    protected readonly renderCols = computed<readonly RenderCol<T>[]>(() => {
        const layout = this.layout();
        const { start, end } = this.colWindow();
        const cells: RenderCol<T>[] = [...layout.left];
        const lead = layout.centerOffsets[start];
        if (lead > 0) cells.push({ kind: 'spacer', key: '^lead', width: lead });
        cells.push(...layout.center.slice(start, end));
        const tail = layout.centerWidth - layout.centerOffsets[end];
        if (tail > 0) cells.push({ kind: 'spacer', key: '^tail', width: tail });
        cells.push(...layout.right);
        return cells;
    });

    /** The rows currently in the DOM, positioned at their virtual offsets. */
    protected readonly visibleRows = computed<readonly RowView<T>[]>(() => {
        const { start, end } = this.rowWindow();
        const rows = this.rows();
        const order = this.sortedIndices();
        const offsets = this.rowOffsets();
        const out: RowView<T>[] = [];
        for (let i = start; i < end; i++) {
            const dataIndex = order[i];
            out.push({
                row: rows[dataIndex],
                dataIndex,
                ariaRowIndex: i + 2,
                top: offsets[i],
                height: offsets[i + 1] - offsets[i],
            });
        }
        return out;
    });

    protected readonly rowCount = computed(() => this.rows().length);
    protected readonly colCount = computed(() => this.columns().length);

    constructor() {
        let observer: ResizeObserver | undefined;
        afterNextRender(() => {
            const el = this.viewportEl().nativeElement;
            if (typeof ResizeObserver !== 'undefined') {
                observer = new ResizeObserver(() => this.measure());
                observer.observe(el);
            }
            this.measure();
        });
        inject(DestroyRef).onDestroy(() => observer?.disconnect());
        // A new data input invalidates any in-progress edit's row index.
        effect(() => {
            this.data();
            untracked(() => this.editing.set(null));
        });
    }

    // --- scrolling ----------------------------------------------------------

    protected onScroll(): void {
        const el = this.viewportEl().nativeElement;
        this.scrollTop.set(el.scrollTop);
        this.scrollLeft.set(el.scrollLeft);
        this.measure();
    }

    private measure(): void {
        const el = this.viewportEl().nativeElement;
        const size = this.viewportSize();
        if (el.clientWidth !== size.width || el.clientHeight !== size.height)
            this.viewportSize.set({
                width: el.clientWidth,
                height: el.clientHeight,
            });
    }

    // --- sorting ------------------------------------------------------------

    /** Cycle a sortable column's sort: asc → desc → unsorted. */
    protected toggleSort(col: TableColumn<T>): void {
        const current = this.sort();
        if (current?.key !== col.key)
            this.sort.set({ key: col.key, direction: 'asc' });
        else if (current.direction === 'asc')
            this.sort.set({ key: col.key, direction: 'desc' });
        else this.sort.set(null);
    }

    protected ariaSort(meta: ColMeta<T>): string | null {
        if (!meta.col.sortable) return null;
        const sort = this.sort();
        if (sort?.key !== meta.key) return 'none';
        return sort.direction === 'asc' ? 'ascending' : 'descending';
    }

    /**
     * Inline-SVG sort glyph (an icon font could be subset without these
     * glyphs): stacked chevrons when unsorted, an arrow when sorted.
     */
    protected sortPath(meta: ColMeta<T>): string {
        const sort = this.sort();
        if (sort?.key !== meta.key) return 'M6 8l4-4 4 4M6 12l4 4 4-4';
        return sort.direction === 'asc'
            ? 'M10 16V4m0 0L5.5 8.5M10 4l4.5 4.5'
            : 'M10 4v12m0 0l-4.5-4.5M10 16l4.5-4.5';
    }

    protected sortButtonClasses(meta: ColMeta<T>): string {
        return table.sortButton({ active: this.sort()?.key === meta.key });
    }

    // --- cells --------------------------------------------------------------

    protected cellText(meta: ColMeta<T>, row: T): string {
        const value = readValue(meta.col, row);
        if (meta.col.format) return meta.col.format(value, row);
        return value == null ? '' : String(value);
    }

    protected isEditing(meta: ColMeta<T>, view: RowView<T>): boolean {
        const editing = this.editing();
        return (
            editing !== null &&
            editing.dataIndex === view.dataIndex &&
            editing.key === meta.key
        );
    }

    protected startEdit(meta: ColMeta<T>, view: RowView<T>): void {
        if (!meta.col.editable || this.isEditing(meta, view)) return;
        const value = readValue(meta.col, view.row);
        this.editing.set({
            dataIndex: view.dataIndex,
            key: meta.key,
            draft: value == null ? '' : String(value),
        });
        afterNextRender(
            () => {
                const el = this.editorEl()?.nativeElement;
                el?.focus();
                el?.select();
            },
            { injector: this.injector },
        );
    }

    protected cancelEdit(): void {
        this.editing.set(null);
    }

    /** Commit from an editor DOM event (Enter or blur). */
    protected commitEditFrom(event: Event): void {
        this.commitEdit((event.target as HTMLInputElement).value);
    }

    /** Parse and apply the editor's value; a failed parse cancels the edit. */
    private commitEdit(raw: string): void {
        const editing = this.editing();
        if (!editing) return;
        const col = this.columns().find((c) => c.key === editing.key);
        if (!col) return this.cancelEdit();
        const rows = this.rows();
        const previousRow = rows[editing.dataIndex];
        const value = this.parseRaw(col, raw, previousRow);
        // `undefined` from a parser means "invalid entry" — drop the edit.
        if (value === undefined) return this.cancelEdit();
        const previousValue = readValue(col, previousRow);
        if (Object.is(previousValue, value)) return this.cancelEdit();
        const row = col.update
            ? col.update(previousRow, value)
            : ({ ...previousRow, [col.key]: value } as T);
        const next = rows.slice();
        next[editing.dataIndex] = row;
        this.rows.set(next);
        this.editing.set(null);
        this.cellEdit.emit({
            row,
            previousRow,
            rowIndex: editing.dataIndex,
            key: col.key,
            value,
            previousValue,
        });
        this.dataChange.emit(next);
    }

    private parseRaw(col: TableColumn<T>, raw: string, row: T): unknown {
        if (col.parse) return col.parse(raw, row);
        if (col.editor === 'number') {
            const parsed = Number(raw);
            return raw.trim() === '' || Number.isNaN(parsed)
                ? undefined
                : parsed;
        }
        return raw;
    }

    // --- column class/meta precomputation -----------------------------------

    /** Unplaced meta; geometry and pinned classes are filled in by `layout`. */
    private colMeta(col: TableColumn<T>): ColMeta<T> {
        return {
            kind: 'col',
            key: col.key,
            col,
            width: Math.max(col.width ?? DEFAULT_COL_WIDTH, MIN_COL_WIDTH),
            ariaColIndex: 0,
            stickyLeft: null,
            stickyRight: null,
            headerClass: this.headerCellClass(col, 'none', false),
            cellClass: this.bodyCellClass(col, 'none', false),
        };
    }

    private headerCellClass(
        col: TableColumn<T>,
        pinned: 'none' | 'left' | 'right',
        edge: boolean,
    ): string {
        return table.headerCell({
            align: col.align ?? 'left',
            pinned,
            edge: edge ? pinned : 'none',
        });
    }

    private bodyCellClass(
        col: TableColumn<T>,
        pinned: 'none' | 'left' | 'right',
        edge: boolean,
    ): string {
        return table.cell({
            align: col.align ?? 'left',
            pinned,
            edge: edge ? pinned : 'none',
            editable: !!col.editable,
        });
    }
}
