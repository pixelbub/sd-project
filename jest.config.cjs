// jest.config.cjs
module.exports = {
  testEnvironment: 'jsdom',
  transform: {},
  collectCoverage: true,
  collectCoverageFrom: [
    "**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**",
    "!**/dist/**",
    "!**/*.config.js"
  ],
  coverageReporters: ["text", "lcov"]
};

