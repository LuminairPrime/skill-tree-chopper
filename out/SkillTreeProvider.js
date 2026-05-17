"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillTreeProvider = exports.SkillNode = exports.KNOWN_AGENT_PREFIXES = void 0;
exports.hasSkillMd = hasSkillMd;
const vscode = require("vscode");
const os = require("os");
const skillFolderState_1 = require("./skillFolderState");
exports.KNOWN_AGENT_PREFIXES = [
    '.adal',
    '.agent',
    '.agents',
    '.amazonq',
    '.augment',
    '.bob',
    '.claude',
    '.cline',
    '.codebuddy',
    '.codeium/windsurf',
    '.codex',
    '.commandcode',
    '.config/agents',
    '.config/crush',
    '.config/goose',
    '.config/opencode',
    '.continue',
    '.copilot',
    '.cospec',
    '.crush',
    '.cursor',
    '.deepagents/agent',
    '.factory',
    '.firebender',
    '.forge',
    '.gemini',
    '.gemini/antigravity',
    '.github',
    '.iflow',
    '.junie',
    '.kilocode',
    '.kimi',
    '.kiro',
    '.kode',
    '.lingma',
    '.mcpjam',
    '.mux',
    '.neovate',
    '.npm-global/lib/node_modules/openclaw',
    '.openclaw',
    '.opencode',
    '.openhands',
    '.pi',
    '.pi/agent',
    '.pochi',
    '.qoder',
    '.qwen',
    '.roo',
    '.snowflake/cortex',
    '.trae',
    '.trae-cn',
    '.vibe',
    '.vscode',
    '.windsurf',
    '.zencoder',
];
async function hasSkillMd(folderUri) {
    try {
        const entries = await vscode.workspace.fs.readDirectory(folderUri);
        return entries.some(([name, type]) => (type & vscode.FileType.File) !== 0 && (0, skillFolderState_1.isSkillMarkdownFile)(name));
    }
    catch {
        return false;
    }
}
function toVsCodeCheckboxState(state) {
    return state === 'checked'
        ? vscode.TreeItemCheckboxState.Checked
        : vscode.TreeItemCheckboxState.Unchecked;
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
                this.checkboxState = toVsCodeCheckboxState((0, skillFolderState_1.getSkillFolderCheckboxState)(this.resourceUri.fsPath));
            }
            else if (this.type === 'skills-container') {
                const childStates = (this.children ?? []).map((child) => child.checkboxState === vscode.TreeItemCheckboxState.Checked ? 'checked' : 'unchecked');
                this.checkboxState = toVsCodeCheckboxState((0, skillFolderState_1.getSkillsContainerCheckboxState)(childStates));
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
    constructor(outputChannel, homeDirectory = os.homedir()) {
        this.outputChannel = outputChannel;
        this.homeDirectory = homeDirectory;
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
            const globalChildren = await this.scanAgentRoots(vscode.Uri.file(this.homeDirectory));
            if (globalChildren.length > 0) {
                const globalRootNode = new SkillNode('Global Skills', 'scope-root', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(this.homeDirectory), globalChildren);
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
            try {
                const stat = await vscode.workspace.fs.stat(agentUri);
                if ((stat.type & vscode.FileType.Directory) === 0) {
                    continue;
                }
            }
            catch {
                // Folder doesn't exist, ignore
                continue;
            }
            const containerNodes = [];
            // STRICT RULE: The folder must be named 'skills'
            const containerName = 'skills';
            const containerUri = vscode.Uri.joinPath(agentUri, containerName);
            try {
                const stat = await vscode.workspace.fs.stat(containerUri);
                if ((stat.type & vscode.FileType.Directory) === 0) {
                    continue;
                }
            }
            catch {
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
            catch {
                // Safe to ignore if .archived doesn't exist
            }
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
                const errMsg = e instanceof Error ? e.message : String(e);
                this.outputChannel.appendLine(`Failed to scan dir ${dirUri.fsPath}: ${errMsg}`);
            }
        }
    }
}
exports.SkillTreeProvider = SkillTreeProvider;
//# sourceMappingURL=SkillTreeProvider.js.map