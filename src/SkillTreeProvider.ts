import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';

export type SkillNodeType = 'scope-root' | 'agent-root' | 'skills-container' | 'skill-folder';

export const KNOWN_AGENT_PREFIXES = ['.cursor', '.claude', '.agents', '.gemini', '.forge'];

export async function hasSkillMd(folderUri: vscode.Uri): Promise<boolean> {
    try {
        const entries = await vscode.workspace.fs.readDirectory(folderUri);
        return entries.some(([name, type]) =>
            (type & vscode.FileType.File) !== 0 && name.toLowerCase() === 'skill.md'
        );
    } catch {
        return false;
    }
}

export class SkillNode extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly type: SkillNodeType,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly resourceUri?: vscode.Uri,
        public children?: SkillNode[]
    ) {
        super(label, collapsibleState);

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
            } else if (this.type === 'skills-container') {
                // Skills container checkbox state depends on children
                let hasCheckedChild = false;
                let hasUncheckedChild = false;
                
                if (this.children) {
                    for (const child of this.children) {
                        if (child.checkboxState === vscode.TreeItemCheckboxState.Checked) {
                            hasCheckedChild = true;
                        } else if (child.checkboxState === vscode.TreeItemCheckboxState.Unchecked) {
                            hasUncheckedChild = true;
                        }
                    }
                }
                
                // If ANY child is checked, the container is checked.
                // If ALL children are unchecked, it is unchecked.
                // If no children, default to checked.
                if (hasCheckedChild || !hasUncheckedChild) {
                     this.checkboxState = vscode.TreeItemCheckboxState.Checked;
                } else {
                     this.checkboxState = vscode.TreeItemCheckboxState.Unchecked;
                }
            }
        }

        // Apply theme icons
        if (this.type === 'scope-root') {
            this.iconPath = new vscode.ThemeIcon('repo');
        } else if (this.type === 'agent-root') {
            this.iconPath = new vscode.ThemeIcon('hubot');
        } else if (this.type === 'skills-container') {
            this.iconPath = new vscode.ThemeIcon('folder-library');
        } else if (this.type === 'skill-folder') {
            this.iconPath = new vscode.ThemeIcon('markdown');
        }
    }
}

export class SkillTreeProvider implements vscode.TreeDataProvider<SkillNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<SkillNode | undefined | null | void> = new vscode.EventEmitter<SkillNode | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SkillNode | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private readonly outputChannel: vscode.OutputChannel) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SkillNode): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: SkillNode): Promise<SkillNode[]> {
        if (!element) {
            // Root nodes
            const roots: SkillNode[] = [];
            
            // 1. Workspace Roots
            if (vscode.workspace.workspaceFolders) {
                for (const wf of vscode.workspace.workspaceFolders) {
                    const workspaceChildren = await this.scanAgentRoots(wf.uri);
                    if (workspaceChildren.length > 0) {
                        const rootNode = new SkillNode(
                            wf.name + ' (Workspace)',
                            'scope-root',
                            vscode.TreeItemCollapsibleState.Expanded,
                            wf.uri,
                            workspaceChildren
                        );
                        roots.push(rootNode);
                    }
                }
            }

            // 2. Global Roots
            const globalChildren = await this.scanAgentRoots(vscode.Uri.file(os.homedir()));
            if (globalChildren.length > 0) {
                const globalRootNode = new SkillNode(
                    'Global Skills',
                    'scope-root',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    vscode.Uri.file(os.homedir()),
                    globalChildren
                );
                roots.push(globalRootNode);
            }
            return roots;
        } else {
            return element.children || [];
        }
    }

    private async scanAgentRoots(baseRootUri: vscode.Uri): Promise<SkillNode[]> {
        const nodes: SkillNode[] = [];
        
        for (const agentPrefix of KNOWN_AGENT_PREFIXES) {
            const agentUri = vscode.Uri.joinPath(baseRootUri, agentPrefix);
            
            let isDir = false;
            try {
                const stat = await vscode.workspace.fs.stat(agentUri);
                isDir = (stat.type & vscode.FileType.Directory) !== 0;
            } catch (e) {
                // Folder doesn't exist, ignore
                continue;
            }

            if (!isDir) {
                continue;
            }

            const containerNodes: SkillNode[] = [];
            
            // STRICT RULE: The folder must be named 'skills'
            const containerName = 'skills';
            const containerUri = vscode.Uri.joinPath(agentUri, containerName);
            
            let isContainerDir = false;
            try {
                const stat = await vscode.workspace.fs.stat(containerUri);
                isContainerDir = (stat.type & vscode.FileType.Directory) !== 0;
            } catch (e) {
                continue;
            }

            if (!isContainerDir) {
                continue;
            }

            const skillFolderNodes: SkillNode[] = [];

            // 1. Scan active skills
            await this.scanForSkillFolders(containerUri, skillFolderNodes);
            
            // 2. Scan .archived skills
            const archivedUri = vscode.Uri.joinPath(containerUri, '.archived');
            let isArchivedDir = false;
            try {
                const stat = await vscode.workspace.fs.stat(archivedUri);
                isArchivedDir = (stat.type & vscode.FileType.Directory) !== 0;
            } catch (e) {}

            if (isArchivedDir) {
                await this.scanForSkillFolders(archivedUri, skillFolderNodes);
            }

            if (skillFolderNodes.length > 0) {
                // Sort children
                skillFolderNodes.sort((a, b) => a.label.localeCompare(b.label));

                containerNodes.push(
                    new SkillNode(
                        containerName,
                        'skills-container',
                        vscode.TreeItemCollapsibleState.Expanded,
                        containerUri,
                        skillFolderNodes
                    )
                );
            }

            if (containerNodes.length > 0) {
                nodes.push(
                    new SkillNode(
                        agentPrefix,
                        'agent-root',
                        vscode.TreeItemCollapsibleState.Expanded,
                        agentUri,
                        containerNodes
                    )
                );
            }
        }

        // Sort agent roots
        nodes.sort((a, b) => a.label.localeCompare(b.label));

        return nodes;
    }

    private async scanForSkillFolders(dirUri: vscode.Uri, nodes: SkillNode[]) {
        try {
            const entries = await vscode.workspace.fs.readDirectory(dirUri);
            const dirs = entries.filter(
                ([name, type]) => (type & vscode.FileType.Directory) !== 0 && name !== '.archived'
            );

            const checks = await Promise.all(
                dirs.map(async ([name]) => {
                    const skillFolderUri = vscode.Uri.joinPath(dirUri, name);
                    const hasSkillFile = await hasSkillMd(skillFolderUri);
                    return hasSkillFile ? { name, uri: skillFolderUri } : null;
                })
            );

            for (const result of checks) {
                if (result) {
                    nodes.push(
                        new SkillNode(
                            result.name,
                            'skill-folder',
                            vscode.TreeItemCollapsibleState.None,
                            result.uri
                        )
                    );
                }
            }
        } catch (e: any) {
            if (this.outputChannel) {
                this.outputChannel.appendLine(`Failed to scan dir ${dirUri.fsPath}: ${e.message}`);
            }
        }
    }
}
