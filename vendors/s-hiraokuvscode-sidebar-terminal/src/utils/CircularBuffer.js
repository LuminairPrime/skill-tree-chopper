"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircularBuffer = void 0;
/**
 * Circular Buffer for efficient data buffering
 *
 * Features:
 * - Fixed-capacity storage with O(1) operations
 * - Head/tail pointer management
 * - No string concatenation overhead
 * - Memory-efficient with automatic wrapping
 */
class CircularBuffer {
    constructor(capacity = 50) {
        this.head = 0;
        this.tail = 0;
        this.size = 0;
        if (capacity <= 0) {
            throw new Error('CircularBuffer capacity must be greater than 0');
        }
        this.capacity = capacity;
        this.buffer = new Array(capacity);
    }
    /**
     * Push data into the buffer
     * Returns true if successful, false if buffer is full
     */
    push(data) {
        if (this.isFull()) {
            // Auto-expand strategy: when full, we can either reject or overwrite
            // For terminal data, we prefer to overwrite oldest data
            this.buffer[this.tail] = data;
            this.tail = (this.tail + 1) % this.capacity;
            this.head = (this.head + 1) % this.capacity; // Move head forward too
            return true;
        }
        this.buffer[this.tail] = data;
        this.tail = (this.tail + 1) % this.capacity;
        this.size++;
        return true;
    }
    /**
     * Flush all data from the buffer and return as a single string
     * Clears the buffer after flushing
     */
    flush() {
        if (this.isEmpty()) {
            return '';
        }
        const result = [];
        let current = this.head;
        for (let i = 0; i < this.size; i++) {
            const item = this.buffer[current];
            if (item !== undefined) {
                result.push(item);
            }
            current = (current + 1) % this.capacity;
        }
        this.clear();
        return result.join('');
    }
    /**
     * Peek at the buffer contents without flushing
     */
    peek() {
        if (this.isEmpty()) {
            return '';
        }
        const result = [];
        let current = this.head;
        for (let i = 0; i < this.size; i++) {
            const item = this.buffer[current];
            if (item !== undefined) {
                result.push(item);
            }
            current = (current + 1) % this.capacity;
        }
        return result.join('');
    }
    /**
     * Clear the buffer
     */
    clear() {
        this.head = 0;
        this.tail = 0;
        this.size = 0;
        // Don't null out the array elements - just reset pointers
        // This is more memory efficient for reuse
    }
    /**
     * Check if buffer is empty
     */
    isEmpty() {
        return this.size === 0;
    }
    /**
     * Check if buffer is full
     */
    isFull() {
        return this.size === this.capacity;
    }
    /**
     * Get current number of items in buffer
     */
    getSize() {
        return this.size;
    }
    /**
     * Get buffer capacity
     */
    getCapacity() {
        return this.capacity;
    }
    /**
     * Get total data length in bytes (approximate)
     */
    getDataLength() {
        let totalLength = 0;
        let current = this.head;
        for (let i = 0; i < this.size; i++) {
            totalLength += this.buffer[current]?.length || 0;
            current = (current + 1) % this.capacity;
        }
        return totalLength;
    }
}
exports.CircularBuffer = CircularBuffer;
//# sourceMappingURL=CircularBuffer.js.map