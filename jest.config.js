// jest.config.js
export default {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    '**/*.{js,jsx}',
    '!jest.config.js',
    '!/node_modules/',
    '!/vendor/**',
  ],
};
