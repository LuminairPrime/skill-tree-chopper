"use strict";
/**
 * Scrollback Normalization Utility
 *
 * Provides scrollback data transformation and normalization functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrollbackNormalizationUtility = void 0;
/**
 * Scrollback Normalization Utility
 *
 * Centralized scrollback data transformation logic
 */
class ScrollbackNormalizationUtility {
    /**
     * Normalize scrollback content to consistent format
     *
     * Handles both string arrays and object arrays
     */
    static normalizeScrollbackContent(scrollbackContent) {
        if (!Array.isArray(scrollbackContent) || scrollbackContent.length === 0) {
            return [];
        }
        // Check if it's string array
        if (typeof scrollbackContent[0] === 'string') {
            return this.normalizeStringArray(scrollbackContent);
        }
        // Already in object format, normalize type field
        return this.normalizeObjectArray(scrollbackContent);
    }
    /**
     * Normalize string array to ScrollbackLine array
     */
    static normalizeStringArray(lines) {
        return lines.map((line) => ({
            content: line,
            type: 'output',
        }));
    }
    /**
     * Normalize object array to ScrollbackLine array
     */
    static normalizeObjectArray(lines) {
        return lines
            .filter((item) => {
            return (typeof item === 'object' &&
                item !== null &&
                'content' in item &&
                typeof item.content === 'string');
        })
            .map((item) => {
            const type = item.type;
            const normalizedType = type === 'input' || type === 'error' ? type : 'output';
            return {
                content: item.content,
                type: normalizedType,
                timestamp: item.timestamp,
            };
        });
    }
    /**
     * Format scrollback lines for transfer
     *
     * Converts ScrollbackLine array to format suitable for message passing
     */
    static formatScrollbackForTransfer(lines) {
        return lines.map((line) => ({
            content: line.content,
            type: line.type || 'output',
            ...(line.timestamp && { timestamp: line.timestamp }),
        }));
    }
    /**
     * Convert scrollback to simple string array
     *
     * Useful for legacy compatibility or simple storage
     */
    static toStringArray(lines) {
        return lines.map((line) => line.content);
    }
    /**
     * Filter empty lines from scrollback
     *
     * @param lines - Scrollback lines to filter
     * @param keepStructuralEmpty - Whether to keep empty lines that maintain structure
     */
    static filterEmptyLines(lines, keepStructuralEmpty = false) {
        if (keepStructuralEmpty) {
            // Keep empty lines that are surrounded by content
            const result = [];
            let hasContent = false;
            for (const line of lines) {
                if (line.content.trim()) {
                    hasContent = true;
                    result.push(line);
                }
                else if (hasContent) {
                    result.push(line);
                }
            }
            // Remove trailing empty lines
            while (result.length > 0) {
                const lastLine = result[result.length - 1];
                if (lastLine && !lastLine.content.trim()) {
                    result.pop();
                }
                else {
                    break;
                }
            }
            return result;
        }
        // Remove all empty lines
        return lines.filter((line) => line.content.trim());
    }
    /**
     * Truncate scrollback to maximum number of lines
     *
     * @param lines - Scrollback lines to truncate
     * @param maxLines - Maximum number of lines to keep
     * @param fromEnd - If true, keep last N lines; if false, keep first N lines
     */
    static truncate(lines, maxLines, fromEnd = true) {
        if (lines.length <= maxLines) {
            return lines;
        }
        if (fromEnd) {
            return lines.slice(-maxLines);
        }
        return lines.slice(0, maxLines);
    }
    /**
     * Merge multiple scrollback arrays
     *
     * Combines multiple scrollback arrays in order
     */
    static merge(...scrollbackArrays) {
        const result = [];
        for (const scrollback of scrollbackArrays) {
            result.push(...scrollback);
        }
        return result;
    }
    /**
     * Validate scrollback line
     *
     * Checks if a line has valid structure
     */
    static isValidLine(line) {
        if (typeof line !== 'object' || line === null) {
            return false;
        }
        const obj = line;
        // Must have content field
        if (typeof obj.content !== 'string') {
            return false;
        }
        // Type field is optional but must be valid if present
        if (obj.type !== undefined) {
            const type = obj.type;
            if (type !== 'output' && type !== 'input' && type !== 'error') {
                return false;
            }
        }
        // Timestamp is optional but must be number if present
        if (obj.timestamp !== undefined && typeof obj.timestamp !== 'number') {
            return false;
        }
        return true;
    }
    /**
     * Sanitize scrollback content
     *
     * Removes invalid lines and normalizes valid ones
     */
    static sanitize(lines) {
        return lines.filter(this.isValidLine).map((line) => ({
            content: line.content,
            type: line.type || 'output',
            ...(line.timestamp && { timestamp: line.timestamp }),
        }));
    }
}
exports.ScrollbackNormalizationUtility = ScrollbackNormalizationUtility;
//# sourceMappingURL=ScrollbackNormalizationUtility.js.map