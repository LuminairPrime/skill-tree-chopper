'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
// @vitest-environment node
const vitest_1 = require('vitest');
const os = require('os');
const fs = require('fs');
const TerminalProfileService_1 = require('../../../../services/TerminalProfileService');
// Hoist mocks to be accessible inside vi.mock factory
const mocks = vitest_1.vi.hoisted(() => {
  const mockConfig = {
    get: vitest_1.vi.fn(),
    update: vitest_1.vi.fn(),
  };
  return {
    mockConfig,
    getConfigurationMock: vitest_1.vi.fn(() => mockConfig),
    showWarningMessageMock: vitest_1.vi.fn(),
  };
});
vitest_1.vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: mocks.getConfigurationMock,
  },
  window: {
    showWarningMessage: mocks.showWarningMessageMock,
  },
  ConfigurationTarget: {
    Global: 1,
  },
}));
vitest_1.vi.mock('os', async () => {
  const actual = await vitest_1.vi.importActual('os');
  return {
    ...actual,
    platform: vitest_1.vi.fn(),
  };
});
vitest_1.vi.mock('fs', async () => {
  return {
    promises: {
      access: vitest_1.vi.fn(),
    },
    constants: {
      F_OK: 0,
    },
  };
});
(0, vitest_1.describe)('TerminalProfileService', () => {
  let service;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    os.platform.mockReturnValue('linux'); // Default to linux
    // Reset default config behavior
    mocks.mockConfig.get.mockImplementation((key, defaultValue) => defaultValue);
    mocks.getConfigurationMock.mockReturnValue(mocks.mockConfig);
  });
  (0, vitest_1.afterEach)(() => {
    vitest_1.vi.restoreAllMocks();
  });
  (0, vitest_1.describe)('Platform Detection', () => {
    (0, vitest_1.it)('should detect windows platform', () => {
      os.platform.mockReturnValue('win32');
      service = new TerminalProfileService_1.TerminalProfileService();
      // Platform detection happens in constructor
    });
  });
  (0, vitest_1.describe)('getAvailableProfiles', () => {
    (0, vitest_1.it)('should return configured profiles merged with VS Code profiles', async () => {
      service = new TerminalProfileService_1.TerminalProfileService();
      const customProfiles = {
        'My Profile': { path: '/bin/custom', args: [] },
      };
      const vscodeProfiles = {
        Bash: { path: '/bin/bash', args: [] },
      };
      // Mock getConfiguration to return different configs based on section
      // @ts-expect-error - test mock type
      mocks.getConfigurationMock.mockImplementation((section) => {
        return {
          get: (key, defaultValue) => {
            if (section === 'secondaryTerminal') {
              if (key === 'profiles.linux') return customProfiles;
              if (key === 'inheritVSCodeProfiles') return true;
            }
            if (section === 'terminal.integrated') {
              if (key === 'profiles.linux') return vscodeProfiles;
            }
            return defaultValue;
          },
          update: vitest_1.vi.fn(),
        };
      });
      const profiles = await service.getAvailableProfiles();
      (0, vitest_1.expect)(profiles).toHaveProperty('My Profile');
      (0, vitest_1.expect)(profiles).toHaveProperty('Bash');
    });
  });
  (0, vitest_1.describe)('getDefaultProfile', () => {
    (0, vitest_1.it)('should return configured default profile', () => {
      service = new TerminalProfileService_1.TerminalProfileService();
      mocks.mockConfig.get.mockReturnValue('My Profile');
      const defaultProfile = service.getDefaultProfile();
      (0, vitest_1.expect)(defaultProfile).toBe('My Profile');
    });
    (0, vitest_1.it)('should warn and return null if default profile looks like a path', () => {
      service = new TerminalProfileService_1.TerminalProfileService();
      mocks.mockConfig.get.mockReturnValue('/bin/bash');
      const defaultProfile = service.getDefaultProfile();
      (0, vitest_1.expect)(defaultProfile).toBeNull();
      (0, vitest_1.expect)(mocks.showWarningMessageMock).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('resolveProfile', () => {
    (0, vitest_1.it)('should resolve specific requested profile', async () => {
      service = new TerminalProfileService_1.TerminalProfileService();
      const profiles = { Custom: { path: '/bin/custom' } };
      mocks.getConfigurationMock.mockReturnValue({
        // @ts-expect-error - test mock type
        get: (key) => (key === 'profiles.linux' ? profiles : undefined),
        update: vitest_1.vi.fn(),
      });
      const result = await service.resolveProfile('Custom');
      (0, vitest_1.expect)(result.profileName).toBe('Custom');
      (0, vitest_1.expect)(result.profile.path).toBe('/bin/custom');
      (0, vitest_1.expect)(result.source).toBe('user');
    });
    (0, vitest_1.it)('should fall back to default profile if requested not found', async () => {
      service = new TerminalProfileService_1.TerminalProfileService();
      const profiles = { Default: { path: '/bin/default' } };
      // @ts-expect-error - test mock type
      mocks.getConfigurationMock.mockImplementation((_section) => ({
        get: (key) => {
          if (key === 'profiles.linux') return profiles;
          if (key === 'defaultProfile.linux') return 'Default';
          return undefined;
        },
        update: vitest_1.vi.fn(),
      }));
      const result = await service.resolveProfile('NonExistent');
      (0, vitest_1.expect)(result.profileName).toBe('Default');
      (0, vitest_1.expect)(result.source).toBe('default');
    });
    (0, vitest_1.it)('should fall back to first available profile if no default', async () => {
      service = new TerminalProfileService_1.TerminalProfileService();
      const profiles = { First: { path: '/bin/first' } };
      // @ts-expect-error - test mock type
      mocks.getConfigurationMock.mockImplementation((_section) => ({
        get: (key) => {
          if (key === 'profiles.linux') return profiles;
          return undefined;
        },
        update: vitest_1.vi.fn(),
      }));
      const result = await service.resolveProfile();
      (0, vitest_1.expect)(result.profileName).toBe('First');
      (0, vitest_1.expect)(result.source).toBe('auto-detected');
    });
    (0, vitest_1.it)('should create fallback profile if nothing configured', async () => {
      service = new TerminalProfileService_1.TerminalProfileService();
      mocks.getConfigurationMock.mockReturnValue({
        // @ts-expect-error - test mock type
        get: (_key, defaultValue) => defaultValue,
        update: vitest_1.vi.fn(),
      });
      const result = await service.resolveProfile();
      (0, vitest_1.expect)(result.profileName).toBe('Fallback Shell');
      (0, vitest_1.expect)(result.source).toBe('auto-detected');
      // Linux default
      (0, vitest_1.expect)(result.profile.path).toBe(process.env.SHELL || '/bin/bash');
    });
  });
  (0, vitest_1.describe)('autoDetectProfiles', () => {
    (0, vitest_1.it)('should detect existing shells', async () => {
      service = new TerminalProfileService_1.TerminalProfileService();
      fs.promises.access.mockResolvedValue(undefined); // Success
      const profiles = await service.autoDetectProfiles();
      (0, vitest_1.expect)(Object.keys(profiles).length).toBeGreaterThan(0);
      (0, vitest_1.expect)(profiles).toHaveProperty('bash');
    });
    (0, vitest_1.it)('should ignore missing shells', async () => {
      service = new TerminalProfileService_1.TerminalProfileService();
      fs.promises.access.mockRejectedValue(new Error('Not found'));
      const profiles = await service.autoDetectProfiles();
      (0, vitest_1.expect)(Object.keys(profiles).length).toBe(0);
    });
  });
});
//# sourceMappingURL=TerminalProfileService.test.js.map
