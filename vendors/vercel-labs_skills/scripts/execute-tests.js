#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = require("node:child_process");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const node_process_1 = require("node:process");
const node_url_1 = require("node:url");
function parseArgs(argv, rootDir) {
    const testsDir = node_path_1.default.join(rootDir, 'tests');
    let filter;
    let listOnly = false;
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--list' || arg === '-l') {
            listOnly = true;
            continue;
        }
        if (arg === '--filter' || arg === '-f') {
            const pattern = argv[i + 1];
            if (!pattern)
                throw new Error('Missing value for --filter');
            filter = new RegExp(pattern);
            i++;
            continue;
        }
        if (arg === '--help' || arg === '-h') {
            console.log(`Usage: node scripts/execute-tests.ts [options]\n\nOptions:\n  -l, --list              List discovered test files and exit\n  -f, --filter <regex>    Only run tests whose path matches regex\n  -h, --help              Show help\n`);
            node_process_1.default.exit(0);
        }
        throw new Error(`Unknown argument: ${arg}`);
    }
    return { rootDir, testsDir, filter, listOnly };
}
async function findTestFiles(dir) {
    const entries = await (0, promises_1.readdir)(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const fullPath = node_path_1.default.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await findTestFiles(fullPath)));
            continue;
        }
        if (entry.isFile() && entry.name.endsWith('.test.ts')) {
            files.push(fullPath);
        }
    }
    return files.sort((a, b) => a.localeCompare(b));
}
async function runOneTest(rootDir, testFile) {
    return await new Promise((resolve, reject) => {
        const child = (0, node_child_process_1.spawn)('node', [testFile], {
            cwd: rootDir,
            stdio: 'inherit',
        });
        child.on('error', reject);
        child.on('exit', (code) => resolve(code ?? 1));
    });
}
async function main() {
    const scriptDir = node_path_1.default.dirname((0, node_url_1.fileURLToPath)(import.meta.url));
    const rootDir = node_path_1.default.resolve(scriptDir, '..');
    const opts = parseArgs(node_process_1.default.argv.slice(2), rootDir);
    let testFiles;
    try {
        testFiles = await findTestFiles(opts.testsDir);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        node_process_1.default.exit(1);
    }
    if (opts.filter) {
        testFiles = testFiles.filter((f) => opts.filter.test(f));
    }
    if (testFiles.length === 0) {
        node_process_1.default.exit(1);
    }
    if (opts.listOnly) {
        for (const file of testFiles)
            console.log(node_path_1.default.relative(opts.rootDir, file));
        return;
    }
    let failed = 0;
    for (const testFile of testFiles) {
        console.log(`\n— Running ${node_path_1.default.relative(opts.rootDir, testFile)} —`);
        const exitCode = await runOneTest(opts.rootDir, testFile);
        if (exitCode !== 0)
            failed++;
    }
    if (failed > 0) {
        node_process_1.default.exit(1);
    }
    console.log(`\nAll ${testFiles.length} test file(s) passed.`);
}
await main();
//# sourceMappingURL=execute-tests.js.map