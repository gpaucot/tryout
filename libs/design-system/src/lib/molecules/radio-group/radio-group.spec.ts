import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { SelectOptions } from '@dash/util-types';
import { RadioGroup } from './radio-group';

@Component({
    imports: [RadioGroup],
    template: `<ds-radio-group
        [options]="options()"
        [(value)]="value"
        [filterable]="filterable()"
        [invalid]="invalid()"
        legend="Fruit"
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
    return { fixture, root };
}

function radios(root: HTMLElement) {
    return Array.from(
        root.querySelectorAll('input[type="radio"]'),
    ) as HTMLInputElement[];
}

describe('RadioGroup', () => {
    it('renders one radio per option sharing a name, with a legend', () => {
        const { root } = render();
        const rs = radios(root);
        expect(rs.length).toBe(3);
        expect(new Set(rs.map((r) => r.name)).size).toBe(1);
        expect(root.querySelector('legend')?.textContent).toContain('Fruit');
    });

    it('pre-checks the radio matching value', () => {
        const { fixture, root } = render();
        fixture.componentInstance.value.set('b');
        fixture.detectChanges();
        const checked = radios(root).filter((r) => r.checked);
        expect(checked.length).toBe(1);
        expect(checked[0].value).toBe('Banana');
    });

    it('selects a value on change and keeps a single selection', () => {
        const { fixture, root } = render();
        radios(root)[1].click();
        fixture.detectChanges();
        expect(fixture.componentInstance.value()).toBe('b');
    });

    it('does not select a disabled option', () => {
        const { fixture, root } = render();
        const cherry = radios(root)[2];
        expect(cherry.disabled).toBe(true);
        cherry.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.value()).toBeUndefined();
    });

    it('filters visible radios and shows an empty state', () => {
        const { fixture, root } = render();
        fixture.componentInstance.filterable.set(true);
        fixture.detectChanges();

        const search = root.querySelector(
            'input[ds-input]',
        ) as HTMLInputElement;
        search.value = 'app';
        search.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        expect(radios(root).map((r) => r.value)).toEqual(['Apple']);

        search.value = 'zzz';
        search.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        expect(radios(root).length).toBe(0);
        expect(root.textContent).toContain('No matches');
    });

    it('marks the fieldset aria-invalid when invalid', () => {
        const { fixture, root } = render();
        fixture.componentInstance.invalid.set(true);
        fixture.detectChanges();
        expect(
            root.querySelector('fieldset')?.getAttribute('aria-invalid'),
        ).toBe('true');
    });
});
