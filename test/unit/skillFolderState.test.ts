import * as path from 'path';
import { describe, expect, it } from 'vitest';
import {
  getSkillFolderCheckboxState,
  getSkillFolderMoveTarget,
  getSkillsContainerCheckboxState,
  isArchivedSkillFolder,
  isSkillMarkdownFile,
} from '../../src/skillFolderState';

function buildPath(...segments: string[]): string {
  return path.join('workspace', ...segments);
}

describe('skillFolderState', () => {
  it('matches skill.md case-insensitively', () => {
    expect(isSkillMarkdownFile('skill.md')).toBe(true);
    expect(isSkillMarkdownFile('SKILL.md')).toBe(true);
    expect(isSkillMarkdownFile('Skill.MD')).toBe(true);
  });

  it('rejects non-skill markdown file names', () => {
    expect(isSkillMarkdownFile('skill.mdx')).toBe(false);
    expect(isSkillMarkdownFile('my-skill.md')).toBe(false);
    expect(isSkillMarkdownFile('skill.md.bak')).toBe(false);
    expect(isSkillMarkdownFile('skill')).toBe(false);
  });

  it('treats an immediate .archived parent as archived', () => {
    const archivedPath = buildPath('.cursor', 'skills', '.archived', 'my-skill');

    expect(isArchivedSkillFolder(archivedPath)).toBe(true);
    expect(getSkillFolderCheckboxState(archivedPath)).toBe('unchecked');
  });

  it('ignores .archived when it is not the immediate parent', () => {
    const activePath = buildPath('.archived', '.cursor', 'skills', 'my-skill');

    expect(isArchivedSkillFolder(activePath)).toBe(false);
    expect(getSkillFolderCheckboxState(activePath)).toBe('checked');
  });

  it('marks containers as checked when empty or when any child is checked', () => {
    expect(getSkillsContainerCheckboxState([])).toBe('checked');
    expect(getSkillsContainerCheckboxState(['checked', 'unchecked'])).toBe('checked');
  });

  it('marks containers as unchecked only when all children are unchecked', () => {
    expect(getSkillsContainerCheckboxState(['unchecked', 'unchecked'])).toBe('unchecked');
  });

  it('computes archive and restore targets only for real state changes', () => {
    const activePath = buildPath('.cursor', 'skills', 'my-skill');
    const archivedPath = buildPath('.cursor', 'skills', '.archived', 'my-skill');

    expect(getSkillFolderMoveTarget(activePath, false)).toBe(archivedPath);
    expect(getSkillFolderMoveTarget(archivedPath, true)).toBe(activePath);
    expect(getSkillFolderMoveTarget(activePath, true)).toBeUndefined();
    expect(getSkillFolderMoveTarget(archivedPath, false)).toBeUndefined();
  });
});
