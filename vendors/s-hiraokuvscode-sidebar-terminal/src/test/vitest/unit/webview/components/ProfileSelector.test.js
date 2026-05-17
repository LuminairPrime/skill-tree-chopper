'use strict';
/**
 * ProfileSelector Component Test Suite
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 * Tests the terminal profile selector UI component
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const jsdom_1 = require('jsdom');
const ProfileSelector_1 = require('../../../../../webview/components/ProfileSelector');
(0, vitest_1.describe)('ProfileSelector Component', () => {
  let profileSelector;
  let container;
  let jsdom;
  let mockProfiles;
  (0, vitest_1.beforeEach)(() => {
    // Setup JSDOM environment
    jsdom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
    });
    global.window = jsdom.window;
    global.document = jsdom.window.document;
    global.Event = jsdom.window.Event;
    global.KeyboardEvent = jsdom.window.KeyboardEvent;
    // Create container element
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
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
      {
        id: 'powershell',
        name: 'PowerShell',
        path: '/usr/local/bin/pwsh',
        description: 'PowerShell Core',
        icon: 'terminal-pwsh',
        isDefault: false,
        args: [],
      },
    ];
    profileSelector = new ProfileSelector_1.ProfileSelector(container);
  });
  (0, vitest_1.afterEach)(() => {
    profileSelector.dispose();
    document.body.removeChild(container);
    jsdom.window.close();
  });
  (0, vitest_1.describe)('Initialization', () => {
    (0, vitest_1.it)('should create profile selector UI elements', () => {
      const overlay = container.querySelector('.profile-selector-overlay');
      (0, vitest_1.expect)(overlay).not.toBeNull();
      const dialog = container.querySelector('.profile-selector-dialog');
      (0, vitest_1.expect)(dialog).not.toBeNull();
      const header = container.querySelector('.profile-selector-header');
      (0, vitest_1.expect)(header).not.toBeNull();
      const filterInput = container.querySelector('.profile-filter');
      (0, vitest_1.expect)(filterInput).not.toBeNull();
      const profileList = container.querySelector('.profile-list');
      (0, vitest_1.expect)(profileList).not.toBeNull();
    });
    (0, vitest_1.it)('should be hidden by default', () => {
      (0, vitest_1.expect)(profileSelector.isVisible).toBe(false);
      // Container display may be empty string or 'none' depending on initialization
      (0, vitest_1.expect)(
        container.style.display === 'none' || container.style.display === ''
      ).toBe(true);
    });
  });
  (0, vitest_1.describe)('Show/Hide Functionality', () => {
    (0, vitest_1.it)('should show profile selector with profiles', () => {
      profileSelector.show(mockProfiles);
      (0, vitest_1.expect)(profileSelector.isVisible).toBe(true);
      (0, vitest_1.expect)(container.style.display).toBe('block');
      const profileItems = container.querySelectorAll('.profile-item');
      (0, vitest_1.expect)(profileItems).toHaveLength(3);
    });
    (0, vitest_1.it)('should hide profile selector', () => {
      profileSelector.show(mockProfiles);
      (0, vitest_1.expect)(profileSelector.isVisible).toBe(true);
      profileSelector.hide();
      (0, vitest_1.expect)(profileSelector.isVisible).toBe(false);
      (0, vitest_1.expect)(container.style.display).toBe('none');
    });
    (0, vitest_1.it)('should clear filter text when hiding', () => {
      profileSelector.show(mockProfiles);
      const filterInput = container.querySelector('.profile-filter');
      filterInput.value = 'test';
      profileSelector.hide();
      (0, vitest_1.expect)(filterInput.value).toBe('');
    });
    (0, vitest_1.it)('should call onClosed callback when hiding', () => {
      const onClosed = vitest_1.vi.fn();
      profileSelector.show(mockProfiles, undefined, undefined, onClosed);
      profileSelector.hide();
      (0, vitest_1.expect)(onClosed).toHaveBeenCalledTimes(1);
    });
  });
  (0, vitest_1.describe)('Profile List Display', () => {
    (0, vitest_1.it)('should display all profiles', () => {
      profileSelector.show(mockProfiles);
      const profileItems = container.querySelectorAll('.profile-item');
      (0, vitest_1.expect)(profileItems).toHaveLength(3);
      // Check profile names are present in the container
      const containerText = container.textContent || '';
      (0, vitest_1.expect)(containerText).toContain('Bash');
      (0, vitest_1.expect)(containerText).toContain('Zsh');
      (0, vitest_1.expect)(containerText).toContain('PowerShell');
    });
    (0, vitest_1.it)('should mark default profile with badge', () => {
      profileSelector.show(mockProfiles);
      const bashProfile = Array.from(container.querySelectorAll('.profile-item')).find((item) =>
        item.textContent?.includes('Bash')
      );
      const defaultBadge = bashProfile?.querySelector('.profile-default-badge');
      (0, vitest_1.expect)(defaultBadge).not.toBeNull();
      (0, vitest_1.expect)(defaultBadge?.textContent?.trim()).toBe('Default');
    });
    (0, vitest_1.it)('should display profile descriptions', () => {
      profileSelector.show(mockProfiles);
      const descriptions = Array.from(container.querySelectorAll('.profile-item-description')).map(
        (el) => el.textContent?.trim()
      );
      (0, vitest_1.expect)(descriptions.some((desc) => desc === 'Bash shell')).toBe(true);
      (0, vitest_1.expect)(descriptions.some((desc) => desc === 'Z shell')).toBe(true);
      (0, vitest_1.expect)(descriptions.some((desc) => desc === 'PowerShell Core')).toBe(true);
    });
  });
  (0, vitest_1.describe)('Profile Selection', () => {
    (0, vitest_1.it)('should select profile on click', () => {
      profileSelector.show(mockProfiles);
      const zshProfile = Array.from(container.querySelectorAll('.profile-item')).find((item) =>
        item.textContent?.includes('Zsh')
      );
      zshProfile.click();
      (0, vitest_1.expect)(zshProfile?.classList.contains('selected')).toBe(true);
      const confirmBtn = container.querySelector('.profile-selector-confirm');
      (0, vitest_1.expect)(confirmBtn.disabled).toBe(false);
    });
    (0, vitest_1.it)('should call onProfileSelected callback on confirm', () => {
      const onProfileSelected = vitest_1.vi.fn();
      profileSelector.show(mockProfiles, undefined, onProfileSelected);
      // Select profile
      const zshProfile = Array.from(container.querySelectorAll('.profile-item')).find((item) =>
        item.textContent?.includes('Zsh')
      );
      zshProfile.click();
      // Click confirm
      const confirmBtn = container.querySelector('.profile-selector-confirm');
      confirmBtn.click();
      (0, vitest_1.expect)(onProfileSelected).toHaveBeenCalledTimes(1);
      (0, vitest_1.expect)(onProfileSelected).toHaveBeenCalledWith('zsh');
    });
    (0, vitest_1.it)('should confirm selection on double-click', () => {
      const onProfileSelected = vitest_1.vi.fn();
      profileSelector.show(mockProfiles, undefined, onProfileSelected);
      const zshProfile = Array.from(container.querySelectorAll('.profile-item')).find((item) =>
        item.textContent?.includes('Zsh')
      );
      // Double click
      const dblClickEvent = new jsdom.window.Event('dblclick', { bubbles: true });
      zshProfile?.dispatchEvent(dblClickEvent);
      (0, vitest_1.expect)(onProfileSelected).toHaveBeenCalledTimes(1);
      (0, vitest_1.expect)(onProfileSelected).toHaveBeenCalledWith('zsh');
    });
    (0, vitest_1.it)('should pre-select specified profile', () => {
      profileSelector.show(mockProfiles, 'zsh');
      const zshProfile = Array.from(container.querySelectorAll('.profile-item')).find((item) =>
        item.textContent?.includes('Zsh')
      );
      (0, vitest_1.expect)(zshProfile?.classList.contains('selected')).toBe(true);
    });
    (0, vitest_1.it)('should only allow one profile selection at a time', () => {
      profileSelector.show(mockProfiles);
      // Select first profile
      const bashProfile = Array.from(container.querySelectorAll('.profile-item')).find((item) =>
        item.textContent?.includes('Bash')
      );
      bashProfile.click();
      (0, vitest_1.expect)(bashProfile?.classList.contains('selected')).toBe(true);
      // Select second profile
      const zshProfile = Array.from(container.querySelectorAll('.profile-item')).find((item) =>
        item.textContent?.includes('Zsh')
      );
      zshProfile.click();
      // First should be deselected
      (0, vitest_1.expect)(bashProfile?.classList.contains('selected')).toBe(false);
      (0, vitest_1.expect)(zshProfile?.classList.contains('selected')).toBe(true);
    });
  });
  (0, vitest_1.describe)('Filter Functionality', () => {
    (0, vitest_1.it)('should filter profiles by name', () => {
      profileSelector.show(mockProfiles);
      const filterInput = container.querySelector('.profile-filter');
      filterInput.value = 'bash';
      filterInput.dispatchEvent(new jsdom.window.Event('input', { bubbles: true }));
      const visibleProfiles = container.querySelectorAll('.profile-item');
      (0, vitest_1.expect)(visibleProfiles).toHaveLength(1);
      (0, vitest_1.expect)(visibleProfiles[0].textContent).toContain('Bash');
    });
    (0, vitest_1.it)('should filter profiles by description', () => {
      profileSelector.show(mockProfiles);
      const filterInput = container.querySelector('.profile-filter');
      filterInput.value = 'Z shell';
      filterInput.dispatchEvent(new jsdom.window.Event('input', { bubbles: true }));
      const visibleProfiles = container.querySelectorAll('.profile-item');
      (0, vitest_1.expect)(visibleProfiles).toHaveLength(1);
      (0, vitest_1.expect)(visibleProfiles[0].textContent).toContain('Zsh');
    });
    (0, vitest_1.it)('should be case-insensitive', () => {
      profileSelector.show(mockProfiles);
      const filterInput = container.querySelector('.profile-filter');
      filterInput.value = 'POWERSHELL';
      filterInput.dispatchEvent(new jsdom.window.Event('input', { bubbles: true }));
      const visibleProfiles = container.querySelectorAll('.profile-item');
      (0, vitest_1.expect)(visibleProfiles).toHaveLength(1);
      (0, vitest_1.expect)(visibleProfiles[0].textContent).toContain('PowerShell');
    });
    (0, vitest_1.it)('should show "no results" message when no profiles match', () => {
      profileSelector.show(mockProfiles);
      const filterInput = container.querySelector('.profile-filter');
      filterInput.value = 'nonexistent';
      filterInput.dispatchEvent(new jsdom.window.Event('input', { bubbles: true }));
      const noResults = container.querySelector('.profile-no-results');
      (0, vitest_1.expect)(noResults).not.toBeNull();
      (0, vitest_1.expect)(noResults?.textContent).toBe('No profiles found');
    });
    (0, vitest_1.it)('should focus filter input when shown', () => {
      const focusSpy = vitest_1.vi.fn();
      const filterInput = container.querySelector('.profile-filter');
      filterInput.focus = focusSpy;
      profileSelector.show(mockProfiles);
      (0, vitest_1.expect)(focusSpy).toHaveBeenCalledTimes(1);
    });
  });
  (0, vitest_1.describe)('Keyboard Navigation', () => {
    (0, vitest_1.it)('should close on Escape key', () => {
      profileSelector.show(mockProfiles);
      const escapeEvent = new jsdom.window.KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      container.dispatchEvent(escapeEvent);
      (0, vitest_1.expect)(profileSelector.isVisible).toBe(false);
    });
    (0, vitest_1.it)('should confirm selection on Enter key', () => {
      const onProfileSelected = vitest_1.vi.fn();
      profileSelector.show(mockProfiles, 'bash', onProfileSelected);
      const enterEvent = new jsdom.window.KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
      });
      container.dispatchEvent(enterEvent);
      (0, vitest_1.expect)(onProfileSelected).toHaveBeenCalledTimes(1);
      (0, vitest_1.expect)(onProfileSelected).toHaveBeenCalledWith('bash');
    });
    (0, vitest_1.it)('should navigate down with ArrowDown key', () => {
      profileSelector.show(mockProfiles, 'bash');
      const arrowDownEvent = new jsdom.window.KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
      });
      container.dispatchEvent(arrowDownEvent);
      const zshProfile = Array.from(container.querySelectorAll('.profile-item')).find((item) =>
        item.textContent?.includes('Zsh')
      );
      (0, vitest_1.expect)(zshProfile?.classList.contains('selected')).toBe(true);
    });
    (0, vitest_1.it)('should navigate up with ArrowUp key', () => {
      profileSelector.show(mockProfiles, 'zsh');
      const arrowUpEvent = new jsdom.window.KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
      });
      container.dispatchEvent(arrowUpEvent);
      const bashProfile = Array.from(container.querySelectorAll('.profile-item')).find((item) =>
        item.textContent?.includes('Bash')
      );
      (0, vitest_1.expect)(bashProfile?.classList.contains('selected')).toBe(true);
    });
    (0, vitest_1.it)('should wrap around when navigating past last item', () => {
      profileSelector.show(mockProfiles, 'powershell');
      const arrowDownEvent = new jsdom.window.KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
      });
      container.dispatchEvent(arrowDownEvent);
      const bashProfile = Array.from(container.querySelectorAll('.profile-item')).find((item) =>
        item.textContent?.includes('Bash')
      );
      (0, vitest_1.expect)(bashProfile?.classList.contains('selected')).toBe(true);
    });
    (0, vitest_1.it)('should wrap around when navigating past first item', () => {
      profileSelector.show(mockProfiles, 'bash');
      const arrowUpEvent = new jsdom.window.KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
      });
      container.dispatchEvent(arrowUpEvent);
      const powershellProfile = Array.from(container.querySelectorAll('.profile-item')).find(
        (item) => item.textContent?.includes('PowerShell')
      );
      (0, vitest_1.expect)(powershellProfile?.classList.contains('selected')).toBe(true);
    });
  });
  (0, vitest_1.describe)('Button Actions', () => {
    (0, vitest_1.it)('should close on close button click', () => {
      profileSelector.show(mockProfiles);
      const closeBtn = container.querySelector('.profile-selector-close');
      closeBtn.click();
      (0, vitest_1.expect)(profileSelector.isVisible).toBe(false);
    });
    (0, vitest_1.it)('should close on cancel button click', () => {
      profileSelector.show(mockProfiles);
      const cancelBtn = container.querySelector('.profile-selector-cancel');
      cancelBtn.click();
      (0, vitest_1.expect)(profileSelector.isVisible).toBe(false);
    });
    (0, vitest_1.it)('should close on overlay click', () => {
      profileSelector.show(mockProfiles);
      const overlay = container.querySelector('.profile-selector-overlay');
      const clickEvent = new jsdom.window.MouseEvent('click', {
        bubbles: true,
      });
      Object.defineProperty(clickEvent, 'target', {
        value: overlay,
        writable: false,
      });
      overlay.dispatchEvent(clickEvent);
      (0, vitest_1.expect)(profileSelector.isVisible).toBe(false);
    });
    (0, vitest_1.it)('should not close when clicking dialog content', () => {
      profileSelector.show(mockProfiles);
      const dialog = container.querySelector('.profile-selector-dialog');
      const clickEvent = new jsdom.window.MouseEvent('click', {
        bubbles: true,
      });
      dialog.dispatchEvent(clickEvent);
      (0, vitest_1.expect)(profileSelector.isVisible).toBe(true);
    });
    (0, vitest_1.it)('should have disabled confirm button when no selection', () => {
      profileSelector.show(mockProfiles);
      const confirmBtn = container.querySelector('.profile-selector-confirm');
      (0, vitest_1.expect)(confirmBtn.disabled).toBe(true);
    });
  });
  (0, vitest_1.describe)('Update Profiles', () => {
    (0, vitest_1.it)('should update profile list when visible', () => {
      profileSelector.show(mockProfiles);
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
      profileSelector.updateProfiles(newProfiles);
      const profileItems = container.querySelectorAll('.profile-item');
      (0, vitest_1.expect)(profileItems).toHaveLength(1);
      (0, vitest_1.expect)(profileItems[0].textContent).toContain('Command Prompt');
    });
    (0, vitest_1.it)('should not update when hidden', () => {
      profileSelector.show(mockProfiles);
      profileSelector.hide();
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
      profileSelector.updateProfiles(newProfiles);
      // Should still show old profiles when re-shown
      profileSelector.show(mockProfiles);
      const profileItems = container.querySelectorAll('.profile-item');
      (0, vitest_1.expect)(profileItems).toHaveLength(3);
    });
  });
  (0, vitest_1.describe)('Edge Cases', () => {
    (0, vitest_1.it)('should handle empty profile list', () => {
      profileSelector.show([]);
      const noResults = container.querySelector('.profile-no-results');
      (0, vitest_1.expect)(noResults).not.toBeNull();
      (0, vitest_1.expect)(noResults?.textContent).toBe('No profiles available');
    });
    (0, vitest_1.it)('should handle profile without description', () => {
      const profilesWithoutDesc = [
        {
          id: 'bash',
          name: 'Bash',
          path: '/bin/bash',
          icon: 'terminal-bash',
          isDefault: true,
          args: [],
        },
      ];
      profileSelector.show(profilesWithoutDesc);
      const description = container.querySelector('.profile-item-description');
      (0, vitest_1.expect)(description?.textContent?.trim()).toBe('/bin/bash');
    });
    (0, vitest_1.it)('should escape HTML in profile names', () => {
      const maliciousProfiles = [
        {
          id: 'malicious',
          name: '<script>alert("XSS")</script>',
          path: '/bin/bash',
          description: '<img src=x onerror=alert(1)>',
          icon: 'terminal-bash',
          isDefault: true,
          args: [],
        },
      ];
      profileSelector.show(maliciousProfiles);
      const profileName = container.querySelector('.profile-item-name');
      (0, vitest_1.expect)(profileName?.innerHTML).not.toContain('<script>');
      (0, vitest_1.expect)(profileName?.textContent).toContain('<script>');
    });
  });
  (0, vitest_1.describe)('Disposal', () => {
    (0, vitest_1.it)('should clean up resources on dispose', () => {
      profileSelector.show(mockProfiles);
      profileSelector.dispose();
      (0, vitest_1.expect)(container.innerHTML).toBe('');
    });
    (0, vitest_1.it)('should not add duplicate styles', () => {
      const selector1 = new ProfileSelector_1.ProfileSelector(container);
      const selector2 = new ProfileSelector_1.ProfileSelector(container);
      const styleElements = document.querySelectorAll('#profile-selector-styles');
      (0, vitest_1.expect)(styleElements).toHaveLength(1);
      selector1.dispose();
      selector2.dispose();
    });
  });
});
//# sourceMappingURL=ProfileSelector.test.js.map
