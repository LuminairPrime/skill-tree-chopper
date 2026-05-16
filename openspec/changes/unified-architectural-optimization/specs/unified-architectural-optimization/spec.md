## ADDED Requirements

### Requirement: Targeted Global Discovery
The system SHALL NOT blindly iterate over the entire OS home directory, which contains hundreds of irrelevant hidden directories. It MUST use an explicit allowlist of known agent root directories.

#### Scenario: Scanning global paths
- **WHEN** the `getGlobalSkills` routine initiates
- **THEN** it must only iterate through a static array of known agent names (`.cursor`, `.claude`, `.agents`, `.gemini`, `.forge`, etc.), checking only those specific paths for existence.

### Requirement: O(1) Skill Validation
The system SHALL NOT execute a full directory read to check for the presence of a `skill.md` file. It MUST check explicitly for the exact file path to guarantee $O(1)$ constant time validation.

#### Scenario: Validating a skill folder
- **WHEN** the discovery algorithm needs to confirm if a folder is a valid skill
- **THEN** it must use a targeted file system API (e.g., `vscode.workspace.fs.stat` or `fs.promises.access`) on the exact path `[folder]/skill.md`, catching the error if it does not exist.

### Requirement: Virtual File System Compatibility
The system SHALL support VS Code remote development environments (SSH, Dev Containers, WSL) by utilizing the native VS Code file system APIs.

#### Scenario: Running in a remote container
- **WHEN** the tree provider performs discovery reads
- **THEN** it must utilize `vscode.workspace.fs.readDirectory` instead of the Node.js `fs` module to ensure it reads the remote file system accurately.

### Requirement: Error Visibility
The system SHALL expose all file system errors or move failures to the user via a dedicated Output Channel to aid in debugging permissions or file locks.

#### Scenario: Catching an access error
- **WHEN** an operation (like scanning a locked directory or moving a locked folder) throws an error
- **THEN** the error message must be appended to the "AI Skill Auditor" Output Channel instead of being silently caught and ignored.

### Requirement: Safe Sequential Operations
The system SHALL prevent file-lock race conditions by executing mass-toggle file operations strictly sequentially.

#### Scenario: Toggling a container with 50 skills
- **WHEN** the user triggers a mass toggle
- **THEN** the extension must iterate and fully `await` each `moveFolder` command before initiating the next.