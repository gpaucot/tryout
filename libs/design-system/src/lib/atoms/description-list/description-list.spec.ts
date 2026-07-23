import {
    Component,
    type Provider,
    computed,
    input,
    signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { DescriptionItems } from '@dash/util-types';
import {
    DescriptionList,
    type DescriptionListHeadingLevel,
} from './description-list';
import { provideDescriptionValuePlugins } from './description-list.plugin';
import type {
    DescriptionListOrientation,
    DescriptionListSize,
} from './description-list.variants';

@Component({
    imports: [DescriptionList],
    template: `<ds-description-list
        [items]="items()"
        [orientation]="orientation()"
        [size]="size()"
        [headingLevel]="headingLevel()"
    ></ds-description-list>`,
})
class Host {
    items = signal<DescriptionItems>([]);
    orientation = signal<DescriptionListOrientation>('stacked');
    size = signal<DescriptionListSize>('md');
    headingLevel = signal<DescriptionListHeadingLevel>(3);
}

// A consumer-authored plugin component (the extension path).
@Component({
    selector: 'ds-dv-shout',
    template: `{{ text() }}`,
})
class ShoutValue {
    readonly value = input<unknown>(undefined);
    readonly options = input<Readonly<Record<string, unknown>>>({});
    protected readonly text = computed(
        () => `${String(this.value()).toUpperCase()}!`,
    );
}

function render(items: DescriptionItems, providers: Provider[] = []) {
    TestBed.configureTestingModule({ providers });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.items.set(items);
    fixture.detectChanges();
    const dl = fixture.nativeElement.querySelector('dl') as HTMLDListElement;
    return { fixture, dl };
}

function rowText(dl: HTMLDListElement, index = 0) {
    return dl.querySelectorAll('dd')[index]?.textContent?.trim();
}

describe('DescriptionList', () => {
    it('renders a term/value pair per item (string default)', () => {
        const { dl } = render([
            { term: 'Owner', value: 'gpaucot' },
            { term: 'Team', value: 'platform' },
        ]);
        const terms = Array.from(dl.querySelectorAll('dt')).map((t) =>
            t.textContent?.trim(),
        );
        expect(terms).toEqual(['Owner', 'Team']);
        expect(rowText(dl, 0)).toBe('gpaucot');
    });

    it('applies the default stacked/md classes and switches to inline/lg', () => {
        const { fixture, dl } = render([{ term: 'A', value: '1' }]);
        expect(dl.className).toContain('flex-col');
        expect(dl.className).toContain('text-sm');
        expect((dl.querySelector('div') as HTMLElement).className).toContain(
            'flex-col',
        );

        fixture.componentInstance.orientation.set('inline');
        fixture.componentInstance.size.set('lg');
        fixture.detectChanges();
        expect(dl.className).toContain('text-base');
        expect((dl.querySelector('div') as HTMLElement).className).toContain(
            'grid',
        );
    });

    it('renders numbers and currencies via Intl plugins', () => {
        const { dl } = render([
            { term: 'Seats', value: 12000, type: 'number' },
            {
                term: 'Cost',
                value: 4200,
                type: 'currency',
                options: { currency: 'USD', locale: 'en-US' },
            },
        ]);
        expect(rowText(dl, 0)).toBe('12,000');
        expect(rowText(dl, 1)).toContain('4,200');
        expect(rowText(dl, 1)).toContain('$');
    });

    it('renders booleans with overridable labels', () => {
        const { dl } = render([
            { term: 'Verified', value: true, type: 'boolean' },
            {
                term: 'Active',
                value: false,
                type: 'boolean',
                options: { trueLabel: 'On', falseLabel: 'Off' },
            },
        ]);
        expect(rowText(dl, 0)).toBe('Yes');
        expect(rowText(dl, 1)).toBe('Off');
    });

    it('renders url, email and phone as links', () => {
        const { dl } = render([
            {
                term: 'Site',
                value: 'https://nx.dev',
                type: 'url',
                options: { label: 'nx.dev' },
            },
            { term: 'Email', value: 'a@b.com', type: 'email' },
            { term: 'Phone', value: '+1 (555) 010-1234', type: 'phone' },
        ]);
        const links = Array.from(
            dl.querySelectorAll('a'),
        ) as HTMLAnchorElement[];
        expect(links[0].getAttribute('href')).toBe('https://nx.dev');
        expect(links[0].textContent?.trim()).toBe('nx.dev');
        expect(links[0].getAttribute('target')).toBe('_blank');
        expect(links[1].getAttribute('href')).toBe('mailto:a@b.com');
        expect(links[2].getAttribute('href')).toBe('tel:+15550101234');
    });

    it('renders arrays as a list, formatting each element by itemType', () => {
        const { dl } = render([
            {
                term: 'Prices',
                value: [1000, 2500],
                type: 'array',
                options: {
                    itemType: 'currency',
                    itemOptions: { currency: 'USD', locale: 'en-US' },
                },
            },
        ]);
        const chips = Array.from(dl.querySelectorAll('li')).map((li) =>
            li.textContent?.trim(),
        );
        expect(chips.length).toBe(2);
        expect(chips[0]).toContain('1,000');
        expect(chips[1]).toContain('2,500');
    });

    it('renders a dash for null/undefined values', () => {
        const { dl } = render([{ term: 'Notes', value: null }]);
        expect(rowText(dl, 0)).toBe('—');
    });

    it('is extensible: a registered plugin adds a new type (Open/Closed)', () => {
        const { dl } = render(
            [{ term: 'Shout', value: 'hi', type: 'shout' }],
            provideDescriptionValuePlugins({
                type: 'shout',
                component: ShoutValue,
            }),
        );
        expect(rowText(dl, 0)).toBe('HI!');
    });

    it('renders a nested section with an h3 label by default', () => {
        const { fixture } = render([
            { term: 'Owner', value: 'gpaucot' },
            {
                label: 'Billing',
                items: [{ term: 'Plan', value: 'Pro' }],
            },
        ]);
        const root = fixture.nativeElement as HTMLElement;
        const heading = root.querySelector('section > h3');
        expect(heading?.textContent?.trim()).toBe('Billing');
        const nested = root.querySelector('section dl');
        expect(nested?.querySelector('dt')?.textContent?.trim()).toBe('Plan');
        expect(nested?.querySelector('dd')?.textContent?.trim()).toBe('Pro');
    });

    it('adapts the heading level per nesting depth, capped at h6', () => {
        const { fixture } = render([
            {
                label: 'L1',
                items: [
                    {
                        label: 'L2',
                        items: [
                            { label: 'L3', items: [{ label: 'L4', items: [] }] },
                        ],
                    },
                ],
            },
        ]);
        fixture.componentInstance.headingLevel.set(4);
        fixture.detectChanges();
        const root = fixture.nativeElement as HTMLElement;
        const levels = Array.from(
            root.querySelectorAll('h2, h3, h4, h5, h6'),
        ).map((h) => `${h.tagName.toLowerCase()}:${h.textContent?.trim()}`);
        expect(levels).toEqual(['h4:L1', 'h5:L2', 'h6:L3', 'h6:L4']);
    });

    it('groups consecutive items around a section into separate <dl> runs', () => {
        const { fixture } = render([
            { term: 'A', value: '1' },
            { term: 'B', value: '2' },
            { label: 'S', items: [{ term: 'C', value: '3' }] },
            { term: 'D', value: '4' },
        ]);
        const root = fixture.nativeElement as HTMLElement;
        // Two top-level runs (A+B and D) plus the section's own list.
        const lists = root.querySelectorAll('dl');
        expect(lists.length).toBe(3);
        const topTerms = (dl: Element) =>
            Array.from(dl.querySelectorAll('dt')).map((t) =>
                t.textContent?.trim(),
            );
        expect(topTerms(lists[0])).toEqual(['A', 'B']);
        expect(topTerms(lists[2])).toEqual(['D']);
    });

    it('resolves consumer plugins inside nested sections', () => {
        const { fixture } = render(
            [
                {
                    label: 'Custom',
                    items: [{ term: 'Shout', value: 'hi', type: 'shout' }],
                },
            ],
            provideDescriptionValuePlugins({
                type: 'shout',
                component: ShoutValue,
            }),
        );
        const root = fixture.nativeElement as HTMLElement;
        expect(
            root.querySelector('section dd')?.textContent?.trim(),
        ).toBe('HI!');
    });

    it('lets a registered plugin override a built-in type', () => {
        const { dl } = render(
            [{ term: 'Name', value: 'x', type: 'string' }],
            provideDescriptionValuePlugins({
                type: 'string',
                component: ShoutValue,
            }),
        );
        expect(rowText(dl, 0)).toBe('X!');
    });
});
