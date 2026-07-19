import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AppHeader,
  Button,
  CheckboxGroup,
  DescriptionList,
  FormField,
  RadioGroup,
  Select,
  ShellLayout,
} from '@dash/design-system';
import type { DescriptionItems, SelectOptions } from '@dash/util-types';

/**
 * HomePage — page (atomic top level).
 * A routed component that fills the ShellLayout template with real content and
 * holds view state. This is the ONLY level allowed to own state/routing, which
 * is why pages live in a feature lib, not the design system.
 */
@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ShellLayout,
    AppHeader,
    FormField,
    Button,
    Select,
    RadioGroup,
    CheckboxGroup,
    DescriptionList,
  ],
  templateUrl: './home-page.html',
})
export class HomePage {
  protected readonly clicks = signal(0);

  protected readonly fruits: SelectOptions<string> = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'date', label: 'Date' },
    { value: 'elderberry', label: 'Elderberry', disabled: true },
    { value: 'fig', label: 'Fig' },
  ];

  protected readonly fruit = signal<string | undefined>(undefined);
  protected readonly plan = signal<string | undefined>('free');
  protected readonly toppings = signal<readonly string[]>(['apple']);

  protected readonly plans: SelectOptions<string> = [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
    { value: 'enterprise', label: 'Enterprise' },
  ];

  protected readonly details: DescriptionItems = [
    { term: 'Status', description: 'Active' },
    { term: 'Owner', description: 'gpaucot' },
    { term: 'Region', description: 'eu-west-1' },
  ];

  protected onAction(): void {
    this.clicks.update((n) => n + 1);
  }
}
