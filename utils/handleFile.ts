
import * as fs from 'node:fs'
import * as path from 'node:path'
export function canSkipOverwriteOption(dir: string) {
  if (!fs.existsSync(dir)) {
    return true
  }
  const files = fs.readdirSync(dir)
  if (files.length === 0) {
    return true
  }
  if (files.length === 1 && files[0] === '.git') {
    return true
  }
  return false
}

export function emptyDirectory(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  traverseAndClean(
    dir,
    (dirPath) => fs.rmdirSync(dirPath),
    (filePath) => fs.unlinkSync(filePath)
  );
}

export function traverseAndClean(dir, onDir, onFile) {
  for (const itemName of fs.readdirSync(dir)) {
    if (itemName === '.git') {
      continue;
    }
    const fullPath = path.resolve(dir, itemName);
    if (fs.lstatSync(fullPath).isDirectory()) {
      traverseAndClean(fullPath, onDir, onFile);
      onDir(fullPath);
    } else {
      onFile(fullPath);
    }
  }
}