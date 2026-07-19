import { TestBed } from '@angular/core/testing';
import { FormField } from './form-field';

async function render(inputs: { label: string; error?: string }) {
  const fixture = TestBed.createComponent(FormField);
  fixture.componentRef.setInput('label', inputs.label);
  if (inputs.error !== undefined) {
    fixture.componentRef.setInput('error', inputs.error);
  }
  fixture.detectChanges();
  return fixture;
}

describe('FormField', () => {
  it('renders a label wired to the input via matching id/for', async () => {
    const fixture = await render({ label: 'Email' });
    const el: HTMLElement = fixture.nativeElement;
    const label = el.querySelector('label');
    const field = el.querySelector('input');
    expect(label?.textContent?.trim()).toBe('Email');
    expect(label?.getAttribute('for')).toBe(field?.id);
    expect(el.querySelector('p')).toBeNull();
  });

  it('shows the error and marks the input invalid', async () => {
    const fixture = await render({ label: 'Email', error: 'Required' });
    const el: HTMLElement = fixture.nativeElement;
    const field = el.querySelector('input');
    expect(el.querySelector('p')?.textContent).toContain('Required');
    expect(field?.getAttribute('aria-invalid')).toBe('true');
    expect(field?.className).toContain('border-danger-600');
  });
});
