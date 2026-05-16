"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setVersion = setVersion;
exports.fetchAuditData = fetchAuditData;
exports.track = track;
exports.flushTelemetry = flushTelemetry;
const TELEMETRY_URL = 'https://add-skill.vercel.sh/t';
const AUDIT_URL = 'https://add-skill.vercel.sh/audit';
let cliVersion = null;
function isCI() {
    return !!(process.env.CI ||
        process.env.GITHUB_ACTIONS ||
        process.env.GITLAB_CI ||
        process.env.CIRCLECI ||
        process.env.TRAVIS ||
        process.env.BUILDKITE ||
        process.env.JENKINS_URL ||
        process.env.TEAMCITY_VERSION);
}
function isEnabled() {
    return !process.env.DISABLE_TELEMETRY && !process.env.DO_NOT_TRACK;
}
function setVersion(version) {
    cliVersion = version;
}
/**
 * Fetch security audit results for skills from the audit API.
 * Returns null on any error or timeout — never blocks installation.
 */
async function fetchAuditData(source, skillSlugs, timeoutMs = 3000) {
    if (skillSlugs.length === 0)
        return null;
    try {
        const params = new URLSearchParams({
            source,
            skills: skillSlugs.join(','),
        });
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        const response = await fetch(`${AUDIT_URL}?${params.toString()}`, {
            signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!response.ok)
            return null;
        return (await response.json());
    }
    catch {
        return null;
    }
}
// Pending telemetry promises — awaited before CLI exit so we don't lose data,
// but never block the main workflow.
const pendingTelemetry = [];
function track(data) {
    if (!isEnabled())
        return;
    try {
        const params = new URLSearchParams();
        // Add version
        if (cliVersion) {
            params.set('v', cliVersion);
        }
        // Add CI flag if running in CI
        if (isCI()) {
            params.set('ci', '1');
        }
        // Add event data
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined && value !== null) {
                params.set(key, String(value));
            }
        }
        // Fire and forget during the workflow, but track the promise so
        // flushTelemetry() can await it before the process exits.
        const p = fetch(`${TELEMETRY_URL}?${params.toString()}`)
            .catch(() => { })
            .then(() => { });
        pendingTelemetry.push(p);
    }
    catch {
        // Silently fail - telemetry should never break the CLI
    }
}
/**
 * Wait for all in-flight telemetry requests to settle.
 * Called once at CLI exit so the process doesn't hang on open sockets
 * but also doesn't drop data by exiting too early.
 */
async function flushTelemetry(timeoutMs = 5000) {
    if (pendingTelemetry.length === 0)
        return;
    const timeout = new Promise((resolve) => setTimeout(resolve, timeoutMs));
    await Promise.race([Promise.all(pendingTelemetry), timeout]);
}
//# sourceMappingURL=telemetry.js.map