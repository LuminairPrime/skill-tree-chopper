const cp = require('child_process');
const fs = require('fs');

if (cp.execSync('git status --porcelain').toString().trim()) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`\x1b[33m⚠️ Warning: cannot release until changes are committed. Try: git commit -am "before release of ${pkg.version}"\x1b[0m`);
  process.exit(1);
}
