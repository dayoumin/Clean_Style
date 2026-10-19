import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { chromium } from 'playwright';

const root = process.cwd();
const output = path.join(root, 'artifacts/html-verification');
await fs.mkdir(output, { recursive: true });
const filename = path.join(root, 'artifacts/html/clean-style.html');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'artifacts/html/manifest.json'), 'utf8'));
const html = await fs.readFile(filename, 'utf8');
assert(!/<(?:script|link)[^>]+(?:src|href)=["'](?:https?:|\/)/i.test(html));
assert(!html.includes('/api/chat') && !html.includes('/api/results') && !html.includes('serviceWorker'));
const source = await fs.readFile(path.join(root, 'src/data/questions.ts'), 'utf8');
const diagnostic = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { exports: diagnostic.exports, module: diagnostic });
const { questions, calculateResult } = diagnostic.exports;
const witnesses = new Map();
let state = 42;
for (let index = 0; index < 10000 && witnesses.size < 8; index++) {
  const answers = questions.map(question => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return (state >>> 16) % question.choices.length; });
  witnesses.set(calculateResult(answers).styleKey, answers);
}
assert.equal(witnesses.size, 8);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ offline: true, viewport: { width: 1100, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  const failures = []; const network = []; const pngs = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
  await page.goto(pathToFileURL(filename).href);
  assert.equal(await page.title(), '청렴 스타일 테스트 · 파일 버전');
  assert.equal(await page.getByRole('button', { name: '이전 결과 보기' }).count(), 0);
  await page.screenshot({ path: path.join(output, 'home-desktop.png'), fullPage: true });
  const assets = await page.evaluate(async () => {
    const { assets } = JSON.parse(document.getElementById('standalone-data').textContent);
    const decoded = await Promise.all(Object.entries(assets).map(async ([path, src]) => {
      const image = new Image(); image.src = src; await image.decode();
      return { path, width: image.naturalWidth, height: image.naturalHeight };
    }));
    return decoded;
  });
  assert.equal(assets.length, manifest.assets.length);
  assert(assets.every(asset => asset.width > 0 && asset.height > 0));
  await page.getByRole('button', { name: '시작하기', exact: true }).click();
  await page.locator('.choice').first().click();
  await page.locator('.choice').nth(1).click();
  await page.getByRole('button', { name: '검사 중단', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /이어하기 · 2\/15/ }).click();
  for (let index = 2; index < questions.length; index++) await page.locator('.choice').first().click();
  // The name step must survive reload, before any history entry has been saved.
  await page.reload();
  await page.getByRole('button', { name: /이어하기 · 15\/15/ }).click();
  await page.getByRole('heading', { name: '결과가 준비됐어요' }).waitFor();
  await page.goBack();
  await page.getByRole('heading', { name: '나의 청렴 스타일은?' }).waitFor();
  await page.getByRole('button', { name: /이어하기 · 15\/15/ }).click();
  await page.getByRole('textbox').fill('<검증 이름>');
  await page.getByRole('button', { name: '결과 보기', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'AI 조언' }).count(), 0);
  assert.equal(await page.locator('.interpretation').count(), 3);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '이미지로 저장', exact: true }).click();
  const download = await downloadEvent;
  await download.saveAs(path.join(output, 'journey-result.png'));
  await page.getByRole('button', { name: '처음으로', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: '이전 결과 보기' }).click();
  await page.getByRole('button', { name: '보기', exact: true }).click();
  assert((await page.locator('h1').textContent()).includes('<검증 이름>'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(output, 'result-mobile.png'), fullPage: true });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  // Reload each of eight valid histories, export each real canvas and inspect PNG bytes.
  for (const [key, answers] of witnesses) {
    const item = { id: key, createdAt: '2026-10-16T00:00:00Z', instrumentVersion: 'adult-integrity-v1', scoringVersion: 'adult-three-axis-v1', answers, name: '가장 긴 이름 열두글자 검증' };
    await page.evaluate(item => localStorage.setItem('clean-style-html-history-v1', JSON.stringify([item])), item);
    await page.reload();
    await page.getByRole('button', { name: '이전 결과 보기' }).click();
    await page.getByRole('button', { name: '보기', exact: true }).click();
    assert((await page.locator('h1').textContent()).includes(calculateResult(answers).style.name));
    const exporting = page.waitForEvent('download');
    await page.getByRole('button', { name: '이미지로 저장', exact: true }).click();
    const result = await exporting;
    const pngPath = path.join(output, `${key}.png`); await result.saveAs(pngPath);
    const bytes = await fs.readFile(pngPath);
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16), 1000);
    assert(bytes.readUInt32BE(20) > 1300);
    pngs.push({ key, bytes: bytes.length, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) });
  }
  await page.getByRole('button', { name: '처음으로', exact: true }).click();
  await page.getByRole('button', { name: '이전 결과 보기' }).click();
  await page.getByRole('button', { name: /결과 삭제/ }).click();
  await page.goBack();
  await page.getByRole('heading', { name: '나의 청렴 스타일은?' }).waitFor();
  await page.goBack();
  await page.getByRole('heading', { name: '나의 청렴 스타일은?' }).waitFor();
  assert.equal(await page.getByRole('button', { name: '이미지로 저장', exact: true }).count(), 0);
  assert.equal(await page.getByRole('button', { name: '이전 결과 보기' }).count(), 0);
  await page.reload();
  assert.equal(await page.getByRole('button', { name: '이전 결과 보기' }).count(), 0);
  // Different results retain their identity when traversing browser history.
  const navigationEntries = [...witnesses].slice(0, 2).map(([key, answers]) => ({ id: key, answers,
    createdAt: '2026-10-16T00:00:00Z', instrumentVersion: 'adult-integrity-v1', scoringVersion: 'adult-three-axis-v1', name: '' }));
  await page.evaluate(entries => localStorage.setItem('clean-style-html-history-v1', JSON.stringify(entries)), navigationEntries);
  await page.reload();
  await page.getByRole('button', { name: '이전 결과 보기' }).click();
  await page.getByRole('button', { name: '보기', exact: true }).nth(0).click();
  const firstTitle = await page.locator('h1').textContent();
  await page.getByRole('button', { name: '처음으로', exact: true }).click();
  await page.getByRole('button', { name: '이전 결과 보기' }).click();
  await page.getByRole('button', { name: '보기', exact: true }).nth(1).click();
  const secondTitle = await page.locator('h1').textContent();
  assert.notEqual(firstTitle, secondTitle);
  await page.goBack(); await page.getByRole('heading', { name: '이전 결과', exact: true }).waitFor();
  await page.goBack(); await page.getByRole('button', { name: '이전 결과 보기' }).waitFor();
  await page.goBack(); await page.getByRole('button', { name: '이미지로 저장' }).waitFor();
  assert.equal(await page.locator('h1').textContent(), firstTitle);
  await page.goForward(); await page.goForward(); await page.goForward();
  await page.getByRole('button', { name: '이미지로 저장' }).waitFor();
  assert.equal(await page.locator('h1').textContent(), secondTitle);
  // All browser storage access denied: finishing and PNG export still work.
  const denied = await browser.newContext({ offline: true, acceptDownloads: true, viewport: { width: 320, height: 740 } });
  await denied.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError'); } }));
  const deniedPage = await denied.newPage();
  deniedPage.on('pageerror', error => failures.push(error.message));
  await deniedPage.goto(pathToFileURL(filename).href);
  await deniedPage.getByRole('button', { name: '시작하기', exact: true }).click();
  await deniedPage.locator('.choice').first().click();
  await deniedPage.getByRole('button', { name: '검사 중단', exact: true }).click();
  await deniedPage.getByRole('button', { name: /이어하기 · 1\/15/ }).click();
  for (let index = 1; index < questions.length; index++) await deniedPage.locator('.choice').first().click();
  await deniedPage.getByRole('button', { name: '결과 보기', exact: true }).click();
  assert((await deniedPage.locator('#notice').textContent()).includes('저장하지 못했어요'));
  await deniedPage.evaluate(() => {
    window.originalToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = () => { throw new Error('Simulated encoder failure'); };
  });
  await deniedPage.getByRole('button', { name: '이미지로 저장', exact: true }).click();
  await deniedPage.getByRole('status').filter({ hasText: '이미지를 만들지 못했어요' }).waitFor();
  await deniedPage.evaluate(() => { HTMLCanvasElement.prototype.toBlob = window.originalToBlob; });
  const deniedDownload = deniedPage.waitForEvent('download');
  await deniedPage.getByRole('button', { name: '이미지로 저장', exact: true }).click();
  await (await deniedDownload).saveAs(path.join(output, 'storage-denied.png'));
  assert(await deniedPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(failures, []);
  assert.deepEqual(network, []);
  const evidence = { file: filename, htmlSha256: manifest.sha256, browser: await browser.version(),
    mode: 'actual file URL, offline', assets, pngs, network, failures,
    checks: ['15-question journey', 'resume after reload', 'pending completed test after reload', 'result identity on back/forward', 'history after reload', 'durable delete', 'deleted result cannot return via browser back',
      'all embedded assets decoded', '8 scoring types and PNG exports', '390px and 320px no horizontal overflow', 'storage denied completion and PNG', 'PNG failure preserves result and retry succeeds'] };
  await fs.writeFile(path.join(output, 'verification.json'), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ checks: evidence.checks, assets: assets.length, exportedTypes: pngs.length, network, failures }));
} finally { await browser.close(); }
