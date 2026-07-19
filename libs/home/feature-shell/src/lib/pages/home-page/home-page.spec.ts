import { TestBed } from '@angular/core/testing';
import { HomePage } from './home-page';

describe('HomePage', () => {
  it('renders the full atomic chain (template + organism + molecule + atoms)', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('ds-shell-layout')).not.toBeNull();
    expect(el.querySelector('ds-app-header')).not.toBeNull();
    expect(el.querySelector('ds-form-field')).not.toBeNull();
    expect(el.querySelector('button')).not.toBeNull();
  });

  it('increments click state when the header action fires', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('clicks: 0');
    // header action button is the first ds-button inside the header
    el.querySelector('ds-app-header button')?.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    expect(el.textContent).toContain('clicks: 1');
  });
});
