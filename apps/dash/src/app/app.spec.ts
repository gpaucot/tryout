import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
    it('bootstraps and renders a router outlet', async () => {
        await TestBed.configureTestingModule({
            imports: [App],
            providers: [provideRouter([])],
        }).compileComponents();

        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();
        expect(
            fixture.nativeElement.querySelector('router-outlet'),
        ).not.toBeNull();
    });
});
