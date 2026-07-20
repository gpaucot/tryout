import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { SelectOptions } from '@dash/util-types';
import { Select } from './select';

@Component({
    imports: [Select],
    template: `<ds-select
        [options]="options()"
        [(value)]="value"
        [filterable]="filterable()"
        [invalid]="invalid()"
    />`,
})
class Host {
    options = signal<SelectOptions<string>>([
        { value: 'a', label: 'Apple' },
        { value: 'b', label: 'Banana' },
        { value: 'c', label: 'Cherry', disabled: true },
    ]);
    value = signal<string | undefined>(undefined);
    filterable = signal(false);
    invalid = signal(false);
}

function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const trigger = root.querySelector(
        'button[role="combobox"]',
    ) as HTMLButtonElement;
    return { fixture, root, trigger };
}

function openPanel(
    fixture: ReturnType<typeof render>['fixture'],
    trigger: HTMLButtonElement,
) {
    trigger.click();
    fixture.detectChanges();
}

function options(root: HTMLElement) {
    return Array.from(
        root.querySelectorAll('[role="option"]'),
    ) as HTMLElement[];
}

describe('Select', () => {
    it('shows the placeholder when nothing is selected, the label when set', () => {
        const { fixture, trigger } = render();
        expect(trigger.textContent).toContain('Select…');
        fixture.componentInstance.value.set('b');
        fixture.detectChanges();
        expect(trigger.textContent).toContain('Banana');
    });

    it('reflects invalid via the danger border class and aria-invalid', () => {
        const { fixture, trigger } = render();
        fixture.componentInstance.invalid.set(true);
        fixture.detectChanges();
        expect(trigger.className).toContain('border-danger-600');
        expect(trigger.getAttribute('aria-invalid')).toBe('true');
    });

    it('toggles the listbox open and renders one option per choice', () => {
        const { fixture, root, trigger } = render();
        expect(root.querySelector('[role="listbox"]')).toBeNull();
        expect(trigger.getAttribute('aria-expanded')).toBe('false');

        openPanel(fixture, trigger);
        expect(root.querySelector('[role="listbox"]')).not.toBeNull();
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(options(root).length).toBe(3);
    });

    it('selects an option on click and closes', () => {
        const { fixture, root, trigger } = render();
        openPanel(fixture, trigger);
        options(root)[1].click();
        fixture.detectChanges();
        expect(fixture.componentInstance.value()).toBe('b');
        expect(root.querySelector('[role="listbox"]')).toBeNull();
    });

    it('ignores clicks on a disabled option', () => {
        const { fixture, root, trigger } = render();
        openPanel(fixture, trigger);
        const disabled = options(root)[2];
        expect(disabled.getAttribute('aria-disabled')).toBe('true');
        disabled.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.value()).toBeUndefined();
        expect(root.querySelector('[role="listbox"]')).not.toBeNull();
    });

    it('filters options case-insensitively when filterable', () => {
        const { fixture, root, trigger } = render();
        fixture.componentInstance.filterable.set(true);
        fixture.detectChanges();
        openPanel(fixture, trigger);

        const search = root.querySelector(
            'input[ds-input]',
        ) as HTMLInputElement;
        search.value = 'an';
        search.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        const labels = options(root).map((o) => o.textContent?.trim());
        expect(labels).toEqual(['Banana']);
    });

    it('shows a "No matches" empty state', () => {
        const { fixture, root, trigger } = render();
        fixture.componentInstance.filterable.set(true);
        fixture.detectChanges();
        openPanel(fixture, trigger);

        const search = root.querySelector(
            'input[ds-input]',
        ) as HTMLInputElement;
        search.value = 'zzz';
        search.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(options(root).length).toBe(0);
        expect(root.textContent).toContain('No matches');
    });

    it('supports keyboard: ArrowDown skips disabled, Enter selects, Escape closes', () => {
        const { fixture, root, trigger } = render();
        openPanel(fixture, trigger);

        // First ArrowDown highlights Apple, second highlights Banana (Cherry is disabled and skipped past the end).
        trigger.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'ArrowDown' }),
        );
        fixture.detectChanges();
        trigger.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'ArrowDown' }),
        );
        fixture.detectChanges();
        trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        fixture.detectChanges();
        expect(fixture.componentInstance.value()).toBe('b');

        openPanel(fixture, trigger);
        expect(root.querySelector('[role="listbox"]')).not.toBeNull();
        trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        fixture.detectChanges();
        expect(root.querySelector('[role="listbox"]')).toBeNull();
    });
});
