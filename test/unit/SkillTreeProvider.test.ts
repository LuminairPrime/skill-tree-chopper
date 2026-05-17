import * as path from 'path';
import * as vscode from 'vscode';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hasSkillMd, SkillNode, SkillTreeProvider } from '../../src/SkillTreeProvider';

type DirEntry = [string, vscode.FileType];

function normalizePath(value: string): string {
  return path.normalize(value);
}

function configureVirtualFileSystem(entriesByDirectory: Record<string, DirEntry[]>): void {
  const directories = new Map<string, DirEntry[]>();
  const files = new Set<string>();

  for (const [directoryPath, entries] of Object.entries(entriesByDirectory)) {
    directories.set(normalizePath(directoryPath), entries);

    for (const [name, type] of entries) {
      const fullPath = normalizePath(path.join(directoryPath, name));

      if ((type & vscode.FileType.File) !== 0) {
        files.add(fullPath);
      }
    }
  }

  Object.assign(vscode.workspace.fs, {
    readDirectory: vi.fn(async (uri: vscode.Uri) => {
      const result = directories.get(normalizePath(uri.fsPath));

      if (!result) {
        throw new Error(`ENOENT: ${uri.fsPath}`);
      }

      return result;
    }),
    stat: vi.fn(async (uri: vscode.Uri) => {
      const normalized = normalizePath(uri.fsPath);

      if (directories.has(normalized)) {
        return { type: vscode.FileType.Directory };
      }

      if (files.has(normalized)) {
        return { type: vscode.FileType.File };
      }

      throw new Error(`ENOENT: ${uri.fsPath}`);
    }),
  });
}

