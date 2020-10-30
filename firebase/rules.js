const fs = require('fs');
const path = require('path');

// TODO: Add your exact paths
const srcFile = path.join(__dirname, 'firestore.rules');
const destFile = path.join(__dirname, 'firestore-deploy.rules');

fs.writeFileSync(destFile, resolveImports(srcFile));

function resolveImports(filePath) {
  const rulesFile = fs.readFileSync(filePath).toString();

  // Every second element in the array will have the file name to the imported file
  const fileElements = rulesFile.split(/include "([A-Za-z0-9\/.]+\.rules)";/);
  // Resolve imports
  let resolvedRulesFile = '';
  let isImport = false;

  for (const elem of fileElements) {
    if (isImport) {
      const importPath = path.join(filePath, '..', elem);
      resolvedRulesFile += resolveImports(importPath);
    } else {
      resolvedRulesFile += elem;
    }
    isImport = !isImport;
  }
  return resolvedRulesFile;
}
