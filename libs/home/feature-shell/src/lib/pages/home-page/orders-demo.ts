import type { TableColumn, TableColumns } from '@dash/util-types';

/**
 * Synthetic dataset for the Table organism demo: a big, wide orders grid
 * (10,000 rows × 30 columns) that exercises everything the table does —
 * 2-axis virtualization, variable row heights and column widths, pinned
 * columns on both edges, sorting, and inline text/number editing.
 */

/** One synthetic order. `m0`–`m23` hold two years of monthly revenue. */
export interface DemoOrder {
    readonly id: string;
    readonly customer: string;
    readonly status: string;
    readonly date: string;
    readonly items: number;
    readonly vip: boolean;
    readonly [key: string]: unknown;
}

export const ORDER_ROW_COUNT = 10_000;

const MONTH_KEYS = Array.from({ length: 24 }, (_, i) => `m${i}`);
const MONTH_NAMES = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(
    ' ',
);

const FIRST =
    'Ada Björn Chidi Dana Emil Farah Grace Hugo Iris Jonas Kaia Liam Mona Nia Otto Priya'.split(
        ' ',
    );
const LAST =
    'Andersson Baptiste Chen Diallo Eriksen Fontaine García Haddad Ito Jansen Kovač Lindqvist Moreau Novak Okafor Petit'.split(
        ' ',
    );
const STATUSES = [
    'in-progress',
    'completed',
    'completed',
    'returned',
    'canceled',
];

/** Small deterministic PRNG so the demo data is stable across reloads. */
function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function makeOrders(): readonly DemoOrder[] {
    const rand = mulberry32(0xf1_09);
    return Array.from({ length: ORDER_ROW_COUNT }, (_, i) => {
        const day = new Date(2025, 0, 1 + Math.floor(rand() * 540));
        const order: Record<string, unknown> = {
            id: `ORD-${String(i + 1).padStart(6, '0')}`,
            customer: `${FIRST[Math.floor(rand() * FIRST.length)]} ${
                LAST[Math.floor(rand() * LAST.length)]
            }`,
            status: STATUSES[Math.floor(rand() * STATUSES.length)],
            date: day.toISOString().slice(0, 10),
            items: 1 + Math.floor(rand() * 40),
            vip: rand() < 0.12,
        };
        for (const key of MONTH_KEYS) order[key] = Math.round(rand() * 9_000);
        return order as DemoOrder;
    });
}

const eur = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
});

/** "in-progress" → "In progress". */
function humanize(value: unknown): string {
    const text = String(value ?? '').replace(/-/g, ' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function monthColumn(key: string, i: number): TableColumn<DemoOrder> {
    return {
        key,
        header: `${MONTH_NAMES[i % 12]} ’${25 + Math.floor(i / 12)}`,
        // Deliberately non-uniform widths to exercise variable-size columns.
        width: 96 + (i % 3) * 22,
        align: 'right',
        editable: true,
        editor: 'number',
        format: (v) => eur.format(v as number),
    };
}

export const ORDER_COLUMNS: TableColumns<DemoOrder> = [
    { key: 'id', header: 'Order', width: 110, pin: 'left', sortable: true },
    {
        key: 'customer',
        header: 'Customer',
        width: 180,
        pin: 'left',
        sortable: true,
        editable: true,
        // The star is display-only (VIP flag); edits work on the raw name.
        format: (v, row) => (row.vip ? `★ ${v}` : String(v ?? '')),
    },
    {
        key: 'status',
        header: 'Status',
        width: 130,
        sortable: true,
        format: humanize,
    },
    { key: 'date', header: 'Ordered', width: 120, sortable: true },
    {
        key: 'items',
        header: 'Items',
        width: 90,
        align: 'right',
        sortable: true,
        editable: true,
        editor: 'number',
        // Whole non-negative quantities only; anything else cancels the edit.
        parse: (raw) => {
            const n = Number(raw);
            return Number.isInteger(n) && n >= 0 ? n : undefined;
        },
    },
    ...MONTH_KEYS.map(monthColumn),
    {
        key: 'total',
        header: 'Total',
        width: 130,
        pin: 'right',
        align: 'right',
        sortable: true,
        // Derived cell: recomputes live as month cells are edited.
        value: (row) =>
            MONTH_KEYS.reduce((sum, key) => sum + (row[key] as number), 0),
        format: (v) => eur.format(v as number),
    },
];

/** VIP rows get extra breathing room — exercises variable row heights. */
export function orderRowHeight(row: DemoOrder): number {
    return row.vip ? 56 : 40;
}
