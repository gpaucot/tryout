import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ShellLayout } from './shell-layout';

@Component({
  imports: [ShellLayout],
  template: `
    <ds-shell-layout>
      <div header>HEADER</div>
      <div nav>NAV</div>
      <p>BODY</p>
    </ds-shell-layout>
  `,
})
class Host {}

describe('ShellLayout', () => {
  it('projects header, nav and default content into their slots', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('HEADER');
    expect(text).toContain('NAV');
    expect(text).toContain('BODY');
  });
});
