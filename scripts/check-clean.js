const cp = require('child_process');
if (cp.execSync('git status --porcelain').toString().trim()) {
  console.error(
    '? ERROR: Git working directory is not clean. Please commit or stash your changes before publishing.',
  );
  process.exit(1);
}
