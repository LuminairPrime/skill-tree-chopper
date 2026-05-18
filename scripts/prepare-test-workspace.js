const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'test', 'fixtures', 'workspace');
const targetDir = path.join(__dirname, '..', 'out', 'test-workspace');

console.log(`Preparing test workspace...`);
console.log(`Source: ${sourceDir}`);
console.log(`Target: ${targetDir}`);

// Ensure the source directory exists
if (!fs.existsSync(sourceDir)) {
  console.error(`Error: Source directory does not exist: ${sourceDir}`);
  process.exit(1);
}

// Remove the target directory if it already exists
if (fs.existsSync(targetDir)) {
  console.log(`Cleaning existing target directory...`);
  fs.rmSync(targetDir, { recursive: true, force: true });
}

// Create the parent out/ directory if needed
if (!fs.existsSync(path.dirname(targetDir))) {
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
}

// Copy the directory
console.log(`Copying files...`);
fs.cpSync(sourceDir, targetDir, { recursive: true });

console.log(`Test workspace prepared successfully!`);
