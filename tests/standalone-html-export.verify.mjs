// A controlled component fixture, not the user's file tab or its storage.
// The only HTTP navigation is fulfilled in memory; no local server is started.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { chromium } from 'playwright';
import { adaptSource } from '../src/products/adult/standalone/adapt-source.mjs';

const root = process.cwd();
const output = path.resolve('artifacts/html-export-fidelity/institution-footer');
await fs.mkdir(output, { recursive: true });
const sha = value => createHash('sha256').update(value).digest('hex');
const sourceHashes = {}, candidates = [];
async function source(file) {
  const text = (await fs.readFile(file, 'utf8')).replaceAll('\r\n', '\n');
  sourceHashes[path.relative(root, file).replaceAll('\\', '/')] = sha(await fs.readFile(file));
  return text;
}
const assets = new Map();
async function asset(url) {
  if (!assets.has(url)) {
    const filename = path.resolve('public', url.slice(1));
    assert(filename.startsWith(path.resolve('public') + path.sep));
    const type = url.endsWith('.svg') ? 'image/svg+xml' : 'image/webp';
    assets.set(url, `data:${type};base64,${(await fs.readFile(filename)).toString('base64')}`);
  }
  return assets.get(url);
}
const entry = `
import { createRoot } from 'react-dom/client';
import Layout from '@/app/(public)/layout';
import Result from '@/products/adult/pages/ResultClient';
import { createExportFooter, EXPORT_FOOTER_GAP } from '@/products/adult/standalone/export-footer';
import { calculateResult, questions, computeSixAxisScores, AXIS_MAXIMUMS } from '@/data/questions';
window.__scoring = { calculateResult, questions, computeSixAxisScores, AXIS_MAXIMUMS };
window.__footer = { create: createExportFooter, gap: EXPORT_FOOTER_GAP };
createRoot(document.getElementById('fixture')).render(<Layout><Result /></Layout>);
`;
const bundle = await build({
  stdin: { contents: entry, loader: 'tsx', resolveDir: root },
  bundle: true, write: false, outdir: 'fixture-output', format: 'iife', jsx: 'automatic', minify: true,
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [{ name: 'controlled-result-fixture', setup(builder) {
    builder.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: 'navigation', namespace: 'fixture' }));
    builder.onResolve({ filter: /^(?:@\/data\/appVariant|\.\/appVariant)$/ }, () => ({ path: 'variant', namespace: 'fixture' }));
    builder.onResolve({ filter: /^\.\/runtime$/ }, args => args.importer.endsWith('ExportActions.tsx') ? { path: 'history', namespace: 'fixture' } : undefined);
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents:
      args.path === 'variant' ? 'export const IS_STUDENT_VARIANT=false, AI_CHAT_ENABLED=false, RESPECT_PILOT_ENABLED=false;' :
      args.path === 'history' ? 'export const getSaved=id=>window.__fixture.id===id?window.__fixture:null;' : `
        import { calculateResult } from '@/data/questions';
        import { buildResultUrl } from '@/lib/utils';
        export const useRouter=()=>({push(){},replace(){}});
        export function useSearchParams(){const e=window.__fixture,r=calculateResult(e.answers);
          const p=new URLSearchParams(buildResultUrl(r.styleKey,r.scores,e.answers,e.id).split('?')[1]);
          if(e.name)p.set('name',e.name);return p;}
      `, loader: 'js', resolveDir: root }));
    builder.onLoad({ filter: /\.[jt]sx?$/ }, async args => {
      if (!args.path.startsWith(path.resolve('src') + path.sep)) return;
      const name = path.relative(root, args.path).replaceAll('\\', '/');
      if (/hooks\/useAiChat|components\/AiAdviceSheet|lib\/client-id/.test(name)) throw Error('Server dependency leaked into fixture');
      let text = adaptSource(await source(args.path), name);
      candidates.push({ content: text, extension: path.extname(args.path).slice(1) });
      for (const match of [...text.matchAll(/(['"])(\/images\/[^'"]+)\1/g)]) {
        text = text.replaceAll(match[0], JSON.stringify(await asset(match[2])));
      }
      return { contents: text, loader: name.endsWith('x') ? 'tsx' : 'ts' };
    });
    builder.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'css' }));
  } }], logLevel: 'silent',
});
const cssCompiler = await compile(await source(path.resolve('src/styles/globals.css')) + '\n' + await source(path.resolve('src/products/adult/styles.css')), {
  base: path.resolve('src/styles'), onDependency() {}, shouldRewriteUrls: false,
});
let css = cssCompiler.build(new Scanner({}).scanFiles(candidates));
for (const match of [...css.matchAll(/url\((['"]?)(\/images\/[^)'"\s]+)\1\)/g)]) css = css.replaceAll(match[0], `url("${await asset(match[2])}")`);
// Read exactly the HTML-only additions from the generator, rather than a test copy.
const builderSource = await fs.readFile('scripts/build-standalone-html.mjs', 'utf8');
const extras = builderSource.match(/css \+= ('[^\n]+');/)[1];
css += Function(`return ${extras}`)();
const script = bundle.outputFiles.find(file => file.path.endsWith('.js')).text;
console.log('Controlled result fixture compiled; launching isolated Edge.');
const report = { checkedAt: new Date().toISOString(), fixtureOnly: true, userTabAccessed: false,
  serverStarted: false, deployed: false, sourceHashes, checks: [], errors: [], externalRequests: [] };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce', acceptDownloads: true });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  let fixture = { id: 'synthetic-export-fixture', name: '', answers: Array(15).fill(0) };
  await page.route('**/*', async route => {
    if (route.request().isNavigationRequest() && route.request().url() === 'http://clean-style-export.test/fixture') {
      await route.fulfill({ contentType: 'text/html; charset=utf-8', body: `<!doctype html><html lang="ko"><meta charset="utf-8"><title>Clean Style · controlled export fixture</title><style>${css}</style><div id="fixture"></div><script>window.__fixture=${JSON.stringify(fixture)};${script.replaceAll('</script', '<\\/script')}</script></html>` });
    } else { report.externalRequests.push(route.request().url()); await route.abort(); }
  });
  await page.goto('http://clean-style-export.test/fixture');
  // Match the type and six displayed scores from the user's supplied screenshot;
  // this is synthetic, not an attempt to recover their answers or history.
  fixture.answers = await page.evaluate(() => {
    const { questions, calculateResult, computeSixAxisScores, AXIS_MAXIMUMS } = window.__scoring;
    const axes = ['principle','transparent','independent','flexible','cautious','cooperative'];
    let seed = 42;
    for (let n = 0; n < 100000; n++) {
      const a = questions.map(q => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return (seed>>>16)%q.choices.length; });
      if (calculateResult(a).styleKey !== 'principle-cautious-independent') continue;
      const six = computeSixAxisScores(a);
      if (axes.map(k=>Math.min(Math.round(1+Math.sqrt(six[k]/AXIS_MAXIMUMS[k])*4),5)).join() === '4,3,3,3,4,3') return a;
    }
    throw Error('Matching synthetic result not found');
  });
  report.syntheticAnswers = fixture.answers;
  const cases = [
    {width:1100,height:900,tab:'강점'}, {width:1100,height:900,tab:'주의'}, {width:1100,height:900,tab:'팁'},
    {width:1024,height:768,tab:'강점'}, {width:1024,height:768,tab:'팁'},
    {width:800,height:600,tab:'강점'}, {width:800,height:600,tab:'주의'},
  ];
  for (const test of cases) {
    await page.setViewportSize({width:test.width,height:test.height});
    await page.goto('http://clean-style-export.test/fixture');
    assert.equal(await page.title(), 'Clean Style · controlled export fixture');
    await page.getByRole('tab',{name:test.tab,exact:true}).click();
    await page.waitForTimeout(1100);
    const prefix = `${test.width}x${test.height}-${test.tab}`;
    const geometry = () => page.evaluate(() => {
      const main = document.querySelector('main'), frame = main.getBoundingClientRect();
      const style = getComputedStyle(main), panel = document.querySelector('[role="tabpanel"]');
      const content = panel.closest('section').getBoundingClientRect();
      return { width:Math.ceil(frame.width), fullHeight:Math.ceil(frame.height),
        height:Math.ceil(content.bottom-frame.top+main.scrollTop+parseFloat(style.paddingBottom)+parseFloat(style.borderBottomWidth)),
        positions: ['.adult-result-hero','h1','.adult-result-art','.adult-result-chart','[role="tablist"]','[role="tabpanel"]'].map(selector=>{
          const r=document.querySelector(selector).getBoundingClientRect();return [selector,r.x-frame.x,r.y-frame.y+main.scrollTop,r.width,r.height];
        }) };
    });
    const before = await geometry();
    await page.locator('main').screenshot({path:path.join(output,`${prefix}-actual-screen.png`)});
    // Take real browser pixels, without cloning or restyling result content.
    // Freeze only the root's original box, shorten the outer frame, and hide
    // the omitted controls. Assert that every result section stays in place.
    const expectedHeight = await page.evaluate(() => {
      const main=document.querySelector('main'), root=main.querySelector('.adult-integrity-result'), actions=root.querySelector('.adult-result-actions');
      const bounds=root.getBoundingClientRect();
      const sizes=Array.from(root.children).map(node=>[node,node.getBoundingClientRect()]);
      for(const [node,rect]of sizes)Object.assign(node.style,{height:rect.height+'px',width:rect.width+'px',flex:'none'});
      Object.assign(root.style,{position:'relative',width:bounds.width+'px',height:bounds.height+'px',flex:'none'});
      const footer=window.__footer.create();
      const panel=root.querySelector('[role="tabpanel"]').closest('section').getBoundingClientRect();
      Object.assign(footer.style,{position:'absolute',left:'0',top:(panel.bottom-bounds.top+window.__footer.gap)+'px',width:bounds.width+'px'});
      root.append(footer);
      const frame=main.getBoundingClientRect(),style=getComputedStyle(main);
      const height=Math.ceil(footer.getBoundingClientRect().bottom-frame.top+main.scrollTop+parseFloat(style.paddingBottom)+parseFloat(style.borderBottomWidth));
      Object.assign(main.style,{height:height+'px',minHeight:'0',maxHeight:'none',overflow:'hidden'});
      // Avoid half-CSS-pixel centering of an odd-height frame: Playwright rounds
      // its screenshot clip origin to CSS pixels. Content coordinates stay equal.
      main.parentElement.style.alignItems='flex-start';
      actions.style.visibility='hidden';main.scrollTop=0;
      return height;
    });
    assert.deepEqual((await geometry()).positions,before.positions,'Reference crop reflows the actual result');
    const reference = await page.locator('main').screenshot();
    assert.deepEqual((await geometry()).positions,before.positions,'Screenshot changed the reference layout');
    // Restore the untouched fixture through a fresh render, including Recharts'
    // resize observers, before invoking the actual download button.
    await page.goto('http://clean-style-export.test/fixture');
    await page.getByRole('tab',{name:test.tab,exact:true}).click();
    await page.waitForTimeout(1100);
    assert.deepEqual((await geometry()).positions,before.positions);
    assert.equal(await page.locator('[data-export-footer]').count(),0,'Export footer appears in the interactive result');
    await page.evaluate(()=>{
      new MutationObserver(()=>{
        const capture=document.querySelector('[data-result-capture]'),footer=capture?.querySelector('[data-export-footer]');
        if(footer){const box=footer.getBoundingClientRect(),frame=capture.getBoundingClientRect();window.__capturedFooter={text:footer.textContent,bottom:box.bottom-frame.top,height:box.height,frameHeight:frame.height};}
      }).observe(document.body,{childList:true,subtree:true});
    });
    const event = page.waitForEvent('download');
    await page.getByRole('button',{name:'이미지로 저장',exact:true}).click();
    const download = await event;
    const savedFile = path.join(output,`${prefix}-saved.png`);
    await download.saveAs(savedFile);
    const png = await fs.readFile(savedFile);
    const comparison = await page.evaluate(async({a,b,height})=>{
      async function read(src){const i=new Image();i.src=src;await i.decode();const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const x=c.getContext('2d');x.drawImage(i,0,0);return {c,x,w:c.width,h:c.height};}
      const native=await read(a),saved=await read(b), h=height*2;
      const aPixels=native.x.getImageData(0,0,native.w,h).data,bPixels=saved.x.getImageData(0,0,saved.w,saved.h).data;
      const cropped=document.createElement('canvas');cropped.width=native.w;cropped.height=h;cropped.getContext('2d').putImageData(native.x.getImageData(0,0,native.w,h),0,0);
      const diff=document.createElement('canvas');diff.width=saved.w;diff.height=saved.h;const dx=diff.getContext('2d'),pixels=dx.createImageData(saved.w,saved.h);
      let count=0,sum=0;
      if(saved.h===h&&saved.w===native.w)for(let n=0;n<aPixels.length;n+=4){let distance=0;for(let k=0;k<3;k++)distance+=Math.abs(aPixels[n+k]-bPixels[n+k]);if(distance>45)count++;sum+=distance;
        pixels.data[n]=distance>45?230:bPixels[n]*.35;pixels.data[n+1]=distance>45?40:bPixels[n+1]*.35;pixels.data[n+2]=distance>45?40:bPixels[n+2]*.35;pixels.data[n+3]=255;}
      dx.putImageData(pixels,0,0);
      return{width:saved.w,height:saved.h,expected:[native.w,h],differentRatio:saved.h===h?count/(native.w*h):null,meanChannelDifference:saved.h===h?sum/(native.w*h*3):null,reference:cropped.toDataURL(),difference:diff.toDataURL()};
    },{a:'data:image/png;base64,'+reference.toString('base64'),b:'data:image/png;base64,'+png.toString('base64'),height:expectedHeight});
    for(const key of ['reference','difference']){await fs.writeFile(path.join(output,`${prefix}-${key}.png`),Buffer.from(comparison[key].split(',')[1],'base64'));delete comparison[key];}
    const after = await geometry();
    const footer=await page.evaluate(()=>window.__capturedFooter);
    assert.equal(footer?.text,'청렴한 당신을 응원합니다.국립수산과학원');
    assert(footer.bottom<footer.frameHeight&&footer.height>0,'Institution footer is clipped');
    assert.equal(await page.locator('[data-export-footer]').count(),0);
    const check={...test,filename:download.suggestedFilename(),before,after,footer,...comparison};report.checks.push(check);
    console.log(JSON.stringify(check));
    assert.deepEqual([comparison.width,comparison.height],comparison.expected,'PNG retains blank footer space or clips content');
    assert(comparison.differentRatio<0.025,'Whole saved image differs from the same live result');
    assert.deepEqual(after.positions,before.positions,'Saving changes the live result layout');
    // Repeat the save without reloading: no notice should shrink the chart.
    const repeatedEvent=page.waitForEvent('download');await page.getByRole('button',{name:'이미지로 저장',exact:true}).click();
    const repeated=await repeatedEvent;const repeatedFile=path.join(output,`${prefix}-repeat.png`);await repeated.saveAs(repeatedFile);
    assert.equal(sha(await fs.readFile(repeatedFile)),sha(png),'Repeated save changes pixels');
    assert.deepEqual((await geometry()).positions,before.positions);
  }
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.externalRequests,[]);
  report.browser=browser.version();
} finally {
  await fs.writeFile(path.join(output,'verification.json'),JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
