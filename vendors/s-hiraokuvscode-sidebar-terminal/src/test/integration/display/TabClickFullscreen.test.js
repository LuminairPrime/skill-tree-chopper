"use strict";
/**
 * Tab Click Fullscreen Integration Tests
 * Issue #198: Integration test for tab click -> fullscreen display behavior
 */
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const sinon = require("sinon");
const jsdom_1 = require("jsdom");
const DisplayModeManager_1 = require("../../../webview/managers/DisplayModeManager");
const TerminalContainerManager_1 = require("../../../webview/managers/TerminalContainerManager");
const TerminalTabManager_1 = require("../../../webview/managers/TerminalTabManager");
const SplitManager_1 = require("../../../webview/managers/SplitManager");
(0, mocha_1.describe)('Tab Click Fullscreen Integration (Issue #198)', function () {
    let dom;
    let displayManager;
    let containerManager;
    let tabManager;
    let splitManager;
    let mockCoordinator;
    (0, mocha_1.beforeEach)(function () {
        // Set up DOM environment with terminal structure
        dom = new jsdom_1.JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="terminal-body">
            <div id="terminal-tabs-container"></div>
            <div id="terminal-container-1" class="terminal-container" data-terminal-id="1"></div>
            <div id="terminal-container-2" class="terminal-container" data-terminal-id="2"></div>
            <div id="terminal-container-3" class="terminal-container" data-terminal-id="3"></div>
          </div>
        </body>
      </html>
    `, { pretendToBeVisual: true });
        global.window = dom.window;
        global.document = dom.window.document;
        global.HTMLElement = dom.window.HTMLElement;
        // Create mock coordinator first (Issue #216)
        mockCoordinator = {
            getTerminalContainerManager: () => containerManager,
            getDisplayModeManager: () => displayManager,
            getSplitManager: () => splitManager,
            getManagers: () => ({
                header: {
                // Split button removed - empty interface
                },
                tabs: tabManager,
            }),
            setActiveTerminalId: sinon.stub(),
            postMessageToExtension: sinon.stub(),
            createTerminal: sinon.stub(),
            closeTerminal: sinon.stub(),
            splitManager: null, // Will be set after splitManager creation
        };
        // Create managers with constructor injection (Issue #216)
        containerManager = new TerminalContainerManager_1.TerminalContainerManager(mockCoordinator);
        displayManager = new DisplayModeManager_1.DisplayModeManager(mockCoordinator);
        splitManager = new SplitManager_1.SplitManager(mockCoordinator);
        tabManager = new TerminalTabManager_1.TerminalTabManager();
        // Update splitManager reference in coordinator
        mockCoordinator.splitManager = splitManager;
        // Set coordinators for remaining managers not yet migrated (Phase 6+)
        tabManager.setCoordinator(mockCoordinator);
        containerManager.initialize();
        displayManager.initialize();
        splitManager.initialize();
        tabManager.initialize();
        // Register containers
        containerManager.registerContainer('1', document.getElementById('terminal-container-1'));
        containerManager.registerContainer('2', document.getElementById('terminal-container-2'));
        containerManager.registerContainer('3', document.getElementById('terminal-container-3'));
        // Add tabs
        tabManager.addTab('1', 'Terminal 1');
        tabManager.addTab('2', 'Terminal 2');
        tabManager.addTab('3', 'Terminal 3');
        tabManager.setActiveTab('1');
    });
    (0, mocha_1.afterEach)(function () {
        tabManager.dispose();
        splitManager.dispose();
        displayManager.dispose();
        containerManager.dispose();
        dom.window.close();
        sinon.restore();
    });
    (0, mocha_1.describe)('Basic Tab Click to Fullscreen Flow', function () {
        (0, mocha_1.it)('should show fullscreen when clicking on inactive tab', function () {
            // Arrange - Tab 1 is active
            (0, chai_1.expect)(tabManager.getActiveTabId()).to.equal('1');
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('normal');
            // Act - Click on Tab 2
            tabManager.onTabClick('2');
            // Assert - Should switch to fullscreen mode showing Terminal 2
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('fullscreen');
            const snapshot = containerManager.getDisplaySnapshot();
            (0, chai_1.expect)(snapshot.visibleTerminals).to.deep.equal(['2']);
            const allTerminals = ['1', '2', '3'];
            const hiddenTerminals = allTerminals.filter((id) => !snapshot.visibleTerminals.includes(id));
            (0, chai_1.expect)(hiddenTerminals).to.have.members(['1', '3']);
        });
        (0, mocha_1.it)('should update active terminal when clicking tab', function () {
            // Act
            tabManager.onTabClick('3');
            // Assert
            (0, chai_1.expect)(mockCoordinator.setActiveTerminalId).to.have.been.calledWith('3');
            (0, chai_1.expect)(tabManager.getActiveTabId()).to.equal('3');
        });
        (0, mocha_1.it)('should hide other terminals when showing fullscreen', function () {
            // Act
            tabManager.onTabClick('2');
            // Assert
            (0, chai_1.expect)(displayManager.isTerminalVisible('2')).to.be.true;
            (0, chai_1.expect)(displayManager.isTerminalVisible('1')).to.be.false;
            (0, chai_1.expect)(displayManager.isTerminalVisible('3')).to.be.false;
        });
    });
    (0, mocha_1.describe)('Active Tab Click Toggle Behavior', function () {
        (0, mocha_1.it)('should toggle to split mode when clicking active tab in fullscreen', function () {
            // Arrange - Enter fullscreen mode with Tab 1
            tabManager.onTabClick('1');
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('fullscreen');
            // Act - Click active tab again (Tab 1 is already active)
            tabManager.onTabClick('1');
            // Assert - Should toggle to split mode
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('split');
            const snapshot = containerManager.getDisplaySnapshot();
            (0, chai_1.expect)(snapshot.visibleTerminals).to.have.length(3);
        });
        (0, mocha_1.it)('should not toggle when only one tab exists', function () {
            // Arrange - Remove tabs 2 and 3
            tabManager.removeTab('2');
            tabManager.removeTab('3');
            containerManager.unregisterContainer('2');
            containerManager.unregisterContainer('3');
            tabManager.onTabClick('1');
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('fullscreen');
            // Act - Click active tab again with only one tab
            tabManager.onTabClick('1');
            // Assert - Should stay in fullscreen (no toggle)
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('fullscreen');
        });
    });
    (0, mocha_1.describe)('Mode Transitions via Tab Clicks', function () {
        (0, mocha_1.it)('should transition normal -> fullscreen -> split -> normal', function () {
            // Start in normal mode
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('normal');
            // Click Tab 1 -> Fullscreen
            tabManager.onTabClick('1');
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('fullscreen');
            // Click Tab 1 again -> Split
            tabManager.onTabClick('1');
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('split');
            // Toggle split mode -> Normal
            displayManager.toggleSplitMode();
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('normal');
        });
        (0, mocha_1.it)('should handle rapid tab switching in fullscreen mode', function () {
            // Start in normal mode
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('normal');
            // Rapid clicks on different tabs
            tabManager.onTabClick('1');
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('fullscreen');
            tabManager.onTabClick('2');
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('fullscreen');
            (0, chai_1.expect)(displayManager.isTerminalVisible('2')).to.be.true;
            tabManager.onTabClick('3');
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('fullscreen');
            (0, chai_1.expect)(displayManager.isTerminalVisible('3')).to.be.true;
        });
        (0, mocha_1.it)('should exit split mode when clicking any tab in split mode', function () {
            // Arrange - Enter split mode
            displayManager.toggleSplitMode();
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('split');
            // Act - Click a tab
            tabManager.onTabClick('2');
            // Assert - Should go to fullscreen showing that tab
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('fullscreen');
            (0, chai_1.expect)(displayManager.isTerminalVisible('2')).to.be.true;
        });
    });
    (0, mocha_1.describe)('Container State Synchronization', function () {
        (0, mocha_1.it)('should apply correct CSS classes when entering fullscreen', function () {
            // Act
            tabManager.onTabClick('1');
            // Assert
            const container1 = document.getElementById('terminal-container-1');
            (0, chai_1.expect)(container1.classList.contains('terminal-container--fullscreen')).to.be.true;
        });
        (0, mocha_1.it)('should apply correct CSS classes in split mode', function () {
            // Act
            tabManager.onTabClick('1');
            tabManager.onTabClick('1'); // Toggle to split
            // Assert - all containers should have split class
            const containers = [
                document.getElementById('terminal-container-1'),
                document.getElementById('terminal-container-2'),
                document.getElementById('terminal-container-3'),
            ];
            containers.forEach((container) => {
                (0, chai_1.expect)(container.classList.contains('terminal-container--split')).to.be.true;
            });
        });
        (0, mocha_1.it)('should update container visibility correctly', function () {
            // Act - Show Terminal 2 fullscreen
            tabManager.onTabClick('2');
            // Assert
            const snapshot = containerManager.getDisplaySnapshot();
            (0, chai_1.expect)(snapshot.visibleTerminals).to.include('2');
            const allTerminals = ['1', '2', '3'];
            const hiddenTerminals = allTerminals.filter((id) => !snapshot.visibleTerminals.includes(id));
            (0, chai_1.expect)(hiddenTerminals).to.include('1');
            (0, chai_1.expect)(hiddenTerminals).to.include('3');
        });
    });
    (0, mocha_1.describe)('Split Manager Integration', function () {
        (0, mocha_1.it)('should exit split mode before entering fullscreen', function () {
            // Arrange - Enter split mode
            displayManager.toggleSplitMode();
            (0, chai_1.expect)(splitManager.isSplitMode).to.be.true;
            // Act - Click a tab to go fullscreen
            tabManager.onTabClick('1');
            // Assert - Split mode should be exited
            (0, chai_1.expect)(splitManager.isSplitMode).to.be.false;
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('fullscreen');
        });
        (0, mocha_1.it)('should prepare split mode when toggling from fullscreen', function () {
            // Arrange - Enter fullscreen
            tabManager.onTabClick('1');
            // Act - Click active tab to toggle split
            tabManager.onTabClick('1');
            // Assert - Split mode should be prepared
            (0, chai_1.expect)(splitManager.isSplitMode).to.be.true;
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('split');
        });
    });
    (0, mocha_1.describe)('Tab Manager Mode Indicator', function () {
        (0, mocha_1.it)('should update mode indicator when entering fullscreen', function () {
            // Arrange
            const updateSpy = sinon.spy(tabManager, 'updateModeIndicator');
            // Act
            tabManager.onTabClick('1');
            // Assert
            (0, chai_1.expect)(updateSpy).to.have.been.calledWith('fullscreen');
        });
        (0, mocha_1.it)('should update mode indicator when entering split mode', function () {
            // Arrange
            const updateSpy = sinon.spy(tabManager, 'updateModeIndicator');
            tabManager.onTabClick('1');
            // Act - Toggle to split
            tabManager.onTabClick('1');
            // Assert
            (0, chai_1.expect)(updateSpy).to.have.been.calledWith('split');
        });
    });
    (0, mocha_1.describe)('Edge Cases', function () {
        (0, mocha_1.it)('should handle clicking non-existent tab gracefully', function () {
            // Act & Assert - should not throw
            (0, chai_1.expect)(() => {
                tabManager.onTabClick('nonexistent');
            }).to.not.throw();
        });
        (0, mocha_1.it)('should handle missing display manager gracefully', function () {
            // Arrange
            mockCoordinator.getDisplayModeManager = () => null;
            // Act & Assert - should not throw
            (0, chai_1.expect)(() => {
                tabManager.onTabClick('1');
            }).to.not.throw();
        });
        (0, mocha_1.it)('should handle missing container manager gracefully', function () {
            // Arrange
            mockCoordinator.getTerminalContainerManager = () => null;
            // Act & Assert - should not throw
            (0, chai_1.expect)(() => {
                displayManager.showTerminalFullscreen('1');
            }).to.not.throw();
        });
        (0, mocha_1.it)('should maintain consistency when rapidly clicking tabs', function () {
            // Act - Rapid clicks
            for (let i = 0; i < 10; i++) {
                const tabId = String((i % 3) + 1);
                tabManager.onTabClick(tabId);
            }
            // Assert - Should still be in consistent state
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.be.oneOf(['fullscreen', 'split']);
            const activeTabId = tabManager.getActiveTabId();
            (0, chai_1.expect)(activeTabId).to.be.oneOf(['1', '2', '3']);
        });
    });
    (0, mocha_1.describe)('Full User Flow Simulation', function () {
        (0, mocha_1.it)('should handle complete user workflow: normal -> fullscreen -> split -> normal', function () {
            // Step 1: Start in normal mode with all terminals visible
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('normal');
            let snapshot = containerManager.getDisplaySnapshot();
            (0, chai_1.expect)(snapshot.visibleTerminals).to.have.length(3);
            // Step 2: Click Tab 2 to view it fullscreen
            tabManager.onTabClick('2');
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('fullscreen');
            snapshot = containerManager.getDisplaySnapshot();
            (0, chai_1.expect)(snapshot.visibleTerminals).to.deep.equal(['2']);
            // Step 3: Click Tab 2 again to see all terminals in split view
            tabManager.onTabClick('2');
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('split');
            snapshot = containerManager.getDisplaySnapshot();
            (0, chai_1.expect)(snapshot.visibleTerminals).to.have.length(3);
            // Step 4: Toggle split mode to return to normal
            displayManager.toggleSplitMode();
            (0, chai_1.expect)(displayManager.getCurrentMode()).to.equal('normal');
            snapshot = containerManager.getDisplaySnapshot();
            (0, chai_1.expect)(snapshot.visibleTerminals).to.have.length(3);
        });
        (0, mocha_1.it)('should handle switching between different terminals in fullscreen', function () {
            // Click Tab 1 -> Fullscreen Terminal 1
            tabManager.onTabClick('1');
            (0, chai_1.expect)(displayManager.isTerminalVisible('1')).to.be.true;
            (0, chai_1.expect)(displayManager.isTerminalVisible('2')).to.be.false;
            // Click Tab 2 -> Fullscreen Terminal 2
            tabManager.onTabClick('2');
            (0, chai_1.expect)(displayManager.isTerminalVisible('1')).to.be.false;
            (0, chai_1.expect)(displayManager.isTerminalVisible('2')).to.be.true;
            // Click Tab 3 -> Fullscreen Terminal 3
            tabManager.onTabClick('3');
            (0, chai_1.expect)(displayManager.isTerminalVisible('1')).to.be.false;
            (0, chai_1.expect)(displayManager.isTerminalVisible('2')).to.be.false;
            (0, chai_1.expect)(displayManager.isTerminalVisible('3')).to.be.true;
        });
    });
    (0, mocha_1.describe)('Performance', function () {
        (0, mocha_1.it)('should handle multiple tab clicks efficiently', function () {
            const startTime = Date.now();
            // Perform 50 tab clicks
            for (let i = 0; i < 50; i++) {
                const tabId = String((i % 3) + 1);
                tabManager.onTabClick(tabId);
            }
            const duration = Date.now() - startTime;
            // Should complete within reasonable time
            (0, chai_1.expect)(duration).to.be.lessThan(500);
        });
        (0, mocha_1.it)('should not leak memory during mode transitions', function () {
            // Arrange
            const initialContainerCount = containerManager.getAllContainers().size;
            // Act - Multiple transitions
            for (let i = 0; i < 20; i++) {
                tabManager.onTabClick('1'); // Fullscreen
                tabManager.onTabClick('1'); // Split
                displayManager.toggleSplitMode(); // Normal
            }
            // Assert - Container count should remain stable
            (0, chai_1.expect)(containerManager.getAllContainers().size).to.equal(initialContainerCount);
        });
    });
});
//# sourceMappingURL=TabClickFullscreen.test.js.map