## Why

We have acquired critical expert insights from community VS Code extension skills (`vscode-ext-commands` and `memory-leak-audit`). Before finalizing the extension, we must perform a rigorous architectural audit to ensure our file I/O operations, command registrations, and event listeners strictly adhere to these enterprise-grade standards to prevent memory overflow, file locking, event loop blocking, and race conditions.

## What Changes

- We will explicitly audit and refactor all synchronous `fs` commands (`fs.readdirSync`, `fs.mkdirSync`, `fs.existsSync`) to asynchronous `fs.promises` to prevent event loop blocking.
- We will review command registrations (`extension.ts`) against the `vscode-ext-commands` guidelines (ensuring proper error catching, visual feedback, and memory-safe promise resolution).
- We will audit the tree data provider's `EventEmitter` to ensure it does not leak memory listeners during rapid UI toggles (based on `memory-leak-audit`).
- We will implement explicit file lock safeguards (e.g., sequential promise evaluation with backoff or strict error boundaries) in the mass-toggle feature.

## Capabilities

### New Capabilities

- `advanced-architectural-audit`: Establishes the enterprise-grade baseline for VS Code Extension memory management, asynchronous event handling, and algorithmic safety.

### Modified Capabilities

<!-- No requirement changes to existing capabilities, strictly internal optimization. -->

## Impact

- **Performance**: Asynchronous code will ensure the UI never stutters, and Big O evaluation will confirm optimal data parsing.
- **Safety**: Robust memory management and file lock mitigation will prevent the extension from crashing the host or corrupting user files during heavy workloads.
