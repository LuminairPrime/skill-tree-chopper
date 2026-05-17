import * as path from 'path';
import { vi } from 'vitest';

export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2,
}

export enum TreeItemCheckboxState {
  Unchecked = 0,
  Checked = 1,
}

export enum FileType {
  Unknown = 0,
  File = 1,
  Directory = 2,
  SymbolicLink = 64,
}

export enum ProgressLocation {
  Notification = 15,
}

export class Uri {
  constructor(public readonly fsPath: string) {}

  static file(fsPath: string): Uri {
    return new Uri(path.normalize(fsPath));
  }

  static joinPath(base: Uri, ...segments: string[]): Uri {
    return new Uri(path.join(base.fsPath, ...segments));
  }
}

export class ThemeIcon {
  constructor(public readonly id: string) {}
}

export class TreeItem {
  public id?: string;
  public checkboxState?: TreeItemCheckboxState;
  public iconPath?: ThemeIcon;
  public contextValue?: string;
  public resourceUri?: Uri;

  constructor(
    public readonly label: string,
    public readonly collapsibleState: TreeItemCollapsibleState,
  ) {}
}

type Listener<T> = (event: T) => void;

export interface Disposable {
  dispose(): void;
}

export type Event<T> = (listener: Listener<T>) => Disposable;

export class EventEmitter<T> {
  private readonly listeners: Listener<T>[] = [];

  readonly event: Event<T> = (listener: Listener<T>) => {
    this.listeners.push(listener);
    return {
      dispose: () => {
        const index = this.listeners.indexOf(listener);
        if (index >= 0) {
          this.listeners.splice(index, 1);
        }
      },
    };
  };

  fire(event: T): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export interface FileStat {
  type: FileType;
}

export interface OutputChannel {
  appendLine(value: string): void;
  dispose(): void;
}

export interface TreeDataProvider<T> {
  getTreeItem(element: T): TreeItem;
  getChildren(element?: T): Promise<T[]>;
}

type CommandHandler = (...args: readonly unknown[]) => unknown;

type CheckboxStateChangeEvent<T> = {
  items: Array<readonly [T, TreeItemCheckboxState]>;
};

type CheckboxListener = (event: CheckboxStateChangeEvent<unknown>) => unknown;

type MockTreeView = Disposable & {
  onDidChangeCheckboxState(listener: CheckboxListener): Disposable;
};

type MockTreeViewCall = {
  id: string;
  options: unknown;
  treeView: MockTreeView;
};

const mockState = {
  registeredCommands: new Map<string, CommandHandler>(),
  checkboxListeners: [] as CheckboxListener[],
  treeViewCalls: [] as MockTreeViewCall[],
};

function createDisposable(onDispose?: () => void): Disposable {
  return {
    dispose: () => {
      onDispose?.();
    },
  };
}

export const workspace = {
  workspaceFolders: undefined as Array<{ name: string; uri: Uri }> | undefined,
  fs: {
    readDirectory: vi.fn(async (_uri: Uri): Promise<[string, FileType][]> => []),
    stat: vi.fn(async (_uri: Uri): Promise<FileStat> => ({ type: FileType.Unknown })),
    createDirectory: vi.fn(async (_uri: Uri): Promise<void> => undefined),
    rename: vi.fn(
      async (_source: Uri, _target: Uri, _options?: { overwrite?: boolean }): Promise<void> =>
        undefined,
    ),
  },
};

export const window = {
  createOutputChannel: vi.fn(
    (_name: string): OutputChannel => ({
      appendLine: vi.fn(),
      dispose: vi.fn(),
    }),
  ),
  createTreeView: vi.fn((id: string, options: unknown): MockTreeView => {
    const treeView: MockTreeView = {
      onDidChangeCheckboxState: vi.fn((listener: CheckboxListener) => {
        mockState.checkboxListeners.push(listener);
        return createDisposable(() => {
          const index = mockState.checkboxListeners.indexOf(listener);
          if (index >= 0) {
            mockState.checkboxListeners.splice(index, 1);
          }
        });
      }),
      dispose: vi.fn(),
    };

    mockState.treeViewCalls.push({ id, options, treeView });
    return treeView;
  }),
  withProgress: vi.fn(async (_options: unknown, task: (...args: readonly unknown[]) => unknown) =>
    task({ report: vi.fn() }),
  ),
  showErrorMessage: vi.fn(),
};

export const commands = {
  registerCommand: vi.fn((command: string, handler: CommandHandler): Disposable => {
    mockState.registeredCommands.set(command, handler);
    return createDisposable(() => {
      mockState.registeredCommands.delete(command);
    });
  }),
};

export function __getRegisteredCommand(command: string): CommandHandler | undefined {
  return mockState.registeredCommands.get(command);
}

export function __getTreeViewCalls(): ReadonlyArray<MockTreeViewCall> {
  return mockState.treeViewCalls;
}

export async function __fireTreeCheckboxChange(
  event: CheckboxStateChangeEvent<unknown>,
): Promise<void> {
  for (const listener of [...mockState.checkboxListeners]) {
    await Promise.resolve(listener(event));
  }
}

export function __resetMockState(): void {
  mockState.registeredCommands.clear();
  mockState.checkboxListeners.length = 0;
  mockState.treeViewCalls.length = 0;

  workspace.workspaceFolders = undefined;

  workspace.fs.readDirectory.mockReset();
  workspace.fs.readDirectory.mockImplementation(async (_uri: Uri) => []);

  workspace.fs.stat.mockReset();
  workspace.fs.stat.mockImplementation(async (_uri: Uri) => ({ type: FileType.Unknown }));

  workspace.fs.createDirectory.mockReset();
  workspace.fs.createDirectory.mockImplementation(async (_uri: Uri) => undefined);

  workspace.fs.rename.mockReset();
  workspace.fs.rename.mockImplementation(
    async (_source: Uri, _target: Uri, _options?: { overwrite?: boolean }) => undefined,
  );

  window.createOutputChannel.mockReset();
  window.createOutputChannel.mockImplementation(
    (_name: string): OutputChannel => ({
      appendLine: vi.fn(),
      dispose: vi.fn(),
    }),
  );

  window.createTreeView.mockReset();
  window.createTreeView.mockImplementation((id: string, options: unknown): MockTreeView => {
    const treeView: MockTreeView = {
      onDidChangeCheckboxState: vi.fn((listener: CheckboxListener) => {
        mockState.checkboxListeners.push(listener);
        return createDisposable(() => {
          const index = mockState.checkboxListeners.indexOf(listener);
          if (index >= 0) {
            mockState.checkboxListeners.splice(index, 1);
          }
        });
      }),
      dispose: vi.fn(),
    };

    mockState.treeViewCalls.push({ id, options, treeView });
    return treeView;
  });

  window.withProgress.mockReset();
  window.withProgress.mockImplementation(
    async (_options: unknown, task: (...args: readonly unknown[]) => unknown) =>
      task({ report: vi.fn() }),
  );

  window.showErrorMessage.mockReset();

  commands.registerCommand.mockReset();
  commands.registerCommand.mockImplementation((command: string, handler: CommandHandler) => {
    mockState.registeredCommands.set(command, handler);
    return createDisposable(() => {
      mockState.registeredCommands.delete(command);
    });
  });
}

__resetMockState();
