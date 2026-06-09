module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.json',
                diagnostics: {
                    ignoreCodes: [151002],
                },
            },
        ],
    },
    testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx)$',
    collectCoverageFrom: [
        'src/domain/**/*.ts',
        'src/application/services/paymentGatewayService.ts',
        '!src/domain/entities/**/*.ts',
        '!src/domain/repositories/**/*.ts',
    ],
    coverageReporters: ['text', 'lcov', 'json-summary'],
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 80,
            functions: 80,
            lines: 80,
        },
    },
};
