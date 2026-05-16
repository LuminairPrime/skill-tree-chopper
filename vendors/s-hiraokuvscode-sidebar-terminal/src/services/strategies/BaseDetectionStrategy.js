"use strict";
/**
 * Base Detection Strategy
 *
 * Abstract base class for CLI agent detection strategies.
 * Provides common validation and helper methods to eliminate code duplication.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDetectionStrategy = void 0;
class BaseDetectionStrategy {
    /**
     * Optional: Regex patterns for startup detection
     * Override if you need regex-based detection
     */
    getStartupRegexPatterns() {
        return [];
    }
    /**
     * Detect agent from user input command
     */
    detectFromInput(input) {
        if (!this.validateInput(input)) {
            return { isDetected: false, confidence: 0 };
        }
        const line = input.toLowerCase();
        const prefixes = this.getCommandPrefixes();
        for (const prefix of prefixes) {
            if (line.startsWith(prefix) || line === prefix.trim()) {
                return {
                    isDetected: true,
                    confidence: 1.0,
                    detectedLine: input,
                };
            }
        }
        return { isDetected: false, confidence: 0 };
    }
    /**
     * Detect agent from terminal output
     */
    detectFromOutput(output) {
        if (!this.validateOutput(output)) {
            return false;
        }
        // Check string patterns
        const patterns = this.getStartupPatterns();
        const hasPattern = patterns.some((pattern) => output.includes(pattern));
        // Check regex patterns
        const regexPatterns = this.getStartupRegexPatterns();
        const hasRegexMatch = regexPatterns.some((regex) => regex.test(output));
        return hasPattern || hasRegexMatch;
    }
    /**
     * Check if output indicates this agent is active
     */
    isAgentActivity(output) {
        if (!this.validateOutput(output)) {
            return false;
        }
        const lowerLine = output.toLowerCase();
        const keywords = this.getActivityKeywords();
        // Check if any keyword is present
        const hasKeyword = keywords.some((keyword) => lowerLine.includes(keyword.toLowerCase()));
        // Long output is usually agent activity
        const isLongOutput = output.length > 50;
        return hasKeyword || isLongOutput;
    }
    /**
     * Validate input string
     */
    validateInput(input) {
        return input !== null && input !== undefined && typeof input === 'string';
    }
    /**
     * Validate output string
     */
    validateOutput(output) {
        return output !== null && output !== undefined && typeof output === 'string';
    }
}
exports.BaseDetectionStrategy = BaseDetectionStrategy;
//# sourceMappingURL=BaseDetectionStrategy.js.map