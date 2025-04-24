/** @type {import('jest').Config} */
const config = {
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',     // Only source files
    '!src/**/__tests__/**',  // Exclude test folders if you have any
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  coverageDirectory: 'coverage',
  testMatch: ['**/tests/**/*.test.js'], // Optional: to restrict where tests live
};

module.exports = config;
