import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
} from '@angular/core';
import { DescriptionValue } from './description-value';
import type {
    DescriptionValueComponent,
    DescriptionValuePlugin,
} from './description-list.plugin';
import { descriptionList } from './description-list.variants';

/**
 * Built-in value plugins. Each is a self-contained component that renders one
 * value `type` and fully owns its output. They are ordinary plugins — the core
 * treats them exactly like consumer-registered ones; they are simply supplied
 * as the zero-config defaults. Kept private: extend via the public
 * `provideDescriptionValuePlugins` token, not by importing these.
 */

const toFiniteNumber = (value: unknown): number | null => {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : null;
};

@Component({
    selector: 'ds-dv-string',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `{{ text() }}`,
})
export class StringValue implements DescriptionValueComponent {
    readonly value = input<unknown>(undefined);
    readonly options = input<Readonly<Record<string, unknown>>>({});
    protected readonly text = computed(() =>
        this.value() == null ? '' : String(this.value()),
    );
}

@Component({
    selector: 'ds-dv-number',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `{{ text() }}`,
})
export class NumberValue implements DescriptionValueComponent {
    readonly value = input<unknown>(undefined);
    readonly options = input<Readonly<Record<string, unknown>>>({});
    protected readonly text = computed(() => {
        const n = toFiniteNumber(this.value());
        if (n === null) return String(this.value() ?? '');
        const { locale, ...opts } = this.options() as {
            locale?: string;
        } & Intl.NumberFormatOptions;
        return new Intl.NumberFormat(locale, opts).format(n);
    });
}

@Component({
    selector: 'ds-dv-currency',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `{{ text() }}`,
})
export class CurrencyValue implements DescriptionValueComponent {
    readonly value = input<unknown>(undefined);
    readonly options = input<Readonly<Record<string, unknown>>>({});
    protected readonly text = computed(() => {
        const n = toFiniteNumber(this.value());
        if (n === null) return String(this.value() ?? '');
        const {
            locale,
            currency = 'USD',
            ...opts
        } = this.options() as {
            locale?: string;
            currency?: string;
        } & Intl.NumberFormatOptions;
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            ...opts,
        }).format(n);
    });
}

@Component({
    selector: 'ds-dv-boolean',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `{{ text() }}`,
})
export class BooleanValue implements DescriptionValueComponent {
    readonly value = input<unknown>(undefined);
    readonly options = input<Readonly<Record<string, unknown>>>({});
    protected readonly text = computed(() => {
        const { trueLabel = 'Yes', falseLabel = 'No' } = this.options() as {
            trueLabel?: string;
            falseLabel?: string;
        };
        return this.value() ? trueLabel : falseLabel;
    });
}

@Component({
    selector: 'ds-dv-phone',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<a [attr.href]="href()" [class]="linkClass">{{ label() }}</a>`,
})
export class PhoneValue implements DescriptionValueComponent {
    readonly value = input<unknown>(undefined);
    readonly options = input<Readonly<Record<string, unknown>>>({});
    protected readonly linkClass = descriptionList.link();
    protected readonly label = computed(() => String(this.value() ?? ''));
    protected readonly href = computed(
        () => `tel:${String(this.value() ?? '').replace(/[^\d+]/g, '')}`,
    );
}

@Component({
    selector: 'ds-dv-url',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<a
        [attr.href]="href()"
        target="_blank"
        rel="noopener noreferrer"
        [class]="linkClass"
        >{{ label() }}</a
    >`,
})
export class UrlValue implements DescriptionValueComponent {
    readonly value = input<unknown>(undefined);
    readonly options = input<Readonly<Record<string, unknown>>>({});
    protected readonly linkClass = descriptionList.link();
    protected readonly href = computed(() => String(this.value() ?? ''));
    protected readonly label = computed(
        () => (this.options() as { label?: string }).label ?? this.href(),
    );
}

@Component({
    selector: 'ds-dv-email',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<a [attr.href]="href()" [class]="linkClass">{{ label() }}</a>`,
})
export class EmailValue implements DescriptionValueComponent {
    readonly value = input<unknown>(undefined);
    readonly options = input<Readonly<Record<string, unknown>>>({});
    protected readonly linkClass = descriptionList.link();
    protected readonly label = computed(() => String(this.value() ?? ''));
    protected readonly href = computed(() => `mailto:${this.label()}`);
}

@Component({
    selector: 'ds-dv-array',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [DescriptionValue],
    template: `<ul [class]="listClass">
        @for (item of items(); track $index) {
            <li [class]="chipClass">
                <ds-description-value
                    [value]="item"
                    [type]="itemType()"
                    [options]="itemOptions()"
                ></ds-description-value>
            </li>
        }
    </ul>`,
})
export class ArrayValue implements DescriptionValueComponent {
    readonly value = input<unknown>(undefined);
    readonly options = input<Readonly<Record<string, unknown>>>({});
    protected readonly listClass = descriptionList.list();
    protected readonly chipClass = descriptionList.chip();
    protected readonly items = computed<readonly unknown[]>(() => {
        const v = this.value();
        return Array.isArray(v) ? v : v == null ? [] : [v];
    });
    protected readonly itemType = computed(
        () => (this.options() as { itemType?: string }).itemType ?? 'string',
    );
    protected readonly itemOptions = computed(
        () =>
            (
                this.options() as {
                    itemOptions?: Readonly<Record<string, unknown>>;
                }
            ).itemOptions ?? {},
    );
}

/** The default plugin set, supplied to the DescriptionList as zero-config defaults. */
export const BUILT_IN_DESCRIPTION_PLUGINS: readonly DescriptionValuePlugin[] = [
    { type: 'string', component: StringValue },
    { type: 'number', component: NumberValue },
    { type: 'currency', component: CurrencyValue },
    { type: 'boolean', component: BooleanValue },
    { type: 'phone', component: PhoneValue },
    { type: 'url', component: UrlValue },
    { type: 'email', component: EmailValue },
    { type: 'array', component: ArrayValue },
];
