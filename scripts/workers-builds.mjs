// Cloudflare Workers Builds entry point (release rule 3): every push to main builds each product
// and stores an inactive version with 0% traffic. Promotion happens only through `pnpm release`
// on the PC. Usage, set per Worker in the Workers Builds settings:
//   build command:  node scripts/workers-builds.mjs build <default|student>
//   deploy command: node scripts/workers-builds.mjs upload <default|student>
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMMIT_SHA, getProduct, versionVarArgs } from './release/products.mjs';

const MARKER = '.workers-builds/verified.json';
const WORKER_BUNDLE = '.open-next/worker.js';

/** @param {NodeJS.ProcessEnv} env @param {string} head @returns {string} commit SHA */
export function assertBuildContext(env, head) {
  if (env.WORKERS_CI !== '1') throw new Error('This script runs only inside Cloudflare Workers Builds');
  if (env.WORKERS_CI_BRANCH !== 'main') throw new Error(`Only main is built for production (got ${env.WORKERS_CI_BRANCH})`);
  const commitSha = env.WORKERS_CI_COMMIT_SHA ?? '';
  if (!COMMIT_SHA.test(commitSha) || commitSha !== head) throw new Error('Workers Builds commit differs from the checkout');
  return commitSha;
}

/** @param {string | undefined} mode @returns {'build' | 'upload'} */
export function assertBuildMode(mode) {
  if (mode !== 'build' && mode !== 'upload') {
    throw new Error('Workers Builds supports only build or upload; promote with `pnpm release production` on the PC');
  }
  return mode;
}

/** @param {any} marker @param {string} product @param {string} commitSha @param {string} workerHash @returns {void} */
export function verifyBuildMarker(marker, product, commitSha, workerHash) {
  if (marker?.product !== product || marker?.commitSha !== commitSha || marker?.workerHash !== workerHash) {
    throw new Error('Upload requires a verified build of this exact commit and product');
  }
}

/** Version preview URLs would expose an unreleased version with production D1 and secrets.
 * @param {any} response Cloudflare `GET /accounts/:id/workers/workers/:name` body @returns {void} */
export function assertPreviewsDisabled(response) {
  if (response?.success !== true || response.result?.subdomain?.previews_enabled !== false) {
    throw new Error('Disable version preview URLs for this Worker before uploading production versions');
  }
}

/** @param {string} text @returns {string | null} */
export function parseUploadedVersionId(text) {
  return [...text.matchAll(/Worker Version ID:\s*([0-9a-f-]{36})/gi)].at(-1)?.[1] ?? null;
}

const sha256 = (text) => createHash('sha256').update(text).digest('hex');

async function main([modeArg, productArg]) {
  const mode = assertBuildMode(modeArg);
  const product = getProduct(productArg);
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const commitSha = assertBuildContext(process.env, head);
  const env = { ...process.env, ...product.vars };
  const run = (cmd, args, capture = false) => execFileSync(cmd, args, {
    env, encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit', maxBuffer: 20 * 1024 * 1024,
  });

  if (mode === 'build') {
    rmSync(MARKER, { force: true });
    run('pnpm', ['check']);
    run('pnpm', ['build']);
    mkdirSync(dirname(MARKER), { recursive: true });
    writeFileSync(MARKER, `${JSON.stringify({ product: product.key, commitSha, workerHash: sha256(readFileSync(WORKER_BUNDLE, 'utf8')) })}\n`);
    console.log(`Verified ${product.key} build of ${commitSha}`);
    return;
  }

  verifyBuildMarker(JSON.parse(readFileSync(MARKER, 'utf8')), product.key, commitSha, sha256(readFileSync(WORKER_BUNDLE, 'utf8')));
  const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token } = process.env;
  if (!account || !token) throw new Error('Workers Builds must provide CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN');
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/workers/${product.worker}`, {
    headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000), redirect: 'error', cache: 'no-store',
  });
  assertPreviewsDisabled(await response.json().catch(() => null));
  const output = run('pnpm', ['exec', 'wrangler', 'versions', 'upload', '--name', product.worker,
    '--tag', commitSha, '--message', `workers-builds ${product.key} ${commitSha}`, ...versionVarArgs(product, commitSha)], true);
  process.stdout.write(output);
  const versionId = parseUploadedVersionId(output);
  if (!versionId) throw new Error('Upload outcome unconfirmed; inspect `wrangler versions list` before retrying');
  console.log(`Stored inactive ${product.worker} version ${versionId} for ${commitSha}; production traffic is unchanged`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
