import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { DescriptionItems } from '@dash/util-types';
import { DescriptionList } from './description-list';
import type {
  DescriptionListOrientation,
  DescriptionListSize,
} from './description-list.variants';

@Component({
  imports: [DescriptionList],
  template: `<dl
    ds-description-list
    [items]="items()"
    [orientation]="orientation()"
    [size]="size()"
  ></dl>`,
})
class Host {
  items = signal<DescriptionItems>([
    { term: 'Status', description: 'Active' },
    { term: 'Owner', description: 'gpaucot' },
  ]);
  orientation = signal<DescriptionListOrientation>('stacked');
  size = signal<DescriptionListSize>('md');
}

function render() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const dl = fixture.nativeElement.querySelector('dl') as HTMLDListElement;
  return { fixture, dl };
}

describe('DescriptionList', () => {
  it('renders a term/description pair per item', () => {
    const { dl } = render();
    const terms = Array.from(dl.querySelectorAll('dt')).map((t) =>
      t.textContent?.trim(),
    );
    const descriptions = Array.from(dl.querySelectorAll('dd')).map((d) =>
      d.textContent?.trim(),
    );
    expect(terms).toEqual(['Status', 'Owner']);
    expect(descriptions).toEqual(['Active', 'gpaucot']);
  });

  it('applies the default stacked/md variant classes', () => {
    const { dl } = render();
    expect(dl.className).toContain('flex-col');
    expect(dl.className).toContain('text-sm');
    const row = dl.querySelector('div') as HTMLElement;
    expect(row.className).toContain('flex-col');
  });

  it('switches to an inline grid layout and reflects size', () => {
    const { fixture, dl } = render();
    fixture.componentInstance.orientation.set('inline');
    fixture.componentInstance.size.set('lg');
    fixture.detectChanges();
    expect(dl.className).toContain('text-base');
    const row = dl.querySelector('div') as HTMLElement;
    expect(row.className).toContain('grid');
  });

  it('reacts to item changes', () => {
    const { fixture, dl } = render();
    fixture.componentInstance.items.set([
      { term: 'Plan', description: 'Pro' },
    ]);
    fixture.detectChanges();
    expect(dl.querySelectorAll('dt').length).toBe(1);
    expect(dl.querySelector('dt')?.textContent?.trim()).toBe('Plan');
  });
});
