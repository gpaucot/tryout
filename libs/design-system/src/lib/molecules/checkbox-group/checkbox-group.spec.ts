import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { SelectOptions } from '@dash/util-types';
import { CheckboxGroup } from './checkbox-group';

@Component({
  imports: [CheckboxGroup],
  template: `<ds-checkbox-group
    [options]="options()"
    [(value)]="value"
    [filterable]="filterable()"
    legend="Fruit"
  />`,
})
class Host {
  options = signal<SelectOptions<string>>([
    { value: 'a', label: 'Apple' },
    { value: 'b', label: 'Banana' },
    { value: 'c', label: 'Cherry', disabled: true },
  ]);
  value = signal<readonly string[]>([]);
  filterable = signal(false);
}

function render() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return { fixture, root };
}

function boxes(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll('input[type="checkbox"]'),
  ) as HTMLInputElement[];
}

describe('CheckboxGroup', () => {
  it('renders one checkbox per option', () => {
    const { root } = render();
    expect(boxes(root).length).toBe(3);
  });

  it('checks multiple options and accumulates the value array', () => {
    const { fixture, root } = render();
    boxes(root)[0].click();
    fixture.detectChanges();
    boxes(root)[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual(['a', 'b']);
  });

  it('unchecks an option, removing it from the array', () => {
    const { fixture, root } = render();
    fixture.componentInstance.value.set(['a', 'b']);
    fixture.detectChanges();
    boxes(root)[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual(['b']);
  });

  it('emits a new array reference on each toggle', () => {
    const { fixture, root } = render();
    const before = fixture.componentInstance.value();
    boxes(root)[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).not.toBe(before);
  });

  it('pre-checks boxes matching the value array', () => {
    const { fixture, root } = render();
    fixture.componentInstance.value.set(['b']);
    fixture.detectChanges();
    const checked = boxes(root).filter((b) => b.checked);
    expect(checked.length).toBe(1);
  });

  it('does not toggle a disabled option', () => {
    const { fixture, root } = render();
    const cherry = boxes(root)[2];
    expect(cherry.disabled).toBe(true);
    cherry.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual([]);
  });

  it('filters visible checkboxes and shows an empty state', () => {
    const { fixture, root } = render();
    fixture.componentInstance.filterable.set(true);
    fixture.detectChanges();

    const search = root.querySelector('input[ds-input]') as HTMLInputElement;
    search.value = 'err';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(boxes(root).length).toBe(1);

    search.value = 'zzz';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(boxes(root).length).toBe(0);
    expect(root.textContent).toContain('No matches');
  });
});
