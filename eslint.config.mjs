import nx from '@nx/eslint-plugin';

export default [
    ...nx.configs['flat/base'],
    ...nx.configs['flat/typescript'],
    ...nx.configs['flat/javascript'],
    {
        ignores: ['**/dist', '**/out-tsc', '**/vitest.config.*.timestamp*'],
    },
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        rules: {
            '@nx/enforce-module-boundaries': [
                'error',
                {
                    enforceBuildableLibDependency: true,
                    allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
                    depConstraints: [
                        // Architectural layering: app -> feature -> ui -> util
                        // (data-access reserved between feature and util for later).
                        {
                            sourceTag: 'type:app',
                            onlyDependOnLibsWithTags: [
                                'type:feature',
                                'type:ui',
                                'type:util',
                            ],
                        },
                        {
                            sourceTag: 'type:feature',
                            onlyDependOnLibsWithTags: [
                                'type:feature',
                                'type:ui',
                                'type:data-access',
                                'type:util',
                            ],
                        },
                        {
                            // The design system stays pure: UI never reaches into features/data.
                            sourceTag: 'type:ui',
                            onlyDependOnLibsWithTags: ['type:ui', 'type:util'],
                        },
                        {
                            sourceTag: 'type:data-access',
                            onlyDependOnLibsWithTags: [
                                'type:data-access',
                                'type:util',
                            ],
                        },
                        {
                            sourceTag: 'type:util',
                            onlyDependOnLibsWithTags: ['type:util'],
                        },
                        // Domain isolation: a scope may only reach its own domain + shared.
                        {
                            sourceTag: 'scope:dash',
                            onlyDependOnLibsWithTags: [
                                'scope:dash',
                                'scope:home',
                                'scope:shared',
                            ],
                        },
                        {
                            sourceTag: 'scope:home',
                            onlyDependOnLibsWithTags: [
                                'scope:home',
                                'scope:shared',
                            ],
                        },
                        {
                            sourceTag: 'scope:shared',
                            onlyDependOnLibsWithTags: ['scope:shared'],
                        },
                    ],
                },
            ],
        },
    },
    {
        // Enforce the atomic dependency direction WITHIN the design system.
        // Nx tags act on project boundaries; this covers intra-lib layering.
        // atoms -> (nothing above)  molecules -> atoms  organisms -> atoms/molecules
        // templates -> atoms/molecules/organisms.
        files: ['libs/design-system/src/lib/atoms/**/*.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: [
                                '**/molecules/**',
                                '**/organisms/**',
                                '**/templates/**',
                            ],
                            message:
                                'Atoms must not import upward (molecules/organisms/templates).',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ['libs/design-system/src/lib/molecules/**/*.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['**/organisms/**', '**/templates/**'],
                            message: 'Molecules may only compose atoms.',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ['libs/design-system/src/lib/organisms/**/*.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['**/templates/**'],
                            message: 'Organisms must not import templates.',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: [
            '**/*.ts',
            '**/*.tsx',
            '**/*.cts',
            '**/*.mts',
            '**/*.js',
            '**/*.jsx',
            '**/*.cjs',
            '**/*.mjs',
        ],
        // Override or add rules here
        rules: {},
    },
];
