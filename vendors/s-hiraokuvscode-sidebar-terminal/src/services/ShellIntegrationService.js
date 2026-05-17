'use strict';
/**
 * VS Code Shell Integration Service
 *
 * Implements VS Code standard shell integration features:
 * - Command tracking and history
 * - Working directory detection
 * - Command status indicators
 * - Shell prompt detection
 * - Command link providers
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ShellIntegrationService = void 0;
const vscode = require('vscode');
const logger_1 = require('../utils/logger');
const common_1 = require('../utils/common');
class ShellIntegrationService {
  constructor(terminalManager, context) {
    this.terminalManager = terminalManager;
    this.states = new Map();
    this.cwdDetectionPatterns = [];
    this.promptPatterns = [];
    this.commandStartTime = new Map();
    this.shellIntegrationPermissionGranted = undefined;
    // VS Code standard shell integration sequences
    this.OSC_SEQUENCES = {
      COMMAND_START: '\x1b]633;A\x07',
      COMMAND_EXECUTED: '\x1b]633;B\x07',
      COMMAND_FINISHED: '\x1b]633;C\x07',
      CWD: '\x1b]633;P;Cwd=',
      PROMPT_START: '\x1b]633;D\x07',
      PROMPT_END: '\x1b]633;E\x07',
    };
    this.initializePatterns();
    // Don't setup event listeners in constructor - wait for terminal creation
    // Store context for persistent settings
    if (context) {
      this.context = context;
      // Load previously saved permission
      this.shellIntegrationPermissionGranted = context.globalState.get(
        'shellIntegrationPermission'
      );
    } else {
      // Fallback if no context provided (for backward compatibility)
      this.context = null;
    }
  }
  initializePatterns() {
    try {
      // Common shell prompt patterns
      this.promptPatterns = [
        /^[^@]+@[^:]+:[^$#]+[$#]\s*$/, // user@host:path$
        /^.*\$\s*$/, // basic $ prompt
        /^.*#\s*$/, // root # prompt
        /^>\s*$/, // PowerShell
        /^PS\s+.*>\s*$/, // PowerShell with path
        /^❯\s*$/, // Starship/fancy prompts
        /^➜\s*$/, // Oh My Zsh
      ];
      // CWD detection patterns
      this.cwdDetectionPatterns = [
        /^cd\s+(.+)\s*$/, // cd command
        /^pushd\s+(.+)\s*$/, // pushd command
        /^z\s+(.+)\s*$/, // zoxide
        /\x1b\]633;P;Cwd=([^\x07]+)\x07/, // VS Code OSC sequence
      ];
    } catch (error) {
      (0, logger_1.terminal)('Failed to initialize shell integration patterns:', error);
      // Initialize with empty arrays to prevent crashes
      this.promptPatterns = [];
      this.cwdDetectionPatterns = [];
    }
  }
  /**
   * Process terminal data directly - called by TerminalManager
   */
  processTerminalData(terminalId, data) {
    if (terminalId && data) {
      this.processTerminalOutput(terminalId, data);
    }
  }
  /**
   * Process terminal output for shell integration sequences
   */
  processTerminalOutput(terminalId, data) {
    const state = this.getOrCreateState(terminalId);
    // Check for VS Code OSC sequences
    if (data.includes(this.OSC_SEQUENCES.COMMAND_START)) {
      this.handleCommandStart(state);
    }
    // Check for sequences that might have arguments (check prefix without terminator)
    const cmdExecutedPrefix = this.OSC_SEQUENCES.COMMAND_EXECUTED.replace('\x07', '');
    if (data.includes(cmdExecutedPrefix)) {
      this.handleCommandExecuted(state, data);
    }
    const cmdFinishedPrefix = this.OSC_SEQUENCES.COMMAND_FINISHED.replace('\x07', '');
    if (data.includes(cmdFinishedPrefix)) {
      this.handleCommandFinished(state, data);
    }
    // Check for CWD change
    const cwdMatch = data.match(/\x1b\]633;P;Cwd=([^\x07]+)\x07/);
    if (cwdMatch && cwdMatch[1]) {
      this.handleCwdChange(state, cwdMatch[1]);
    }
    // Fallback prompt detection for shells without integration
    if (!data.includes('\x1b]633')) {
      this.detectPromptFallback(state, data);
    }
  }
  handleCommandStart(state) {
    state.isExecuting = true;
    this.commandStartTime.set(state.terminalId, Date.now());
    // Send status update to webview
    this.sendStatusUpdate(state.terminalId, 'executing');
  }
  handleCommandExecuted(state, data) {
    // Extract command from data if available
    const commandMatch = data.match(/\x1b\]633;B;([^\x07]+)\x07/);
    if (commandMatch && commandMatch[1]) {
      state.currentCommand = commandMatch[1];
    }
  }
  handleCommandFinished(state, data) {
    // Extract exit code if available
    const exitCodeMatch = data.match(/\x1b\]633;C;(\d+)\x07/);
    const exitCode = exitCodeMatch && exitCodeMatch[1] ? parseInt(exitCodeMatch[1], 10) : undefined;
    // Calculate duration
    const startTime = this.commandStartTime.get(state.terminalId);
    const duration = startTime ? Date.now() - startTime : undefined;
    // Add to history
    if (state.currentCommand) {
      const command = {
        command: state.currentCommand,
        cwd: state.currentCwd,
        exitCode,
        duration,
        timestamp: Date.now(),
      };
      state.commandHistory.push(command);
      // Limit history size
      if (state.commandHistory.length > 100) {
        state.commandHistory.shift();
      }
    }
    state.isExecuting = false;
    state.currentCommand = undefined;
    this.commandStartTime.delete(state.terminalId);
    // Send status update
    this.sendStatusUpdate(state.terminalId, exitCode === 0 ? 'success' : 'error');
  }
  handleCwdChange(state, cwd) {
    if (cwd) {
      state.currentCwd = cwd;
      try {
        this.terminalManager.updateTerminalCwd(state.terminalId, cwd);
      } catch (error) {
        (0, logger_1.terminal)('Failed to update terminal cwd:', error);
      }
      // Send CWD update to webview
      this.sendCwdUpdate(state.terminalId, cwd);
    }
  }
  detectPromptFallback(state, data) {
    // Try to detect prompts using patterns
    for (const pattern of this.promptPatterns) {
      if (pattern.test(data)) {
        state.lastPrompt = data;
        if (state.isExecuting) {
          // Command likely finished
          state.isExecuting = false;
          this.sendStatusUpdate(state.terminalId, 'ready');
        }
        break;
      }
    }
    // Try to detect CWD changes
    for (const pattern of this.cwdDetectionPatterns) {
      const match = data.match(pattern);
      if (match && match[1]) {
        this.handleCwdChange(state, match[1]);
        break;
      }
    }
  }
  getOrCreateState(terminalId) {
    if (!this.states.has(terminalId)) {
      this.states.set(terminalId, {
        terminalId,
        currentCwd: (0, common_1.safeProcessCwd)(),
        commandHistory: [],
        isExecuting: false,
      });
    }
    return this.states.get(terminalId);
  }
  /**
   * Send status update to webview
   */
  sendStatusUpdate(terminalId, status) {
    vscode.commands.executeCommand('secondaryTerminal.updateShellStatus', {
      terminalId,
      status,
    });
  }
  /**
   * Send CWD update to webview
   */
  sendCwdUpdate(terminalId, cwd) {
    vscode.commands.executeCommand('secondaryTerminal.updateCwd', {
      terminalId,
      cwd,
    });
  }
  /**
   * Get command history for a terminal
   */
  getCommandHistory(terminalId) {
    const state = this.states.get(terminalId);
    return state ? [...state.commandHistory] : [];
  }
  /**
   * Get current working directory for a terminal
   */
  getCurrentCwd(terminalId) {
    const state = this.states.get(terminalId);
    return state ? state.currentCwd : (0, common_1.safeProcessCwd)();
  }
  /**
   * Check if terminal is executing a command
   */
  isExecuting(terminalId) {
    const state = this.states.get(terminalId);
    return state ? state.isExecuting : false;
  }
  /**
   * Inject shell integration script
   * This is called when a new terminal is created
   */
  async injectShellIntegration(_terminalId, shell, ptyProcess) {
    // Check if shell integration is enabled in settings
    const config = vscode.workspace.getConfiguration('secondaryTerminal');
    const shellIntegrationEnabled = config.get('enableShellIntegration', true);
    if (!shellIntegrationEnabled) {
      (0, logger_1.terminal)('Shell integration disabled in settings');
      return;
    }
    // Check if user has granted permission for shell integration
    if (this.shellIntegrationPermissionGranted === undefined) {
      // First time - ask for permission
      const granted = await this.requestShellIntegrationPermission();
      if (!granted) {
        (0, logger_1.terminal)('Shell integration permission denied by user');
        return;
      }
    } else if (this.shellIntegrationPermissionGranted === false) {
      // User previously denied permission
      return;
    }
    // Permission granted - inject shell integration
    // Detect shell type and inject appropriate integration
    if ((shell && shell.includes('bash')) || (shell && shell.includes('zsh'))) {
      this.injectBashZshIntegration(ptyProcess);
    } else if (shell && shell.includes('fish')) {
      this.injectFishIntegration(ptyProcess);
    } else if (shell && (shell.includes('powershell') || shell.includes('pwsh'))) {
      this.injectPowerShellIntegration(ptyProcess);
    }
  }
  /**
   * Request user permission to inject shell integration scripts
   *
   * Displays a modal dialog asking the user for permission to inject shell
   * integration scripts. The user's choice can be saved persistently.
   *
   * @returns Promise<boolean> - true if permission granted, false otherwise
   */
  async requestShellIntegrationPermission() {
    const { MAIN_MESSAGE, BUTTON_ALLOW, BUTTON_ALWAYS_ALLOW, BUTTON_DENY, BUTTON_NEVER_ALLOW } =
      ShellIntegrationService.PERMISSION_MESSAGES;
    const result = await vscode.window.showWarningMessage(
      MAIN_MESSAGE,
      { modal: true },
      BUTTON_ALLOW,
      BUTTON_ALWAYS_ALLOW,
      BUTTON_DENY,
      BUTTON_NEVER_ALLOW
    );
    // Handle user's choice
    switch (result) {
      case BUTTON_ALLOW:
        // Allow for this session only
        this.shellIntegrationPermissionGranted = true;
        (0, logger_1.terminal)('Shell integration allowed for this session');
        return true;
      case BUTTON_ALWAYS_ALLOW:
        // Always allow - save to persistent storage
        this.shellIntegrationPermissionGranted = true;
        if (this.context) {
          await this.context.globalState.update('shellIntegrationPermission', true);
        }
        (0, logger_1.terminal)('Shell integration always allowed (saved to settings)');
        return true;
      case BUTTON_NEVER_ALLOW:
        // Never allow - save to persistent storage
        this.shellIntegrationPermissionGranted = false;
        if (this.context) {
          await this.context.globalState.update('shellIntegrationPermission', false);
        }
        (0, logger_1.terminal)('Shell integration never allowed (saved to settings)');
        return false;
      default:
        // Deny for this session (user dismissed dialog or clicked Deny)
        this.shellIntegrationPermissionGranted = false;
        (0, logger_1.terminal)('Shell integration denied for this session');
        return false;
    }
  }
  injectBashZshIntegration(ptyProcess) {
    // VS Code standard shell integration for bash/zsh with enhanced history support
    const script = `
# VS Code Shell Integration with History Support
__vsc_prompt_cmd() {
  printf "\\033]633;A\\007"
}
__vsc_preexec() {
  printf "\\033]633;B;%s\\007" "$1"
}
__vsc_precmd() {
  local ret=$?
  printf "\\033]633;C;%s\\007" "$ret"
  printf "\\033]633;P;Cwd=%s\\007" "$PWD"
}

# Enhanced History Configuration
if [[ -n "$BASH_VERSION" ]]; then
  # Bash history settings for better terminal history
  export HISTSIZE=1000
  export HISTFILESIZE=2000
  export HISTCONTROL=ignoreboth:erasedups
  export HISTIGNORE="ls:ll:cd:pwd:bg:fg:history"
  shopt -s histappend
  shopt -s cmdhist
  
  # Ensure prompt is set if not already defined
  if [[ -z "\$PS1" ]]; then
    export PS1='\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ '
  fi
  
  # Setup hooks - preserve existing PROMPT_COMMAND
  trap '__vsc_preexec' DEBUG
  if [[ -n "\$PROMPT_COMMAND" ]]; then
    PROMPT_COMMAND="history -a; history -c; history -r; __vsc_precmd; \$PROMPT_COMMAND"
  else
    PROMPT_COMMAND="history -a; history -c; history -r; __vsc_precmd"
  fi
elif [[ -n "$ZSH_VERSION" ]]; then
  # Zsh history settings for better terminal history
  export HISTSIZE=1000
  export SAVEHIST=2000
  setopt HIST_IGNORE_ALL_DUPS
  setopt HIST_IGNORE_SPACE
  setopt HIST_REDUCE_BLANKS
  setopt HIST_SAVE_NO_DUPS
  setopt SHARE_HISTORY
  setopt APPEND_HISTORY
  setopt INC_APPEND_HISTORY
  
  # Ensure prompt is set if not already defined
  if [[ -z "\$PS1" ]] && [[ -z "\$PROMPT" ]]; then
    export PS1='%n@%m:%~%# '
  fi
  
  # Setup hooks
  preexec_functions+=(__vsc_preexec)
  precmd_functions+=(__vsc_precmd)
fi

# Enable history expansion
set +H 2>/dev/null || true
`;
    ptyProcess.write(script + '\n');
  }
  injectFishIntegration(ptyProcess) {
    // VS Code standard shell integration for fish with enhanced history support
    const script = `
# VS Code Shell Integration for Fish with History Support
function __vsc_preexec --on-event fish_preexec
  printf "\\033]633;B;%s\\007" "$argv"
end

function __vsc_prompt --on-event fish_prompt
  printf "\\033]633;A\\007"
  printf "\\033]633;P;Cwd=%s\\007" "$PWD"
end

function __vsc_postexec --on-event fish_postexec
  printf "\\033]633;C;%s\\007" "$status"
end

# Enhanced Fish History Configuration
set -U fish_history_max_length 1000
set -U fish_history_save_timestamp yes
set -U fish_history_ignore_dups yes
set -U fish_history_ignore_space yes

# Enable better history search
function fish_user_key_bindings
  # Arrow key history search (if not already set)
  bind \\e'[A' history-search-backward 2>/dev/null
  bind \\e'[B' history-search-forward 2>/dev/null
  bind -k up history-search-backward 2>/dev/null  
  bind -k down history-search-forward 2>/dev/null
end
`;
    ptyProcess.write(script + '\n');
  }
  injectPowerShellIntegration(ptyProcess) {
    // VS Code standard shell integration for PowerShell with enhanced history support
    const script = `
# VS Code Shell Integration for PowerShell with History Support
function Global:__VSCode-Prompt-Start { 
  Write-Host -NoNewline "]633;A$([char]7)" 
}
function Global:__VSCode-Prompt-End { 
  Write-Host -NoNewline "]633;P;Cwd=$($PWD.Path)$([char]7)" 
}

# Enhanced PowerShell History Configuration
$MaximumHistoryCount = 1000
Set-PSReadLineOption -MaximumHistoryCount 1000
Set-PSReadLineOption -HistoryNoDuplicates:$true
Set-PSReadLineOption -HistorySearchCursorMovesToEnd:$true
Set-PSReadLineOption -HistorySearchCaseSensitive:$false

# Enhanced history search keybindings
Set-PSReadLineKeyHandler -Key UpArrow -Function HistorySearchBackward
Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward
Set-PSReadLineKeyHandler -Key Ctrl+r -Function ReverseSearchHistory

$Global:__VSCodeOriginalPrompt = $function:prompt
function Global:prompt {
  __VSCode-Prompt-Start
  & $Global:__VSCodeOriginalPrompt
  __VSCode-Prompt-End
}
`;
    ptyProcess.write(script + '\n');
  }
  /**
   * Clean up resources for a terminal
   */
  disposeTerminal(terminalId) {
    this.states.delete(terminalId);
    this.commandStartTime.delete(terminalId);
  }
  dispose() {
    this.states.clear();
    this.commandStartTime.clear();
  }
}
exports.ShellIntegrationService = ShellIntegrationService;
/**
 * Shell Integration Permission Dialog Constants
 *
 * These messages are displayed when requesting user permission to inject
 * shell integration scripts into their terminal sessions.
 */
ShellIntegrationService.PERMISSION_MESSAGES = {
  MAIN_MESSAGE:
    'Secondary Terminal wants to enable Shell Integration to provide enhanced features like command tracking and history. This requires modifying your shell startup script.',
  BUTTON_ALLOW: 'Allow',
  BUTTON_DENY: 'Deny',
  BUTTON_ALWAYS_ALLOW: 'Always Allow',
  BUTTON_NEVER_ALLOW: 'Never Allow',
};
//# sourceMappingURL=ShellIntegrationService.js.map
