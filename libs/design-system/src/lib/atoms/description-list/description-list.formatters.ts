import type {
  DescriptionRendering,
  DescriptionValueFormatter,
} from './description-list.model';

/**
 * Built-in value formatters. Each handles exactly one `type` and is a private
 * implementation detail — consumers extend/override via the public
 * `provideDescriptionValueFormatters` token, not by importing these.
 */

const text = (value: string): DescriptionRendering => ({
  display: 'text',
  text: value,
});

const toFiniteNumber = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

const stringFormatter: DescriptionValueFormatter = {
  type: 'string',
  format: (value) => text(value == null ? '' : String(value)),
};

const numberFormatter: DescriptionValueFormatter = {
  type: 'number',
  format: (value, ctx) => {
    const n = toFiniteNumber(value);
    if (n === null) return text(String(value ?? ''));
    const { locale, ...opts } = ctx.options as {
      locale?: string;
    } & Intl.NumberFormatOptions;
    return text(new Intl.NumberFormat(locale, opts).format(n));
  },
};

const currencyFormatter: DescriptionValueFormatter = {
  type: 'currency',
  format: (value, ctx) => {
    const n = toFiniteNumber(value);
    if (n === null) return text(String(value ?? ''));
    const {
      locale,
      currency = 'USD',
      ...opts
    } = ctx.options as {
      locale?: string;
      currency?: string;
    } & Intl.NumberFormatOptions;
    return text(
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        ...opts,
      }).format(n),
    );
  },
};

const booleanFormatter: DescriptionValueFormatter = {
  type: 'boolean',
  format: (value, ctx) => {
    const { trueLabel = 'Yes', falseLabel = 'No' } = ctx.options as {
      trueLabel?: string;
      falseLabel?: string;
    };
    return text(value ? trueLabel : falseLabel);
  },
};

const phoneFormatter: DescriptionValueFormatter = {
  type: 'phone',
  format: (value) => {
    const raw = String(value ?? '');
    return { display: 'link', href: `tel:${raw.replace(/[^\d+]/g, '')}`, label: raw };
  },
};

const urlFormatter: DescriptionValueFormatter = {
  type: 'url',
  format: (value, ctx) => {
    const href = String(value ?? '');
    const { label } = ctx.options as { label?: string };
    return { display: 'link', href, label: label ?? href, external: true };
  },
};

const emailFormatter: DescriptionValueFormatter = {
  type: 'email',
  format: (value) => {
    const address = String(value ?? '');
    return { display: 'link', href: `mailto:${address}`, label: address };
  },
};

const arrayFormatter: DescriptionValueFormatter = {
  type: 'array',
  format: (value, ctx) => {
    const items = Array.isArray(value) ? value : value == null ? [] : [value];
    const { itemType, itemOptions } = ctx.options as {
      itemType?: string;
      itemOptions?: Readonly<Record<string, unknown>>;
    };
    return {
      display: 'list',
      items: items.map((element) => ctx.render(element, itemType, itemOptions)),
    };
  },
};

/** All built-ins, in registration order. */
export const BUILT_IN_DESCRIPTION_FORMATTERS: readonly DescriptionValueFormatter[] =
  [
    stringFormatter,
    numberFormatter,
    currencyFormatter,
    booleanFormatter,
    phoneFormatter,
    urlFormatter,
    emailFormatter,
    arrayFormatter,
  ];
