import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
    AppHeader,
    Button,
    CheckboxGroup,
    DescriptionList,
    FormField,
    provideDescriptionValuePlugins,
    RadioGroup,
    Select,
    ShellLayout,
    TabPanel,
    Tabs,
} from '@dash/design-system';
import type {
    DescriptionItems,
    SelectOptions,
    TabItems,
} from '@dash/util-types';
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
        Button,
        Select,
        RadioGroup,
        CheckboxGroup,
        DescriptionList,
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
    protected readonly sections: TabItems<string> = [
        { value: 'overview', label: 'Overview' },
        { value: 'activity', label: 'Activity' },
        { value: 'archived', label: 'Archived', disabled: true },
    ];

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
    ];

    protected onAction(): void {
        this.clicks.update((n) => n + 1);
    }
}
