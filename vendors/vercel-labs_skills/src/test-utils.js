"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripAnsi = stripAnsi;
exports.stripLogo = stripLogo;
exports.hasLogo = hasLogo;
exports.runCli = runCli;
exports.runCliOutput = runCliOutput;
exports.runCliWithInput = runCliWithInput;
const child_process_1 = require("child_process");
const path_1 = require("path");
const sanitize_ts_1 = require("./sanitize.ts");
// const PROJECT_ROOT = join(import.meta.dirname, '..');
const CLI_PATH = (0, path_1.join)(import.meta.dirname, 'cli.ts');
function stripAnsi(str) {
    return (0, sanitize_ts_1.stripTerminalEscapes)(str);
}
function stripLogo(str) {
    return str
        .split('\n')
        .filter((line) => !line.includes('███') && !line.includes('╔') && !line.includes('╚'))
        .join('\n')
        .replace(/^\n+/, '');
}
function hasLogo(str) {
    return str.includes('███') || str.includes('╔') || str.includes('╚');
}
function runCli(args, cwd, env, timeout) {
    try {
        const output = (0, child_process_1.execSync)(`node "${CLI_PATH}" ${args.join(' ')}`, {
            encoding: 'utf-8',
            cwd,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: env ? { ...process.env, ...env } : undefined,
            timeout: timeout ?? 30000,
        });
        return { stdout: stripAnsi(output), stderr: '', exitCode: 0 };
    }
    catch (error) {
        return {
            stdout: stripAnsi(error.stdout || ''),
            stderr: stripAnsi(error.stderr || ''),
            exitCode: error.status || 1,
        };
    }
}
function runCliOutput(args, cwd) {
    const result = runCli(args, cwd);
    return result.stdout || result.stderr;
}
function runCliWithInput(args, input, cwd) {
    try {
        const output = (0, child_process_1.execSync)(`node "${CLI_PATH}" ${args.join(' ')}`, {
            encoding: 'utf-8',
            cwd,
            input: input + '\n',
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        return { stdout: stripAnsi(output), stderr: '', exitCode: 0 };
    }
    catch (error) {
        return {
            stdout: stripAnsi(error.stdout || ''),
            stderr: stripAnsi(error.stderr || ''),
            exitCode: error.status || 1,
        };
    }
}
//# sourceMappingURL=test-utils.js.map