## 1. Setup Output Channel and Error Handling

- [x] 1.1 In `extension.ts`, create a `vscode.window.createOutputChannel('AI Skill Auditor')` and push it to `context.subscriptions`.
- [x] 1.2 Export the `outputChannel` (or pass it to the provider) so it can be used for logging.
- [x] 1.3 Update all empty `catch(e) {}` blocks and `console.error` calls in `extension.ts` and `SkillTreeProvider.ts` to use `outputChannel.appendLine`.

## 2. API Migration & Fast Validation

- [x] 2.1 In `SkillTreeProvider.ts`, replace the use of the Node.js `fs` module with `vscode.workspace.fs.readDirectory` and `vscode.workspace.fs.stat`.
- [x] 2.2 Create a helper method `async hasSkillMd(folderUri: vscode.Uri): Promise<boolean>` that uses `vscode.workspace.fs.stat` to check specifically for `skill.md` (and `SKILL.md`), returning true on success and false on throw, achieving true $O(1)$ validation.

## 3. Targeted Global Discovery

- [x] 3.1 Define `const KNOWN_AGENT_PREFIXES = ['.cursor', '.claude', '.agents', '.gemini', '.forge'];` inside `SkillTreeProvider.ts`.
- [x] 3.2 Refactor the `getGlobalSkills` method. Instead of scanning `os.homedir()` completely, construct precise URIs using `KNOWN_AGENT_PREFIXES` and check for their existence.
- [x] 3.3 Ensure `getWorkspaceSkills` uses the same targeted logic against the root of the workspace folders.

## 4. Sequential Move Logic Review

- [x] 4.1 In `extension.ts`, update `moveFolder` to use the new `hasSkillMd` logic instead of `fs.readdirSync`.
- [x] 4.2 In `extension.ts`, update `moveFolder` to use `vscode.workspace.fs.createDirectory` instead of `fs.mkdirSync`.
- [x] 4.3 Verify the mass-toggle loop remains an `await` within a `for...of` loop to prevent race conditions.
