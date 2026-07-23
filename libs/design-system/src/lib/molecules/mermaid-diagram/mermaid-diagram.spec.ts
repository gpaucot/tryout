import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MermaidDiagram } from './mermaid-diagram';
import {
    MERMAID_RENDERER,
    type MermaidRenderer,
    type RenderResult,
} from './mermaid-diagram.renderer';

/**
 * A renderer whose `render` we resolve/reject by hand so each test controls the
 * async timing. `calls` records the (id, source) it was asked to draw.
 */
class FakeRenderer implements MermaidRenderer {
    readonly calls: Array<{ id: string; source: string }> = [];
    private pending?: {
        resolve: (r: RenderResult) => void;
        reject: (e: unknown) => void;
    };

    render(id: string, source: string): Promise<RenderResult> {
        this.calls.push({ id, source });
        return new Promise((resolve, reject) => {
            this.pending = { resolve, reject };
        });
    }

    resolveWith(svg: string, bindFunctions?: (el: Element) => void): void {
        this.pending?.resolve({ svg, diagramType: 'flowchart', bindFunctions });
    }

    rejectWith(error: unknown): void {
        this.pending?.reject(error);
    }
}

@Component({
    imports: [MermaidDiagram],
    template: `<ds-mermaid-diagram
        [source]="source()"
        [label]="label()"
        (rendered)="rendered()"
        (errored)="errored($event)"
    />`,
})
class Host {
    source = signal('graph TD; A-->B');
    label = signal('');
    rendered = vi.fn();
    errored = vi.fn();
}

function setup() {
    const renderer = new FakeRenderer();
    TestBed.configureTestingModule({
        providers: [{ provide: MERMAID_RENDERER, useValue: renderer }],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector(
        'ds-mermaid-diagram',
    ) as HTMLElement;
    return { fixture, host, renderer };
}

/** Let queued microtasks (the awaited render promise) settle, then re-render. */
async function flush(fixture: ReturnType<typeof setup>['fixture']) {
    await fixture.whenStable();
    fixture.detectChanges();
}

describe('MermaidDiagram', () => {
    it('renders the source and injects the returned SVG', async () => {
        const { fixture, host, renderer } = setup();
        await fixture.whenStable(); // afterNextRender → first render kicks off

        expect(renderer.calls).toHaveLength(1);
        expect(renderer.calls[0].source).toBe('graph TD; A-->B');
        expect(host.getAttribute('data-status')).toBe('loading');

        renderer.resolveWith('<svg id="drawing"></svg>');
        await flush(fixture);

        expect(host.getAttribute('data-status')).toBe('ready');
        expect(host.querySelector('svg#drawing')).not.toBeNull();
        expect(fixture.componentInstance.rendered).toHaveBeenCalledTimes(1);
    });

    it('gives mermaid a unique, stable id for its render node', async () => {
        const { fixture, renderer } = setup();
        await fixture.whenStable();
        expect(renderer.calls[0].id).toMatch(/^ds-mermaid-\d+$/);
    });

    it('re-renders when the source changes', async () => {
        const { fixture, host, renderer } = setup();
        await fixture.whenStable();
        renderer.resolveWith('<svg id="one"></svg>');
        await flush(fixture);

        fixture.componentInstance.source.set('graph TD; X-->Y');
        fixture.detectChanges();
        await fixture.whenStable();

        expect(renderer.calls).toHaveLength(2);
        expect(renderer.calls[1].source).toBe('graph TD; X-->Y');
        renderer.resolveWith('<svg id="two"></svg>');
        await flush(fixture);
        expect(host.querySelector('svg#two')).not.toBeNull();
    });

    it('shows an inline error and emits when rendering fails', async () => {
        const { fixture, host, renderer } = setup();
        await fixture.whenStable();

        renderer.rejectWith(new Error('Parse error on line 1'));
        await flush(fixture);

        expect(host.getAttribute('data-status')).toBe('error');
        const alert = host.querySelector('[role="alert"]');
        expect(alert?.textContent).toContain('Parse error on line 1');
        expect(fixture.componentInstance.errored).toHaveBeenCalledWith(
            expect.any(Error),
        );
        expect(host.querySelector('svg')).toBeNull();
    });

    it('recovers from an error on the next successful render', async () => {
        const { fixture, host, renderer } = setup();
        await fixture.whenStable();
        renderer.rejectWith(new Error('boom'));
        await flush(fixture);
        expect(host.getAttribute('data-status')).toBe('error');

        fixture.componentInstance.source.set('graph TD; A-->B; B-->C');
        fixture.detectChanges();
        await fixture.whenStable();
        renderer.resolveWith('<svg id="fixed"></svg>');
        await flush(fixture);

        expect(host.getAttribute('data-status')).toBe('ready');
        expect(host.querySelector('[role="alert"]')).toBeNull();
        expect(host.querySelector('svg#fixed')).not.toBeNull();
    });

    it('treats a blank source as an empty, ready diagram', async () => {
        const { fixture, host, renderer } = setup();
        await fixture.whenStable();
        renderer.resolveWith('<svg id="one"></svg>');
        await flush(fixture);

        fixture.componentInstance.source.set('   ');
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        // No new render is attempted and the previous drawing is cleared.
        expect(renderer.calls).toHaveLength(1);
        expect(host.getAttribute('data-status')).toBe('ready');
        expect(host.querySelector('svg')).toBeNull();
    });

    it('is decorative by default and labelled when a label is set', async () => {
        const { fixture, host, renderer } = setup();
        await fixture.whenStable();
        renderer.resolveWith('<svg></svg>');
        await flush(fixture);

        const output = host.querySelector('div') as HTMLElement;
        expect(output.getAttribute('aria-hidden')).toBe('true');
        expect(output.getAttribute('role')).toBeNull();

        fixture.componentInstance.label.set('Data flow');
        fixture.detectChanges();
        expect(output.getAttribute('aria-hidden')).toBeNull();
        expect(output.getAttribute('role')).toBe('img');
        expect(output.getAttribute('aria-label')).toBe('Data flow');
    });

    it('calls bindFunctions on the rendered output', async () => {
        const { fixture, renderer } = setup();
        await fixture.whenStable();
        const bind = vi.fn();
        renderer.resolveWith('<svg id="interactive"></svg>', bind);
        await flush(fixture);
        expect(bind).toHaveBeenCalledTimes(1);
    });
});
