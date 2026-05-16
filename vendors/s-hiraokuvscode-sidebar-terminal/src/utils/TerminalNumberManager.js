"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalNumberManager = void 0;
/** Manages terminal number allocation and recycling. */
class TerminalNumberManager {
    constructor(maxTerminals) {
        this.maxTerminals = maxTerminals;
    }
    /** Gets the set of currently used terminal numbers. */
    getUsedNumbers(terminals) {
        const usedNumbers = new Set();
        for (const terminal of terminals.values()) {
            if (terminal.number && typeof terminal.number === 'number') {
                usedNumbers.add(terminal.number);
            }
            else {
                // Fallback: extract from terminal name for backward compatibility
                const match = terminal.name.match(/Terminal (\d+)/);
                if (match?.[1]) {
                    usedNumbers.add(parseInt(match[1], 10));
                }
            }
        }
        return usedNumbers;
    }
    /** Finds the lowest available terminal number. */
    findAvailableNumber(terminals) {
        const usedNumbers = this.getUsedNumbers(terminals);
        for (let i = 1; i <= this.maxTerminals; i++) {
            if (!usedNumbers.has(i))
                return i;
        }
        return this.maxTerminals;
    }
    /** Checks if a new terminal can be created. */
    canCreate(terminals) {
        const usedNumbers = this.getUsedNumbers(terminals);
        for (let i = 1; i <= this.maxTerminals; i++) {
            if (!usedNumbers.has(i))
                return true;
        }
        return false;
    }
    /** Gets all available slot numbers. */
    getAvailableSlots(terminals) {
        const usedNumbers = this.getUsedNumbers(terminals);
        const slots = [];
        for (let i = 1; i <= this.maxTerminals; i++) {
            if (!usedNumbers.has(i))
                slots.push(i);
        }
        return slots;
    }
    /** Allocates a specific number or finds an available one. */
    allocateNumber(preferredNumber, terminals) {
        const usedNumbers = this.getUsedNumbers(terminals);
        if (preferredNumber >= 1 &&
            preferredNumber <= this.maxTerminals &&
            !usedNumbers.has(preferredNumber)) {
            return preferredNumber;
        }
        return this.findAvailableNumber(terminals);
    }
}
exports.TerminalNumberManager = TerminalNumberManager;
//# sourceMappingURL=TerminalNumberManager.js.map