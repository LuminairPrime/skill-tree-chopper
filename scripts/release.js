const cp = require('child_process');
const fs = require('fs');

const VALID_RELEASE_TYPES = ['patch', 'minor', 'major'];
const releaseType = process.argv[2] || 'patch';

if (!VALID_RELEASE_TYPES.includes(releaseType)) {
  console.error(
    `\x1b[31m❌ Invalid release type "${releaseType}". Must be one of: ${VALID_RELEASE_TYPES.join(', ')}\x1b[0m`,
  );
  process.exit(1);
}

if (cp.execSync('git status --porcelain').toString().trim()) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.error(
    `\x1b[33m⚠️ Warning: cannot release until changes are committed. Try: git commit -am "before release of ${pkg.version}"\x1b[0m`,
  );
  process.exit(1);
}

try {
  cp.execSync('mise run release-checks', { stdio: 'inherit' });
  cp.execSync(`npm version ${releaseType}`, { stdio: 'inherit' });
  cp.execSync('git push --follow-tags', { stdio: 'inherit' });
  cp.execSync('node scripts/watch-workflows.js', { stdio: 'inherit' });
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
