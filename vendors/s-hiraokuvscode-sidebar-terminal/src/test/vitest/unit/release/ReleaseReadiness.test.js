'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const node_fs_1 = require('node:fs');
const node_path_1 = require('node:path');
const repoRoot = process.cwd();
const expectedKeywords = [
  'terminal',
  'sidebar',
  'ai',
  'claude',
  'copilot',
  'xterm',
  'shell',
  'split terminal',
  'session',
  'ime',
];
const allowedConsoleFiles = new Set(['src/utils/logger.ts']);
const productionConsolePattern = /\bconsole\.(log|debug|info)\b/;
const toPosix = (value) => value.split(node_path_1.default.sep).join('/');
const listTypeScriptFiles = (directory) => {
  const entries = node_fs_1.default.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = node_path_1.default.join(directory, entry.name);
    const relativePath = toPosix(node_path_1.default.relative(repoRoot, fullPath));
    if (entry.isDirectory()) {
      if (relativePath === 'src/test') {
        return [];
      }
      return listTypeScriptFiles(fullPath);
    }
    return entry.isFile() && entry.name.endsWith('.ts') ? [fullPath] : [];
  });
};
const findProductionConsoleCalls = () => {
  const srcDir = node_path_1.default.join(repoRoot, 'src');
  return listTypeScriptFiles(srcDir).flatMap((filePath) => {
    const relativePath = toPosix(node_path_1.default.relative(repoRoot, filePath));
    if (allowedConsoleFiles.has(relativePath)) {
      return [];
    }
    return node_fs_1.default
      .readFileSync(filePath, 'utf8')
      .split('\n')
      .flatMap((line, index) => {
        const trimmedLine = line.trim();
        const isComment =
          trimmedLine.startsWith('//') ||
          trimmedLine.startsWith('*') ||
          trimmedLine.startsWith('/*');
        if (isComment || trimmedLine.includes('onclick=') || !productionConsolePattern.test(line)) {
          return [];
        }
        return [`${relativePath}:${index + 1}: ${trimmedLine}`];
      });
  });
};
(0, vitest_1.describe)('1.0.0 release readiness', () => {
  (0, vitest_1.it)('uses stable release package metadata', () => {
    const packageJson = JSON.parse(
      node_fs_1.default.readFileSync(node_path_1.default.join(repoRoot, 'package.json'), 'utf8')
    );
    (0, vitest_1.expect)(packageJson.version).toBe('1.0.0');
    (0, vitest_1.expect)(packageJson.description).toBe(
      'Sidebar terminal for VS Code with AI agent awareness (Claude Code, Copilot, Gemini, Codex), split views, session persistence, and full IME support.'
    );
    (0, vitest_1.expect)(packageJson.keywords).toEqual(expectedKeywords);
  });
  (0, vitest_1.it)('documents the 1.0.0 stable release at the top of the changelog', () => {
    const changelog = node_fs_1.default.readFileSync(
      node_path_1.default.join(repoRoot, 'CHANGELOG.md'),
      'utf8'
    );
    const stableReleaseHeading =
      /^## \[1\.0\.0\]\(https:\/\/github\.com\/s-hiraoku\/vscode-sidebar-terminal\/compare\/v0\.6\.3\.\.\.v1\.0\.0\) \(\d{4}-\d{2}-\d{2}\)/m;
    const stableMatch = changelog.match(stableReleaseHeading);
    const previousReleaseHeading = '### [0.6.3]';
    (0, vitest_1.expect)(stableMatch).not.toBeNull();
    (0, vitest_1.expect)(stableMatch.index).toBeLessThan(changelog.indexOf(previousReleaseHeading));
    (0, vitest_1.expect)(changelog).toContain('**First stable release.**');
  });
  (0, vitest_1.it)('does not leave debug console output in production TypeScript paths', () => {
    (0, vitest_1.expect)(findProductionConsoleCalls()).toEqual([]);
  });
});
//# sourceMappingURL=ReleaseReadiness.test.js.map
