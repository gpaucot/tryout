import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { Button } from '../../atoms/button/button';

/**
 * AppHeader — organism.
 * A self-contained header bar composed of atoms. Presentational: it emits an
 * intent via `action` and lets the consuming page decide what happens.
 */
@Component({
    selector: 'ds-app-header',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Button],
    templateUrl: './app-header.html',
})
export class AppHeader {
    readonly action = output<void>();
}
