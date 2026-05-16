"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeNotificationService = void 0;
const vscode = require("vscode");
const logger_1 = require("../utils/logger");
const agentConstants_1 = require("./agentConstants");
const SETTING_PREFIX = 'secondaryTerminal';
const DEFAULT_COOLDOWN_MS = 10000;
class NativeNotificationService {
    constructor(execFileFn) {
        this.isDisposed = false;
        this.lastNotifiedAt = new Map();
        this.lastGlobalNotifiedAt = 0;
        this.execFileFn =
            execFileFn ??
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                require('child_process').execFile;
    }
    getConfig() {
        const config = vscode.workspace.getConfiguration(SETTING_PREFIX);
        return {
            enabled: config.get('nativeNotification.enabled', true),
            activateWindow: config.get('nativeNotification.activateWindow', true),
            cooldownMs: Math.max(1000, Math.min(60000, config.get('nativeNotification.cooldownMs', DEFAULT_COOLDOWN_MS))),
        };
    }
    canNotify(terminalId, cooldownMs) {
        const now = Date.now();
        if (now - this.lastGlobalNotifiedAt < cooldownMs) {
            return false;
        }
        const lastNotified = this.lastNotifiedAt.get(terminalId) ?? 0;
        if (now - lastNotified < cooldownMs) {
            return false;
        }
        this.lastNotifiedAt.set(terminalId, now);
        this.lastGlobalNotifiedAt = now;
        return true;
    }
    notifyAndActivate(terminalId, title, message) {
        if (this.isDisposed) {
            return;
        }
        // Skip native notifications entirely when VS Code is focused.
        // The user is already in VS Code — toast status bar is sufficient.
        // Spawning osascript/powershell can cause transient focus shifts.
        if (vscode.window.state.focused) {
            return;
        }
        const config = this.getConfig();
        if (!config.enabled || !this.canNotify(terminalId, config.cooldownMs)) {
            return;
        }
        const platform = process.platform;
        try {
            const shouldActivate = config.activateWindow;
            switch (platform) {
                case 'darwin':
                    this.notifyAndActivateMac(title, message, shouldActivate);
                    break;
                case 'win32':
                    this.notifyAndActivateWindows(title, message, shouldActivate);
                    break;
                case 'linux':
                    this.notifyAndActivateLinux(title, message, shouldActivate);
                    break;
                default:
                    (0, logger_1.terminal)('[NATIVE_NOTIFY] Unsupported platform:', platform);
                    break;
            }
        }
        catch (error) {
            (0, logger_1.terminal)('[NATIVE_NOTIFY] Error:', error);
        }
    }
    notifyCompleted(terminalId, title, message) {
        this.notifyAndActivate(terminalId, title, message);
    }
    getAppName() {
        try {
            return vscode.env.appName || 'Visual Studio Code';
        }
        catch {
            return 'Visual Studio Code';
        }
    }
    notifyAndActivateMac(title, message, activate) {
        const safeTitle = this.sanitize(title);
        const safeMessage = this.sanitize(message);
        const parts = [`display notification "${safeMessage}" with title "${safeTitle}"`];
        if (activate) {
            const appName = this.sanitize(this.getAppName());
            parts.push(`tell application "${appName}" to activate`);
        }
        const script = parts.join('\n');
        this.execFileFn('osascript', ['-e', script], (error) => {
            if (error) {
                (0, logger_1.terminal)('[NATIVE_NOTIFY] macOS error:', error);
            }
        });
    }
    notifyAndActivateWindows(title, message, activate) {
        const safeTitle = title.replace(/'/g, "''");
        const safeMessage = message.replace(/'/g, "''");
        const lines = [
            '[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null;',
            `$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02);`,
            `$textNodes = $template.GetElementsByTagName('text');`,
            `$textNodes.Item(0).AppendChild($template.CreateTextNode('${safeTitle}')) > $null;`,
            `$textNodes.Item(1).AppendChild($template.CreateTextNode('${safeMessage}')) > $null;`,
            `$toast = [Windows.UI.Notifications.ToastNotification]::new($template);`,
            `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('${agentConstants_1.NOTIFICATION_TITLE}').Show($toast);`,
        ];
        if (activate) {
            lines.push(`$vscode = Get-Process | Where-Object { $_.ProcessName -match '^Code( - Insiders)?$' -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1;`, `if ($vscode) {`, `  Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd); }';`, `  [Win32]::SetForegroundWindow($vscode.MainWindowHandle) > $null;`, `}`);
        }
        this.execFileFn('powershell', ['-Command', lines.join(' ')], (error) => {
            if (error) {
                (0, logger_1.terminal)('[NATIVE_NOTIFY] Windows error:', error);
            }
        });
    }
    notifyAndActivateLinux(title, message, activate) {
        this.execFileFn('notify-send', [title, message], (error) => {
            if (error) {
                (0, logger_1.terminal)('[NATIVE_NOTIFY] Linux notification error:', error);
            }
        });
        if (activate) {
            this.execFileFn('wmctrl', ['-a', this.getAppName()], (error) => {
                if (error) {
                    (0, logger_1.terminal)('[NATIVE_NOTIFY] Linux window activation error:', error);
                }
            });
        }
    }
    sanitize(str) {
        return str.replace(/[\\"]/g, '');
    }
    clearTerminal(terminalId) {
        this.lastNotifiedAt.delete(terminalId);
    }
    dispose() {
        this.isDisposed = true;
        this.lastNotifiedAt.clear();
        this.lastGlobalNotifiedAt = 0;
    }
}
exports.NativeNotificationService = NativeNotificationService;
//# sourceMappingURL=NativeNotificationService.js.map