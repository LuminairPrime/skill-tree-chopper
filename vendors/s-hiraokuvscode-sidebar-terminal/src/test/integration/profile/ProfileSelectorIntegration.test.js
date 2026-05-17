'use strict';
/**
 * Profile Selector Integration Test Suite
 * Tests the complete profile selection flow including shortcuts and messaging
 */
Object.defineProperty(exports, '__esModule', { value: true });
const chai_1 = require('chai');
const mocha_1 = require('mocha');
const sinon_1 = require('sinon');
const jsdom_1 = require('jsdom');
const InputManager_1 = require('../../../webview/managers/InputManager');
const ProfileManager_1 = require('../../../webview/managers/ProfileManager');
(0, mocha_1.describe)('Profile Selector Integration', () => {
  let inputManager;
  let profileManager;
  let mockCoordinator;
  let jsdom;
  let mockProfiles;
  (0, mocha_1.beforeEach)(() => {
    // Setup JSDOM environment
    jsdom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
    });
    global.window = jsdom.window;
    global.document = jsdom.window.document;
    global.Event = jsdom.window.Event;
    global.KeyboardEvent = jsdom.window.KeyboardEvent;
    // Create mock profiles
    mockProfiles = [
      {
        id: 'bash',
        name: 'Bash',
        path: '/bin/bash',
        description: 'Bash shell',
        icon: 'terminal-bash',
        isDefault: true,
        args: [],
      },
      {
        id: 'zsh',
        name: 'Zsh',
        path: '/bin/zsh',
        description: 'Z shell',
        icon: 'terminal-bash',
        isDefault: false,
        args: [],
      },
    ];
    // Create mock coordinator with profile manager
    profileManager = new ProfileManager_1.ProfileManager();
    mockCoordinator = {
      postMessageToExtension: sinon_1.default.stub(),
      createTerminal: sinon_1.default.stub().resolves(),
      getActiveTerminalId: sinon_1.default.stub().returns('terminal-1'),
      getManagers: sinon_1.default.stub().returns({
        profileManager: profileManager,
        notification: {
          showWarning: sinon_1.default.stub(),
          showInfo: sinon_1.default.stub(),
        },
      }),
    };
    // Initialize managers
    profileManager.setCoordinator(mockCoordinator);
    profileManager.updateProfiles(mockProfiles, 'bash');
    inputManager = new InputManager_1.InputManager(mockCoordinator);
  });
  (0, mocha_1.afterEach)(() => {
    inputManager.dispose();
    profileManager.dispose();
    jsdom.window.close();
  });
  (0, mocha_1.describe)('Ctrl+Shift+P Shortcut Integration', () => {
    (0, mocha_1.it)('should open profile selector on Ctrl+Shift+P', async () => {
      await inputManager.initialize();
      await profileManager.initialize();
      (0, chai_1.expect)(profileManager.isProfileSelectorVisible()).to.be.false;
      // Simulate Ctrl+Shift+P keydown
      const event = new jsdom.window.KeyboardEvent('keydown', {
        key: 'P',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);
      (0, chai_1.expect)(profileManager.isProfileSelectorVisible()).to.be.true;
    });
    (0, mocha_1.it)('should not open selector on Ctrl+P without Shift', async () => {
      await inputManager.initialize();
      await profileManager.initialize();
      const event = new jsdom.window.KeyboardEvent('keydown', {
        key: 'P',
        ctrlKey: true,
        shiftKey: false,
        bubbles: true,
      });
      document.dispatchEvent(event);
      (0, chai_1.expect)(profileManager.isProfileSelectorVisible()).to.be.false;
    });
    (0, mocha_1.it)('should not open selector on Shift+P without Ctrl', async () => {
      await inputManager.initialize();
      await profileManager.initialize();
      const event = new jsdom.window.KeyboardEvent('keydown', {
        key: 'P',
        ctrlKey: false,
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);
      (0, chai_1.expect)(profileManager.isProfileSelectorVisible()).to.be.false;
    });
  });
  (0, mocha_1.describe)('Complete Profile Selection Flow', () => {
    (0, mocha_1.it)('should complete full profile selection workflow', async () => {
      await inputManager.initialize();
      await profileManager.initialize();
      // Step 1: Open selector with Ctrl+Shift+P
      const openEvent = new jsdom.window.KeyboardEvent('keydown', {
        key: 'P',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(openEvent);
      (0, chai_1.expect)(profileManager.isProfileSelectorVisible()).to.be.true;
      // Step 2: Select profile
      const profileItems = document.querySelectorAll('.profile-item');
      const zshItem = Array.from(profileItems).find((item) => item.textContent?.includes('Zsh'));
      (0, chai_1.expect)(zshItem).to.exist;
      zshItem.click();
      // Step 3: Confirm selection
      const confirmBtn = document.querySelector('.profile-selector-confirm');
      confirmBtn.click();
      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));
      // Verify terminal creation
      (0, chai_1.expect)(mockCoordinator.createTerminal.calledOnce).to.be.true;
      const [, , options] = mockCoordinator.createTerminal.firstCall.args;
      (0, chai_1.expect)(options.profileId).to.equal('zsh');
    });
    (0, mocha_1.it)('should close selector on Escape', async () => {
      await inputManager.initialize();
      await profileManager.initialize();
      // Open selector
      const openEvent = new jsdom.window.KeyboardEvent('keydown', {
        key: 'P',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(openEvent);
      (0, chai_1.expect)(profileManager.isProfileSelectorVisible()).to.be.true;
      // Close with Escape
      const closeEvent = new jsdom.window.KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      const container = document.getElementById('profile-selector-container');
      container?.dispatchEvent(closeEvent);
      (0, chai_1.expect)(profileManager.isProfileSelectorVisible()).to.be.false;
    });
    (0, mocha_1.it)('should navigate and select with keyboard only', async () => {
      await inputManager.initialize();
      await profileManager.initialize();
      // Open selector
      const openEvent = new jsdom.window.KeyboardEvent('keydown', {
        key: 'P',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(openEvent);
      const container = document.getElementById('profile-selector-container');
      // Navigate down
      const downEvent = new jsdom.window.KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
      });
      container?.dispatchEvent(downEvent);
      // Confirm with Enter
      const enterEvent = new jsdom.window.KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
      });
      container?.dispatchEvent(enterEvent);
      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));
      (0, chai_1.expect)(mockCoordinator.createTerminal.calledOnce).to.be.true;
    });
  });
  (0, mocha_1.describe)('Message Flow Integration', () => {
    (0, mocha_1.it)('should request profiles from extension', async () => {
      await profileManager.initialize();
      await profileManager.refreshProfiles();
      (0, chai_1.expect)(mockCoordinator.postMessageToExtension.calledOnce).to.be.true;
      const message = mockCoordinator.postMessageToExtension.firstCall.args[0];
      (0, chai_1.expect)(message.command).to.equal('getTerminalProfiles');
    });
    (0, mocha_1.it)('should receive and update profiles from extension', () => {
      const newProfiles = [
        {
          id: 'cmd',
          name: 'Command Prompt',
          path: 'C:\\Windows\\System32\\cmd.exe',
          description: 'Windows Command Prompt',
          icon: 'terminal-cmd',
          isDefault: true,
          args: [],
        },
      ];
      profileManager.handleMessage({
        command: 'profilesUpdated',
        profiles: newProfiles,
        defaultProfileId: 'cmd',
      });
      const profile = profileManager.getProfile('cmd');
      (0, chai_1.expect)(profile).to.exist;
      (0, chai_1.expect)(profile?.name).to.equal('Command Prompt');
      const defaultProfile = profileManager.getDefaultProfile();
      (0, chai_1.expect)(defaultProfile?.id).to.equal('cmd');
    });
    (0, mocha_1.it)('should send terminal creation message to extension', async () => {
      await profileManager.createTerminalWithProfile('bash');
      (0, chai_1.expect)(mockCoordinator.createTerminal.calledOnce).to.be.true;
      const [terminalId, terminalName, options] = mockCoordinator.createTerminal.firstCall.args;
      (0, chai_1.expect)(terminalId).to.be.a('string');
      (0, chai_1.expect)(terminalName).to.include('Bash');
      (0, chai_1.expect)(options.profileId).to.equal('bash');
      (0, chai_1.expect)(options.shell).to.equal('/bin/bash');
    });
    (0, mocha_1.it)('should update default profile via extension', async () => {
      await profileManager.setDefaultProfile('zsh');
      (0, chai_1.expect)(mockCoordinator.postMessageToExtension.calledOnce).to.be.true;
      const message = mockCoordinator.postMessageToExtension.firstCall.args[0];
      (0, chai_1.expect)(message.command).to.equal('setDefaultProfile');
      (0, chai_1.expect)(message.profileId).to.equal('zsh');
    });
  });
  (0, mocha_1.describe)('Error Handling', () => {
    (0, mocha_1.it)('should show warning when no profiles available', async () => {
      profileManager.updateProfiles([], undefined);
      await inputManager.initialize();
      await profileManager.initialize();
      // Open selector
      const openEvent = new jsdom.window.KeyboardEvent('keydown', {
        key: 'P',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(openEvent);
      const notificationManager = mockCoordinator.getManagers().notification;
      (0, chai_1.expect)(notificationManager.showWarning.calledOnce).to.be.true;
      (0, chai_1.expect)(
        notificationManager.showWarning.calledWith('No terminal profiles available')
      ).to.be.true;
    });
    (0, mocha_1.it)('should handle terminal creation failure gracefully', async () => {
      mockCoordinator.createTerminal.rejects(new Error('Failed to create terminal'));
      try {
        await profileManager.createTerminalWithProfile('bash');
        chai_1.expect.fail('Should have thrown error');
      } catch (error) {
        (0, chai_1.expect)(error.message).to.include('Failed to create terminal');
      }
      const notificationManager = mockCoordinator.getManagers().notification;
      (0, chai_1.expect)(notificationManager.showWarning.called).to.be.true;
    });
  });
  (0, mocha_1.describe)('Multiple Profile Selection Cycles', () => {
    (0, mocha_1.it)('should handle multiple open-close cycles', async () => {
      await inputManager.initialize();
      await profileManager.initialize();
      // Cycle 1: Open and close
      let openEvent = new jsdom.window.KeyboardEvent('keydown', {
        key: 'P',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(openEvent);
      (0, chai_1.expect)(profileManager.isProfileSelectorVisible()).to.be.true;
      profileManager.hideProfileSelector();
      (0, chai_1.expect)(profileManager.isProfileSelectorVisible()).to.be.false;
      // Cycle 2: Open and close again
      openEvent = new jsdom.window.KeyboardEvent('keydown', {
        key: 'P',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(openEvent);
      (0, chai_1.expect)(profileManager.isProfileSelectorVisible()).to.be.true;
      profileManager.hideProfileSelector();
      (0, chai_1.expect)(profileManager.isProfileSelectorVisible()).to.be.false;
    });
    (0, mocha_1.it)('should handle rapid selection changes', async () => {
      await inputManager.initialize();
      await profileManager.initialize();
      // Open selector
      const openEvent = new jsdom.window.KeyboardEvent('keydown', {
        key: 'P',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(openEvent);
      const profileItems = document.querySelectorAll('.profile-item');
      // Rapid clicks on different profiles
      profileItems[0].click();
      (0, chai_1.expect)(profileItems[0].classList.contains('selected')).to.be.true;
      profileItems[1].click();
      (0, chai_1.expect)(profileItems[0].classList.contains('selected')).to.be.false;
      (0, chai_1.expect)(profileItems[1].classList.contains('selected')).to.be.true;
      profileItems[0].click();
      (0, chai_1.expect)(profileItems[1].classList.contains('selected')).to.be.false;
      (0, chai_1.expect)(profileItems[0].classList.contains('selected')).to.be.true;
    });
  });
  (0, mocha_1.describe)('Profile Filtering Integration', () => {
    (0, mocha_1.it)('should filter profiles and maintain selection', async () => {
      await inputManager.initialize();
      await profileManager.initialize();
      // Open selector
      const openEvent = new jsdom.window.KeyboardEvent('keydown', {
        key: 'P',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(openEvent);
      const filterInput = document.querySelector('.profile-filter');
      filterInput.value = 'zsh';
      filterInput.dispatchEvent(new jsdom.window.Event('input', { bubbles: true }));
      const visibleProfiles = document.querySelectorAll('.profile-item');
      (0, chai_1.expect)(visibleProfiles).to.have.length(1);
      (0, chai_1.expect)(visibleProfiles[0].textContent).to.include('Zsh');
    });
  });
  (0, mocha_1.describe)('Performance', () => {
    (0, mocha_1.it)('should handle profile selector open/close without memory leaks', async () => {
      await inputManager.initialize();
      await profileManager.initialize();
      const iterations = 10;
      for (let i = 0; i < iterations; i++) {
        profileManager.showProfileSelector();
        (0, chai_1.expect)(profileManager.isProfileSelectorVisible()).to.be.true;
        profileManager.hideProfileSelector();
        (0, chai_1.expect)(profileManager.isProfileSelectorVisible()).to.be.false;
      }
      // Verify container still exists and is properly managed
      const container = document.getElementById('profile-selector-container');
      (0, chai_1.expect)(container).to.exist;
    });
    (0, mocha_1.it)('should efficiently update large profile lists', async () => {
      const largeProfileList = Array.from({ length: 100 }, (_, i) => ({
        id: `profile-${i}`,
        name: `Profile ${i}`,
        path: `/bin/shell${i}`,
        description: `Description ${i}`,
        icon: 'terminal-bash',
        isDefault: i === 0,
        args: [],
      }));
      const startTime = Date.now();
      profileManager.updateProfiles(largeProfileList, 'profile-0');
      await profileManager.initialize();
      profileManager.showProfileSelector();
      const duration = Date.now() - startTime;
      // Should complete within reasonable time (< 100ms)
      (0, chai_1.expect)(duration).to.be.lessThan(100);
      const profileItems = document.querySelectorAll('.profile-item');
      (0, chai_1.expect)(profileItems).to.have.length(100);
    });
  });
});
//# sourceMappingURL=ProfileSelectorIntegration.test.js.map
