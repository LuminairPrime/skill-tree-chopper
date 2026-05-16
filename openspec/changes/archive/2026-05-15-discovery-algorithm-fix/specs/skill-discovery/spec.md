## MODIFIED Requirements

### Requirement: Shallow Strict Discovery
The system MUST discover skills by checking specifically mapped agent paths at a shallow depth of one, rather than utilizing unconstrained deep glob searches (`**`).

#### Scenario: Discovering skills in a local workspace
- **WHEN** the `getWorkspaceSkills` method runs
- **THEN** it must only scan known directories (e.g., `.cursor/skills`, `.cursor/rules`, `.agents/skills`) in the root of the workspace, looking exactly one directory level deep for a folder containing a `skill.md` file.

#### Scenario: Discovering archived skills
- **WHEN** the discovery algorithm scans an agent directory
- **THEN** it must explicitly look for the `.archived` sub-directory (e.g., `.cursor/skills/.archived`) and scan it one level deep for folders containing a `skill.md` file.

#### Scenario: Validating skill files
- **WHEN** the algorithm encounters a folder
- **THEN** it must verify the existence of a file named `skill.md` (case-insensitive) within that specific folder before classifying it as a valid skill folder.