describe('SkillTreeProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vscode.workspace.workspaceFolders = undefined;
    Object.assign(vscode.workspace.fs, {
      readDirectory: async () => [],
      stat: async () => ({ type: vscode.FileType.Unknown }),
    });
  });

  it('detects skill.md files when scanning a folder', async () => {
    const skillFolder = path.resolve('virtual', 'skill-folder');

    configureVirtualFileSystem({
      [skillFolder]: [['SKILL.md', vscode.FileType.File]],
    });

    await expect(hasSkillMd(vscode.Uri.file(skillFolder))).resolves.toBe(true);
  });

  it('returns false when a folder cannot be read while checking for skill.md', async () => {
    Object.assign(vscode.workspace.fs, {
      readDirectory: vi.fn(async () => {
        throw new Error('boom');
      }),
    });

    await expect(hasSkillMd(vscode.Uri.file(path.resolve('virtual', 'missing')))).resolves.toBe(
      false,
    );
  });

  it('sets checkbox state for active and archived skill nodes', () => {
    const activeNode = new SkillNode(
      'active-skill',
      'skill-folder',
      vscode.TreeItemCollapsibleState.None,
      vscode.Uri.file(path.resolve('virtual', '.cursor', 'skills', 'active-skill')),
    );
    const archivedNode = new SkillNode(
      'archived-skill',
      'skill-folder',
      vscode.TreeItemCollapsibleState.None,
      vscode.Uri.file(path.resolve('virtual', '.cursor', 'skills', '.archived', 'archived-skill')),
    );

    expect(activeNode.checkboxState).toBe(vscode.TreeItemCheckboxState.Checked);
    expect(archivedNode.checkboxState).toBe(vscode.TreeItemCheckboxState.Unchecked);
  });

  it('aggregates skills container checkbox state from its children', () => {
    const checkedChild = new SkillNode(
      'active-skill',
      'skill-folder',
      vscode.TreeItemCollapsibleState.None,
      vscode.Uri.file(path.resolve('virtual', '.cursor', 'skills', 'active-skill')),
    );
    const uncheckedChild = new SkillNode(
      'archived-skill',
      'skill-folder',
      vscode.TreeItemCollapsibleState.None,
      vscode.Uri.file(path.resolve('virtual', '.cursor', 'skills', '.archived', 'archived-skill')),
    );

    const mixedContainer = new SkillNode(
      'skills',
      'skills-container',
      vscode.TreeItemCollapsibleState.Expanded,
      vscode.Uri.file(path.resolve('virtual', '.cursor', 'skills')),
      [checkedChild, uncheckedChild],
    );
    const archivedOnlyContainer = new SkillNode(
      'skills',
      'skills-container',
      vscode.TreeItemCollapsibleState.Expanded,
      vscode.Uri.file(path.resolve('virtual', '.claude', 'skills')),
      [uncheckedChild],
    );

    expect(mixedContainer.checkboxState).toBe(vscode.TreeItemCheckboxState.Checked);
    expect(archivedOnlyContainer.checkboxState).toBe(vscode.TreeItemCheckboxState.Unchecked);
  });

  it('returns workspace and global roots only for valid skill directories', async () => {
    const workspaceRoot = path.resolve('virtual-workspace');
    const homeRoot = path.resolve('virtual-home');

    vscode.workspace.workspaceFolders = [{ name: 'demo', uri: vscode.Uri.file(workspaceRoot) }];

    configureVirtualFileSystem({
      [workspaceRoot]: [
        ['.cursor', vscode.FileType.Directory],
        ['.forge', vscode.FileType.Directory],
      ],
      [path.join(workspaceRoot, '.cursor')]: [['skills', vscode.FileType.Directory]],
      [path.join(workspaceRoot, '.cursor', 'skills')]: [
        ['alpha-skill', vscode.FileType.Directory],
        ['empty-folder', vscode.FileType.Directory],
        ['.archived', vscode.FileType.Directory],
      ],
      [path.join(workspaceRoot, '.cursor', 'skills', 'alpha-skill')]: [
        ['skill.md', vscode.FileType.File],
      ],
      [path.join(workspaceRoot, '.cursor', 'skills', 'empty-folder')]: [
        ['notes.md', vscode.FileType.File],
      ],
      [path.join(workspaceRoot, '.cursor', 'skills', '.archived')]: [
        ['zeta-skill', vscode.FileType.Directory],
      ],
      [path.join(workspaceRoot, '.cursor', 'skills', '.archived', 'zeta-skill')]: [
        ['SKILL.md', vscode.FileType.File],
      ],
      [path.join(workspaceRoot, '.forge')]: [['other', vscode.FileType.Directory]],
      [homeRoot]: [['.claude', vscode.FileType.Directory]],
      [path.join(homeRoot, '.claude')]: [['skills', vscode.FileType.Directory]],
      [path.join(homeRoot, '.claude', 'skills')]: [['global-skill', vscode.FileType.Directory]],
      [path.join(homeRoot, '.claude', 'skills', 'global-skill')]: [
        ['skill.md', vscode.FileType.File],
      ],
    });

    const outputChannel = { appendLine: vi.fn() };
    const provider = new SkillTreeProvider(outputChannel, homeRoot);
    const roots = await provider.getChildren();

    expect(roots.map((node) => node.label)).toEqual(['demo (Workspace)', 'Global Skills']);

    const workspaceAgentRoot = roots[0].children?.[0];
    const workspaceSkillsContainer = workspaceAgentRoot?.children?.[0];

    expect(workspaceAgentRoot?.label).toBe('.cursor');
    expect(workspaceSkillsContainer?.label).toBe('skills');
    expect(workspaceSkillsContainer?.children?.map((node) => node.label)).toEqual([
      'alpha-skill',
      'zeta-skill',
    ]);
    expect(workspaceSkillsContainer?.children?.map((node) => node.checkboxState)).toEqual([
      vscode.TreeItemCheckboxState.Checked,
      vscode.TreeItemCheckboxState.Unchecked,
    ]);

    const globalAgentRoot = roots[1].children?.[0];
    expect(globalAgentRoot?.label).toBe('.claude');
    expect(globalAgentRoot?.children?.[0].children?.map((node) => node.label)).toEqual([
      'global-skill',
    ]);
  });
});
