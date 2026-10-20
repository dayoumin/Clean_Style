import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { build } from 'esbuild';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { adaptSource } from '../src/products/adult/standalone/adapt-source.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const standalone = path.join(root, 'src/products/adult/standalone');
const mime = { '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const json = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const sha = value => createHash('sha256').update(value).digest('hex');
const relative = filename => path.relative(root, filename).replaceAll('\\', '/');

export async function buildStandaloneHtml(outputDir = path.join(root, 'artifacts/html')) {
  const sources = new Map();
  const candidates = [];
  async function readSource(filename) {
    const bytes = await fs.readFile(filename);
    sources.set(relative(filename), sha(bytes));
    return bytes.toString('utf8').replaceAll('\r\n', '\n');
  }
  const artwork = await readSource(path.join(root, 'src/diagnostics/adult-integrity/artwork.ts'));
  const title = await readSource(path.join(root, 'src/products/adult/components/adult-home-title.ts'));
  const scenes = await readSource(path.join(root, 'src/products/adult/components/question-ocean-files.ts'));
  const ast = ts.createSourceFile('scenes.ts', scenes, ts.ScriptTarget.Latest, true);
  let sceneFiles;
  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(ast) !== 'QUESTION_OCEAN_FILES') continue;
      let array = declaration.initializer;
      if (ts.isAsExpression(array)) array = array.expression;
      if (!ts.isArrayLiteralExpression(array) || !array.elements.every(ts.isStringLiteral)) throw Error('Invalid ocean image manifest');
      sceneFiles = array.elements.map(item => item.text);
    }
  }
  if (!sceneFiles?.length) throw Error('Missing ocean image manifest');
  const paths = [...new Set([
    '/images/adult-integrity/result-wave-pattern.svg', '/icons/adult/icon-192x192.png',
    ...[...(artwork + title).matchAll(/['"](\/images\/[^'"]+)['"]/g)].map(match => match[1]),
    ...sceneFiles.map(name => `/images/adult-integrity/question-ocean/${name}`),
  ])];
  const assets = {}; const inventory = [];
  for (const assetPath of paths) {
    const filename = path.resolve(root, 'public', assetPath.slice(1));
    if (!filename.startsWith(path.join(root, 'public') + path.sep)) throw Error('Invalid asset path');
    const bytes = await fs.readFile(filename);
    const type = mime[path.extname(filename)];
    if (!type) throw Error(`Unsupported asset: ${filename}`);
    if (type === 'image/svg+xml' && /(?:href\s*=\s*["'](?!#|data:)|url\(\s*["']?(?:https?:|\/))/i.test(bytes.toString())) throw Error(`External SVG resource: ${filename}`);
    assets[assetPath] = `data:${type};base64,${bytes.toString('base64')}`;
    inventory.push({ path: assetPath, bytes: bytes.length, sha256: sha(bytes) });
  }
  const plugin = {
    name: 'standalone-browser-boundary',
    setup(builder) {
      builder.onResolve({ filter: /^(next\/(navigation|link)|@\/lib\/history)$/ }, args => ({
        path: path.join(standalone, args.path === '@/lib/history' ? 'runtime.ts' : 'navigation.tsx'),
      }));
      builder.onResolve({ filter: /^(?:@\/data\/appVariant|\.\/appVariant)$/ }, () => ({ path: 'html-product', namespace: 'html' }));
      builder.onResolve({ filter: /^@\/components\/FluentEmoji$/ }, () => ({ path: 'inline-emoji-fallback', namespace: 'html' }));
      builder.onLoad({ filter: /.*/, namespace: 'html' }, args => ({ contents: args.path === 'html-product'
        ? 'export const IS_STUDENT_VARIANT=false, AI_CHAT_ENABLED=false, RESPECT_PILOT_ENABLED=false;'
        : 'export function FluentEmoji({emoji,className}) { return <span className={className}>{emoji}</span> }', loader: 'tsx', resolveDir: root }));
      builder.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, async args => {
        if (!args.path.startsWith(path.join(root, 'src') + path.sep)) return;
        const name = relative(args.path);
        if (/\/(?:hooks\/useAiChat|components\/AiAdviceSheet|lib\/client-id|app\/api\/|diagnostics\/student-integrity|diagnostics\/workplace-respect)/.test(name)) {
          throw Error(`Server-only or other-product dependency in HTML: ${name}`);
        }
        const original = await readSource(args.path);
        let contents = adaptSource(original, name);
        candidates.push({ content: contents, extension: path.extname(args.path).slice(1) });
        const file = ts.createSourceFile(name, contents, ts.ScriptTarget.Latest, true, name.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
        let embedded = false;
        const transformed = ts.transform(file, [context => node => {
          function visit(child) {
            if (ts.isStringLiteral(child) && child.text.startsWith('/images/')) {
              if (!assets[child.text]) throw Error(`Missing embedded image: ${child.text}`);
              embedded = true;
              return ts.factory.createCallExpression(ts.factory.createIdentifier('__standaloneAsset'), undefined, [child]);
            }
            if (ts.isTemplateExpression(child) && child.head.text.startsWith('/images/')) {
              if (!name.endsWith('/components/QuestionOcean.tsx')) throw Error(`Unreviewed dynamic image: ${name}`);
              embedded = true;
              return ts.factory.createCallExpression(ts.factory.createIdentifier('__standaloneAsset'), undefined, [child]);
            }
            return ts.visitEachChild(child, visit, context);
          }
          return ts.visitNode(node, visit);
        }]);
        contents = ts.createPrinter().printFile(transformed.transformed[0]);
        transformed.dispose();
        if (embedded) contents = "import { asset as __standaloneAsset } from '@/products/adult/standalone/assets';\n" + contents;
        return { contents, loader: name.endsWith('x') ? 'tsx' : 'ts' };
      });
      builder.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'css' }));
    },
  };
  const bundled = await build({
    absWorkingDir: root, entryPoints: [path.join(standalone, 'entry.tsx')], bundle: true,
    write: false, outdir: 'html-output', format: 'iife', platform: 'browser', target: 'es2020',
    minify: true, metafile: true, jsx: 'automatic', plugins: [plugin],
    define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'silent',
  });
  const code = bundled.outputFiles.find(file => file.path.endsWith('.js')).text;
  if (/\/api\/(?:chat|results)|serviceWorker|OPENAI_API_KEY/.test(code)) throw Error('Server behavior leaked into HTML');
  const globalCss = await readSource(path.join(root, 'src/styles/globals.css'));
  const adultCss = await readSource(path.join(root, 'src/products/adult/styles.css'));
  const compiler = await compile(globalCss + '\n' + adultCss, {
    base: path.join(root, 'src/styles'), onDependency: () => {}, shouldRewriteUrls: false,
  });
  const scanner = new Scanner({});
  let css = compiler.build(scanner.scanFiles(candidates));
  css = css.replace(/url\((['"]?)(\/images\/[^)'"\s]+)\1\)/g, (_match, _quote, image) => {
    if (!assets[image]) throw Error(`Missing CSS image: ${image}`);
    return `url("${assets[image]}")`;
  });
  css += '\n.standalone-notice{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:100;max-width:min(92vw,480px);padding:12px 16px;border-radius:12px;background:#263e36;color:white;font-size:13px}.standalone-notice button{margin-left:12px;padding:4px}.adult-result-actions{flex-wrap:wrap}.standalone-export-message{flex:0 0 100%;font-size:12px;line-height:1.6;color:var(--color-text-secondary)}.standalone-export-message a{color:var(--color-primary);text-decoration:underline}';
  const { version } = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  const metadata = { product: 'clean-style', distribution: 'html', version, builtAt: new Date().toISOString(), sceneFiles };
  let html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"><title>청렴 스타일 테스트 · 파일 버전</title><link rel="icon" href="${assets['/icons/adult/icon-192x192.png']}"><style>${css.replaceAll(/<\/style/gi, '<\\/style')}</style></head><body><div id="app"></div><noscript>검사를 시작하려면 브라우저의 JavaScript를 허용해 주세요.</noscript><script id="standalone-data" type="application/json">${json({ assets, metadata })}</script><script>${code.replaceAll(/<\/script/gi, '<\\/script')}</script></body></html>`;
  const captureLicense = await fs.readFile(path.join(root, 'node_modules/html-to-image/LICENSE'), 'utf8');
  html = html.replace('<head>', '<head><!-- html-to-image 1.11.13\n' + captureLicense.replaceAll('-->', '--&gt;') + '\n-->');
  await fs.mkdir(outputDir, { recursive: true });
  const filename = path.join(outputDir, 'clean-style.html');
  await fs.writeFile(filename, html, 'utf8');
  const manifest = { ...metadata, file: 'clean-style.html', bytes: Buffer.byteLength(html), sha256: sha(html),
    assets: inventory, sources: Object.fromEntries([...sources].sort()),
    sharedScreens: ['home-page.tsx', 'test-page.tsx', 'ResultClient.tsx', 'layout.tsx'],
    packages: Object.keys(bundled.metafile.inputs).filter(name => name.startsWith('node_modules/')) };
  await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return { filename, manifest };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length > 2) throw Error('This target builds only clean-style HTML; no product or deploy arguments are accepted.');
  const { filename, manifest } = await buildStandaloneHtml();
  console.log(`HTML: ${filename}\n${manifest.assets.length} embedded assets · ${manifest.bytes} bytes\nSHA-256: ${manifest.sha256}\nShared server screens compiled; no server build or deployment was run.`);
}
