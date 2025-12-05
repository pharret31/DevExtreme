module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js',
  ],
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
  coverageProvider: 'v8',
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '.*visual-tests.*',
  ],
};
