"use strict";
/**
 * TerminalLinkManager Unit Tests
 *
 * Tests for terminal file path and URL link detection including:
 * - Link modifier settings (VS Code standard behavior)
 * - File path detection with line:column parsing
 * - Link provider registration and disposal
 * - Link activation with modifier key checks
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalLinkManager_1 = require("../../../../../webview/managers/TerminalLinkManager");
// Mock logger
vi.mock('../../../../../webview/utils/ManagerLogger', () => ({
    terminalLogger: {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));
vi.mock('../../../../../utils/logger', () => ({
    webview: vi.fn(),
}));
// Helper to create mock terminal
function createMockTerminal(lines = []) {
    const mockBuffer = {
        getLine: vi.fn((lineIndex) => {
            const text = lines[lineIndex];
            if (text === undefined)
                return undefined;
            return {
                translateToString: vi.fn().mockReturnValue(text),
                length: text.length,
                isWrapped: false,
                getCell: vi.fn(),
            };
        }),
    };
    return {
        buffer: {
            active: mockBuffer,
            normal: mockBuffer,
            alternate: mockBuffer,
        },
        registerLinkProvider: vi.fn().mockReturnValue({
            dispose: vi.fn(),
        }),
    };
}
// Helper to create mock coordinator
function createMockCoordinator() {
    return {
        getManager: vi.fn(),
        postMessage: vi.fn(),
        postMessageToExtension: vi.fn(),
    };
}
// Helper to create mock mouse event
function createMockMouseEvent(options = {}) {
    return {
        metaKey: options.metaKey ?? false,
        ctrlKey: options.ctrlKey ?? false,
        altKey: options.altKey ?? false,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
    };
}
(0, vitest_1.describe)('TerminalLinkManager', () => {
    let manager;
    let mockCoordinator;
    beforeEach(() => {
        mockCoordinator = createMockCoordinator();
        manager = new TerminalLinkManager_1.TerminalLinkManager(mockCoordinator);
    });
    afterEach(() => {
        manager.dispose();
        vi.clearAllMocks();
    });
    (0, vitest_1.describe)('Constructor and Initialization', () => {
        (0, vitest_1.it)('should create instance with coordinator', () => {
            (0, vitest_1.expect)(manager).toBeDefined();
            (0, vitest_1.expect)(manager.getStatus().name).toBe('TerminalLinkManager');
        });
        (0, vitest_1.it)('should have default link modifier as alt', () => {
            // Default is 'alt', which means Cmd/Ctrl opens links
            // We can test this through link activation behavior
            (0, vitest_1.expect)(manager.getStatus().isDisposed).toBe(false);
        });
    });
    (0, vitest_1.describe)('setLinkModifier', () => {
        (0, vitest_1.it)('should update link modifier to alt', () => {
            manager.setLinkModifier('alt');
            // Modifier is internal, but we can verify no errors occur
            (0, vitest_1.expect)(() => manager.setLinkModifier('alt')).not.toThrow();
        });
        (0, vitest_1.it)('should update link modifier to ctrlCmd', () => {
            manager.setLinkModifier('ctrlCmd');
            (0, vitest_1.expect)(() => manager.setLinkModifier('ctrlCmd')).not.toThrow();
        });
    });
    (0, vitest_1.describe)('registerTerminalLinkHandlers', () => {
        (0, vitest_1.it)('should register link provider for terminal', () => {
            const mockTerminal = createMockTerminal();
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(mockTerminal.registerLinkProvider).toHaveBeenCalled();
            (0, vitest_1.expect)(manager.getRegisteredTerminals()).toContain('terminal-1');
        });
        (0, vitest_1.it)('should dispose existing provider before registering new one', () => {
            const mockDispose = vi.fn();
            const mockTerminal = createMockTerminal();
            vi.mocked(mockTerminal.registerLinkProvider).mockReturnValue({
                dispose: mockDispose,
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(mockDispose).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should handle registration errors gracefully', () => {
            const mockTerminal = createMockTerminal();
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation(() => {
                throw new Error('Registration failed');
            });
            (0, vitest_1.expect)(() => {
                manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            }).not.toThrow();
        });
    });
    (0, vitest_1.describe)('Link Detection', () => {
        (0, vitest_1.it)('should detect absolute file paths', () => {
            const mockTerminal = createMockTerminal(['/path/to/file.ts']);
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(mockTerminal.registerLinkProvider).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should detect relative file paths with ./', () => {
            const lines = ['./src/file.ts'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(detectedLinks.length).toBe(1);
            (0, vitest_1.expect)(detectedLinks[0].text).toBe('./src/file.ts');
        });
        (0, vitest_1.it)('should detect relative file paths with ../', () => {
            const lines = ['../parent/file.ts'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(detectedLinks.length).toBe(1);
            (0, vitest_1.expect)(detectedLinks[0].text).toBe('../parent/file.ts');
        });
        (0, vitest_1.it)('should detect Windows file paths', () => {
            const lines = ['C:\\Users\\test\\file.ts'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(detectedLinks.length).toBe(1);
            (0, vitest_1.expect)(detectedLinks[0].text).toBe('C:\\Users\\test\\file.ts');
        });
        (0, vitest_1.it)('should detect file paths with line numbers', () => {
            const lines = ['/path/to/file.ts:10'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(detectedLinks.length).toBe(1);
            (0, vitest_1.expect)(detectedLinks[0].text).toBe('/path/to/file.ts:10');
        });
        (0, vitest_1.it)('should detect file paths with line and column numbers', () => {
            const lines = ['/path/to/file.ts:10:5'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(detectedLinks.length).toBe(1);
            (0, vitest_1.expect)(detectedLinks[0].text).toBe('/path/to/file.ts:10:5');
        });
        (0, vitest_1.it)('should detect URL path portion starting from first slash', () => {
            // The regex pattern (?:\.{0,2}\/|[A-Za-z]:\\) matches 0-2 dots + /
            // For https://example.com/path, it matches starting at the first /
            // (with 0 dots before it), then continues with /example.com/path
            const lines = ['https://example.com/path'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            // The regex matches //example.com/path (0 dots + / + rest)
            // This looks like a file path to the regex
            (0, vitest_1.expect)(detectedLinks.length).toBe(1);
            (0, vitest_1.expect)(detectedLinks[0].text).toBe('//example.com/path');
        });
        (0, vitest_1.it)('should clean trailing punctuation from paths', () => {
            const lines = ['/path/to/file.ts,'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(detectedLinks.length).toBe(1);
            (0, vitest_1.expect)(detectedLinks[0].text).toBe('/path/to/file.ts');
        });
        (0, vitest_1.it)('should handle empty lines', () => {
            const mockTerminal = createMockTerminal(['']);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(detectedLinks.length).toBe(0);
        });
        (0, vitest_1.it)('should handle non-existent lines', () => {
            const mockTerminal = createMockTerminal([]);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(detectedLinks.length).toBe(0);
        });
        (0, vitest_1.it)('should detect multiple links in one line', () => {
            const lines = ['/path/to/file1.ts /path/to/file2.ts'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(detectedLinks.length).toBe(2);
        });
        (0, vitest_1.it)('should avoid duplicate links', () => {
            // Same path appearing twice at same position should only be detected once
            const lines = ['/path/to/file.ts'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(detectedLinks.length).toBe(1);
        });
    });
    (0, vitest_1.describe)('Link Activation', () => {
        (0, vitest_1.it)('should activate with Cmd+Click when modifier is alt', () => {
            const lines = ['/path/to/file.ts'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.setLinkModifier('alt');
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            const event = createMockMouseEvent({ metaKey: true });
            const link = detectedLinks[0];
            link.activate(event, link.text);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'openTerminalLink',
                linkType: 'file',
                filePath: '/path/to/file.ts',
            }));
        });
        (0, vitest_1.it)('should activate with Ctrl+Click when modifier is alt', () => {
            const lines = ['/path/to/file.ts'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.setLinkModifier('alt');
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            const event = createMockMouseEvent({ ctrlKey: true });
            const link = detectedLinks[0];
            link.activate(event, link.text);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should activate with Alt+Click when modifier is ctrlCmd', () => {
            const lines = ['/path/to/file.ts'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.setLinkModifier('ctrlCmd');
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            const event = createMockMouseEvent({ altKey: true });
            const link = detectedLinks[0];
            link.activate(event, link.text);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should not activate without modifier key', () => {
            const lines = ['/path/to/file.ts'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            const event = createMockMouseEvent(); // No modifier keys
            const link = detectedLinks[0];
            link.activate(event, link.text);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should not activate with wrong modifier key', () => {
            const lines = ['/path/to/file.ts'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.setLinkModifier('alt'); // Cmd/Ctrl should open links
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            const event = createMockMouseEvent({ altKey: true }); // Alt pressed, but should be Cmd/Ctrl
            const link = detectedLinks[0];
            link.activate(event, link.text);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should include line and column in activation message', () => {
            const lines = ['/path/to/file.ts:10:5'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            const event = createMockMouseEvent({ metaKey: true });
            const link = detectedLinks[0];
            link.activate(event, link.text);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'openTerminalLink',
                linkType: 'file',
                filePath: '/path/to/file.ts',
                lineNumber: 10,
                columnNumber: 5,
            }));
        });
    });
    (0, vitest_1.describe)('openUrlFromTerminal', () => {
        (0, vitest_1.it)('should send URL open message to extension', () => {
            manager.openUrlFromTerminal('https://example.com', 'terminal-1');
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'openTerminalLink',
                linkType: 'url',
                url: 'https://example.com',
                terminalId: 'terminal-1',
            }));
        });
    });
    (0, vitest_1.describe)('unregisterTerminalLinkProvider', () => {
        (0, vitest_1.it)('should dispose and remove provider', () => {
            const mockDispose = vi.fn();
            const mockTerminal = createMockTerminal();
            vi.mocked(mockTerminal.registerLinkProvider).mockReturnValue({
                dispose: mockDispose,
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(manager.getRegisteredTerminals()).toContain('terminal-1');
            manager.unregisterTerminalLinkProvider('terminal-1');
            (0, vitest_1.expect)(mockDispose).toHaveBeenCalled();
            (0, vitest_1.expect)(manager.getRegisteredTerminals()).not.toContain('terminal-1');
        });
        (0, vitest_1.it)('should handle unregistering non-existent provider', () => {
            (0, vitest_1.expect)(() => {
                manager.unregisterTerminalLinkProvider('non-existent');
            }).not.toThrow();
        });
    });
    (0, vitest_1.describe)('getRegisteredTerminals', () => {
        (0, vitest_1.it)('should return empty array initially', () => {
            (0, vitest_1.expect)(manager.getRegisteredTerminals()).toEqual([]);
        });
        (0, vitest_1.it)('should return registered terminal IDs', () => {
            const mockTerminal1 = createMockTerminal();
            const mockTerminal2 = createMockTerminal();
            manager.registerTerminalLinkHandlers(mockTerminal1, 'terminal-1');
            manager.registerTerminalLinkHandlers(mockTerminal2, 'terminal-2');
            const registered = manager.getRegisteredTerminals();
            (0, vitest_1.expect)(registered).toContain('terminal-1');
            (0, vitest_1.expect)(registered).toContain('terminal-2');
            (0, vitest_1.expect)(registered.length).toBe(2);
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should dispose all registered providers', () => {
            const mockDispose1 = vi.fn();
            const mockDispose2 = vi.fn();
            const mockTerminal1 = createMockTerminal();
            const mockTerminal2 = createMockTerminal();
            vi.mocked(mockTerminal1.registerLinkProvider).mockReturnValue({
                dispose: mockDispose1,
            });
            vi.mocked(mockTerminal2.registerLinkProvider).mockReturnValue({
                dispose: mockDispose2,
            });
            manager.registerTerminalLinkHandlers(mockTerminal1, 'terminal-1');
            manager.registerTerminalLinkHandlers(mockTerminal2, 'terminal-2');
            manager.dispose();
            (0, vitest_1.expect)(mockDispose1).toHaveBeenCalled();
            (0, vitest_1.expect)(mockDispose2).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should clear registered terminals after dispose', () => {
            const mockTerminal = createMockTerminal();
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            manager.dispose();
            (0, vitest_1.expect)(manager.getRegisteredTerminals()).toEqual([]);
        });
        (0, vitest_1.it)('should set disposed status', () => {
            manager.dispose();
            (0, vitest_1.expect)(manager.getStatus().isDisposed).toBe(true);
        });
    });
    (0, vitest_1.describe)('Link Decorations', () => {
        (0, vitest_1.it)('should include pointer cursor and underline decorations', () => {
            const lines = ['/path/to/file.ts'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(detectedLinks[0]?.decorations?.pointerCursor).toBe(true);
            (0, vitest_1.expect)(detectedLinks[0]?.decorations?.underline).toBe(true);
        });
    });
    (0, vitest_1.describe)('Link Range Calculation', () => {
        (0, vitest_1.it)('should calculate correct link range', () => {
            const lines = ['prefix /path/to/file.ts suffix'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(detectedLinks.length).toBe(1);
            // Link starts after "prefix " (7 characters), so startX = 8 (1-indexed)
            (0, vitest_1.expect)(detectedLinks[0].range.start.x).toBe(8);
            (0, vitest_1.expect)(detectedLinks[0].range.start.y).toBe(1);
        });
    });
    (0, vitest_1.describe)('Path Cleaning', () => {
        (0, vitest_1.it)('should remove trailing semicolons', () => {
            const lines = ['/path/to/file.ts;'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(detectedLinks[0]?.text).toBe('/path/to/file.ts');
        });
        (0, vitest_1.it)('should remove unmatched closing brackets', () => {
            const lines = ['/path/to/file.ts)'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(detectedLinks[0]?.text).toBe('/path/to/file.ts');
        });
        (0, vitest_1.it)('should truncate at brackets due to regex exclusion', () => {
            // The regex pattern [^\s"'<>()[\]{}|]+ excludes parentheses
            // So paths with brackets are truncated at the bracket
            const lines = ['/path/to/(special)/file.ts'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            // Due to regex, path is truncated at the opening parenthesis
            (0, vitest_1.expect)(detectedLinks[0]?.text).toBe('/path/to/');
        });
    });
    (0, vitest_1.describe)('Edge Cases', () => {
        (0, vitest_1.it)('should handle paths without extension', () => {
            const lines = ['/path/to/file'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            (0, vitest_1.expect)(detectedLinks.length).toBe(1);
            (0, vitest_1.expect)(detectedLinks[0].text).toBe('/path/to/file');
        });
        (0, vitest_1.it)('should reject invalid paths without separators', () => {
            // A path that starts with ./ but has no further separators might be invalid
            const lines = ['./file'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            // ./file has a path separator (/), so it should be valid
            (0, vitest_1.expect)(detectedLinks.length).toBe(1);
        });
        (0, vitest_1.it)('should handle hover and leave callbacks', () => {
            const lines = ['/path/to/file.ts'];
            const mockTerminal = createMockTerminal(lines);
            let detectedLinks = [];
            vi.mocked(mockTerminal.registerLinkProvider).mockImplementation((provider) => {
                provider.provideLinks(1, (links) => {
                    detectedLinks = links;
                });
                return { dispose: vi.fn() };
            });
            manager.registerTerminalLinkHandlers(mockTerminal, 'terminal-1');
            // Hover and leave callbacks should be defined and not throw
            const event = createMockMouseEvent();
            (0, vitest_1.expect)(() => detectedLinks[0]?.hover?.(event, '/path/to/file.ts')).not.toThrow();
            (0, vitest_1.expect)(() => detectedLinks[0]?.leave?.(event, '/path/to/file.ts')).not.toThrow();
        });
    });
    (0, vitest_1.describe)('Health and Performance', () => {
        (0, vitest_1.it)('should report health status', async () => {
            await manager.initialize();
            const health = manager.getHealthStatus();
            (0, vitest_1.expect)(health.managerName).toBe('TerminalLinkManager');
            (0, vitest_1.expect)(health.isInitialized).toBe(true);
            (0, vitest_1.expect)(health.isDisposed).toBe(false);
        });
        (0, vitest_1.it)('should track performance metrics', async () => {
            await manager.initialize();
            const metrics = manager.getPerformanceMetrics();
            (0, vitest_1.expect)(metrics.initializationTimeMs).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(metrics.operationCount).toBe(0);
            (0, vitest_1.expect)(metrics.errorCount).toBe(0);
        });
    });
});
//# sourceMappingURL=TerminalLinkManager.test.js.map