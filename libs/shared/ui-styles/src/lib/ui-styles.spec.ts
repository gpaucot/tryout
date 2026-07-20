import { cn } from './ui-styles';

describe('cn', () => {
    it('merges conflicting Tailwind utilities, last one wins', () => {
        expect(cn('px-2 px-4')).toBe('px-4');
    });

    it('keeps non-conflicting utilities', () => {
        expect(cn('text-white', 'bg-brand-500')).toBe(
            'text-white bg-brand-500',
        );
    });
});
