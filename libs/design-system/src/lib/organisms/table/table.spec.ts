import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { TableCellEdit, TableColumns, TableSort } from '@dash/util-types';
import { Table } from './table';

interface Row {
    id: number;
    name: string;
    amount: number;
    [metric: string]: unknown;
}

const COL_COUNT = 40;
const ROW_COUNT = 1000;

function makeRows(): Row[] {
    return Array.from({ length: ROW_COUNT }, (_, i) => {
        const row: Row = {
            id: i,
            name: `Row ${String(i).padStart(4, '0')}`,
            amount: (i * 37) % 500,
        };
        for (let c = 0; c < COL_COUNT; c++) row[`m${c}`] = i * 100 + c;
        return row;
    });
}

function makeColumns(): TableColumns<Row> {
    return [
        { key: 'id', header: 'ID', width: 80, pin: 'left', sortable: true },
        { key: 'name', header: 'Name', width: 160, editable: true },
        {
            key: 'amount',
            header: 'Amount',
            width: 120,
            pin: 'right',
            sortable: true,
            editable: true,
            editor: 'number',
        },
        ...Array.from({ length: COL_COUNT }, (_, c) => ({
            key: `m${c}`,
            header: `Metric ${c}`,
            width: 100,
        })),
    ];
}

@Component({
    imports: [Table],
    template: `<ds-table
        [data]="data()"
        [columns]="columns"
        [rowHeight]="rowHeight"
        [(sort)]="sort"
        [overscan]="1"
        label="Spec grid"
        (cellEdit)="edits.push($event)"
        (dataChange)="latest.set($event)"
    />`,
})
class Host {
    readonly data = signal<readonly Row[]>(makeRows());
    readonly columns = makeColumns();
    rowHeight: number | ((row: Row, index: number) => number) = 40;
    readonly sort = signal<TableSort | null>(null);
    readonly edits: TableCellEdit<Row>[] = [];
    readonly latest = signal<readonly Row[] | null>(null);
}

interface Ctx {
    fixture: ComponentFixture<Host>;
    host: Host;
    root: HTMLElement;
    viewport: HTMLElement;
}

/**
 * jsdom has no layout, so the viewport reports 0×0. Pretend it is
 * `width`×`height` and fire a scroll so the table re-measures.
 */
function sizeViewport(root: HTMLElement, width: number, height: number) {
    const viewport = root.querySelector('[role="grid"]') as HTMLElement;
    Object.defineProperty(viewport, 'clientWidth', {
        value: width,
        configurable: true,
    });
    Object.defineProperty(viewport, 'clientHeight', {
        value: height,
        configurable: true,
    });
    viewport.dispatchEvent(new Event('scroll'));
    return viewport;
}

function scrollTo(ctx: Ctx, top: number, left: number) {
    ctx.viewport.scrollTop = top;
    ctx.viewport.scrollLeft = left;
    ctx.viewport.dispatchEvent(new Event('scroll'));
    ctx.fixture.detectChanges();
}

function render(configure?: (host: Host) => void): Ctx {
    const fixture = TestBed.createComponent(Host);
    configure?.(fixture.componentInstance);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const viewport = sizeViewport(root, 600, 400);
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance, root, viewport };
}

const bodyRows = (ctx: Ctx) =>
    Array.from(ctx.root.querySelectorAll<HTMLElement>('[role="row"]')).filter(
        (el) => el.getAttribute('aria-rowindex') !== '1',
    );

const headerCells = (ctx: Ctx) =>
    Array.from(ctx.root.querySelectorAll<HTMLElement>('[role="columnheader"]'));

/** Header cells whose text starts with `text` (sortable ones append an icon). */
const headerOf = (ctx: Ctx, text: string) =>
    headerCells(ctx).find((el) => el.textContent?.trim().startsWith(text));

const gridCells = (ctx: Ctx) =>
    Array.from(ctx.root.querySelectorAll<HTMLElement>('[role="gridcell"]'));

