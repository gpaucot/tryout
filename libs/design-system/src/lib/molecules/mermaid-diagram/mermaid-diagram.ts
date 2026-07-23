import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    ElementRef,
    inject,
    input,
    output,
    signal,
    untracked,
    viewChild,
} from '@angular/core';
import { cn } from '@dash/ui-styles';
import { Icon } from '../../atoms/icon/icon';
import { MERMAID_RENDERER } from './mermaid-diagram.renderer';
import { mermaidDiagram } from './mermaid-diagram.variants';

/** Where a render attempt currently stands. */
export type MermaidDiagramStatus = 'loading' | 'ready' | 'error';

/** Process-wide counter for the unique id mermaid needs per render node. */
let nextId = 0;

/**
 * MermaidDiagram — molecule.
 * Renders a [mermaid](https://mermaid.js.org) diagram from its text `source`.
 * The drawing is produced off-DOM by the injected {@link MERMAID_RENDERER}
 * (which lazy-loads mermaid by default) and its SVG is placed into the output
 * container; it re-renders whenever `source` changes.
 *
 * - **States** are surfaced on the host as `data-status`
 *   (`loading` | `ready` | `error`) and emitted via `rendered` / `errored`.
 *   During a re-render the previous drawing stays visible but dimmed.
 * - **Accessibility**: pass `label` to expose the diagram as `role="img"` with
 *   that accessible name; without it the drawing is decorative (`aria-hidden`).
 * - **Trust**: the SVG string is written directly into the DOM (Angular's HTML
 *   sanitizer would strip the `<svg>`), so it relies on mermaid's own
 *   sanitization — keep the renderer's `securityLevel` at `strict`/`sandbox`
 *   for untrusted input (the default renderer uses `strict`).
 *
 * @example
 * <ds-mermaid-diagram [source]="'graph TD; A-->B; A-->C'" label="Build flow" />
 */
@Component({
    selector: 'ds-mermaid-diagram',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon],
    templateUrl: './mermaid-diagram.html',
    host: {
        '[class]': 'hostClasses()',
        '[attr.data-status]': 'status()',
    },
})
export class MermaidDiagram {
    /** The mermaid diagram definition (e.g. `graph TD; A-->B`). */
    readonly source = input.required<string>();
    /**
     * Accessible name for the diagram. When set the output is exposed as
     * `role="img"`; when omitted the drawing is decorative (`aria-hidden`).
     */
    readonly label = input('');
    /** Extra classes forwarded onto the host element. */
    readonly class = input('');

    /** Emitted after each successful render. */
    readonly rendered = output<void>();
    /** Emitted when a render fails, with the thrown reason. */
    readonly errored = output<unknown>();

    private readonly renderer = inject(MERMAID_RENDERER);
    private readonly outputEl =
        viewChild.required<ElementRef<HTMLElement>>('output');

    /** Unique across instances — mermaid keys its temporary render node by it. */
    private readonly domId = `ds-mermaid-${++nextId}`;
    /** Bumped per attempt so a slow render that lost the race is discarded. */
    private renderSeq = 0;
    private viewReady = false;

    protected readonly status = signal<MermaidDiagramStatus>('loading');
    protected readonly errorMessage = signal('');

    protected readonly hostClasses = computed(() =>
        cn(mermaidDiagram().root(), this.class()),
    );
    protected readonly outputClasses = computed(() =>
        mermaidDiagram({ busy: this.status() === 'loading' }).output(),
    );
    protected readonly loadingClasses = mermaidDiagram().loading();
    protected readonly errorClasses = mermaidDiagram().error();

    constructor() {
        // The first render waits for the output element to exist; every later
        // `source` change re-renders (the view is ready by then).
        afterNextRender(() => {
            this.viewReady = true;
            void this.renderDiagram();
        });
        effect(() => {
            this.source();
            untracked(() => {
                if (this.viewReady) void this.renderDiagram();
            });
        });
    }

    private async renderDiagram(): Promise<void> {
        const source = this.source().trim();
        const host = this.outputEl().nativeElement;
        const seq = ++this.renderSeq;

        if (!source) {
            host.replaceChildren();
            this.errorMessage.set('');
            this.status.set('ready');
            return;
        }

        this.status.set('loading');
        try {
            const { svg, bindFunctions } = await this.renderer.render(
                this.domId,
                source,
            );
            // A newer attempt (or teardown) superseded this one — drop it.
            if (seq !== this.renderSeq) return;
            host.innerHTML = svg;
            const svgEl = host.querySelector('svg');
            if (svgEl) {
                // Let CSS size it responsively instead of the fixed height
                // mermaid bakes in.
                svgEl.removeAttribute('height');
                svgEl.setAttribute('height', '100%');
            }
            bindFunctions?.(host);
            this.errorMessage.set('');
            this.status.set('ready');
            this.rendered.emit();
        } catch (error) {
            if (seq !== this.renderSeq) return;
            host.replaceChildren();
            this.errorMessage.set(
                error instanceof Error ? error.message : String(error),
            );
            this.status.set('error');
            this.errored.emit(error);
        }
    }
}
