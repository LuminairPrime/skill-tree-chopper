"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
suite('Extension Test Suite', () => {
    void vscode.window.showInformationMessage('Start all tests.');
    test('Extension should be present', () => {
        const extension = vscode.extensions.getExtension('s-hiraoku.vscode-sidebar-terminal');
        assert.ok(extension);
    });
    test('Should register commands', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('secondaryTerminal.createTerminal'));
        assert.ok(commands.includes('secondaryTerminal.killTerminal'));
        assert.ok(commands.includes('secondaryTerminal.splitTerminal'));
        assert.ok(commands.includes('secondaryTerminal.openSettings'));
    });
    test('Should activate extension', async () => {
        const extension = vscode.extensions.getExtension('s-hiraoku.vscode-sidebar-terminal');
        assert.ok(extension);
        if (extension && !extension.isActive) {
            await extension.activate();
        }
        assert.ok(extension && extension.isActive);
    });
});
//# sourceMappingURL=extension.test.js.map