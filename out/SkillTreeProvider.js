"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillTreeProvider = exports.SkillNode = exports.KNOWN_AGENT_PREFIXES = void 0;
exports.hasSkillMd = hasSkillMd;
const vscode = require("vscode");
const path = require("path");
const os = require("os");
exports.KNOWN_AGENT_PREFIXES = ['.cursor', '.claude', '.agents', '.gemini', '.forge'];
async function hasSkillMd(folderUri) {
    try {
        const entries = await vscode.workspace.fs.readDirectory(folderUri);
        return entries.some(([name, type]) => (type & vscode.FileType.File) !== 0 && name.toLowerCase() === 'skill.md');
    }
    catch {
        return false;
    }
}
class SkillNode extends vscode.TreeItem {
    constructor(label, type, collapsibleState, resourceUri, children) {
        super(label, collapsibleState);
        this.label = label;
        this.type = type;
        this.collapsibleState = collapsibleState;
        this.resourceUri = resourceUri;
        this.children = children;
        if (this.resourceUri) {
            this.id = this.resourceUri.fsPath;
            if (this.type === 'skill-folder') {
                const fsPath = this.resourceUri.fsPath;
                const parentDirName = path.basename(path.dirname(fsPath));
                // If it's inside an '.archived' folder, it's unchecked (disabled)
                const isArchived = parentDirName === '.archived';
                this.checkboxState = isArchived ? vscode.TreeItemCheckboxState.Unchecked : vscode.TreeItemCheckboxState.Checked;
                // Allow actions like delete
                this.contextValue = 'skillFolder';
            }
            else if (this.type === 'skills-container') {
                // Skills container checkbox state depends on children
                let hasCheckedChild = false;
                let hasUncheckedChild = false;
                if (this.children) {
                    for (const child of this.children) {
                        if (child.checkboxState === vscode.TreeItemCheckboxState.Checked) {
                            hasCheckedChild = true;
                        }
                        else if (child.checkboxState === vscode.TreeItemCheckboxState.Unchecked) {
                            hasUncheckedChild = true;
                        }
                    }
                }
                // If ANY child is checked, the container is checked.
                // If ALL children are unchecked, it is unchecked.
                // If no children, default to checked.
                if (hasCheckedChild || !hasUncheckedChild) {
                    this.checkboxState = vscode.TreeItemCheckboxState.Checked;
                }
                else {
                    this.checkboxState = vscode.TreeItemCheckboxState.Unchecked;
                }
            }
        }
        // Apply theme icons
        if (this.type === 'scope-root') {
            this.iconPath = new vscode.ThemeIcon('repo');
        }
        else if (this.type === 'agent-root') {
            this.iconPath = new vscode.ThemeIcon('hubot');
        }
        else if (this.type === 'skills-container') {
            this.iconPath = new vscode.ThemeIcon('folder-library');
        }
        else if (this.type === 'skill-folder') {
            this.iconPath = new vscode.ThemeIcon('markdown');
        }
    }
}
exports.SkillNode = SkillNode;
class SkillTreeProvider {
    constructor(outputChannel) {
        this.outputChannel = outputChannel;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (!element) {
            // Root nodes
            const roots = [];
            // 1. Workspace Roots
            if (vscode.workspace.workspaceFolders) {
                for (const wf of vscode.workspace.workspaceFolders) {
                    const workspaceChildren = await this.scanAgentRoots(wf.uri);
                    if (workspaceChildren.length > 0) {
                        const rootNode = new SkillNode(wf.name + ' (Workspace)', 'scope-root', vscode.TreeItemCollapsibleState.Expanded, wf.uri, workspaceChildren);
                        roots.push(rootNode);
                    }
                }
            }
            // 2. Global Roots
            const globalChildren = await this.scanAgentRoots(vscode.Uri.file(os.homedir()));
            if (globalChildren.length > 0) {
                const globalRootNode = new SkillNode('Global Skills', 'scope-root', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(os.homedir()), globalChildren);
                roots.push(globalRootNode);
            }
            return roots;
        }
        else {
            return element.children || [];
        }
    }
    async scanAgentRoots(baseRootUri) {
        const nodes = [];
        for (const agentPrefix of exports.KNOWN_AGENT_PREFIXES) {
            const agentUri = vscode.Uri.joinPath(baseRootUri, agentPrefix);
            let isDir = false;
            try {
                const stat = await vscode.workspace.fs.stat(agentUri);
                isDir = (stat.type & vscode.FileType.Directory) !== 0;
            }
            catch (e) {
                // Folder doesn't exist, ignore
                continue;
            }
            if (!isDir) {
                continue;
            }
            const containerNodes = [];
            // STRICT RULE: The folder must be named 'skills'
            const containerName = 'skills';
            const containerUri = vscode.Uri.joinPath(agentUri, containerName);
            let isContainerDir = false;
            try {
                const stat = await vscode.workspace.fs.stat(containerUri);
                isContainerDir = (stat.type & vscode.FileType.Directory) !== 0;
            }
            catch (e) {
                continue;
            }
            if (!isContainerDir) {
                continue;
            }
            const skillFolderNodes = [];
            // 1. Scan active skills
            await this.scanForSkillFolders(containerUri, skillFolderNodes);
            // 2. Scan .archived skills
            const archivedUri = vscode.Uri.joinPath(containerUri, '.archived');
            let isArchivedDir = false;
            try {
                const stat = await vscode.workspace.fs.stat(archivedUri);
                isArchivedDir = (stat.type & vscode.FileType.Directory) !== 0;
            }
            catch (e) { }
            if (isArchivedDir) {
                await this.scanForSkillFolders(archivedUri, skillFolderNodes);
            }
            if (skillFolderNodes.length > 0) {
                // Sort children
                skillFolderNodes.sort((a, b) => a.label.localeCompare(b.label));
                containerNodes.push(new SkillNode(containerName, 'skills-container', vscode.TreeItemCollapsibleState.Expanded, containerUri, skillFolderNodes));
            }
            if (containerNodes.length > 0) {
                nodes.push(new SkillNode(agentPrefix, 'agent-root', vscode.TreeItemCollapsibleState.Expanded, agentUri, containerNodes));
            }
        }
        // Sort agent roots
        nodes.sort((a, b) => a.label.localeCompare(b.label));
        return nodes;
    }
    async scanForSkillFolders(dirUri, nodes) {
        try {
            const entries = await vscode.workspace.fs.readDirectory(dirUri);
            const dirs = entries.filter(([name, type]) => (type & vscode.FileType.Directory) !== 0 && name !== '.archived');
            const checks = await Promise.all(dirs.map(async ([name]) => {
                const skillFolderUri = vscode.Uri.joinPath(dirUri, name);
                const hasSkillFile = await hasSkillMd(skillFolderUri);
                return hasSkillFile ? { name, uri: skillFolderUri } : null;
            }));
            for (const result of checks) {
                if (result) {
                    nodes.push(new SkillNode(result.name, 'skill-folder', vscode.TreeItemCollapsibleState.None, result.uri));
                }
            }
        }
        catch (e) {
            if (this.outputChannel) {
                this.outputChannel.appendLine(`Failed to scan dir ${dirUri.fsPath}: ${e.message}`);
            }
        }
    }
}
exports.SkillTreeProvider = SkillTreeProvider;
//# sourceMappingURL=SkillTreeProvider.js.map