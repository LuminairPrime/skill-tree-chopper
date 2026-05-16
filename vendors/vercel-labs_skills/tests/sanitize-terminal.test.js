"use strict";
/**
 * Unit tests for terminal escape sanitization (CWE-150 fix).
 *
 * These tests verify that untrusted metadata from SKILL.md frontmatter
 * and remote APIs cannot inject terminal escape sequences that could:
 * - Clear the screen
 * - Move the cursor
 * - Change the terminal window title
 * - Render attacker-controlled text as if it were legitimate CLI output
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const sanitize_ts_1 = require("../src/sanitize.ts");
(0, vitest_1.describe)('stripTerminalEscapes', () => {
    (0, vitest_1.describe)('CSI sequences (ESC[...)', () => {
        (0, vitest_1.it)('strips SGR color codes', () => {
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b[31mred text\x1b[0m')).toBe('red text');
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b[1;32mbold green\x1b[0m')).toBe('bold green');
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b[38;5;145mextended color\x1b[0m')).toBe('extended color');
        });
        (0, vitest_1.it)('strips cursor movement sequences', () => {
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b[H')).toBe(''); // cursor home
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b[5;10H')).toBe(''); // cursor to row 5, col 10
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b[A')).toBe(''); // cursor up
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b[10B')).toBe(''); // cursor down 10
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b[C')).toBe(''); // cursor forward
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b[D')).toBe(''); // cursor back
        });
        (0, vitest_1.it)('strips screen clear sequences', () => {
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b[2J')).toBe(''); // clear screen
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b[3J')).toBe(''); // clear screen + scrollback
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b[K')).toBe(''); // clear to end of line
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b[2K')).toBe(''); // clear entire line
        });
        (0, vitest_1.it)('strips scroll sequences', () => {
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b[S')).toBe(''); // scroll up
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b[T')).toBe(''); // scroll down
        });
    });
    (0, vitest_1.describe)('OSC sequences (ESC]...BEL/ST)', () => {
        (0, vitest_1.it)('strips window title changes (OSC 0)', () => {
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b]0;malicious title\x07')).toBe('');
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b]0;[POC] hijacked\x07rest')).toBe('rest');
        });
        (0, vitest_1.it)('strips OSC with ST terminator (ESC\\)', () => {
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b]0;title\x1b\\')).toBe('');
        });
        (0, vitest_1.it)('strips hyperlink sequences (OSC 8)', () => {
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b]8;;https://evil.com\x07click\x1b]8;;\x07')).toBe('click');
        });
    });
    (0, vitest_1.describe)('simple escape sequences', () => {
        (0, vitest_1.it)('strips save/restore cursor', () => {
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1b7text\x1b8')).toBe('text');
        });
        (0, vitest_1.it)('strips other two-byte escapes', () => {
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1bM')).toBe(''); // reverse index
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('\x1bc')).toBe(''); // reset terminal
        });
    });
    (0, vitest_1.describe)('control characters', () => {
        (0, vitest_1.it)('strips BEL character', () => {
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('hello\x07world')).toBe('helloworld');
        });
        (0, vitest_1.it)('strips backspace', () => {
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('hello\x08world')).toBe('helloworld');
        });
        (0, vitest_1.it)('strips carriage return', () => {
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('hello\rworld')).toBe('helloworld');
        });
        (0, vitest_1.it)('preserves tabs and newlines', () => {
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('hello\tworld')).toBe('hello\tworld');
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('hello\nworld')).toBe('hello\nworld');
        });
        (0, vitest_1.it)('strips null bytes', () => {
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('hello\x00world')).toBe('helloworld');
        });
    });
    (0, vitest_1.describe)('C1 control codes (8-bit)', () => {
        (0, vitest_1.it)('strips C1 control codes', () => {
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('hello\x9bworld')).toBe('helloworld');
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('hello\x9dworld')).toBe('helloworld');
        });
    });
    (0, vitest_1.describe)('preserves normal text', () => {
        (0, vitest_1.it)('leaves plain ASCII text unchanged', () => {
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('hello world')).toBe('hello world');
        });
        (0, vitest_1.it)('leaves unicode text unchanged', () => {
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('hello 日本語 world')).toBe('hello 日本語 world');
        });
        (0, vitest_1.it)('leaves emoji unchanged', () => {
            (0, vitest_1.expect)((0, sanitize_ts_1.stripTerminalEscapes)('hello 🎉 world')).toBe('hello 🎉 world');
        });
    });
    (0, vitest_1.describe)('real-world attack payloads', () => {
        (0, vitest_1.it)('strips the POC payload from the bug report', () => {
            const malicious = '\x1b]0;[POC] skills output hijacked\x07\x1b[3J\x1b[2J\x1b[H\x1b[31m[POC] Terminal output injected from SKILL.md\x1b[0m\n\x1b[33mThis cleared the screen and overwrote CLI output.\x1b[0m';
            const result = (0, sanitize_ts_1.stripTerminalEscapes)(malicious);
            (0, vitest_1.expect)(result).not.toContain('\x1b');
            (0, vitest_1.expect)(result).not.toContain('\x07');
            (0, vitest_1.expect)(result).toContain('[POC] Terminal output injected from SKILL.md');
            (0, vitest_1.expect)(result).toContain('This cleared the screen and overwrote CLI output.');
        });
        (0, vitest_1.it)('strips concealed text attack', () => {
            const malicious = 'safe-skill\x1b[8m(downloads malware)\x1b[0m';
            const result = (0, sanitize_ts_1.stripTerminalEscapes)(malicious);
            (0, vitest_1.expect)(result).toBe('safe-skill(downloads malware)');
        });
        (0, vitest_1.it)('strips screen clear + fake output', () => {
            const malicious = 'safe-skill\x1b[2J\x1b[H\x1b[32m✓ Verified Safe\x1b[0m';
            const result = (0, sanitize_ts_1.stripTerminalEscapes)(malicious);
            (0, vitest_1.expect)(result).toBe('safe-skill✓ Verified Safe');
        });
        (0, vitest_1.it)('strips combined title change + clear + cursor move + colored text', () => {
            const malicious = '\x1b]0;pwned\x07' + // change title
                '\x1b[3J' + // clear scrollback
                '\x1b[2J' + // clear screen
                '\x1b[H' + // cursor home
                '\x1b[32mFake output\x1b[0m'; // green text
            const result = (0, sanitize_ts_1.stripTerminalEscapes)(malicious);
            (0, vitest_1.expect)(result).toBe('Fake output');
            (0, vitest_1.expect)(result).not.toContain('\x1b');
        });
    });
});
(0, vitest_1.describe)('sanitizeMetadata', () => {
    (0, vitest_1.it)('strips escape sequences and trims', () => {
        (0, vitest_1.expect)((0, sanitize_ts_1.sanitizeMetadata)('  \x1b[31mhello\x1b[0m  ')).toBe('hello');
    });
    (0, vitest_1.it)('collapses newlines into spaces', () => {
        (0, vitest_1.expect)((0, sanitize_ts_1.sanitizeMetadata)('line1\nline2\nline3')).toBe('line1 line2 line3');
    });
    (0, vitest_1.it)('collapses carriage returns into spaces', () => {
        // CR is stripped as control char, then newline collapsed
        (0, vitest_1.expect)((0, sanitize_ts_1.sanitizeMetadata)('line1\r\nline2')).toBe('line1 line2');
    });
    (0, vitest_1.it)('handles the full POC payload', () => {
        const malicious = '\u001b]0;[POC] skills output hijacked\u0007\u001b[3J\u001b[2J\u001b[H\u001b[31m[POC] Terminal output injected from SKILL.md\u001b[0m\n\u001b[33mThis cleared the screen and overwrote CLI output.\u001b[0m';
        const result = (0, sanitize_ts_1.sanitizeMetadata)(malicious);
        (0, vitest_1.expect)(result).not.toContain('\x1b');
        (0, vitest_1.expect)(result).not.toContain('\x07');
        // Newline is collapsed to space
        (0, vitest_1.expect)(result).toBe('[POC] Terminal output injected from SKILL.md This cleared the screen and overwrote CLI output.');
    });
    (0, vitest_1.it)('handles normal skill names unchanged', () => {
        (0, vitest_1.expect)((0, sanitize_ts_1.sanitizeMetadata)('next-best-practices')).toBe('next-best-practices');
        (0, vitest_1.expect)((0, sanitize_ts_1.sanitizeMetadata)('AI SDK')).toBe('AI SDK');
        (0, vitest_1.expect)((0, sanitize_ts_1.sanitizeMetadata)('Creating Diagrams')).toBe('Creating Diagrams');
    });
    (0, vitest_1.it)('handles normal descriptions unchanged', () => {
        (0, vitest_1.expect)((0, sanitize_ts_1.sanitizeMetadata)('Build UIs with @nuxt/ui v4')).toBe('Build UIs with @nuxt/ui v4');
        (0, vitest_1.expect)((0, sanitize_ts_1.sanitizeMetadata)('Guide for implementing smooth, native-feeling animations')).toBe('Guide for implementing smooth, native-feeling animations');
    });
});
//# sourceMappingURL=sanitize-terminal.test.js.map