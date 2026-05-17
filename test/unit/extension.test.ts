import * as path from 'path';
import * as vscode from 'vscode';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { activate } from '../../src/extension';
import { SkillTreeProvider } from '../../src/SkillTreeProvider';

type MockVscode = typeof vscode & {
  __getRegisteredCommand(command: string): ((...args: readonly unknown[]) => unknown) | undefined;
  __getTreeViewCalls(): ReadonlyArray<{ id: string; options: unknown }>;
  __fireTreeCheckboxChange(event: {
    items: Array<readonly [unknown, vscode.TreeItemCheckboxState]>;
  }): Promise<void>;
  __resetMockState(): void;
};

const mockVscode = vscode as MockVscode;

function createContext(): vscode.ExtensionContext {
  return {
    subscriptions: [],
  } as unknown as vscode.ExtensionContext;
}

describe('extension activation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockVscode.__resetMockState();
  });

  it('registers the tree view and refresh command on activation', () => {
    activate(createContext());

    expect(vscode.window.createTreeView).toHaveBeenCalledWith(
      'aiSkillAuditor',
      expect.objectContaining({
        showCollapseAll: true,
        manageCheckboxStateManually: true,
      }),
    );
    expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(1);
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'aiSkills.refresh',
      expect.any(Function),
    );
    expect(mockVscode.__getTreeViewCalls()).toHaveLength(1);
  });

  it('runs provider refresh when the refresh command is executed', () => {
    const refreshSpy = vi.spyOn(SkillTreeProvider.prototype, 'refresh');

    activate(createContext());

    const refreshCommand = mockVscode.__getRegisteredCommand('aiSkills.refresh');

    expect(refreshCommand).toBeTypeOf('function');

    refreshCommand?.();

    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it('archives a skill folder when it is unchecked', async () => {
    const refreshSpy = vi.spyOn(SkillTreeProvider.prototype, 'refresh');
    const skillPath = path.resolve('virtual', '.cursor', 'skills', 'alpha-skill');
    const archivedDir = path.join(path.dirname(skillPath), '.archived');
    const archivedSkillPath = path.join(archivedDir, 'alpha-skill');

    vscode.workspace.fs.readDirectory.mockImplementation(async (uri: vscode.Uri) => {
      if (uri.fsPath === skillPath) {
        return [['SKILL.md', vscode.FileType.File]];
      }

      return [];
    });

    activate(createContext());

    await mockVscode.__fireTreeCheckboxChange({
      items: [
        [
          {
            type: 'skill-folder',
            resourceUri: vscode.Uri.file(skillPath),
          },
          vscode.TreeItemCheckboxState.Unchecked,
        ],
      ],
    });

    expect(vscode.window.withProgress).not.toHaveBeenCalled();
    expect(vscode.workspace.fs.createDirectory).toHaveBeenCalledWith(vscode.Uri.file(archivedDir));
    expect(vscode.workspace.fs.rename).toHaveBeenCalledWith(
      vscode.Uri.file(skillPath),
      vscode.Uri.file(archivedSkillPath),
      { overwrite: false },
    );
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it('restores all child skills when a container is checked', async () => {
    const refreshSpy = vi.spyOn(SkillTreeProvider.prototype, 'refresh');
    const firstArchivedSkill = path.resolve(
      'virtual',
      '.cursor',
      'skills',
      '.archived',
      'alpha-skill',
    );
    const secondArchivedSkill = path.resolve(
      'virtual',
      '.cursor',
      'skills',
      '.archived',
      'beta-skill',
    );

    activate(createContext());

    await mockVscode.__fireTreeCheckboxChange({
      items: [
        [
          {
            type: 'skills-container',
            children: [
              { resourceUri: vscode.Uri.file(firstArchivedSkill) },
              { resourceUri: vscode.Uri.file(secondArchivedSkill) },
            ],
          },
          vscode.TreeItemCheckboxState.Checked,
        ],
      ],
    });

    expect(vscode.window.withProgress).toHaveBeenCalledTimes(1);
    expect(vscode.workspace.fs.createDirectory).not.toHaveBeenCalled();
    expect(vscode.workspace.fs.rename).toHaveBeenNthCalledWith(
      1,
      vscode.Uri.file(firstArchivedSkill),
      vscode.Uri.file(path.join(path.dirname(path.dirname(firstArchivedSkill)), 'alpha-skill')),
      { overwrite: false },
    );
    expect(vscode.workspace.fs.rename).toHaveBeenNthCalledWith(
      2,
      vscode.Uri.file(secondArchivedSkill),
      vscode.Uri.file(path.join(path.dirname(path.dirname(secondArchivedSkill)), 'beta-skill')),
      { overwrite: false },
    );
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });
});
