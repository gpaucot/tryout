import { InjectionToken, type Provider } from '@angular/core';
import type { MermaidConfig, RenderResult } from 'mermaid';

export type { MermaidConfig, RenderResult } from 'mermaid';

/**
 * The rendering contract the MermaidDiagram depends on: turn a diagram `source`
 * into an SVG string, using `id` as the (unique) id mermaid needs for its
 * temporary render node. Kept as an abstraction — not a direct `import mermaid`
 * — so the component is unit-testable with a fake and so the heavy `mermaid`
 * bundle is only pulled in when a diagram is actually drawn.
 */
export interface MermaidRenderer {
    render(id: string, source: string): Promise<RenderResult>;
}

/**
 * The renderer the MermaidDiagram resolves. Defaults (zero-config) to a lazy
 * renderer that dynamically imports `mermaid` on first use. Override app-wide
 * (theme, security level, …) with {@link provideMermaid}, or per-injector for a
 * bespoke/stub renderer.
 */
export const MERMAID_RENDERER = new InjectionToken<MermaidRenderer>(
    'MERMAID_RENDERER',
    { providedIn: 'root', factory: () => createMermaidRenderer() },
);

/**
 * Build a {@link MermaidRenderer} backed by the real `mermaid` library. The
 * import is deferred to the first `render` call and initialization runs once;
 * `config` is merged over the defaults (`startOnLoad: false`, strict security).
 */
export function createMermaidRenderer(config?: MermaidConfig): MermaidRenderer {
    let ready: Promise<typeof import('mermaid').default> | undefined;
    const load = () => {
        ready ??= import('mermaid').then(({ default: mermaid }) => {
            mermaid.initialize({
                startOnLoad: false,
                securityLevel: 'strict',
                ...config,
            });
            return mermaid;
        });
        return ready;
    };
    return {
        async render(id, source) {
            const mermaid = await load();
            return mermaid.render(id, source);
        },
    };
}

/**
 * Provide a mermaid renderer configured once for the app (or a route/component
 * subtree). Pass a {@link MermaidConfig} to set the theme, security level, etc.
 *
 * @example
 * providers: [provideMermaid({ theme: 'neutral' })]
 */
export function provideMermaid(config?: MermaidConfig): Provider {
    return {
        provide: MERMAID_RENDERER,
        useValue: createMermaidRenderer(config),
    };
}
