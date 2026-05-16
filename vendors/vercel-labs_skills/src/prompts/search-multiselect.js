"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelSymbol = void 0;
exports.approxStringWidth = approxStringWidth;
exports.visualRowsForLine = visualRowsForLine;
exports.countVisualRowsForLines = countVisualRowsForLines;
exports.searchMultiselect = searchMultiselect;
const readline = require("readline");
const node_util_1 = require("node:util");
const stream_1 = require("stream");
const picocolors_1 = require("picocolors");
// Silent writable stream to prevent readline from echoing input
const silentOutput = new stream_1.Writable({
    write(_chunk, _encoding, callback) {
        callback();
    },
});
const S_STEP_ACTIVE = picocolors_1.default.green('◆');
const S_STEP_CANCEL = picocolors_1.default.red('■');
const S_STEP_SUBMIT = picocolors_1.default.green('◇');
const S_RADIO_ACTIVE = picocolors_1.default.green('●');
const S_RADIO_INACTIVE = picocolors_1.default.dim('○');
const S_CHECKBOX_LOCKED = picocolors_1.default.green('✓');
const S_BULLET = picocolors_1.default.green('•');
const S_BAR = picocolors_1.default.dim('│');
const S_BAR_H = picocolors_1.default.dim('─');
exports.cancelSymbol = Symbol('cancel');
/**
 * Approximate terminal display width (cells) for a string with no ANSI sequences.
 * Matches common East Asian / emoji double-width behavior used by modern terminals.
 */
function approxStringWidth(plain) {
    let width = 0;
    for (const ch of plain) {
        const code = ch.codePointAt(0);
        if (code === 0)
            continue;
        const wide = (code >= 0x1100 && code <= 0x115f) ||
            (code >= 0x231a && code <= 0x231b) ||
            (code >= 0x2329 && code <= 0x232a) ||
            (code >= 0x23e9 && code <= 0x23ec) ||
            code === 0x23f0 ||
            code === 0x23f3 ||
            (code >= 0x25fd && code <= 0x25fe) ||
            (code >= 0x2614 && code <= 0x2615) ||
            (code >= 0x2648 && code <= 0x2653) ||
            (code >= 0x267f && code <= 0x267f) ||
            (code >= 0x2693 && code <= 0x2693) ||
            (code >= 0x26a1 && code <= 0x26a1) ||
            (code >= 0x26aa && code <= 0x26ab) ||
            (code >= 0x26bd && code <= 0x26be) ||
            (code >= 0x26c4 && code <= 0x26c5) ||
            (code >= 0x26ce && code <= 0x26ce) ||
            (code >= 0x26d4 && code <= 0x26d4) ||
            (code >= 0x26ea && code <= 0x26ea) ||
            (code >= 0x26f2 && code <= 0x26f3) ||
            (code >= 0x26f5 && code <= 0x26f5) ||
            (code >= 0x26fa && code <= 0x26fa) ||
            (code >= 0x26fd && code <= 0x26fd) ||
            (code >= 0x2705 && code <= 0x2705) ||
            (code >= 0x270a && code <= 0x270b) ||
            (code >= 0x2728 && code <= 0x2728) ||
            (code >= 0x274c && code <= 0x274c) ||
            (code >= 0x274e && code <= 0x274e) ||
            (code >= 0x2753 && code <= 0x2755) ||
            (code >= 0x2757 && code <= 0x2757) ||
            (code >= 0x2795 && code <= 0x2797) ||
            (code >= 0x27b0 && code <= 0x27b0) ||
            (code >= 0x27bf && code <= 0x27bf) ||
            (code >= 0x2b1b && code <= 0x2b1c) ||
            (code >= 0x2b50 && code <= 0x2b50) ||
            (code >= 0x2b55 && code <= 0x2b55) ||
            (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f) ||
            (code >= 0xa960 && code <= 0xa97c) ||
            (code >= 0xac00 && code <= 0xd7a3) ||
            (code >= 0xf900 && code <= 0xfaff) ||
            (code >= 0xfe10 && code <= 0xfe19) ||
            (code >= 0xfe30 && code <= 0xfe6f) ||
            (code >= 0xff00 && code <= 0xff60) ||
            (code >= 0xffe0 && code <= 0xffe6) ||
            (code >= 0x1f000 && code <= 0x1f9ff);
        width += wide ? 2 : 1;
    }
    return width;
}
/**
 * How many physical terminal rows one logical line occupies after soft-wrapping.
 */
