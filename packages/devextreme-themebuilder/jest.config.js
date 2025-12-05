module.exports = {
    moduleFileExtensions: [
        'ts',
        'js',
    ],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            // eslint-disable-next-line spellcheck/spell-checker
            tsconfig: './tsconfig.tests.json',
        }],
    },
    testMatch: [
        '**/tests/**/*.test.ts',
    ],
    coverageProvider: 'v8',
    coverageThreshold: {
        global: {
            branches: 85,
            functions: 100,
            lines: 95,
            statements: 95,
        },
    },
};
