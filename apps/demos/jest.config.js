module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js',
  ],
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
  coverageProvider: 'v8',
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '.*visual-tests.*',
  ],
};
