import * as vscode from 'vscode';
import * as path from 'path';
import { SkillTreeProvider, SkillNode, hasSkillMd } from './SkillTreeProvider';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('Skill Tree Chopper');
    context.subscriptions.push(outputChannel);

    const treeProvider = new SkillTreeProvider(outputChannel);
    
    const treeView = vscode.window.createTreeView('aiSkillAuditor', {
        treeDataProvider: treeProvider,
        showCollapseAll: true,
        manageCheckboxStateManually: true
    });

    const moveFolder = async (currentFsPath: string, isChecking: boolean) => {
        const parentDir = path.dirname(currentFsPath);
        const parentDirName = path.basename(parentDir);
        const skillFolderName = path.basename(currentFsPath);
        
        let newPath = currentFsPath;

        if (isChecking && parentDirName === '.archived') {
            // Moving OUT of .archived: e.g. .cursor/skills/.archived/my-skill -> .cursor/skills/my-skill
            const targetParentDir = path.dirname(parentDir);
            newPath = path.join(targetParentDir, skillFolderName);
        } else if (!isChecking && parentDirName !== '.archived') {
            // Moving INTO .archived: e.g. .cursor/skills/my-skill -> .cursor/skills/.archived/my-skill
            
            // PRE-FLIGHT VALIDATION: Only move if it contains a markdown file
            const currentUri = vscode.Uri.file(currentFsPath);
            let isValid = false;
            try {
                isValid = await hasSkillMd(currentUri);
            } catch(e: any) {
                outputChannel.appendLine(`Validation failed for ${currentFsPath}: ${e.message || e}`);
            }
            
            if (!isValid) {
                outputChannel.appendLine(`Skipping move for ${currentFsPath} - no markdown file found.`);
                return;
            }

            const archivedDirPath = path.join(parentDir, '.archived');
            const archivedDirUri = vscode.Uri.file(archivedDirPath);
            await vscode.workspace.fs.createDirectory(archivedDirUri);
            newPath = path.join(archivedDirPath, skillFolderName);
        }

        if (newPath !== currentFsPath) {
            try {
                const newUri = vscode.Uri.file(newPath);
                await vscode.workspace.fs.rename(vscode.Uri.file(currentFsPath), newUri, { overwrite: false });
            } catch (error: any) {
                outputChannel.appendLine(`Failed to move skill folder: ${error.message}`);
                vscode.window.showErrorMessage(`Failed to move skill folder: ${error.message}`);
            }
        }
    };

    const checkboxListener = treeView.onDidChangeCheckboxState(async (e) => {
        let requiresRefresh = false;
        
        for (const [item, state] of e.items) {
            const isChecking = state === vscode.TreeItemCheckboxState.Checked;
            
            if (item.type === 'skill-folder' && item.resourceUri) {
                await moveFolder(item.resourceUri.fsPath, isChecking);
                requiresRefresh = true;
            } else if (item.type === 'skills-container' && item.children) {
                // MASS TOGGLE: Iterate over all children with progress indicator
                await vscode.window.withProgress(
                    { location: vscode.ProgressLocation.Notification, title: 'Toggling skills...' },
                    async () => {
                        if (item.children) {
                            for (const child of item.children) {
                                if (child.resourceUri) {
                                    await moveFolder(child.resourceUri.fsPath, isChecking);
                                    requiresRefresh = true;
                                }
                            }
                        }
                    }
                );
            }
        }
        
        if (requiresRefresh) {
            treeProvider.refresh();
        }
    });

    const refreshCommand = vscode.commands.registerCommand('aiSkills.refresh', () => {
        treeProvider.refresh();
    });

    const deleteCommand = vscode.commands.registerCommand('aiSkills.deleteSkill', async (node: SkillNode) => {
        if (node && node.resourceUri && node.type === 'skill-folder') {
            try {
                // Delete the entire folder and its contents
                await vscode.workspace.fs.delete(node.resourceUri, { recursive: true, useTrash: true });
                treeProvider.refresh();
            } catch (error: any) {
                outputChannel.appendLine(`Failed to delete skill folder: ${error.message}`);
                vscode.window.showErrorMessage(`Failed to delete skill folder: ${error.message}`);
            }
        }
    });

    context.subscriptions.push(treeView, checkboxListener, refreshCommand, deleteCommand);
}

export function deactivate() {}
