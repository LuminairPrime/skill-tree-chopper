'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.run = run;
const path = require('path');
const mocha_1 = require('mocha');
const glob_1 = require('glob');
// Setup global mock for node-pty before any test files are loaded
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'node-pty') {
    try {
      const mockPath = path.resolve(__dirname, '../mocks/node-pty');
      console.log('🔧 [TEST-SUITE] Loading node-pty mock from:', mockPath);
      return originalRequire.call(this, mockPath);
    } catch (error) {
      console.error('❌ [TEST-SUITE] Failed to load node-pty mock:', error);
      // Fallback to inline mock for Windows compatibility
      return {
        spawn: () => ({
          pid: 1234,
          cols: 80,
          rows: 24,
          handleFlowControl: false,
          onData: () => {},
          onExit: () => {},
          write: () => {},
          resize: () => {},
          kill: () => {},
        }),
      };
    }
  }
  return originalRequire.apply(this, arguments);
};
function run() {
  console.log('🧪 [TEST-SUITE] Starting integration test suite...');
  // Create the mocha test with extended timeout for CI
  const mocha = new mocha_1.default({
    ui: 'tdd',
    color: true,
    timeout: 60000, // 60 second timeout for individual tests in CI
    slow: 10000, // Mark tests as slow if they take >10s
    retries: 2, // Retry failed tests up to 2 times
    bail: false, // Continue running tests even if some fail
  });
  const testsRoot = path.resolve(__dirname, '..');
  console.log('📁 [TEST-SUITE] Tests root:', testsRoot);
  return new Promise((c, e) => {
    console.log('🔍 [TEST-SUITE] Searching for test files...');
    (0, glob_1.glob)('suite/**/*.test.js', { cwd: testsRoot })
      .then((files) => {
        console.log(`📝 [TEST-SUITE] Found ${files.length} test files:`, files);
        if (files.length === 0) {
          const error = new Error('No test files found in suite directory');
          console.error('❌ [TEST-SUITE]', error.message);
          e(error);
          return;
        }
        // Add files to the test suite
        files.forEach((f) => {
          const fullPath = path.resolve(testsRoot, f);
          console.log(`➕ [TEST-SUITE] Adding test file: ${fullPath}`);
          mocha.addFile(fullPath);
        });
        try {
          console.log('🚀 [TEST-SUITE] Running integration tests...');
          // Run the mocha test
          mocha.run((failures) => {
            console.log(`📊 [TEST-SUITE] Test execution completed. Failures: ${failures}`);
            if (failures > 0) {
              const error = new Error(`${failures} integration tests failed.`);
              console.error('❌ [TEST-SUITE]', error.message);
              e(error);
            } else {
              console.log('✅ [TEST-SUITE] All integration tests passed!');
              c();
            }
          });
        } catch (err) {
          console.error('❌ [TEST-SUITE] Failed to run tests:', err);
          e(err);
        }
      })
      .catch((err) => {
        console.error('❌ [TEST-SUITE] Failed to find test files:', err);
        e(err);
      });
  });
}
//# sourceMappingURL=index.js.map
