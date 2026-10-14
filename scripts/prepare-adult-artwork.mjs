import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Encode generated cutouts for local delivery; do not alter their content or color.
const manifestPath = process.argv[2];
if (!manifestPath) throw new Error('Provide the generated source manifest JSON path.');
const items = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const output = path.resolve('public/images/adult-integrity');
await fs.mkdir(output, { recursive: true });
const results = [];
for (const item of items) {
  if (!/^[a-z-]+$/.test(item.key)) throw new Error('Invalid artwork key.');
  const stats = await sharp(item.source).stats();
  if (stats.isOpaque) throw new Error(`${item.key}: generated cutout lacks transparency.`);
  const destination = path.join(output, `${item.key}.webp`);
  await sharp(item.source).resize(640, 640, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 100 }).toFile(destination);
  const metadata = await sharp(destination).metadata();
  const file = await fs.stat(destination);
  if (!metadata.hasAlpha) throw new Error(`${item.key}: alpha lost during encoding.`);
  results.push({ key: item.key, width: metadata.width, height: metadata.height, alpha: metadata.hasAlpha, bytes: file.size });
}
console.log(JSON.stringify(results, null, 2));
