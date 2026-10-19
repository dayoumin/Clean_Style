import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(root, 'src/products/adult/standalone');
const mime = { '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const json = value => JSON.stringify(value).replaceAll('<', '\\u003c');

// Compile only the standalone entry's local dependencies. No env files, server
// bundles, packages, dynamic imports or network loaders enter the artifact.
async function bundle(entry) {
  const modules = new Map();
  async function visit(filename) {
    const id = path.relative(root, filename).replaceAll('\\', '/');
    if (modules.has(id)) return id;
    modules.set(id, '');
    const source = await fs.readFile(filename, 'utf8');
    const compiled = ts.transpileModule(source, {
      fileName: filename,
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, allowJs: true },
    }).outputText;
    const dependencies = {};
    for (const match of compiled.matchAll(/require\(["']([^"']+)["']\)/g)) {
      const name = match[1];
      if (!name.startsWith('.') && !name.startsWith('@/')) throw new Error(`Non-local dependency: ${name}`);
      const base = name.startsWith('@/') ? path.join(root, 'src', name.slice(2)) : path.resolve(path.dirname(filename), name);
      if (!base.startsWith(path.join(root, 'src') + path.sep)) throw new Error(`Invalid source: ${name}`);
      let resolved;
      for (const candidate of [base, `${base}.ts`, `${base}.js`, path.join(base, 'index.ts')]) {
        if ((await fs.stat(candidate).catch(() => null))?.isFile()) { resolved = candidate; break; }
      }
      if (!resolved) throw new Error(`Missing local dependency: ${name}`);
      dependencies[name] = await visit(resolved);
    }
    modules.set(id, `[function(module,exports,require){\n${compiled}\n},${json(dependencies)}]`);
    return id;
  }
  const entryId = await visit(entry);
  return `(function(){const modules={${[...modules].map(([id, body]) => `${json(id)}:${body}`).join(',')}};const cache={};function load(id){if(cache[id])return cache[id].exports;const module={exports:{}};cache[id]=module;const [run,deps]=modules[id];run(module,module.exports,name=>{if(!deps[name])throw Error('Unknown module');return load(deps[name]);});return module.exports;}load(${json(entryId)});})();`;
}

async function sharedComponent(filename) {
  const source = await fs.readFile(path.join(root, 'src/products/adult/components', filename), 'utf8');
  const module = { exports: {} };
  const localRequire = createRequire(import.meta.url);
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true,
  } }).outputText, { module, exports: module.exports, require: name => {
    if (!['react', 'react/jsx-runtime'].includes(name)) throw new Error(`Unexpected presentation dependency: ${name}`);
    return localRequire(name);
  } });
  return module.exports;
}

export async function buildStandaloneHtml(outputDir = path.join(root, 'artifacts/html')) {
  const brand = await sharedComponent('AdultInstitutionBrand.tsx');
  const { AdultIcon } = await sharedComponent('AdultIcon.tsx');
  const brandMarkup = renderToStaticMarkup(createElement(brand.default));
  const icons = Object.fromEntries(['research', 'document', 'handshake', 'close'].map(name =>
    [name, renderToStaticMarkup(createElement(AdultIcon, { name, size: name === 'close' ? 16 : 18 }))]));
  const artwork = await fs.readFile(path.join(root, 'src/diagnostics/adult-integrity/artwork.ts'), 'utf8');
  const scenesSource = await fs.readFile(path.join(root, 'src/products/adult/components/question-ocean-files.ts'), 'utf8');
  const ast = ts.createSourceFile('scenes.ts', scenesSource, ts.ScriptTarget.Latest, true);
  let sceneFiles;
  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(ast) !== 'QUESTION_OCEAN_FILES') continue;
      let array = declaration.initializer;
      if (ts.isAsExpression(array)) array = array.expression;
      if (!ts.isArrayLiteralExpression(array) || !array.elements.every(ts.isStringLiteral)) throw new Error('Invalid ocean image manifest');
      sceneFiles = array.elements.map(item => item.text);
    }
  }
  if (!sceneFiles?.length) throw new Error('Missing ocean image manifest');
  const paths = [...new Set([
    '/images/integrity-home-title-smile.png', '/images/adult-integrity/result-wave-pattern.svg',
    '/icons/adult/icon-192x192.png',
    ...[...artwork.matchAll(/['"](\/images\/[^'"]+)['"]/g)].map(match => match[1]),
    ...sceneFiles.map(name => `/images/adult-integrity/question-ocean/${name}`),
  ])];
  const assets = {};
  const inventory = [];
  for (const assetPath of paths) {
    const filename = path.resolve(root, 'public', assetPath.slice(1));
    if (!filename.startsWith(path.join(root, 'public') + path.sep)) throw new Error('Invalid asset path');
    const bytes = await fs.readFile(filename); // Missing assets must fail the build.
    const type = mime[path.extname(filename)];
    if (!type) throw new Error(`Unsupported asset: ${filename}`);
    if (type === 'image/svg+xml' && /(?:href\s*=\s*["'](?!#|data:)|url\(\s*["']?(?:https?:|\/))/i.test(bytes.toString())) throw new Error(`External SVG resource: ${filename}`);
    assets[assetPath] = `data:${type};base64,${bytes.toString('base64')}`;
    inventory.push({ path: assetPath, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  const { version } = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  const metadata = { product: 'clean-style', distribution: 'html', version, builtAt: new Date().toISOString(), sceneFiles, brandMarkup, icons };
  const css = (await fs.readFile(path.join(sourceRoot, 'styles.css'), 'utf8')).replaceAll('__RESULT_WAVE__', assets['/images/adult-integrity/result-wave-pattern.svg']);
  const code = await bundle(path.join(sourceRoot, 'app.js'));
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"><title>청렴 스타일 테스트 · 파일 버전</title><link rel="icon" href="${assets['/icons/adult/icon-192x192.png']}"><style>${css}</style></head><body><main id="app" aria-label="청렴 스타일 테스트"></main><p id="notice" role="status" aria-live="polite"></p><noscript>검사를 시작하려면 브라우저의 JavaScript를 허용해 주세요.</noscript><script id="standalone-data" type="application/json">${json({ assets, metadata })}</script><script>${code.replaceAll(/<\/script/gi, '<\\/script')}</script></body></html>`;
  await fs.mkdir(outputDir, { recursive: true });
  const filename = path.join(outputDir, 'clean-style.html');
  await fs.writeFile(filename, html, 'utf8');
  const manifest = { ...metadata, file: 'clean-style.html', bytes: Buffer.byteLength(html), sha256: createHash('sha256').update(html).digest('hex'), assets: inventory };
  await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return { filename, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length > 2) throw new Error('This target builds only clean-style HTML; no product or deploy arguments are accepted.');
  const { filename, manifest } = await buildStandaloneHtml();
  console.log(`HTML: ${filename}\n${manifest.assets.length} embedded assets · ${manifest.bytes} bytes\nSHA-256: ${manifest.sha256}\nNo server build or deployment was run.`);
}
