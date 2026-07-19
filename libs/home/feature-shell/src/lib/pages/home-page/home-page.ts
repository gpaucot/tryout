import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AppHeader,
  Button,
  FormField,
  ShellLayout,
} from '@dash/design-system';

/**
 * HomePage — page (atomic top level).
 * A routed component that fills the ShellLayout template with real content and
 * holds view state. This is the ONLY level allowed to own state/routing, which
 * is why pages live in a feature lib, not the design system.
 */
@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ShellLayout, AppHeader, FormField, Button],
  templateUrl: './home-page.html',
})
export class HomePage {
  protected readonly clicks = signal(0);

  protected onAction(): void {
    this.clicks.update((n) => n + 1);
  }
}
