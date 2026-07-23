import {
    ChangeDetectionStrategy,
    Component,
    computed,
    forwardRef,
    input,
} from '@angular/core';
import { cn } from '@dash/ui-styles';
import type {
    DescriptionEntry,
    DescriptionItem,
    DescriptionItems,
    DescriptionSection,
} from '@dash/util-types';
import { DescriptionValue } from './description-value';
import { DescriptionPluginRegistry } from './description-list.registry';
import { BUILT_IN_DESCRIPTION_PLUGINS } from './description-list.plugins';
import { DESCRIPTION_DEFAULT_VALUE_PLUGINS } from './description-list.plugin';
import {
    descriptionList,
    type DescriptionListOrientation,
    type DescriptionListSize,
} from './description-list.variants';

/** Heading levels a description-list section label may render as. */
export type DescriptionListHeadingLevel = 2 | 3 | 4 | 5 | 6;

/** A section entry has a label and child entries; an item has a term. */
function isSection(entry: DescriptionEntry): entry is DescriptionSection {
    return 'items' in entry;
}

/** Consecutive plain items collapse into one `<dl>` run between sections. */
type EntryGroup =
    | { readonly kind: 'items'; readonly items: DescriptionItem[] }
    | { readonly kind: 'section'; readonly section: DescriptionSection };

/**
 * DescriptionList — atom.
 * Renders term/value pairs from data into a native `<dl>`. It is
 * type-agnostic: each value is rendered by a plugin resolved from the registry,
 * so supporting a new value type never touches this component — register a
 * plugin via `provideDescriptionValuePlugins` instead. Built-ins are supplied
 * here as zero-config defaults through the same plugin contract.
 *
 * Entries may also be labelled sections (`{ label, items }`), which render a
 * heading followed by a nested list. `headingLevel` sets the level of
 * top-level section labels; each nesting depth uses the next level down,
 * capped at `<h6>`.
 */
@Component({
    selector: 'ds-description-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [DescriptionValue, forwardRef(() => DescriptionList)],
    providers: [
        DescriptionPluginRegistry,
        {
            provide: DESCRIPTION_DEFAULT_VALUE_PLUGINS,
            useValue: BUILT_IN_DESCRIPTION_PLUGINS,
        },
    ],
    templateUrl: './description-list.html',
    host: { class: 'contents' },
})
export class DescriptionList {
    readonly items = input.required<DescriptionItems>();
    readonly orientation = input<DescriptionListOrientation>('stacked');
    readonly size = input<DescriptionListSize>('md');
    /** Heading level for top-level section labels. Nested sections adapt. */
    readonly headingLevel = input<DescriptionListHeadingLevel>(3);
    /** Extra classes forwarded by a composing component. */
    readonly class = input<string>('');

    protected readonly groups = computed<readonly EntryGroup[]>(() => {
        const groups: EntryGroup[] = [];
        for (const entry of this.items()) {
            const last = groups[groups.length - 1];
            if (isSection(entry)) {
                groups.push({ kind: 'section', section: entry });
            } else if (last?.kind === 'items') {
                last.items.push(entry);
            } else {
                groups.push({ kind: 'items', items: [entry] });
            }
        }
        return groups;
    });

    protected readonly nestedHeadingLevel = computed(
        () => Math.min(this.headingLevel() + 1, 6) as DescriptionListHeadingLevel,
    );

    protected readonly containerClasses = computed(() =>
        cn(descriptionList.container({ size: this.size() }), this.class()),
    );
    protected readonly listClasses = computed(() =>
        descriptionList.root({
            size: this.size(),
            orientation: this.orientation(),
        }),
    );
    protected readonly rowClasses = computed(() =>
        descriptionList.row({ orientation: this.orientation() }),
    );
    protected readonly sectionClasses = descriptionList.section();
    protected readonly sectionLabelClasses = descriptionList.sectionLabel();
    protected readonly termClasses = descriptionList.term();
    protected readonly descriptionClasses = descriptionList.description();
}
