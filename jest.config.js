export default {
  testEnvironment: 'jsdom',
  transform: {},
  collectCoverage: true,
  collectCoverageFrom: [
    "**/*.js",             // Include all JS files
    "!**/node_modules/**", // Exclude dependencies
    "!**/coverage/**",     // Exclude previous coverage reports
    "!**/dist/**",         // Optional: exclude build output
    "!**/*.config.js"      // Optional: exclude config files
  ],
  coverageReporters: ["text", "lcov"],
};
