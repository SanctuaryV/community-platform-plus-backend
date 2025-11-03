module.exports = {
  connect: jest.fn((cb) => cb && cb(null)), // Simulate successful connection
  execute: jest.fn((query, params, cb) => {
    // Simulate DB insert success
    cb && cb(null, { affectedRows: 1 });
  }),
};