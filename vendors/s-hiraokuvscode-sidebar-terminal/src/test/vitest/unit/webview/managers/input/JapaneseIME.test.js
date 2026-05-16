"use strict";
/**
 * Japanese IME Input Handling TDD Test Suite
 * Following t-wada's TDD methodology for comprehensive Japanese IME testing
 * RED-GREEN-REFACTOR cycles with focus on complex Japanese input scenarios
 * Tests based on real-world Japanese IME behavior patterns
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const InputEventService_1 = require("../../../../../../webview/managers/input/services/InputEventService");
const InputStateManager_1 = require("../../../../../../webview/managers/input/services/InputStateManager");
// Japanese IME test data representing real input scenarios
const JAPANESE_IME_TEST_DATA = {
    // Hiragana input: "konnichiwa" -> "こんにちは"
    konnichiwa: {
        input: ['k', 'o', 'n', 'n', 'i', 'c', 'h', 'i', 'w', 'a'],
        composition: ['k', 'ko', 'kon', 'konn', 'konni', 'konnichi', 'konnichiw', 'konnichiwa'],
        result: 'こんにちは',
    },
    // Kanji conversion: "nihon" -> "日本"
    nihon: {
        input: ['n', 'i', 'h', 'o', 'n'],
        composition: ['n', 'ni', 'nih', 'niho', 'nihon'],
        intermediate: 'にほん',
        candidates: ['日本', 'ニホン', 'にほん', '二本', '弐本'],
        result: '日本',
    },
    // Complex phrase: "kyou wa ii tenki desu ne" -> "今日はいい天気ですね"
    phrase: {
        input: 'kyou wa ii tenki desu ne'.split(''),
        segments: [
            { romaji: 'kyou', hiragana: 'きょう', kanji: '今日' },
            { romaji: 'wa', hiragana: 'は', kanji: 'は' },
            { romaji: 'ii', hiragana: 'いい', kanji: 'いい' },
            { romaji: 'tenki', hiragana: 'てんき', kanji: '天気' },
            { romaji: 'desu', hiragana: 'です', kanji: 'です' },
            { romaji: 'ne', hiragana: 'ね', kanji: 'ね' },
        ],
        result: '今日はいい天気ですね',
    },
};
// Mock Japanese IME behavior
class MockJapaneseIME {
    constructor(eventService, stateManager, element) {
        this.currentComposition = '';
        this.isComposing = false;
        this.eventService = eventService;
        this.stateManager = stateManager;
        this.element = element;
        this.setupIMEEventHandling();
    }
    setupIMEEventHandling() {
        this.eventService.registerEventHandler('ime-keydown', this.element, 'keydown', this.handleKeyDown.bind(this), { debounce: false });
        this.eventService.registerEventHandler('ime-compositionstart', this.element, 'compositionstart', this.handleCompositionStart.bind(this), { debounce: false });
        this.eventService.registerEventHandler('ime-compositionupdate', this.element, 'compositionupdate', this.handleCompositionUpdate.bind(this), { debounce: false });
        this.eventService.registerEventHandler('ime-compositionend', this.element, 'compositionend', this.handleCompositionEnd.bind(this), { debounce: false });
    }
    handleKeyDown(event) {
        const keyEvent = event;
        // Handle IME mode switching (typically Alt+~ on Windows)
        if (keyEvent.altKey && keyEvent.key === '~') {
            this.toggleIMEMode();
        }
    }
    handleCompositionStart(event) {
        const compEvent = event;
        this.isComposing = true;
        this.currentComposition = compEvent.data || '';
        this.stateManager.updateIMEState({
            isActive: true,
            data: this.currentComposition,
            startOffset: 0,
            endOffset: this.currentComposition.length,
            lastEvent: 'start',
            timestamp: Date.now(),
        });
    }
    handleCompositionUpdate(event) {
        const compEvent = event;
        if (this.isComposing) {
            this.currentComposition = compEvent.data || '';
            this.stateManager.updateIMEState({
                data: this.currentComposition,
                endOffset: this.currentComposition.length,
                lastEvent: 'update',
                timestamp: Date.now(),
            });
        }
    }
    handleCompositionEnd(event) {
        const compEvent = event;
        this.currentComposition = compEvent.data || '';
        this.isComposing = false;
        this.stateManager.updateIMEState({
            isActive: false,
            data: this.currentComposition,
            endOffset: this.currentComposition.length,
            lastEvent: 'end',
            timestamp: Date.now(),
        });
    }
    toggleIMEMode() {
        // Simulate IME mode toggle
        const imeState = this.stateManager.getStateSection('ime');
        if (imeState.isActive) {
            // Force composition end
            this.dispatchCompositionEvent('compositionend', this.currentComposition);
        }
    }
    // Helper to dispatch composition events with correct data property
    dispatchCompositionEvent(type, data) {
        const event = new CompositionEvent(type, { data });
        // Force data property if not correctly set by constructor (common in some DOM mocks)
        if (event.data !== data) {
            Object.defineProperty(event, 'data', { value: data });
        }
        this.element.dispatchEvent(event);
    }
    // Simulate Japanese input sequence
    simulateJapaneseInput(sequence, finalText) {
        // Start composition
        this.dispatchCompositionEvent('compositionstart', sequence[0] || '');
        // Simulate incremental composition updates
        for (let i = 1; i < sequence.length; i++) {
            // @ts-expect-error - test mock type
            this.dispatchCompositionEvent('compositionupdate', sequence[i]);
        }
        // End composition with final result
        this.dispatchCompositionEvent('compositionend', finalText);
    }
    getCurrentComposition() {
        return this.currentComposition;
    }
    isCurrentlyComposing() {
        return this.isComposing;
    }
}
(0, vitest_1.describe)('Japanese IME Input Handling TDD Test Suite', () => {
    let inputElement;
    let eventService;
    let stateManager;
    let japaneseIME;
    let logMessages;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        // Set up DOM elements in the existing environment
        document.body.innerHTML = `
      <input type="text" id="japanese-input" lang="ja" />
      <div id="terminal" contenteditable="true" lang="ja"></div>
    `;
        // Setup input element
        inputElement = document.getElementById('japanese-input');
        // Setup services
        logMessages = [];
        const mockLogger = (message) => {
            logMessages.push(message);
        };
        eventService = new InputEventService_1.InputEventService(mockLogger);
        stateManager = new InputStateManager_1.InputStateManager(mockLogger);
        // Setup Japanese IME mock
        japaneseIME = new MockJapaneseIME(eventService, stateManager, inputElement);
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.useRealTimers();
        eventService?.dispose();
        stateManager?.dispose();
        document.body.innerHTML = '';
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('TDD Red Phase: Basic Japanese IME Composition', () => {
        (0, vitest_1.describe)('Hiragana Input Processing', () => {
            (0, vitest_1.it)('should handle basic hiragana composition sequence', () => {
                const testData = JAPANESE_IME_TEST_DATA.konnichiwa;
                // Act: Simulate "konnichiwa" input
                japaneseIME.simulateJapaneseInput(testData.composition, testData.result);
                // Assert: Final IME state should be correct
                const imeState = stateManager.getStateSection('ime');
                (0, vitest_1.expect)(imeState.isActive).toBe(false);
                (0, vitest_1.expect)(imeState.data).toBe(testData.result);
                (0, vitest_1.expect)(imeState.lastEvent).toBe('end');
                // Assert: All composition events should be processed
                const metrics = eventService.getGlobalMetrics();
                (0, vitest_1.expect)(metrics.totalProcessed).toBeGreaterThan(testData.composition.length);
            });
            (0, vitest_1.it)('should track composition progress through hiragana input', () => {
                const _testData = JAPANESE_IME_TEST_DATA.konnichiwa;
                const stateChanges = [];
                // Arrange: Track IME state changes
                stateManager.addStateListener('ime', (newState, _previousState) => {
                    stateChanges.push({
                        data: newState.data,
                        isActive: newState.isActive,
                        lastEvent: newState.lastEvent,
                    });
                });
                // Act: Simulate step-by-step composition
                japaneseIME.dispatchCompositionEvent('compositionstart', 'k');
                japaneseIME.dispatchCompositionEvent('compositionupdate', 'ko');
                japaneseIME.dispatchCompositionEvent('compositionupdate', 'kon');
                japaneseIME.dispatchCompositionEvent('compositionend', 'こん');
                // Assert: Should track each composition stage
                (0, vitest_1.expect)(stateChanges.length).toBe(4); // start + 2 updates + end
                (0, vitest_1.expect)(stateChanges[0].data).toBe('k');
                (0, vitest_1.expect)(stateChanges[0].isActive).toBe(true);
                (0, vitest_1.expect)(stateChanges[0].lastEvent).toBe('start');
                (0, vitest_1.expect)(stateChanges[1].data).toBe('ko');
                (0, vitest_1.expect)(stateChanges[1].lastEvent).toBe('update');
                (0, vitest_1.expect)(stateChanges[3].data).toBe('こん');
                (0, vitest_1.expect)(stateChanges[3].isActive).toBe(false);
                (0, vitest_1.expect)(stateChanges[3].lastEvent).toBe('end');
            });
            (0, vitest_1.it)('should handle composition cancellation during hiragana input', () => {
                // Act: Start composition and cancel
                japaneseIME.dispatchCompositionEvent('compositionstart', 'konni');
                japaneseIME.dispatchCompositionEvent('compositionupdate', 'konnichiwa');
                // Cancel composition (empty result)
                japaneseIME.dispatchCompositionEvent('compositionend', '');
                // Assert: Should handle cancellation gracefully
                const imeState = stateManager.getStateSection('ime');
                (0, vitest_1.expect)(imeState.isActive).toBe(false);
                (0, vitest_1.expect)(imeState.data).toBe('');
                (0, vitest_1.expect)(imeState.lastEvent).toBe('end');
            });
        });
        (0, vitest_1.describe)('Kanji Conversion Processing', () => {
            (0, vitest_1.it)('should handle kanji conversion from hiragana', () => {
                const testData = JAPANESE_IME_TEST_DATA.nihon;
                // Act: Simulate hiragana to kanji conversion
                // First phase: romaji to hiragana
                japaneseIME.dispatchCompositionEvent('compositionstart', 'n');
                testData.composition.forEach((stage, index) => {
                    if (index > 0) {
                        japaneseIME.dispatchCompositionEvent('compositionupdate', stage);
                    }
                });
                // Intermediate state: hiragana before conversion
                japaneseIME.dispatchCompositionEvent('compositionupdate', testData.intermediate);
                // Final conversion to kanji
                japaneseIME.dispatchCompositionEvent('compositionend', testData.result);
                // Assert: Final result should be kanji
                const imeState = stateManager.getStateSection('ime');
                (0, vitest_1.expect)(imeState.data).toBe(testData.result);
                (0, vitest_1.expect)(imeState.isActive).toBe(false);
            });
            (0, vitest_1.it)('should maintain composition state during kanji candidate selection', () => {
                const testData = JAPANESE_IME_TEST_DATA.nihon;
                const stateHistory = [];
                // Arrange: Track all state changes
                stateManager.addStateListener('ime', (newState) => {
                    stateHistory.push({
                        data: newState.data,
                        timestamp: newState.timestamp,
                        isActive: newState.isActive,
                    });
                });
                // Act: Simulate extended kanji selection process
                japaneseIME.dispatchCompositionEvent('compositionstart', 'nihon');
                // Show hiragana intermediate
                japaneseIME.dispatchCompositionEvent('compositionupdate', testData.intermediate);
                // Simulate candidate selection (multiple updates)
                testData.candidates.forEach((candidate, _index) => {
                    vitest_1.vi.advanceTimersByTime(100); // Time between candidate changes
                    japaneseIME.dispatchCompositionEvent('compositionupdate', candidate);
                });
                // Final selection
                japaneseIME.dispatchCompositionEvent('compositionend', testData.result);
                // Assert: Should track all candidate changes
                (0, vitest_1.expect)(stateHistory.length).toBeGreaterThan(testData.candidates.length);
                // Assert: Should maintain active state throughout selection
                const activeStates = stateHistory.filter((state) => state.isActive);
                (0, vitest_1.expect)(activeStates.length).toBeGreaterThan(0);
                // Assert: Final state should be correct
                const finalState = stateHistory[stateHistory.length - 1];
                (0, vitest_1.expect)(finalState.data).toBe(testData.result);
                (0, vitest_1.expect)(finalState.isActive).toBe(false);
            });
            (0, vitest_1.it)('should handle kanji candidate selection abandonment', () => {
                const testData = JAPANESE_IME_TEST_DATA.nihon;
                // Act: Start kanji conversion process
                japaneseIME.dispatchCompositionEvent('compositionstart', 'nihon');
                japaneseIME.dispatchCompositionEvent('compositionupdate', testData.intermediate);
                // Show some kanji candidates
                japaneseIME.dispatchCompositionEvent('compositionupdate', '日本');
                // User decides to abandon kanji and stick with hiragana
                japaneseIME.dispatchCompositionEvent('compositionend', testData.intermediate);
                // Assert: Should handle abandonment gracefully
                const imeState = stateManager.getStateSection('ime');
                (0, vitest_1.expect)(imeState.data).toBe(testData.intermediate);
                (0, vitest_1.expect)(imeState.isActive).toBe(false);
                (0, vitest_1.expect)(imeState.lastEvent).toBe('end');
            });
        });
    });
    (0, vitest_1.describe)('TDD Red Phase: Complex Japanese Input Scenarios', () => {
        (0, vitest_1.describe)('Multi-Segment Phrase Input', () => {
            (0, vitest_1.it)('should handle complex phrase with multiple conversions', () => {
                const testData = JAPANESE_IME_TEST_DATA.phrase;
                // Act: Simulate complex phrase input
                japaneseIME.dispatchCompositionEvent('compositionstart', 'k');
                // Simulate incremental building of the entire phrase
                const romajiPhrase = testData.segments.map((seg) => seg.romaji).join(' ');
                let currentComposition = '';
                for (let i = 0; i < romajiPhrase.length; i++) {
                    currentComposition += romajiPhrase[i];
                    japaneseIME.dispatchCompositionEvent('compositionupdate', currentComposition);
                }
                // Convert to hiragana
                const hiraganaPhrase = testData.segments.map((seg) => seg.hiragana).join('');
                japaneseIME.dispatchCompositionEvent('compositionupdate', hiraganaPhrase);
                // Final kanji conversion
                japaneseIME.dispatchCompositionEvent('compositionend', testData.result);
                // Assert: Should handle complex phrase correctly
                const imeState = stateManager.getStateSection('ime');
                (0, vitest_1.expect)(imeState.data).toBe(testData.result);
                (0, vitest_1.expect)(imeState.isActive).toBe(false);
                // Assert: Should have processed many composition events
                const metrics = eventService.getGlobalMetrics();
                (0, vitest_1.expect)(metrics.totalProcessed).toBeGreaterThan(romajiPhrase.length);
            });
            (0, vitest_1.it)('should handle partial phrase conversion with mixed results', () => {
                // Act: Simulate partial conversion where some words become kanji, others remain hiragana
                japaneseIME.dispatchCompositionEvent('compositionstart', 'kyouwaii');
                // Convert first part to kanji
                japaneseIME.dispatchCompositionEvent('compositionupdate', '今日はいい');
                // Add more text
                japaneseIME.dispatchCompositionEvent('compositionupdate', '今日はいいてんき');
                // Final mixed result
                japaneseIME.dispatchCompositionEvent('compositionend', '今日はいい天気');
                // Assert: Should handle mixed conversion results
                const imeState = stateManager.getStateSection('ime');
                (0, vitest_1.expect)(imeState.data).toBe('今日はいい天気');
                (0, vitest_1.expect)(imeState.isActive).toBe(false);
            });
            (0, vitest_1.it)('should track composition boundaries in multi-segment input', () => {
                const compositionStages = [];
                // Arrange: Track all composition data changes
                stateManager.addStateListener('ime', (newState) => {
                    if (newState.data && newState.data !== '') {
                        compositionStages.push(newState.data);
                    }
                });
                // Act: Simulate step-by-step phrase building
                const stages = [
                    'k',
                    'ky',
                    'kyo',
                    'kyou',
                    'kyou ',
                    'kyou w',
                    'kyou wa',
                    'きょう は',
                    '今日 は',
                    '今日は',
                ];
                // @ts-expect-error - test mock type
                japaneseIME.dispatchCompositionEvent('compositionstart', stages[0]);
                stages.slice(1).forEach((stage) => {
                    japaneseIME.dispatchCompositionEvent('compositionupdate', stage);
                });
                japaneseIME.dispatchCompositionEvent('compositionend', '今日は');
                // Assert: Should track all intermediate stages
                (0, vitest_1.expect)(compositionStages.length).toBeGreaterThan(stages.length);
                (0, vitest_1.expect)(compositionStages[0]).toBe('k');
                (0, vitest_1.expect)(compositionStages[compositionStages.length - 1]).toBe('今日は');
            });
        });
        (0, vitest_1.describe)('IME Mode Switching', () => {
            (0, vitest_1.it)('should handle IME mode toggle during composition', () => {
                // Act: Start composition
                japaneseIME.dispatchCompositionEvent('compositionstart', 'test');
                (0, vitest_1.expect)(stateManager.getStateSection('ime').isActive).toBe(true);
                // Act: Simulate IME mode toggle (Alt+~)
                const altTildeEvent = new KeyboardEvent('keydown', {
                    key: '~',
                    altKey: true,
                });
                inputElement.dispatchEvent(altTildeEvent);
                // Should force composition end
                // (Mock IME will dispatch compositionend)
                // Assert: IME should be deactivated
                const imeState = stateManager.getStateSection('ime');
                (0, vitest_1.expect)(imeState.isActive).toBe(false);
                (0, vitest_1.expect)(imeState.lastEvent).toBe('end');
            });
            (0, vitest_1.it)('should handle rapid IME mode switching', () => {
                // Act: Rapid mode switching
                for (let i = 0; i < 5; i++) {
                    // Start composition
                    japaneseIME.dispatchCompositionEvent('compositionstart', `test${i}`);
                    // Toggle IME mode
                    const toggleEvent = new KeyboardEvent('keydown', {
                        key: '~',
                        altKey: true,
                    });
                    inputElement.dispatchEvent(toggleEvent);
                    vitest_1.vi.advanceTimersByTime(10);
                }
                // Assert: Should handle rapid switching gracefully
                const imeState = stateManager.getStateSection('ime');
                (0, vitest_1.expect)(imeState.isActive).toBe(false);
                // Assert: No errors should occur
                const errorLogs = logMessages.filter((msg) => msg.toLowerCase().includes('error'));
                (0, vitest_1.expect)(errorLogs.length).toBe(0);
            });
        });
    });
    (0, vitest_1.describe)('TDD Red Phase: IME State Validation for Japanese Input', () => {
        (0, vitest_1.describe)('Japanese-Specific State Validation', () => {
            (0, vitest_1.it)('should validate Japanese character composition data', () => {
                // Act: Update IME state with Japanese characters
                stateManager.updateIMEState({
                    isActive: true,
                    data: 'こんにちは',
                    startOffset: 0,
                    endOffset: 5, // 5 Japanese characters
                    lastEvent: 'update',
                    timestamp: Date.now(),
                });
                // Assert: Should validate without errors
                const warningLogs = logMessages.filter((msg) => msg.includes('State validation warnings'));
                (0, vitest_1.expect)(warningLogs.length).toBe(0);
            });
            (0, vitest_1.it)('should handle mixed romaji and Japanese character validation', () => {
                // Act: Update with mixed composition data (typical during conversion)
                stateManager.updateIMEState({
                    isActive: true,
                    data: 'konこん', // Mixed romaji and hiragana
                    startOffset: 0,
                    endOffset: 6,
                    lastEvent: 'update',
                    timestamp: Date.now(),
                });
                // Assert: Should handle mixed content without validation errors
                const errorLogs = logMessages.filter((msg) => msg.includes('State validation errors'));
                (0, vitest_1.expect)(errorLogs.length).toBe(0);
            });
            (0, vitest_1.it)('should validate composition boundaries for multi-byte characters', () => {
                // Act: Test various Japanese character boundary scenarios
                const testCases = [
                    { data: 'あ', startOffset: 0, endOffset: 1 },
                    { data: 'あいう', startOffset: 0, endOffset: 3 },
                    { data: '今日', startOffset: 0, endOffset: 2 },
                    { data: 'ひらがな漢字', startOffset: 0, endOffset: 6 },
                ];
                testCases.forEach((testCase, index) => {
                    stateManager.updateIMEState({
                        isActive: true,
                        data: testCase.data,
                        startOffset: testCase.startOffset,
                        endOffset: testCase.endOffset,
                        lastEvent: 'update',
                        timestamp: Date.now() + index,
                    });
                });
                // Assert: All should validate correctly
                const errorLogs = logMessages.filter((msg) => msg.includes('State validation errors'));
                (0, vitest_1.expect)(errorLogs.length).toBe(0);
            });
        });
        (0, vitest_1.describe)('IME Composition Lifecycle Validation', () => {
            (0, vitest_1.it)('should validate complete Japanese IME composition lifecycle', () => {
                const stateChanges = [];
                // Arrange: Track state changes for validation
                stateManager.addStateListener('ime', (newState, previousState) => {
                    stateChanges.push({
                        from: previousState.lastEvent,
                        to: newState.lastEvent,
                        isActive: newState.isActive,
                        hasData: newState.data.length > 0,
                    });
                });
                // Act: Complete Japanese input lifecycle
                stateManager.updateIMEState({
                    isActive: true,
                    data: 'k',
                    lastEvent: 'start',
                    timestamp: Date.now(),
                });
                stateManager.updateIMEState({
                    data: 'ko',
                    lastEvent: 'update',
                    timestamp: Date.now() + 1,
                });
                stateManager.updateIMEState({
                    data: 'こ',
                    lastEvent: 'update',
                    timestamp: Date.now() + 2,
                });
                stateManager.updateIMEState({
                    isActive: false,
                    data: 'こ',
                    lastEvent: 'end',
                    timestamp: Date.now() + 3,
                });
                // Assert: Should have proper lifecycle progression
                (0, vitest_1.expect)(stateChanges.length).toBe(4);
                (0, vitest_1.expect)(stateChanges[0].to).toBe('start');
                (0, vitest_1.expect)(stateChanges[1].to).toBe('update');
                (0, vitest_1.expect)(stateChanges[3].to).toBe('end');
                (0, vitest_1.expect)(stateChanges[3].isActive).toBe(false);
                // Assert: No validation errors during lifecycle
                const errorLogs = logMessages.filter((msg) => msg.includes('State validation errors'));
                (0, vitest_1.expect)(errorLogs.length).toBe(0);
            });
            (0, vitest_1.it)('should detect and warn about abnormal IME state transitions', () => {
                // Act: Abnormal transition - end without start
                stateManager.updateIMEState({
                    isActive: false,
                    data: 'unexpected',
                    lastEvent: 'end',
                    timestamp: Date.now(),
                });
                // Act: Another abnormal transition - active but no data and not start
                stateManager.updateIMEState({
                    isActive: true,
                    data: '',
                    lastEvent: 'update', // Update without start
                    timestamp: Date.now() + 1,
                });
                // Assert: Should generate validation warnings
                const warningLogs = logMessages.filter((msg) => msg.includes('State validation warnings'));
                (0, vitest_1.expect)(warningLogs.length).toBeGreaterThan(0);
            });
        });
    });
    (0, vitest_1.describe)('TDD Red Phase: Performance and Edge Cases', () => {
        (0, vitest_1.describe)('High-Frequency Japanese Input', () => {
            (0, vitest_1.it)('should handle rapid Japanese composition updates efficiently', () => {
                const startTime = Date.now();
                // Act: Simulate very rapid Japanese typing
                japaneseIME.dispatchCompositionEvent('compositionstart', 'a');
                // Generate rapid composition updates (typical for fast Japanese typing)
                const rapidSequence = [
                    'a',
                    'ar',
                    'ari',
                    'arig',
                    'ariga',
                    'arigas',
                    'arigat',
                    'arigato',
                    'arigatos',
                    'ありが',
                    'ありがと',
                    'ありがとうご',
                    'ありがとうございま',
                    'ありがとうございます',
                ];
                rapidSequence.forEach((stage, _index) => {
                    japaneseIME.dispatchCompositionEvent('compositionupdate', stage);
                    vitest_1.vi.advanceTimersByTime(1); // Minimal time between updates
                });
                japaneseIME.dispatchCompositionEvent('compositionend', 'ありがとうございます');
                const endTime = Date.now();
                // Assert: Should process all events efficiently
                const metrics = eventService.getGlobalMetrics();
                (0, vitest_1.expect)(metrics.totalProcessed).toBe(rapidSequence.length + 2); // +2 for start and end
                // Assert: Processing should be reasonably fast
                (0, vitest_1.expect)(endTime - startTime).toBeLessThan(1000);
                // Assert: Final state should be correct
                const imeState = stateManager.getStateSection('ime');
                (0, vitest_1.expect)(imeState.data).toBe('ありがとうございます');
                (0, vitest_1.expect)(imeState.isActive).toBe(false);
            });
            (0, vitest_1.it)('should maintain accuracy under high-frequency updates', () => {
                let updateCount = 0;
                const allUpdates = [];
                // Arrange: Track every single update
                stateManager.addStateListener('ime', (newState) => {
                    updateCount++;
                    if (newState.data) {
                        allUpdates.push(newState.data);
                    }
                });
                // Act: Generate many rapid updates
                japaneseIME.dispatchCompositionEvent('compositionstart', 'n');
                for (let i = 1; i <= 100; i++) {
                    const data = 'n'.repeat(i % 10) + 'ih' + 'o'.repeat(i % 5);
                    japaneseIME.dispatchCompositionEvent('compositionupdate', data);
                }
                japaneseIME.dispatchCompositionEvent('compositionend', '日本語入力テスト');
                // Assert: Should track all updates accurately
                (0, vitest_1.expect)(updateCount).toBe(102); // 1 start + 100 updates + 1 end
                (0, vitest_1.expect)(allUpdates.length).toBeGreaterThan(100);
                (0, vitest_1.expect)(allUpdates[allUpdates.length - 1]).toBe('日本語入力テスト');
            });
        });
        (0, vitest_1.describe)('Edge Cases in Japanese IME', () => {
            (0, vitest_1.it)('should handle empty composition data gracefully', () => {
                // Act: Various empty data scenarios
                japaneseIME.dispatchCompositionEvent('compositionstart', '');
                japaneseIME.dispatchCompositionEvent('compositionupdate', '');
                japaneseIME.dispatchCompositionEvent('compositionend', '');
                // Assert: Should handle empty data without errors
                const imeState = stateManager.getStateSection('ime');
                (0, vitest_1.expect)(imeState.isActive).toBe(false);
                (0, vitest_1.expect)(imeState.data).toBe('');
                const errorLogs = logMessages.filter((msg) => msg.toLowerCase().includes('error'));
                (0, vitest_1.expect)(errorLogs.length).toBe(0);
            });
            (0, vitest_1.it)('should handle very long Japanese composition strings', () => {
                // Arrange: Create very long Japanese composition
                const longJapaneseText = 'これは非常に長い日本語の文章です。'.repeat(100); // 50 repetitions
                // Act: Process long composition
                japaneseIME.dispatchCompositionEvent('compositionstart', 'k');
                japaneseIME.dispatchCompositionEvent('compositionupdate', longJapaneseText);
                japaneseIME.dispatchCompositionEvent('compositionend', longJapaneseText);
                // Assert: Should handle long text without issues
                const imeState = stateManager.getStateSection('ime');
                (0, vitest_1.expect)(imeState.data).toBe(longJapaneseText);
                (0, vitest_1.expect)(imeState.data.length).toBeGreaterThan(1000);
                (0, vitest_1.expect)(imeState.isActive).toBe(false);
            });
            (0, vitest_1.it)('should handle special Japanese punctuation and symbols', () => {
                // Act: Test various Japanese punctuation
                const specialCharacters = [
                    '。',
                    '、',
                    '？',
                    '！',
                    '「',
                    '」',
                    '『',
                    '』',
                    '（',
                    '）',
                    '・',
                    '〜',
                    '：',
                    '；',
                    '※',
                    '§',
                ];
                specialCharacters.forEach((char, _index) => {
                    japaneseIME.dispatchCompositionEvent('compositionstart', char);
                    japaneseIME.dispatchCompositionEvent('compositionend', char);
                    // Verify each character is handled
                    const imeState = stateManager.getStateSection('ime');
                    (0, vitest_1.expect)(imeState.data).toBe(char);
                });
                // Assert: All special characters processed
                const metrics = eventService.getGlobalMetrics();
                (0, vitest_1.expect)(metrics.totalProcessed).toBe(specialCharacters.length * 2);
            });
            (0, vitest_1.it)('should handle corrupted composition events gracefully', () => {
                // Act: Simulate corrupted/malformed events
                try {
                    // Null data
                    japaneseIME.dispatchCompositionEvent('compositionstart', null);
                    // Undefined data
                    japaneseIME.dispatchCompositionEvent('compositionupdate', undefined);
                    // Very unusual data
                    japaneseIME.dispatchCompositionEvent('compositionend', '\uFEFF\u200B\u200C'); // Zero-width characters
                }
                catch (error) {
                    // Should not throw errors
                }
                // Assert: Should handle corrupted events gracefully
                const errorLogs = logMessages.filter((msg) => msg.toLowerCase().includes('error'));
                (0, vitest_1.expect)(errorLogs.length).toBe(0);
                // Should maintain stable state
                const imeState = stateManager.getStateSection('ime');
                (0, vitest_1.expect)(imeState.isActive).toBe(false);
            });
        });
        (0, vitest_1.describe)('Memory Management for Japanese IME', () => {
            (0, vitest_1.it)('should manage memory efficiently with long Japanese input sessions', () => {
                // Act: Simulate extended Japanese input session
                for (let session = 0; session < 10; session++) {
                    for (let phrase = 0; phrase < 20; phrase++) {
                        japaneseIME.dispatchCompositionEvent('compositionstart', 'test');
                        // Simulate complex phrase
                        for (let stage = 0; stage < 15; stage++) {
                            japaneseIME.dispatchCompositionEvent('compositionupdate', `日本語テスト${session}${phrase}${stage}`);
                        }
                        japaneseIME.dispatchCompositionEvent('compositionend', `日本語テスト完了${session}${phrase}`);
                    }
                }
                // Assert: Should process all events without memory issues
                const metrics = eventService.getGlobalMetrics();
                (0, vitest_1.expect)(metrics.totalProcessed).toBeGreaterThan(3000); // 10*20*15 + overhead
                // Assert: State history should be managed (not growing unbounded)
                const history = stateManager.getStateHistory(200);
                (0, vitest_1.expect)(history.length).toBeLessThanOrEqual(100); // Should be capped
                // Assert: No memory-related errors
                const errorLogs = logMessages.filter((msg) => msg.toLowerCase().includes('memory') || msg.toLowerCase().includes('error'));
                (0, vitest_1.expect)(errorLogs.length).toBe(0);
            });
        });
    });
});
//# sourceMappingURL=JapaneseIME.test.js.map