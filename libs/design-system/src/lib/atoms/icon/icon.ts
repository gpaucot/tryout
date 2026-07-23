import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
} from '@angular/core';
import { cn } from '@dash/ui-styles';
import { icon, type IconSize } from './icon.variants';

/**
 * Icon — atom.
 * Renders a Material Symbols (Outlined) glyph. The host is a `<span ds-icon>`
 * whose text content is the glyph's ligature name (e.g. "search"); the icon
 * font turns it into the drawing. FILL / weight / optical-size are driven per
 * instance through `font-variation-settings`.
 *
 * Decorative by default (`aria-hidden`); pass `label` to expose it to
 * assistive tech as `role="img"`.
 */
@Component({
    selector: 'span[ds-icon]',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './icon.html',
    host: {
        // Keep browser translation from rewriting the ligature text.
        translate: 'no',
        '[class]': 'classes()',
        '[style.font-variation-settings]': 'variationSettings()',
        '[attr.aria-hidden]': 'label() ? null : "true"',
        '[attr.role]': 'label() ? "img" : null',
        '[attr.aria-label]': 'label() || null',
    },
})
export class Icon {
    /** Material Symbols glyph name (ligature), e.g. "search", "settings". */
    readonly name = input.required<string>();
    readonly size = input<IconSize>('md');
    /** Render the filled variant (toggles the `FILL` axis 0 → 1). */
    readonly filled = input(false);
    /** Weight axis (`wght`), 100–700. */
    readonly weight = input(400);
    /**
     * Accessible label. When set the icon is exposed as `role="img"`; when
     * omitted it is `aria-hidden` (purely decorative).
     */
    readonly label = input('');
    /** Extra classes forwarded by a composing component. */
    readonly class = input('');

    /** Optical size (`opsz`) matched to the font-size of each `size`. */
    private readonly opticalSize: Record<IconSize, number> = {
        sm: 20,
        md: 24,
        lg: 40,
    };

    protected readonly classes = computed(() =>
        cn(icon({ size: this.size() }), this.class()),
    );

    protected readonly variationSettings = computed(
        () =>
            `'FILL' ${this.filled() ? 1 : 0}, 'wght' ${this.weight()}, 'GRAD' 0, 'opsz' ${this.opticalSize[this.size()]}`,
    );
}
