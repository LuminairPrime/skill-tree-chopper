## ADDED Requirements

### Requirement: Cross-platform extension architecture
The system SHALL be implemented strictly using VS Code native APIs (like `vscode.workspace.fs`) to ensure full cross-platform compatibility (Windows, Linux, macOS) without relying on native bindings that require a C++ toolchain or Rust/Tauri.

#### Scenario: Running on different OSes
- **WHEN** the extension is installed on Windows, Linux, or macOS
- **THEN** it executes without any native compilation steps or dependency errors.

### Requirement: Defer standalone GUI app
The system SHALL NOT include a standalone desktop application in its v1 release. 

#### Scenario: Standalone app scope
- **WHEN** evaluating the v1 scope
- **THEN** the standalone desktop executable feature is explicitly marked as out of scope and deferred to v2.