import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Icon } from './icon';
import type { IconSize } from './icon.variants';

@Component({
    imports: [Icon],
    template: `<span
        ds-icon
        [name]="name()"
        [size]="size()"
        [filled]="filled()"
        [label]="label()"
    ></span>`,
})
class Host {
    name = signal('search');
    size = signal<IconSize>('md');
    filled = signal(false);
    label = signal('');
}

function renderIcon() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('span') as HTMLSpanElement;
    return { fixture, el };
}

describe('Icon', () => {
    it('renders the glyph name as ligature text with the icon-font class', () => {
        const { el } = renderIcon();
        expect(el.textContent?.trim()).toBe('search');
        expect(el.className).toContain('ds-icon');
        expect(el.className).toContain('text-2xl');
    });

    it('is decorative (aria-hidden) by default and labelled when a label is set', () => {
        const { fixture, el } = renderIcon();
        expect(el.getAttribute('aria-hidden')).toBe('true');
        expect(el.getAttribute('role')).toBeNull();

        fixture.componentInstance.label.set('Search');
        fixture.detectChanges();
        expect(el.getAttribute('aria-hidden')).toBeNull();
        expect(el.getAttribute('role')).toBe('img');
        expect(el.getAttribute('aria-label')).toBe('Search');
    });

    it('reflects size and fill through classes and font-variation-settings', () => {
        const { fixture, el } = renderIcon();
        expect(el.style.fontVariationSettings).toContain("'FILL' 0");
        expect(el.style.fontVariationSettings).toContain("'opsz' 24");

        fixture.componentInstance.size.set('lg');
        fixture.componentInstance.filled.set(true);
        fixture.detectChanges();
        expect(el.className).toContain('text-[2.5rem]');
        expect(el.style.fontVariationSettings).toContain("'FILL' 1");
        expect(el.style.fontVariationSettings).toContain("'opsz' 40");
    });
});
