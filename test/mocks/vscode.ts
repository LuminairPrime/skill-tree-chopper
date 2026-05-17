import * as path from 'path';

export enum TreeItemCollapsibleState {
    None = 0,
    Collapsed = 1,
    Expanded = 2
}

export enum TreeItemCheckboxState {
    Unchecked = 0,
    Checked = 1
}

export enum FileType {
    Unknown = 0,
    File = 1,
    Directory = 2,
    SymbolicLink = 64
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
        public readonly collapsibleState: TreeItemCollapsibleState
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
            }
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
}

export interface TreeDataProvider<T> {
    getTreeItem(element: T): TreeItem;
    getChildren(element?: T): Promise<T[]>;
}

export const workspace = {
    workspaceFolders: undefined as Array<{ name: string; uri: Uri }> | undefined,
    fs: {
        readDirectory: async (_uri: Uri): Promise<[string, FileType][]> => [],
        stat: async (_uri: Uri): Promise<FileStat> => ({ type: FileType.Unknown })
    }
};