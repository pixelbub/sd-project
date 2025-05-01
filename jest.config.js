// jest.config.js
export default {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    '**/*.{js,jsx}',
    '!/node_modules/',
    '!/vendor/**',
  ],
};