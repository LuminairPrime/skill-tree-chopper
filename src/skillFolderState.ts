import * as path from 'path';

export type SkillCheckboxState = 'checked' | 'unchecked';

export function isSkillMarkdownFile(name: string): boolean {
  return name.toLowerCase() === 'skill.md';
}

export function isArchivedSkillFolder(fsPath: string): boolean {
  return path.basename(path.dirname(fsPath)) === '.archived';
}

export function getSkillFolderCheckboxState(fsPath: string): SkillCheckboxState {
  return isArchivedSkillFolder(fsPath) ? 'unchecked' : 'checked';
}

export function getSkillsContainerCheckboxState(
  childStates: ReadonlyArray<SkillCheckboxState>,
): SkillCheckboxState {
  if (childStates.length === 0) {
    return 'checked';
  }

  return childStates.some((state) => state === 'checked') ? 'checked' : 'unchecked';
}

export function getSkillFolderMoveTarget(
  currentFsPath: string,
  isChecking: boolean,
): string | undefined {
  const parentDir = path.dirname(currentFsPath);
  const parentDirName = path.basename(parentDir);
  const skillFolderName = path.basename(currentFsPath);

  if (isChecking) {
    if (parentDirName !== '.archived') {
      return undefined;
    }

    return path.join(path.dirname(parentDir), skillFolderName);
  }

  if (parentDirName === '.archived') {
    return undefined;
  }

  return path.join(parentDir, '.archived', skillFolderName);
}
