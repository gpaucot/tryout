import { TestBed } from '@angular/core/testing';
import { AppHeader } from './app-header';

describe('AppHeader', () => {
    it('renders a header containing the action button', () => {
        const fixture = TestBed.createComponent(AppHeader);
        fixture.detectChanges();
        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('header')).not.toBeNull();
        expect(el.querySelector('button')).not.toBeNull();
    });

    it('emits action when the header button is clicked', () => {
        const fixture = TestBed.createComponent(AppHeader);
        fixture.detectChanges();
        const spy = vi.fn();
        fixture.componentInstance.action.subscribe(spy);
        fixture.nativeElement.querySelector('button').click();
        expect(spy).toHaveBeenCalledTimes(1);
    });
});
