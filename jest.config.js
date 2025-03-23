/** @type {import('jest').Config} */
const config = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    testMatch: ['**/tests/**/*.test.js'],
    verbose: true,
    transformIgnorePatterns: [
        'node_modules/(?!(colyseus|@colyseus|@msgpack)/)'
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};

export default config; 