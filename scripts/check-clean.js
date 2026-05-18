const cp = require('child_process');
const fs = require('fs');

if (cp.execSync('git status --porcelain').toString().trim()) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`\x1b[33m⚠️  Warning: Git working directory is not clean.\x1b[0m`);
  console.log(`Please commit or stash your changes before publishing.`);
  console.log(`\nSuggested commit command:`);
  console.log(`\x1b[36mgit commit -am "chore: prepare for release ${pkg.version}"\x1b[0m\n`);
  process.exit(1);
}
