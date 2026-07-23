import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
    AppHeader,
    Button,
    CheckboxGroup,
    DescriptionList,
    type DescriptionListActionEvent,
    FormField,
    Icon,
    provideDescriptionValuePlugins,
    RadioGroup,
    Select,
    ShellLayout,
    Table,
    TabPanel,
    Tabs,
} from '@dash/design-system';
import type {
    DescriptionItems,
    SelectOptions,
    TabItems,
    TableCellEdit,
    TableSort,
} from '@dash/util-types';
import {
    type DemoOrder,
    makeOrders,
    ORDER_COLUMNS,
    orderRowHeight,
} from './orders-demo';
import { StatusBadgeValue } from './status-badge-value';

/**
 * HomePage — page (atomic top level).
 * A routed component that fills the ShellLayout template with real content and
 * holds view state. This is the ONLY level allowed to own state/routing, which
 * is why pages live in a feature lib, not the design system.
 */
@Component({
    selector: 'app-home-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ShellLayout,
        AppHeader,
        FormField,
        Icon,
        Button,
        Select,
        RadioGroup,
        CheckboxGroup,
        DescriptionList,
        Table,
        Tabs,
        TabPanel,
    ],
    providers: [
        // Consumer extends the DescriptionList with a custom value type — no
        // change to the design system.
        provideDescriptionValuePlugins({
            type: 'badge',
            component: StatusBadgeValue,
        }),
    ],
    templateUrl: './home-page.html',
})
export class HomePage {
    protected readonly clicks = signal(0);

    protected readonly fruits: SelectOptions<string> = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
        { value: 'cherry', label: 'Cherry' },
        { value: 'date', label: 'Date' },
        { value: 'elderberry', label: 'Elderberry', disabled: true },
        { value: 'fig', label: 'Fig' },
    ];

    protected readonly fruit = signal<string | undefined>(undefined);
    protected readonly plan = signal<string | undefined>('free');
    protected readonly toppings = signal<readonly string[]>(['apple']);

    protected readonly section = signal('overview');
    // Enough tabs that the strip overflows on an iPhone 6 — it scrolls
    // horizontally rather than widening the page.
    protected readonly sections: TabItems<string> = [
        { value: 'overview', label: 'Overview' },
        { value: 'activity', label: 'Activity' },
        { value: 'members', label: 'Members' },
        { value: 'integrations', label: 'Integrations' },
        { value: 'billing', label: 'Billing' },
        { value: 'archived', label: 'Archived', disabled: true },
    ];

    // Order tabs with trailing count badges — mirrors the Flup reference: a
    // status filter bar over the orders table.
    protected readonly orderTab = signal('all');
    protected readonly orderTabs: TabItems<string> = [
        { value: 'all', label: 'All orders', badge: 152 },
        { value: 'in-progress', label: 'In progress', badge: 54 },
        { value: 'completed', label: 'Completed', badge: 77 },
        { value: 'returned', label: 'Returned', badge: 15 },
        { value: 'canceled', label: 'Canceled', badge: 6 },
    ];

    // Orders grid — a deliberately huge dataset (10k rows × 30 columns) so
    // the Table's 2-axis virtualization has something real to chew on.
    protected readonly orders = makeOrders();
    protected readonly orderColumns = ORDER_COLUMNS;
    protected readonly orderRowHeight = orderRowHeight;
    protected readonly orderSort = signal<TableSort | null>({
        key: 'date',
        direction: 'desc',
    });
    protected readonly lastOrderEdit = signal<TableCellEdit<DemoOrder> | null>(
        null,
    );

    protected onOrderEdit(edit: TableCellEdit<DemoOrder>): void {
        this.lastOrderEdit.set(edit);
    }

    protected readonly plans: SelectOptions<string> = [
        { value: 'free', label: 'Free' },
        { value: 'pro', label: 'Pro' },
        { value: 'enterprise', label: 'Enterprise' },
    ];

    protected readonly details: DescriptionItems = [
        {
            term: 'Status',
            value: true,
            type: 'boolean',
            options: { trueLabel: 'Active', falseLabel: 'Inactive' },
        },
        { term: 'Owner', value: 'gpaucot' },
        { term: 'Seats', value: 12, type: 'number' },
        {
            term: 'Monthly cost',
            value: 4200,
            type: 'currency',
            options: { currency: 'EUR', locale: 'en-GB' },
        },
        { term: 'Support', value: 'support@example.com', type: 'email' },
        { term: 'Phone', value: '+1 (555) 010-1234', type: 'phone' },
        {
            term: 'Docs',
            value: 'https://nx.dev',
            type: 'url',
            options: { label: 'nx.dev' },
        },
        { term: 'Regions', value: ['eu-west-1', 'us-east-1'], type: 'array' },
        { term: 'Tier', value: 'gold', type: 'badge' },
        {
            label: 'Billing',
            actions: [
                { id: 'edit-billing', label: 'Edit', icon: 'edit' },
                {
                    id: 'download-invoice',
                    label: 'Download invoice',
                    icon: 'download',
                    hideLabel: true,
                },
            ],
            items: [
                { term: 'Plan', value: 'Pro' },
                {
                    term: 'Renews',
                    value: 1200,
                    type: 'currency',
                    options: { currency: 'EUR', locale: 'en-GB' },
                },
                {
                    label: 'Payment method',
                    actions: [{ id: 'add-card', label: 'Add card', icon: 'add' }],
                    items: [
                        { term: 'Card', value: 'Visa •••• 4242' },
                        { term: 'Auto-renew', value: true, type: 'boolean' },
                    ],
                },
            ],
        },
    ];

    protected readonly lastDetailAction = signal('');

    protected onAction(): void {
        this.clicks.update((n) => n + 1);
    }

    protected onDetailAction(event: DescriptionListActionEvent): void {
        this.lastDetailAction.set(
            `${event.action.label} (${event.section.label})`,
        );
    }
}
