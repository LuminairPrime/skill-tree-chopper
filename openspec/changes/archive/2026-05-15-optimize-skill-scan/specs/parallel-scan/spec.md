## ADDED Requirements

### Requirement: Parallel skill validation

The system SHALL validate the presence of `skill.md` files in candidate directories concurrently.

#### Scenario: Loading a container with multiple skills

- **WHEN** the system scans a `skills` container containing multiple folder entries
- **THEN** it issues file system read operations for all candidate skill folders in parallel to minimize wait time.
