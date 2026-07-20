import { Injectable, type Type, inject } from '@angular/core';
import {
    DESCRIPTION_DEFAULT_VALUE_PLUGINS,
    DESCRIPTION_VALUE_PLUGINS,
    type DescriptionValueComponent,
} from './description-list.plugin';

/**
 * Resolves a value `type` to its plugin component. Generic and type-agnostic:
 * it merges the built-in defaults with any consumer-registered plugins
 * (consumer wins on conflicts) and knows nothing about specific types.
 * Provided once per DescriptionList and shared by all nested value outlets.
 */
@Injectable()
export class DescriptionPluginRegistry {
    private readonly byType = new Map<
        string,
        Type<DescriptionValueComponent>
    >();

    constructor() {
        const defaults =
            inject(DESCRIPTION_DEFAULT_VALUE_PLUGINS, { optional: true }) ?? [];
        const registered =
            inject(DESCRIPTION_VALUE_PLUGINS, { optional: true }) ?? [];
        for (const plugin of [...defaults, ...registered]) {
            this.byType.set(plugin.type, plugin.component);
        }
    }

    /** The plugin component for `type`, falling back to the 'string' plugin. */
    resolve(type: string): Type<DescriptionValueComponent> | null {
        return this.byType.get(type) ?? this.byType.get('string') ?? null;
    }
}
