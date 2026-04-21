const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build', 'contracts');
const frontendUtilsDir = path.join(rootDir, 'frontend', 'src', 'utils');

const artifactFiles = ['Escrow.json', 'EscrowFactory.json'];

for (const file of artifactFiles) {
  const sourcePath = path.join(buildDir, file);
  const targetPath = path.join(frontendUtilsDir, file);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing artifact: ${sourcePath}`);
  }

  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Synced ${file} -> ${path.relative(rootDir, targetPath)}`);
}
