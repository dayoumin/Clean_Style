import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
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
for (const [file, hash] of Object.entries(manifest.sources)) {
  assert.equal(createHash('sha256').update(await fs.readFile(path.join(root, file))).digest('hex'), hash, file);
}
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
const pngs = []; const failures = []; const network = [];
const fileUrl = pathToFileURL(filename).href;
const HISTORY = 'clean-style-html-history-v1';
const PROGRESS = 'clean-style-html-progress-v1';
const savedItem = (id, answers, name = '') => ({ id, answers, name, createdAt: '2026-10-19T00:00:00Z',
  instrumentVersion: 'adult-integrity-v1', scoringVersion: 'adult-three-axis-v1' });
try {
  const context = await browser.newContext({ offline: true, viewport: { width: 1100, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  page.on('pageerror', error => failures.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
  await page.goto(fileUrl);
  await page.getByRole('link', { name: '시작하기', exact: true }).waitFor();
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(output, 'home-desktop.png') });
  const assets = await page.evaluate(async () => {
    const { assets } = JSON.parse(document.getElementById('standalone-data').textContent);
    return Promise.all(Object.entries(assets).map(async ([path, src]) => {
      const image = new Image(); image.src = src; await image.decode();
      return { path, width: image.naturalWidth, height: image.naturalHeight };
    }));
  });
  assert.equal(assets.length, manifest.assets.length);
  assert(assets.every(asset => asset.width > 0 && asset.height > 0));
  // Shared home controls and sheet, including Escape/focus restoration.
  const chip = page.getByRole('button', { name: '15개 상황 안내' });
  await chip.click(); await page.getByRole('dialog').waitFor(); await page.keyboard.press('Escape');
  assert(await chip.evaluate(element => document.activeElement === element));
  await page.getByRole('link', { name: '시작하기', exact: true }).click();
  await page.locator('.choice-button').first().waitFor();
  await page.waitForTimeout(1300);
  await page.screenshot({ path: path.join(output, 'question-desktop.png') });
  await page.locator('.choice-button').first().click();
  await page.locator('.choice-button').nth(1).click();
  await page.getByRole('button', { name: '검사 중단', exact: true }).click();
  await page.reload(); await page.getByRole('link', { name: '시작하기', exact: true }).click();
  await page.getByText('2/15문항까지 진행했어요').waitFor();
  await page.getByRole('button', { name: '이어하기', exact: true }).click();
  for (let index = 2; index < questions.length; index++) await page.locator('.choice-button').first().click();
  await page.getByRole('textbox').focus();
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(output, 'finish-desktop.png') });
  await page.getByRole('textbox').fill('<검증 이름>');
  const completedId = await page.evaluate(key => JSON.parse(localStorage.getItem(key))[0].id, HISTORY);
  await page.reload();
  await page.getByRole('heading', { name: '결과가 준비됐어요' }).waitFor();
  assert.equal(await page.getByRole('textbox').inputValue(), '<검증 이름>');
  assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).length, HISTORY), 1);
  await page.getByRole('button', { name: '결과 보기', exact: true }).click();
  await page.getByRole('button', { name: '이미지로 저장', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'AI 조언' }).count(), 0);
  assert.equal(await page.getByRole('tab').count(), 3);
  await page.getByRole('tab', { name: '주의', exact: true }).click();
  assert.equal(await page.getByRole('tab', { name: '주의', exact: true }).getAttribute('aria-selected'), 'true');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(output, 'result-desktop.png') });
  // Completed test must not return as a 15/15 resume after Back/Forward.
  await page.goBack(); await page.getByRole('link', { name: '시작하기', exact: true }).waitFor();
  await page.goForward(); await page.getByRole('button', { name: '이미지로 저장', exact: true }).waitFor();
  assert.equal(await page.evaluate(key => localStorage.getItem(key), PROGRESS), null);
  await page.getByRole('button', { name: '처음으로', exact: true }).click();
  await page.getByRole('link', { name: '시작하기', exact: true }).click();
  await page.locator('.choice-button').first().waitFor();
  assert.equal(await page.getByRole('button', { name: '이어하기', exact: true }).count(), 0);
  await page.getByRole('button', { name: '검사 중단', exact: true }).click();
  await page.getByRole('button', { name: '이전 결과 보기' }).click();
  await page.getByRole('button', { name: '보기', exact: true }).click();
  assert((await page.locator('h1').textContent()).includes('<검증 이름>'));
  assert(page.url().includes(completedId));
  for (const [key, answers] of witnesses) {
    await page.evaluate(({ item, key }) => { localStorage.setItem(key, JSON.stringify([item])); location.hash = '/'; },
      { item: savedItem(key, answers, '가장 긴 이름 열두글자 검증'), key: HISTORY });
    await page.reload();
    await page.getByRole('button', { name: '이전 결과 보기' }).click();
    await page.getByRole('button', { name: '보기', exact: true }).click();
    assert((await page.locator('h1').textContent()).includes(calculateResult(answers).style.name));
    const frame = await page.locator('main').boundingBox();
    const exporting = page.waitForEvent('download');
    await page.getByRole('button', { name: '이미지로 저장', exact: true }).click();
    const download = await exporting;
    const pngPath = path.join(output, `${key}.png`); await download.saveAs(pngPath);
    const bytes = await fs.readFile(pngPath);
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16), Math.ceil(frame.width) * 2);
    assert(bytes.readUInt32BE(20) >= Math.ceil(frame.height) * 2);
    pngs.push({ key, bytes: bytes.length, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) });
    assert.equal(await page.getByRole('dialog').count(), 0);
    await page.getByRole('link', { name: '다시 다운로드', exact: true }).waitFor();
  }
  await page.getByRole('button', { name: '처음으로', exact: true }).click();
  await page.getByRole('button', { name: '이전 결과 보기' }).click();
  await page.getByRole('dialog').waitFor();
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(output, 'history-desktop.png') });
  await page.getByRole('button', { name: / 삭제$/ }).click();
  assert.equal(await page.getByRole('button', { name: '이전 결과 보기' }).count(), 0);
  await page.goBack();
  await page.getByRole('link', { name: '시작하기', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: '이미지로 저장', exact: true }).count(), 0);
  await page.reload();
  assert.equal(await page.getByRole('button', { name: '이전 결과 보기' }).count(), 0);
  // Real denied writes and PNG encoder failure, independent of the happy path.
  const blocked = await context.newPage();
  await blocked.addInitScript(() => {
    Storage.prototype.setItem = function () { throw new DOMException('Denied', 'QuotaExceededError'); };
    Storage.prototype.removeItem = function () { throw new DOMException('Denied', 'SecurityError'); };
  });
  blocked.on('pageerror', error => failures.push(error.message));
  await blocked.goto(fileUrl);
  await blocked.getByRole('link', { name: '시작하기', exact: true }).click();
  for (let index = 0; index < questions.length; index++) await blocked.locator('.choice-button').first().click();
  await blocked.getByRole('textbox').fill('저장 차단');
  await blocked.getByRole('button', { name: '결과 보기', exact: true }).click();
  await blocked.getByRole('button', { name: '이미지로 저장', exact: true }).waitFor();
  await blocked.evaluate(() => { window.originalToBlob = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = callback => callback(null); });
  await blocked.getByRole('button', { name: '이미지로 저장', exact: true }).click();
  await blocked.getByText('이미지를 만들지 못했어요. 결과는 그대로 있으니 다시 시도해 주세요.').waitFor();
  await blocked.evaluate(() => { HTMLCanvasElement.prototype.toBlob = window.originalToBlob; });
  const retry = blocked.waitForEvent('download');
  await blocked.getByRole('button', { name: '이미지로 저장', exact: true }).click();
  await retry;
  // Regression: leave the name step, then open that same result via history.
  const alternateContext = await browser.newContext({ offline: true, viewport: { width: 1100, height: 900 }, acceptDownloads: true });
  const alternate = await alternateContext.newPage();
  alternate.on('pageerror', error => failures.push(error.message));
  alternate.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
  await alternate.goto(fileUrl);
  await alternate.getByRole('link', { name: '시작하기', exact: true }).click();
  for (let index = 0; index < questions.length; index++) await alternate.locator('.choice-button').first().click();
  await alternate.getByRole('textbox').fill('홍길동');
  const pendingId = await alternate.evaluate(() => JSON.parse(localStorage.getItem('clean-style-html-pending-v1')).id);
  await alternate.goBack();
  await alternate.getByRole('button', { name: '이전 결과 보기' }).click();
  await alternate.getByRole('button', { name: '보기', exact: true }).click();
  await alternate.getByRole('button', { name: '이미지로 저장', exact: true }).waitFor();
  assert((await alternate.locator('h1').textContent()).includes('홍길동'));
  assert.equal(await alternate.evaluate(() => localStorage.getItem('clean-style-html-pending-v1')), null);
  assert.equal(await alternate.evaluate(key => JSON.parse(localStorage.getItem(key)).length, HISTORY), 1);
  await alternate.reload();
  await alternate.getByRole('button', { name: '이미지로 저장', exact: true }).waitFor();
  assert(alternate.url().includes(pendingId));
  assert((await alternate.locator('h1').textContent()).includes('홍길동'));
  // Inspect the actual DOM snapshot sent to the renderer, including the saved name.
  await alternate.evaluate(() => {
    window.exportedSnapshotText = '';
    new MutationObserver(() => {
      const snapshot = document.querySelector('[data-result-capture]');
      if (snapshot) window.exportedSnapshotText = snapshot.textContent;
    }).observe(document.body, { childList: true, subtree: true });
  });
  await alternate.waitForTimeout(1000);
  await alternate.screenshot({ path: path.join(output, 'alternate-history-named-result.png') });
  const namedExport = alternate.waitForEvent('download');
  await alternate.getByRole('button', { name: '이미지로 저장', exact: true }).click();
  await (await namedExport).saveAs(path.join(output, 'alternate-history-named-result-export.png'));
  assert(await alternate.evaluate(() => window.exportedSnapshotText.includes('홍길동')));
  assert.equal(await alternate.getByRole('dialog').count(), 0);
  await alternate.getByRole('button', { name: '처음으로', exact: true }).click();
  await alternate.getByRole('link', { name: '시작하기', exact: true }).click();
  await alternate.locator('.choice-button').first().waitFor();
  assert.equal(await alternate.getByRole('heading', { name: '결과가 준비됐어요', exact: true }).count(), 0);
  assert.deepEqual(failures, []); assert.deepEqual(network, []);
  const result = { checkedAt: new Date().toISOString(), browser: browser.version(), file: filename,
    sha256: manifest.sha256, bytes: manifest.bytes, support: 'Windows PC / Edge / file URL / offline',
    sharedSources: manifest.sharedScreens, assets, pngs, failures, network,
    completionBackForwardNoDuplicate: true, finishReloadNameAndIdPreserved: true,
    deletionBackBlocked: true, storageDeniedAndPngRetry: true,
    alternateHistoryKeepsNameAndCompletes: true, namedPngSnapshotVerified: true, autoPreview: false,
    serverStarted: false, deployed: false };
  await fs.writeFile(path.join(output, 'verification.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ok: true, assets: assets.length, pngs: pngs.length, sha256: manifest.sha256 }));
} finally { await browser.close(); }
