import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
} from '@angular/core';
import { cn } from '@dash/ui-styles';
import { button, type ButtonIntent, type ButtonSize } from './button.variants';

/**
 * Button — atom.
 * A styled `<button>` host. Consumers pick `intent` / `size`; visual logic
 * lives entirely in the private `button.variants.ts`.
 */
@Component({
    selector: 'button[ds-button]',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './button.html',
    host: {
        '[class]': 'classes()',
        '[attr.data-intent]': 'intent()',
    },
})
export class Button {
    readonly intent = input<ButtonIntent>('primary');
    readonly size = input<ButtonSize>('md');
    /** Extra classes forwarded by a composing component. */
    readonly class = input<string>('');

    protected readonly classes = computed(() =>
        cn(button({ intent: this.intent(), size: this.size() }), this.class()),
    );
}
