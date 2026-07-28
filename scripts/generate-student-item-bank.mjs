import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'content/student-integrity/item-bank.json');
const outputPath = path.join(root, 'docs/research/student-integrity/item-bank-data.js');
const items = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const output = `// Generated from content/student-integrity/item-bank.json. Do not edit directly.\nwindow.STUDENT_ITEM_BANK = ${JSON.stringify(items, null, 2)};\n`;
fs.writeFileSync(outputPath, output, 'utf8');

console.log(`Generated ${path.relative(root, outputPath)} with ${items.length} candidate items.`);
