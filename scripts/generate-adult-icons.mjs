import fs from 'node:fs/promises';
import sharp from 'sharp';

const themeSource = await fs.readFile('src/products/adult/theme.ts', 'utf8');
const color = themeSource.match(/ADULT_THEME_COLOR = '(#[a-fA-F0-9]{6})'/)?.[1];
if (!color) throw new Error('Adult icon color is missing.');
await fs.mkdir('public/icons/adult', { recursive: true });
for (const size of [192, 512]) {
  for (const maskable of [false, true]) {
    const edge = maskable ? 0.58 : 0.7;
    const artworkSize = size * edge;
    const inset = (size - artworkSize) / 2;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${color}"/><g transform="translate(${inset} ${inset}) scale(${artworkSize / 32})" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 1 L2 6.5 L2 16 C2 24 7.5 29.5 16 31 C24.5 29.5 30 24 30 16 L30 6.5 Z"/><path d="M7 18 C9.5 13.5, 13.5 13.5, 16 18 C18.5 22.5, 22.5 22.5, 25 18"/><path d="M7.5 12.5 C10.5 8, 14.5 8, 17.5 12.5"/></g></svg>`;
    const name = maskable ? `icon-${size}-maskable.png` : `icon-${size}x${size}.png`;
    await sharp(Buffer.from(svg)).png().toFile(`public/icons/adult/${name}`);
    console.log(name);
  }
}
