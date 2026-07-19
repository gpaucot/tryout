import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button } from './button';
import type { ButtonIntent, ButtonSize } from './button.variants';

@Component({
  imports: [Button],
  template: `<button ds-button [intent]="intent()" [size]="size()">Go</button>`,
})
class Host {
  intent = signal<ButtonIntent>('primary');
  size = signal<ButtonSize>('md');
}

function renderButton() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const el = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  return { fixture, el };
}

describe('Button', () => {
  it('applies default primary/md variant classes', () => {
    const { el } = renderButton();
    expect(el.className).toContain('bg-brand-500');
    expect(el.className).toContain('h-10');
    expect(el.getAttribute('data-intent')).toBe('primary');
  });

  it('reflects intent and size inputs', () => {
    const { fixture, el } = renderButton();
    fixture.componentInstance.intent.set('ghost');
    fixture.componentInstance.size.set('lg');
    fixture.detectChanges();
    expect(el.className).toContain('bg-transparent');
    expect(el.className).toContain('h-12');
    expect(el.getAttribute('data-intent')).toBe('ghost');
  });
});
