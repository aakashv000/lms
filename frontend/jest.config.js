module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(@capacitor|@ionic)/)'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  testPathIgnorePatterns: [
    '/node_modules/'
  ]
};
