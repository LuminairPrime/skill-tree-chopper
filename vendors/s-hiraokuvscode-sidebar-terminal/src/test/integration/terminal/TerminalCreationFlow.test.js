'use strict';
/**
 * Integration Tests for Terminal Creation Flow - Following t-wada's TDD Methodology
 *
 * These tests verify the complete terminal creation workflow:
 * - Extension Host ↔ WebView coordination
 * - TerminalManager lifecycle integration
 * - Configuration service integration
 * - Error handling across boundaries
 * - Performance characteristics
 *
 * TDD Integration Approach:
 * 1. RED: Write failing integration tests for complete workflows
 * 2. GREEN: Implement coordination between components
 * 3. REFACTOR: Optimize integration while maintaining functionality
 */
Object.defineProperty(exports, '__esModule', { value: true });
const chai_1 = require('chai');
const sinon = require('sinon');
const TestSetup_1 = require('../../shared/TestSetup');
const common_1 = require('../../../utils/common');
describe('Terminal Creation Flow - Integration TDD Suite', () => {
  let sandbox;
  beforeEach(() => {
    (0, TestSetup_1.setupTestEnvironment)();
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    (0, TestSetup_1.resetTestEnvironment)();
    sandbox.restore();
  });
  describe('End-to-End Terminal Creation', () => {
    describe('RED Phase - Complete Creation Workflow', () => {
      it('should successfully create terminal from configuration to instance', async () => {
        // RED: Complete terminal creation should work end-to-end
        // Step 1: Get configuration
        const config = (0, common_1.getTerminalConfig)();
        (0, chai_1.expect)(config).to.be.an('object');
        (0, chai_1.expect)(config.shell).to.be.a('string');
        // Step 2: Determine shell for platform
        const platformShell = (0, common_1.getShellForPlatform)();
        (0, chai_1.expect)(platformShell).to.be.a('string');
        (0, chai_1.expect)(platformShell.length).to.be.greaterThan(0);
        // Step 3: Generate unique terminal ID
        const terminalId = (0, common_1.generateTerminalId)();
        (0, chai_1.expect)(terminalId).to.be.a('string');
        (0, chai_1.expect)(terminalId).to.match(/^terminal-\d+-[a-z0-9]+$/);
        // Step 4: Create terminal info structure
        const terminalInfo = (0, common_1.normalizeTerminalInfo)({
          id: terminalId,
          name: `Terminal ${Date.now()}`,
          isActive: true,
        });
        (0, chai_1.expect)(terminalInfo.id).to.equal(terminalId);
        (0, chai_1.expect)(terminalInfo.name).to.be.a('string');
        (0, chai_1.expect)(terminalInfo.isActive).to.be.true;
      });
      it('should handle terminal creation with custom configuration', async () => {
        // RED: Custom configuration should be applied during creation
        // Mock custom configuration
        TestSetup_1.mockVscode.workspace.getConfiguration.returns({
          get: sinon.stub().callsFake((key, defaultValue) => {
            const customConfig = {
              shell: '/bin/custom-shell',
              fontSize: 16,
              fontFamily: 'Custom Mono',
              maxTerminals: 10,
              theme: 'custom-dark',
              cursorBlink: false,
              defaultDirectory: '/custom/path',
              showHeader: false,
              showIcons: false,
              altClickMovesCursor: false,
              enableCliAgentIntegration: false,
              enableGitHubCopilotIntegration: false,
              enablePersistentSessions: false,
              persistentSessionScrollback: 500,
              persistentSessionReviveProcess: false,
            };
            return key in customConfig ? customConfig[key] : defaultValue;
          }),
          has: sinon.stub().returns(true),
          inspect: sinon.stub().returns({ defaultValue: undefined }),
          update: sinon.stub().resolves(),
        });
        const config = (0, common_1.getTerminalConfig)();
        (0, chai_1.expect)(config.shell).to.equal('/bin/custom-shell');
        (0, chai_1.expect)(config.fontSize).to.equal(16);
        (0, chai_1.expect)(config.fontFamily).to.equal('Custom Mono');
        (0, chai_1.expect)(config.maxTerminals).to.equal(10);
        (0, chai_1.expect)(config.theme).to.equal('custom-dark');
        (0, chai_1.expect)(config.cursorBlink).to.be.false;
        (0, chai_1.expect)(config.defaultDirectory).to.equal('/custom/path');
        // expect(config.showHeader).to.be.false; // Property doesn't exist on ExtensionTerminalConfig
        (0, chai_1.expect)(config.enableCliAgentIntegration).to.be.false;
      });
      it('should create unique terminal IDs for concurrent creation', () => {
        // RED: Concurrent terminal creation should produce unique IDs
        const ids = new Set();
        const creationCount = 100;
        // Create many terminals concurrently
        for (let i = 0; i < creationCount; i++) {
          const id = (0, common_1.generateTerminalId)();
          (0, chai_1.expect)(ids.has(id)).to.be.false; // Should be unique
          ids.add(id);
        }
        (0, chai_1.expect)(ids.size).to.equal(creationCount);
      });
      it('should validate terminal creation with proper working directory', async () => {
        // RED: Working directory validation should be part of creation
        // This test simulates the working directory validation that occurs during creation
        const config = (0, common_1.getTerminalConfig)();
        // If defaultDirectory is specified in config, it should be validated
        if (config.defaultDirectory && config.defaultDirectory.trim()) {
          // In real implementation, this would be validated by validateDirectory
          (0, chai_1.expect)(config.defaultDirectory).to.be.a('string');
          (0, chai_1.expect)(config.defaultDirectory.length).to.be.greaterThan(0);
        }
      });
    });
  });
  describe('Cross-Platform Terminal Creation', () => {
    let originalPlatform;
    let originalEnv;
    beforeEach(() => {
      originalPlatform = process.platform;
      originalEnv = { ...process.env };
    });
    afterEach(() => {
      Object.defineProperty(process, 'platform', { value: originalPlatform });
      process.env = originalEnv;
    });
    describe('RED Phase - Platform-Specific Creation', () => {
      it('should create Windows terminal with correct shell configuration', () => {
        // RED: Windows terminal creation should use proper shell
        Object.defineProperty(process, 'platform', { value: 'win32' });
        process.env.COMSPEC = 'C:\\Windows\\System32\\cmd.exe';
        const shell = (0, common_1.getShellForPlatform)();
        const config = (0, common_1.getTerminalConfig)();
        (0, chai_1.expect)(shell).to.equal('C:\\Windows\\System32\\cmd.exe');
        // Configuration should work regardless of platform
        (0, chai_1.expect)(config).to.be.an('object');
      });
      it('should create macOS terminal with correct shell configuration', () => {
        // RED: macOS terminal creation should use proper shell
        Object.defineProperty(process, 'platform', { value: 'darwin' });
        process.env.SHELL = '/bin/zsh';
        const shell = (0, common_1.getShellForPlatform)();
        const config = (0, common_1.getTerminalConfig)();
        (0, chai_1.expect)(shell).to.equal('/bin/zsh');
        (0, chai_1.expect)(config).to.be.an('object');
      });
      it('should create Linux terminal with correct shell configuration', () => {
        // RED: Linux terminal creation should use proper shell
        Object.defineProperty(process, 'platform', { value: 'linux' });
        process.env.SHELL = '/bin/bash';
        const shell = (0, common_1.getShellForPlatform)();
        const config = (0, common_1.getTerminalConfig)();
        (0, chai_1.expect)(shell).to.equal('/bin/bash');
        (0, chai_1.expect)(config).to.be.an('object');
      });
      it('should handle platform detection failure gracefully', () => {
        // RED: Unknown platforms should fallback gracefully
        Object.defineProperty(process, 'platform', { value: 'unknown' });
        delete process.env.SHELL;
        delete process.env.COMSPEC;
        const shell = (0, common_1.getShellForPlatform)();
        const config = (0, common_1.getTerminalConfig)();
        // Should fallback to bash
        (0, chai_1.expect)(shell).to.equal('/bin/bash');
        (0, chai_1.expect)(config).to.be.an('object');
      });
    });
  });
  describe('Terminal Creation Error Handling', () => {
    describe('RED Phase - Error Recovery and Reporting', () => {
      it('should handle configuration service failures gracefully', () => {
        // RED: Configuration failures should not crash terminal creation
        // Mock configuration service failure
        TestSetup_1.mockVscode.workspace.getConfiguration.throws(
          new Error('Configuration service unavailable')
        );
        // Creation should still work with fallback behavior
        (0, chai_1.expect)(() => (0, common_1.getTerminalConfig)()).to.not.throw();
      });
      it('should handle shell detection errors gracefully', () => {
        // RED: Shell detection errors should fallback properly
        // Create scenario where shell detection might fail
        Object.defineProperty(process, 'platform', { value: 'win32' });
        delete process.env.COMSPEC;
        const shell = (0, common_1.getShellForPlatform)();
        // Should fallback to default
        (0, chai_1.expect)(shell).to.equal('cmd.exe');
      });
      it('should handle terminal ID generation under stress', () => {
        // RED: ID generation should be robust under high load
        // Mock Date.now and Math.random to test edge cases
        const originalDateNow = Date.now;
        const originalMathRandom = Math.random;
        let callCount = 0;
        global.Date.now = () => {
          callCount++;
          return 1000000 + callCount;
        };
        Math.random = () => 0.123456789;
        try {
          const id1 = (0, common_1.generateTerminalId)();
          const id2 = (0, common_1.generateTerminalId)();
          (0, chai_1.expect)(id1).to.not.equal(id2); // Should still be unique
          (0, chai_1.expect)(id1).to.match(/^terminal-\d+-[a-z0-9]+$/);
          (0, chai_1.expect)(id2).to.match(/^terminal-\d+-[a-z0-9]+$/);
        } finally {
          global.Date.now = originalDateNow;
          Math.random = originalMathRandom;
        }
      });
    });
  });
  describe('Performance and Resource Management', () => {
    describe('RED Phase - Performance Characteristics', () => {
      it('should create terminals within acceptable time limits', async () => {
        // RED: Terminal creation should be fast
        const startTime = Date.now();
        // Simulate rapid terminal creation
        const operations = [];
        for (let i = 0; i < 10; i++) {
          operations.push(() => {
            const config = (0, common_1.getTerminalConfig)();
            const shell = (0, common_1.getShellForPlatform)();
            const id = (0, common_1.generateTerminalId)();
            const info = (0, common_1.normalizeTerminalInfo)({
              id,
              name: `Performance Test ${i}`,
              isActive: i === 0,
            });
            return { config, shell, id, info };
          });
        }
        const results = operations.map((op) => op());
        const endTime = Date.now();
        (0, chai_1.expect)(results.length).to.equal(10);
        (0, chai_1.expect)(endTime - startTime).to.be.lessThan(100); // Should be very fast
        // All results should be valid
        results.forEach((result, index) => {
          (0, chai_1.expect)(result.config).to.be.an('object');
          (0, chai_1.expect)(result.shell).to.be.a('string');
          (0, chai_1.expect)(result.id).to.be.a('string');
          (0, chai_1.expect)(result.info.name).to.equal(`Performance Test ${index}`);
        });
      });
      it('should handle memory efficiently during bulk creation', () => {
        // RED: Memory usage should be reasonable
        const initialMemory = process.memoryUsage().heapUsed;
        // Create many terminal configurations
        const configs = [];
        for (let i = 0; i < 1000; i++) {
          configs.push({
            config: (0, common_1.getTerminalConfig)(),
            shell: (0, common_1.getShellForPlatform)(),
            id: (0, common_1.generateTerminalId)(),
            info: (0, common_1.normalizeTerminalInfo)({
              id: `test-${i}`,
              name: `Bulk Test ${i}`,
              isActive: false,
            }),
          });
        }
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        (0, chai_1.expect)(configs.length).to.equal(1000);
        // Memory increase should be reasonable (less than 10MB for 1000 configs)
        (0, chai_1.expect)(memoryIncrease).to.be.lessThan(10 * 1024 * 1024);
      });
    });
  });
  describe('Integration with VS Code APIs', () => {
    describe('RED Phase - VS Code Integration', () => {
      it('should integrate properly with VS Code workspace API', () => {
        // RED: VS Code workspace integration should work
        const config = (0, common_1.getTerminalConfig)();
        // Verify that VS Code workspace.getConfiguration was called
        (0, chai_1.expect)(TestSetup_1.mockVscode.workspace.getConfiguration).to.have.been.called;
        // Configuration should reflect VS Code settings structure
        (0, chai_1.expect)(config).to.have.property('shell');
        (0, chai_1.expect)(config).to.have.property('fontSize');
        (0, chai_1.expect)(config).to.have.property('fontFamily');
        (0, chai_1.expect)(config).to.have.property('maxTerminals');
      });
      it('should handle VS Code API unavailability gracefully', () => {
        // RED: Should work even if VS Code APIs are not available
        // Temporarily remove VS Code mock
        const originalVscode = global.vscode;
        delete global.vscode;
        try {
          // These operations should still work with fallbacks
          (0, chai_1.expect)(() => (0, common_1.getShellForPlatform)()).to.not.throw();
          (0, chai_1.expect)(() => (0, common_1.generateTerminalId)()).to.not.throw();
        } finally {
          global.vscode = originalVscode;
        }
      });
    });
  });
  describe('Concurrent Terminal Creation', () => {
    describe('RED Phase - Concurrency Handling', () => {
      it('should handle simultaneous terminal creation requests', async () => {
        // RED: Concurrent creation should work without conflicts
        const concurrentCreations = 20;
        const promises = [];
        for (let i = 0; i < concurrentCreations; i++) {
          promises.push(
            new Promise((resolve) => {
              setTimeout(() => {
                const config = (0, common_1.getTerminalConfig)();
                const shell = (0, common_1.getShellForPlatform)();
                const id = (0, common_1.generateTerminalId)();
                const info = (0, common_1.normalizeTerminalInfo)({
                  id,
                  name: `Concurrent ${i}`,
                  isActive: i === 0,
                });
                resolve({ config, shell, id, info, index: i });
              }, Math.random() * 10); // Random timing
            })
          );
        }
        const results = await Promise.all(promises);
        (0, chai_1.expect)(results.length).to.equal(concurrentCreations);
        // All IDs should be unique
        const ids = new Set(results.map((r) => r.id));
        (0, chai_1.expect)(ids.size).to.equal(concurrentCreations);
        // All results should be valid
        results.forEach((result) => {
          (0, chai_1.expect)(result.config).to.be.an('object');
          (0, chai_1.expect)(result.shell).to.be.a('string');
          (0, chai_1.expect)(result.id).to.be.a('string');
          (0, chai_1.expect)(result.info).to.be.an('object');
        });
      });
      it('should maintain configuration consistency across concurrent access', async () => {
        // RED: Configuration should be consistent across concurrent access
        const concurrentAccess = 50;
        const promises = [];
        for (let i = 0; i < concurrentAccess; i++) {
          promises.push(
            new Promise((resolve) => {
              const config = (0, common_1.getTerminalConfig)();
              resolve(config);
            })
          );
        }
        const configs = await Promise.all(promises);
        // All configurations should be identical
        const firstConfig = configs[0];
        configs.forEach((config) => {
          (0, chai_1.expect)(config).to.deep.equal(firstConfig);
        });
      });
    });
  });
  describe('Terminal Creation State Management', () => {
    describe('RED Phase - State Consistency', () => {
      it('should maintain consistent terminal information normalization', () => {
        // RED: Terminal info normalization should be consistent
        const testCases = [
          { id: 'term-1', name: 'Test Terminal 1', isActive: true },
          { id: 'term-2', name: 'Test Terminal 2', isActive: false },
          { id: 'term-3', name: '', isActive: true },
          { id: '', name: 'Empty ID Test', isActive: false },
        ];
        testCases.forEach((testCase) => {
          const normalized = (0, common_1.normalizeTerminalInfo)(testCase);
          (0, chai_1.expect)(normalized.id).to.equal(testCase.id);
          (0, chai_1.expect)(normalized.name).to.equal(testCase.name);
          (0, chai_1.expect)(normalized.isActive).to.equal(testCase.isActive);
          // Normalized info should have exactly these properties
          (0, chai_1.expect)(Object.keys(normalized)).to.have.members(['id', 'name', 'isActive']);
        });
      });
      it('should handle terminal creation with various name patterns', () => {
        // RED: Different name patterns should be handled consistently
        const namePatterns = [
          'Simple Terminal',
          'Terminal with números 123',
          'Terminal with symbols !@#$%',
          'Very long terminal name that exceeds normal length expectations for testing purposes',
          '終端機', // Unicode characters
          '', // Empty name
          '   Whitespace Terminal   ', // Leading/trailing whitespace
        ];
        namePatterns.forEach((name, index) => {
          const id = (0, common_1.generateTerminalId)();
          const info = (0, common_1.normalizeTerminalInfo)({
            id,
            name,
            isActive: index === 0,
          });
          (0, chai_1.expect)(info.id).to.equal(id);
          (0, chai_1.expect)(info.name).to.equal(name); // Should preserve original name
          (0, chai_1.expect)(info.isActive).to.equal(index === 0);
        });
      });
    });
  });
  describe('Error Recovery and Resilience', () => {
    describe('RED Phase - System Resilience', () => {
      it('should recover from transient configuration failures', () => {
        // RED: Should handle temporary configuration failures
        let failureCount = 0;
        const maxFailures = 3;
        // Mock configuration service to fail initially, then succeed
        TestSetup_1.mockVscode.workspace.getConfiguration.callsFake(() => {
          failureCount++;
          if (failureCount <= maxFailures) {
            throw new Error(`Transient failure ${failureCount}`);
          }
          return {
            get: sinon.stub().callsFake((key, defaultValue) => {
              // Return reasonable defaults
              const defaults = {
                shell: '/bin/bash',
                fontSize: 14,
                maxTerminals: 5,
              };
              return key in defaults ? defaults[key] : defaultValue;
            }),
            has: sinon.stub().returns(true),
            inspect: sinon.stub().returns({ defaultValue: undefined }),
            update: sinon.stub().resolves(),
          };
        });
        // First few calls should handle errors gracefully
        for (let i = 0; i <= maxFailures; i++) {
          (0, chai_1.expect)(() => (0, common_1.getTerminalConfig)()).to.not.throw();
        }
        // After max failures, should succeed
        const config = (0, common_1.getTerminalConfig)();
        (0, chai_1.expect)(config).to.be.an('object');
        (0, chai_1.expect)(config.shell).to.equal('/bin/bash');
      });
    });
  });
});
//# sourceMappingURL=TerminalCreationFlow.test.js.map
