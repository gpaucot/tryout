/**
 * Shared, framework-agnostic types. Pure TypeScript — no Angular, no runtime.
 * Keep this layer dependency-free so any lib can consume it.
 */

/** Marks a value that may not be present. */
export type Maybe<T> = T | null | undefined;

/** A value or an array of values. */
export type OneOrMany<T> = T | readonly T[];

/** Extract the element type of an array. */
export type ElementOf<T extends readonly unknown[]> = T[number];

/**
 * A single choice in a select / radio-group / checkbox-group.
 * `value` should be a primitive or a stable reference — membership and
 * pre-selection compare by identity (`Object.is`).
 */
export interface SelectOption<T> {
    readonly value: T;
    readonly label: string;
    readonly disabled?: boolean;
}

/** A collection of choices. */
export type SelectOptions<T> = readonly SelectOption<T>[];

/**
 * A single tab in a tab group.
 *
 * `value` identifies the tab (compared by identity, `Object.is`). A plain tab
 * is a selection tab: activating it sets the group's value. When `link` is
 * present the tab becomes a navigation link instead — it renders as an anchor
 * whose active state follows the router, and activating it navigates.
 */
export interface TabItem<T> {
    readonly value: T;
    readonly label: string;
    readonly disabled?: boolean;
    /**
     * Leading icon (Material Symbols ligature name, e.g. `"settings"`), shown
     * before the label. Decorative — the label carries the accessible name.
     */
    readonly icon?: string;
    /**
     * Trailing badge, e.g. a count or short status. Rendered as a small pill
     * after the label; numbers and strings are both accepted.
     */
    readonly badge?: string | number;
    /**
     * RouterLink target. When set, the tab renders as a navigation link
     * (a routed `<a>`) rather than a selection tab.
     */
    readonly link?: string | readonly unknown[];
    /** For link tabs: require an exact URL match to be considered active. */
    readonly exact?: boolean;
}

/** A collection of tabs. */
export type TabItems<T> = readonly TabItem<T>[];

/**
 * A single term/value pair in a description list.
 *
 * `value` is intentionally `unknown`: how it renders is decided by the
 * formatter selected via `type` (e.g. 'currency', 'email', 'array'). `type`
 * defaults to 'string' and is open-ended — register a formatter for any custom
 * type without changing the component.
 */
export interface DescriptionItem {
    readonly term: string;
    readonly value: unknown;
    /** Formatter discriminator. Defaults to 'string'. */
    readonly type?: string;
    /** Formatter-specific options (currency code, locale, boolean labels, …). */
    readonly options?: Readonly<Record<string, unknown>>;
}

/** A collection of term/value pairs. */
export type DescriptionItems = readonly DescriptionItem[];

/** Direction of an active table sort. */
export type TableSortDirection = 'asc' | 'desc';

/** The active sort of a table: which column (`key`) and which way. */
export interface TableSort {
    readonly key: string;
    readonly direction: TableSortDirection;
}

/** Horizontal alignment of a table column's content. */
export type TableAlign = 'left' | 'center' | 'right';

/** Built-in inline editors for editable table cells. */
export type TableCellEditor = 'text' | 'number';

/**
 * Configuration for one table column. Purely data-driven: rendering, sorting
 * and editing are all described here — no templates involved.
 *
 * Reading and writing a cell are decoupled from the row shape via optional
 * functions: `value` reads (defaults to `row[key]`), `format` renders the read
 * value as text, `parse` turns an editor's raw string back into a value and
 * `update` applies it to the row (defaults to `{ ...row, [key]: value }`).
 */
export interface TableColumn<T> {
    /** Unique column id. Also the default property read/written on rows. */
    readonly key: string;
    readonly header: string;
    /** Column width in px (virtual scrolling needs fixed widths). Default 160. */
    readonly width?: number;
    /** Content alignment. Defaults to `left`. */
    readonly align?: TableAlign;
    /**
     * Pin the column to an edge: pinned columns stay visible while the rest
     * scroll horizontally. Pinned columns render grouped at their edge, in
     * config order, regardless of where they appear in the columns array.
     */
    readonly pin?: 'left' | 'right';
    /** Whether clicking the header cycles asc → desc → unsorted. */
    readonly sortable?: boolean;
    /** Cell value accessor. Defaults to reading `row[key]`. */
    readonly value?: (row: T) => unknown;
    /** Display formatter for the cell text. Defaults to `String(value)`. */
    readonly format?: (value: unknown, row: T) => string;
    /**
     * Comparator over cell values used when sorting. Defaults to a natural
     * compare (numeric-aware for strings, nullish values last).
     */
    readonly compare?: (a: unknown, b: unknown) => number;
    /** Whether cells in this column can be edited inline (double-click). */
    readonly editable?: boolean;
    /** Editor kind for editable cells. Defaults to `text`. */
    readonly editor?: TableCellEditor;
    /**
     * Parse the editor's raw string into a cell value; return `undefined` to
     * reject the entry and cancel the edit. Defaults per editor: `text` keeps
     * the string, `number` parses a float (an unparseable entry cancels).
     */
    readonly parse?: (raw: string, row: T) => unknown;
    /** Apply an edited value to a row, returning the new row. */
    readonly update?: (row: T, value: unknown) => T;
}

/** A table's column set, in display order. */
export type TableColumns<T> = readonly TableColumn<T>[];

/** Emitted by a table after an inline cell edit was committed. */
export interface TableCellEdit<T> {
    /** The row after the edit. */
    readonly row: T;
    /** The row as it was before the edit. */
    readonly previousRow: T;
    /** Index of the row in the table's data (original order, not sorted). */
    readonly rowIndex: number;
    /** Key of the edited column. */
    readonly key: string;
    /** The committed cell value (after `parse`). */
    readonly value: unknown;
    /** The cell value before the edit. */
    readonly previousValue: unknown;
}
