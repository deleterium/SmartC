
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    globals: {
        'ts-jest': {
            diagnostics: false
        }
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!**/e2e/**'
    ],
    transform: {
        '^.+\\.ts?$': 'ts-jest'
    },
    testPathIgnorePatterns: [
        'helpers',
        '.*\\.e2e\\.ts$',
        'dist',
        'node_modules'
    ],
    verbose: true
}