function visualRowsForLine(line, columns) {
    const plain = (0, node_util_1.stripVTControlCharacters)(line);
    const cols = Math.max(1, columns);
    const w = approxStringWidth(plain);
    return Math.max(1, Math.ceil(w / cols));
}
/**
 * Total physical rows for a block of logical lines (used to erase/redraw TUI output).
 */
function countVisualRowsForLines(lines, columns) {
    const cols = columns !== undefined && columns > 0
        ? columns
        : process.stdout.columns && process.stdout.columns > 0
            ? process.stdout.columns
            : 80;
    return lines.reduce((sum, line) => sum + visualRowsForLine(line, cols), 0);
}
/**
 * Interactive search multiselect prompt.
 * Allows users to filter a long list by typing and select multiple items.
 * Optionally supports a "locked" section that displays always-selected items.
 */
async function searchMultiselect(options) {
    const { message, items, maxVisible = 8, initialSelected = [], required = false, lockedSection, } = options;
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: silentOutput,
            terminal: false,
        });
        // Enable raw mode for keypress detection
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }
        readline.emitKeypressEvents(process.stdin, rl);
        let query = '';
        let cursor = 0;
        const selected = new Set(initialSelected);
        let lastRenderHeight = 0;
        // Locked items are always included in the result
        const lockedValues = lockedSection ? lockedSection.items.map((i) => i.value) : [];
        const filter = (item, q) => {
            if (!q)
                return true;
            const lowerQ = q.toLowerCase();
            return (item.label.toLowerCase().includes(lowerQ) ||
                String(item.value).toLowerCase().includes(lowerQ));
        };
        const getFiltered = () => {
            return items.filter((item) => filter(item, query));
        };
        const clearRender = () => {
            if (lastRenderHeight > 0) {
                // Move up and clear each line
                process.stdout.write(`\x1b[${lastRenderHeight}A`);
                for (let i = 0; i < lastRenderHeight; i++) {
                    process.stdout.write('\x1b[2K\x1b[1B');
                }
                process.stdout.write(`\x1b[${lastRenderHeight}A`);
            }
        };
        const render = (state = 'active') => {
            clearRender();
            const lines = [];
            const filtered = getFiltered();
            // Header
            const icon = state === 'active' ? S_STEP_ACTIVE : state === 'cancel' ? S_STEP_CANCEL : S_STEP_SUBMIT;
            lines.push(`${icon}  ${picocolors_1.default.bold(message)}`);
            if (state === 'active') {
                // Locked section (universal agents)
                if (lockedSection && lockedSection.items.length > 0) {
                    lines.push(`${S_BAR}`);
                    const lockedTitle = `${picocolors_1.default.bold(lockedSection.title)} ${picocolors_1.default.dim('── always included')}`;
                    lines.push(`${S_BAR}  ${S_BAR_H}${S_BAR_H} ${lockedTitle} ${S_BAR_H.repeat(12)}`);
                    for (const item of lockedSection.items) {
                        lines.push(`${S_BAR}    ${S_BULLET} ${picocolors_1.default.bold(item.label)}`);
                    }
                    lines.push(`${S_BAR}`);
                    lines.push(`${S_BAR}  ${S_BAR_H}${S_BAR_H} ${picocolors_1.default.bold('Additional agents')} ${S_BAR_H.repeat(29)}`);
                }
                // Search input
                const searchLine = `${S_BAR}  ${picocolors_1.default.dim('Search:')} ${query}${picocolors_1.default.inverse(' ')}`;
                lines.push(searchLine);
                // Hint
                lines.push(`${S_BAR}  ${picocolors_1.default.dim('↑↓ move, space select, enter confirm')}`);
                lines.push(`${S_BAR}`);
                // Items
                const visibleStart = Math.max(0, Math.min(cursor - Math.floor(maxVisible / 2), filtered.length - maxVisible));
                const visibleEnd = Math.min(filtered.length, visibleStart + maxVisible);
                const visibleItems = filtered.slice(visibleStart, visibleEnd);
                if (filtered.length === 0) {
                    lines.push(`${S_BAR}  ${picocolors_1.default.dim('No matches found')}`);
                }
                else {
                    for (let i = 0; i < visibleItems.length; i++) {
                        const item = visibleItems[i];
                        const actualIndex = visibleStart + i;
                        const isSelected = selected.has(item.value);
                        const isCursor = actualIndex === cursor;
                        const radio = isSelected ? S_RADIO_ACTIVE : S_RADIO_INACTIVE;
                        const label = isCursor ? picocolors_1.default.underline(item.label) : item.label;
                        const hint = item.hint ? picocolors_1.default.dim(` (${item.hint})`) : '';
                        const prefix = isCursor ? picocolors_1.default.cyan('❯') : ' ';
                        lines.push(`${S_BAR} ${prefix} ${radio} ${label}${hint}`);
                    }
                    // Show count if more items
                    const hiddenBefore = visibleStart;
                    const hiddenAfter = filtered.length - visibleEnd;
                    if (hiddenBefore > 0 || hiddenAfter > 0) {
                        const parts = [];
                        if (hiddenBefore > 0)
                            parts.push(`↑ ${hiddenBefore} more`);
                        if (hiddenAfter > 0)
                            parts.push(`↓ ${hiddenAfter} more`);
                        lines.push(`${S_BAR}  ${picocolors_1.default.dim(parts.join('  '))}`);
                    }
                }
                // Selected summary (include locked items)
                lines.push(`${S_BAR}`);
                const allSelectedLabels = [
                    ...(lockedSection ? lockedSection.items.map((i) => i.label) : []),
                    ...items.filter((item) => selected.has(item.value)).map((item) => item.label),
                ];
                if (allSelectedLabels.length === 0) {
                    lines.push(`${S_BAR}  ${picocolors_1.default.dim('Selected: (none)')}`);
                }
                else {
                    const summary = allSelectedLabels.length <= 3
                        ? allSelectedLabels.join(', ')
                        : `${allSelectedLabels.slice(0, 3).join(', ')} +${allSelectedLabels.length - 3} more`;
                    lines.push(`${S_BAR}  ${picocolors_1.default.green('Selected:')} ${summary}`);
                }
                lines.push(`${picocolors_1.default.dim('└')}`);
            }
            else if (state === 'submit') {
                // Final state - show what was selected (including locked)
                const allSelectedLabels = [
                    ...(lockedSection ? lockedSection.items.map((i) => i.label) : []),
                    ...items.filter((item) => selected.has(item.value)).map((item) => item.label),
                ];
                lines.push(`${S_BAR}  ${picocolors_1.default.dim(allSelectedLabels.join(', '))}`);
            }
            else if (state === 'cancel') {
                lines.push(`${S_BAR}  ${picocolors_1.default.strikethrough(picocolors_1.default.dim('Cancelled'))}`);
            }
            process.stdout.write(lines.join('\n') + '\n');
            // Use wrapped row count: logical lines can span multiple terminal rows when hints
            // or labels exceed column width. Using lines.length alone under-counts and breaks
            // clearRender(), causing the prompt to re-print hundreds of times on each redraw.
            lastRenderHeight = countVisualRowsForLines(lines, process.stdout.columns);
        };
        const cleanup = () => {
            process.stdin.removeListener('keypress', keypressHandler);
            if (process.stdin.isTTY) {
                process.stdin.setRawMode(false);
            }
            rl.close();
        };
        const submit = () => {
            // If required and no locked items, don't allow submitting with no selection
            if (required && selected.size === 0 && lockedValues.length === 0) {
                return;
            }
            render('submit');
            cleanup();
            // Include locked values in the result
            resolve([...lockedValues, ...Array.from(selected)]);
        };
        const cancel = () => {
            render('cancel');
            cleanup();
            resolve(exports.cancelSymbol);
        };
        // Handle keypresses
        const keypressHandler = (_str, key) => {
            if (!key)
                return;
            const filtered = getFiltered();
            if (key.name === 'return') {
                submit();
                return;
            }
            if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
                cancel();
                return;
            }
            if (key.name === 'up') {
                cursor = Math.max(0, cursor - 1);
                render();
                return;
            }
            if (key.name === 'down') {
                cursor = Math.min(filtered.length - 1, cursor + 1);
                render();
                return;
            }
            if (key.name === 'space') {
                const item = filtered[cursor];
                if (item) {
                    if (selected.has(item.value)) {
                        selected.delete(item.value);
                    }
                    else {
                        selected.add(item.value);
                    }
                }
                render();
                return;
            }
            if (key.name === 'backspace') {
                query = query.slice(0, -1);
                cursor = 0;
                render();
                return;
            }
            // Regular character input
            if (key.sequence && !key.ctrl && !key.meta && key.sequence.length === 1) {
                query += key.sequence;
                cursor = 0;
                render();
                return;
            }
        };
        process.stdin.on('keypress', keypressHandler);
        // Initial render
        render();
    });
}
//# sourceMappingURL=search-multiselect.js.map