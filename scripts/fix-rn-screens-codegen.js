#!/usr/bin/env node
/**
 * Fixes react-native-screens fabric spec files for React Native 0.76 codegen compatibility.
 * The specs use `CodegenTypes as CT` namespace from 'react-native' which is a Flow export
 * only — not available as a TypeScript type. This script replaces all `CT.X` usages with
 * direct imports from 'react-native/Libraries/Types/CodegenTypes'.
 */
const fs = require('fs');
const path = require('path');

function findFiles(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) results = results.concat(findFiles(full, ext));
    else if (f.endsWith(ext)) results.push(full);
  }
  return results;
}

const fabricDir = path.join(__dirname, '..', 'node_modules', 'react-native-screens', 'src', 'fabric');
const files = findFiles(fabricDir, '.ts');
let fixed = 0;

const CT_TYPES = [
  'WithDefault', 'Int32', 'Double', 'Float', 'UnsafeObject',
  'BubblingEventHandler', 'DirectEventHandler', 'EventEmitter', 'UnsafeMixed',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('CT.')) continue;

  const needed = CT_TYPES.filter(t => content.includes('CT.' + t));
  if (needed.length === 0) continue;

  const importLine = `import type { ${needed.join(', ')} } from 'react-native/Libraries/Types/CodegenTypes';`;
  content = content.replace(/^'use client';/m, `'use client';\n${importLine}`);

  for (const t of needed) content = content.replaceAll('CT.' + t, t);

  content = content.replace(/,\s*CodegenTypes as CT/g, '');
  content = content.replace(/CodegenTypes as CT,\s*/g, '');
  content = content.replace(/import type \{\s*CodegenTypes as CT\s*\}[^;]*;\n/g, '');

  fs.writeFileSync(file, content);
  fixed++;
}

if (fixed > 0) {
  console.log(`[fix-rn-screens-codegen] Fixed ${fixed} fabric spec file(s).`);
}
