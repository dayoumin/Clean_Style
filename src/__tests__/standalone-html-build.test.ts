import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { expect, it } from 'vitest';
import { QUESTION_OCEAN_FILES } from '@/products/adult/components/question-ocean-files';

it('builds the file artifact with every scene from the current shared manifest', async () => {
  const artifactRoot = path.resolve('artifacts');
  await mkdir(artifactRoot, { recursive: true });
  const output = await mkdtemp(path.join(artifactRoot, 'standalone-build-test-'));
  try {
    execFileSync(process.execPath, ['--input-type=module', '-e',
      "import { buildStandaloneHtml } from './scripts/build-standalone-html.mjs'; await buildStandaloneHtml(process.argv[1]);", output],
    { cwd: process.cwd(), timeout: 15_000 });
    const manifest = JSON.parse(await readFile(path.join(output, 'manifest.json'), 'utf8'));
    const html = await readFile(path.join(output, 'clean-style.html'), 'utf8');
    expect(manifest.sceneFiles).toEqual([...QUESTION_OCEAN_FILES]);
    for (const file of ['src/products/adult/pages/home-page.tsx', 'src/products/adult/pages/test-page.tsx',
      'src/products/adult/pages/ResultClient.tsx', 'src/app/(public)/layout.tsx', 'src/products/adult/styles.css', 'src/styles/globals.css']) {
      expect(manifest.sources[file], file).toMatch(/^[a-f0-9]{64}$/);
    }
    for (const file of QUESTION_OCEAN_FILES) {
      expect(manifest.assets.some((asset: { path: string }) => asset.path.endsWith(`/question-ocean/${file}`))).toBe(true);
    }
    expect(html).toContain("connect-src 'none'");
    expect(html).not.toMatch(/\/api\/(?:chat|results)|OPENAI_API_KEY|serviceWorker/);
    expect(html).not.toMatch(/<(?:script|link)[^>]+(?:src|href)=["'](?:https?:|\/)/i);
  } finally {
    if (!output.startsWith(artifactRoot + path.sep)) throw new Error('Unexpected test output directory');
    await rm(output, { recursive: true, force: true });
  }
}, 20_000);
