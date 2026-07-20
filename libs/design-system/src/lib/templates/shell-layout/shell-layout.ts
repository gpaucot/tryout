import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * ShellLayout — template.
 * A pure page skeleton with named content slots and NO data. Pages project
 * concrete content into `[header]`, `[nav]`, and the default (content) slot.
 */
@Component({
    selector: 'ds-shell-layout',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './shell-layout.html',
})
export class ShellLayout {}
