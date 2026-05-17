"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const path = require("path");
const SkillTreeProvider_1 = require("./SkillTreeProvider");
const skillFolderState_1 = require("./skillFolderState");
function activate(context) {
    const outputChannel = vscode.window.createOutputChannel('Skill Tree Chopper');
    context.subscriptions.push(outputChannel);
    const treeProvider = new SkillTreeProvider_1.SkillTreeProvider(outputChannel);
    const treeView = vscode.window.createTreeView('aiSkillAuditor', {
        treeDataProvider: treeProvider,
        showCollapseAll: true,
        manageCheckboxStateManually: true,
    });
    const moveSkillFolder = async (currentFsPath, isChecking) => {
        const targetFsPath = (0, skillFolderState_1.getSkillFolderMoveTarget)(currentFsPath, isChecking);
        if (!targetFsPath) {
            return;
        }
        if (!isChecking) {
            const currentUri = vscode.Uri.file(currentFsPath);
            let isValid = false;
            try {
                isValid = await (0, SkillTreeProvider_1.hasSkillMd)(currentUri);
            }
            catch (error) {
                outputChannel.appendLine(`Validation failed for ${currentFsPath}: ${error.message || error}`);
            }
            if (!isValid) {
                outputChannel.appendLine(`Skipping move for ${currentFsPath} - no skill.md file found.`);
                return;
            }
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(targetFsPath)));
        }
        try {
            await vscode.workspace.fs.rename(vscode.Uri.file(currentFsPath), vscode.Uri.file(targetFsPath), { overwrite: false });
        }
        catch (error) {
            outputChannel.appendLine(`Failed to move skill folder: ${error.message}`);
            vscode.window.showErrorMessage(`Failed to move skill folder: ${error.message}`);
        }
    };
    const checkboxListener = treeView.onDidChangeCheckboxState(async (e) => {
        let requiresRefresh = false;
        for (const [item, state] of e.items) {
            const isChecking = state === vscode.TreeItemCheckboxState.Checked;
            if (item.type === 'skill-folder' && item.resourceUri) {
                await moveSkillFolder(item.resourceUri.fsPath, isChecking);
                requiresRefresh = true;
            }
            else if (item.type === 'skills-container' && item.children) {
                // MASS TOGGLE: Iterate over all children with progress indicator
                await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Toggling skills...' }, async () => {
                    if (item.children) {
                        for (const child of item.children) {
                            if (child.resourceUri) {
                                await moveSkillFolder(child.resourceUri.fsPath, isChecking);
                                requiresRefresh = true;
                            }
                        }
                    }
                });
            }
        }
        if (requiresRefresh) {
            treeProvider.refresh();
        }
    });
    const refreshCommand = vscode.commands.registerCommand('aiSkills.refresh', () => {
        treeProvider.refresh();
    });
    context.subscriptions.push(treeView, checkboxListener, refreshCommand);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map