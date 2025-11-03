// Global Jest setup: mock the DB connection module so tests never try to reach the real MySQL host
const path = require('path');

// Resolve the actual module file path and mock it before any tests run.
const dbModulePath = path.resolve(__dirname, 'src', 'config', 'db.config.js');

// Use doMock (non-hoisted) so the path variable is initialized before mocking.
// Provide a safe, test-friendly mock with `query` and `execute` as jest.fn so tests can
// override/mockImplementation where needed.
jest.doMock(dbModulePath, () => ({
  query: jest.fn((query, params, cb) => {
    // Default: return an empty result set to be harmless.
    if (typeof cb === 'function') cb(null, []);
  }),
  execute: jest.fn((query, params, cb) => {
    if (typeof cb === 'function') cb(null, { affectedRows: 1 });
  }),
  // keep a connect stub in case code calls it
  connect: jest.fn((cb) => cb && cb(null)),
}));
