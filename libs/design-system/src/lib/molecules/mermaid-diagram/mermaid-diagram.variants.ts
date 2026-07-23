import { tv } from 'tailwind-variants';

/**
 * Private variant definition for the MermaidDiagram molecule.
 * `output` centers the generated SVG and makes it fluid (the rendered `<svg>`
 * scales to the host width rather than mermaid's intrinsic size); `loading`
 * dims the previous drawing while a re-render is in flight; `error` is the
 * inline failure notice.
 */
export const mermaidDiagram = tv({
    slots: {
        root: 'ds-mermaid-diagram block',
        output: [
            'flex justify-center transition-opacity',
            '[&>svg]:h-auto [&>svg]:max-w-full',
        ],
        loading: 'text-sm text-ink-muted',
        error: [
            'flex items-start gap-2 rounded-card border border-danger-100',
            'bg-danger-50 p-3 text-sm text-danger-700',
        ],
    },
    variants: {
        busy: {
            true: { output: 'opacity-60' },
        },
    },
});