function pressKey(el: HTMLElement, key: string) {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('Table', () => {
    it('renders only the visible row window (plus overscan)', () => {
        const ctx = render();
        const rows = bodyRows(ctx);
        // 400px viewport / 40px rows = 10 visible + 1 overscan.
        expect(rows.length).toBeGreaterThan(5);
        expect(rows.length).toBeLessThan(20);
        expect(rows[0].getAttribute('aria-rowindex')).toBe('2');
        // Full dataset still announced to AT.
        const grid = ctx.root.querySelector('[role="grid"]');
        expect(grid?.getAttribute('aria-rowcount')).toBe(String(ROW_COUNT + 1));
        expect(grid?.getAttribute('aria-colcount')).toBe(String(COL_COUNT + 3));
    });

    it('windows rows on vertical scroll, keeping virtual offsets', () => {
        const ctx = render();
        scrollTo(ctx, 4000, 0);
        const rows = bodyRows(ctx);
        // 4000px / 40px = sorted index 100 at the top; 1 overscan above.
        expect(rows[0].getAttribute('aria-rowindex')).toBe(String(99 + 2));
        expect(rows[0].style.top).toBe(`${99 * 40}px`);
    });

    it('windows middle columns on horizontal scroll; pinned always render', () => {
        const ctx = render();
        expect(headerOf(ctx, 'ID')).toBeTruthy();
        expect(headerOf(ctx, 'Amount')).toBeTruthy();
        expect(headerOf(ctx, 'Metric 0')).toBeTruthy();
        expect(headerOf(ctx, 'Metric 30')).toBeUndefined();
        // Scroll deep into the middle columns.
        scrollTo(ctx, 0, 3000);
        expect(headerOf(ctx, 'ID')).toBeTruthy();
        expect(headerOf(ctx, 'Amount')).toBeTruthy();
        expect(headerOf(ctx, 'Metric 30')).toBeTruthy();
        expect(
            headerCells(ctx).some(
                (el) => el.textContent?.trim() === 'Metric 0',
            ),
        ).toBe(false);
    });

    it('positions pinned columns with sticky offsets', () => {
        const ctx = render();
        const id = headerOf(ctx, 'ID');
        const amount = headerOf(ctx, 'Amount');
        expect(id?.className).toContain('sticky');
        expect(id?.style.left).toBe('0px');
        expect(amount?.className).toContain('sticky');
        expect(amount?.style.right).toBe('0px');
    });

    it('supports variable row heights via a rowHeight function', () => {
        const ctx = render((host) => {
            host.rowHeight = (_row, i) => (i % 2 === 0 ? 60 : 20);
        });
        const rows = bodyRows(ctx);
        expect(rows[0].style.height).toBe('60px');
        expect(rows[0].style.top).toBe('0px');
        expect(rows[1].style.height).toBe('20px');
        expect(rows[1].style.top).toBe('60px');
        expect(rows[2].style.top).toBe('80px');
    });

    it('cycles sort asc → desc → none on header click and reorders rows', () => {
        const ctx = render();
        const button = headerOf(ctx, 'Amount')?.querySelector('button');
        expect(button).toBeTruthy();

        button?.click();
        ctx.fixture.detectChanges();
        expect(ctx.host.sort()).toEqual({ key: 'amount', direction: 'asc' });
        // Smallest amount is 0, held by row 0 (stable sort keeps it first).
        expect(bodyRows(ctx)[0].textContent).toContain('Row 0000');
        expect(headerOf(ctx, 'Amount')?.getAttribute('aria-sort')).toBe(
            'ascending',
        );

        button?.click();
        ctx.fixture.detectChanges();
        expect(ctx.host.sort()).toEqual({ key: 'amount', direction: 'desc' });
        expect(bodyRows(ctx)[0].textContent).not.toContain('Row 0000');
        expect(headerOf(ctx, 'Amount')?.getAttribute('aria-sort')).toBe(
            'descending',
        );

        button?.click();
        ctx.fixture.detectChanges();
        expect(ctx.host.sort()).toBeNull();
        expect(bodyRows(ctx)[0].textContent).toContain('Row 0000');
    });

    it('edits a cell inline and emits cellEdit + dataChange', () => {
        const ctx = render();
        const nameCell = gridCells(ctx).find(
            (c) => c.textContent?.trim() === 'Row 0000',
        );
        expect(nameCell).toBeTruthy();

        nameCell?.dispatchEvent(new Event('dblclick'));
        ctx.fixture.detectChanges();
        const editor = nameCell?.querySelector('input') as HTMLInputElement;
        expect(editor).toBeTruthy();
        expect(editor.value).toBe('Row 0000');

        editor.value = 'Renamed';
        pressKey(editor, 'Enter');
        ctx.fixture.detectChanges();

        expect(ctx.host.edits).toHaveLength(1);
        expect(ctx.host.edits[0]).toMatchObject({
            key: 'name',
            rowIndex: 0,
            value: 'Renamed',
            previousValue: 'Row 0000',
        });
        expect(ctx.host.latest()?.[0].name).toBe('Renamed');
        // The input array is untouched (the table edits its working copy).
        expect(ctx.host.data()[0].name).toBe('Row 0000');
        expect(nameCell?.textContent?.trim()).toBe('Renamed');
    });

    it('cancels an edit on Escape and rejects invalid number entries', () => {
        const ctx = render();
        const nameCell = gridCells(ctx).find(
            (c) => c.textContent?.trim() === 'Row 0000',
        );
        nameCell?.dispatchEvent(new Event('dblclick'));
        ctx.fixture.detectChanges();
        let editor = nameCell?.querySelector('input') as HTMLInputElement;
        editor.value = 'Ignored';
        pressKey(editor, 'Escape');
        ctx.fixture.detectChanges();
        expect(ctx.host.edits).toHaveLength(0);
        expect(nameCell?.textContent?.trim()).toBe('Row 0000');

        // Amount is a number editor: an unparseable entry cancels the edit.
        const amountCell = gridCells(ctx).find(
            (c) => c.style.right === '0px' && c.textContent?.trim() === '0',
        );
        amountCell?.dispatchEvent(new Event('dblclick'));
        ctx.fixture.detectChanges();
        editor = amountCell?.querySelector('input') as HTMLInputElement;
        expect(editor).toBeTruthy();
        editor.value = 'not-a-number';
        pressKey(editor, 'Enter');
        ctx.fixture.detectChanges();
        expect(ctx.host.edits).toHaveLength(0);
        expect(amountCell?.textContent?.trim()).toBe('0');
    });

    it('re-seeds its working copy when the data input changes', () => {
        const ctx = render();
        ctx.host.data.set([{ id: 1, name: 'Only', amount: 7 }]);
        ctx.fixture.detectChanges();
        expect(bodyRows(ctx)).toHaveLength(1);
        expect(bodyRows(ctx)[0].textContent).toContain('Only');
    });

    it('shows the empty state without rows', () => {
        const ctx = render();
        ctx.host.data.set([]);
        ctx.fixture.detectChanges();
        expect(bodyRows(ctx)).toHaveLength(0);
        expect(ctx.root.querySelector('[role="grid"]')?.textContent).toContain(
            'No data',
        );
    });
});
