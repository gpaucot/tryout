import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import type { DescriptionAction, DescriptionActions } from '@dash/util-types';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { descriptionList } from './description-list.variants';

/**
 * Internal: the action buttons of a description-list section header.
 * Wide screens show one button per action (icon and/or label); narrow screens
 * collapse them behind a 3-dots trigger that opens a dropdown menu. The menu
 * closes on selection, Escape, or a click outside the component.
 * Not part of the public API — reached through section data on DescriptionList.
 */
@Component({
    selector: 'ds-description-list-actions',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Button, Icon],
    host: {
        class: 'contents',
        '(document:click)': 'onDocumentClick($event)',
        '(document:keydown.escape)': 'closeMenu()',
    },
    template: `
        <span [class]="inlineClasses">
            @for (action of actions(); track action.id) {
                <button
                    ds-button
                    type="button"
                    intent="ghost"
                    size="sm"
                    [class]="action.hideLabel && action.icon ? 'px-2' : ''"
                    [disabled]="action.disabled ?? false"
                    [attr.aria-label]="
                        action.hideLabel && action.icon ? action.label : null
                    "
                    [attr.title]="
                        action.hideLabel && action.icon ? action.label : null
                    "
                    (click)="run.emit(action)"
                >
                    @if (action.icon) {
                        <span ds-icon size="sm" [name]="action.icon"></span>
                    }
                    @if (!(action.hideLabel && action.icon)) {
                        {{ action.label }}
                    }
                </button>
            }
        </span>
        <span [class]="overflowClasses">
            <button
                ds-button
                type="button"
                intent="ghost"
                size="sm"
                class="px-2"
                aria-haspopup="menu"
                [attr.aria-expanded]="menuOpen()"
                [attr.aria-label]="menuLabel()"
                (click)="menuOpen.set(!menuOpen())"
            >
                <span ds-icon size="sm" name="more_vert"></span>
            </button>
            @if (menuOpen()) {
                <div role="menu" [class]="menuClasses">
                    @for (action of actions(); track action.id) {
                        <button
                            type="button"
                            role="menuitem"
                            [class]="menuItemClasses"
                            [disabled]="action.disabled ?? false"
                            (click)="select(action)"
                        >
                            @if (action.icon) {
                                <span
                                    ds-icon
                                    size="sm"
                                    [name]="action.icon"
                                ></span>
                            }
                            {{ action.label }}
                        </button>
                    }
                </div>
            }
        </span>
    `,
})
export class DescriptionListActions {
    readonly actions = input.required<DescriptionActions>();
    /** Accessible name of the 3-dots overflow trigger. */
    readonly menuLabel = input('More actions');
    readonly run = output<DescriptionAction>();

    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

    protected readonly menuOpen = signal(false);

    protected readonly inlineClasses = descriptionList.actionsInline();
    protected readonly overflowClasses = descriptionList.actionsOverflow();
    protected readonly menuClasses = descriptionList.actionsMenu();
    protected readonly menuItemClasses = descriptionList.actionsMenuItem();

    protected select(action: DescriptionAction): void {
        this.menuOpen.set(false);
        this.run.emit(action);
    }

    protected closeMenu(): void {
        this.menuOpen.set(false);
    }

    protected onDocumentClick(event: Event): void {
        if (
            this.menuOpen() &&
            !this.host.nativeElement.contains(event.target as Node)
        ) {
            this.menuOpen.set(false);
        }
    }
}
