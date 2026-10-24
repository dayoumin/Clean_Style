// PC-only release and rollback (release rules 4-7). Workers Builds has already stored an
// inactive version for each pushed main commit; this script promotes or rolls back that version.
//   pnpm release production [default|student]
//   pnpm release:rollback [default|student] [--to <version-id>]
// Wrangler authenticates with the PC's `wrangler login`; no token is read from the repository.
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import {
  D1_DATABASE, VERSION_ID, activeVersionId, findVersionForCommit, getProduct,
  nextReleaseTag, parsePendingMigrations, verifyStoredVersion,
} from './release/products.mjs';
import { runSmoke } from './release/smoke.mjs';

/** Release rule 5: cloud sessions, CI and Workers Builds never run releases.
 * @param {NodeJS.ProcessEnv} env @param {boolean} interactive @returns {void} */
export function assertPcContext(env, interactive) {
  const automated = ['CLAUDE_CODE_REMOTE', 'CI', 'GITHUB_ACTIONS', 'WORKERS_CI'].filter((name) => env[name]);
  if (automated.length) throw new Error(`Releases run only from the PC terminal (found ${automated.join(', ')})`);
  if (!interactive) throw new Error('Releases need an interactive terminal for confirmation');
}

/** @param {string[]} args @returns {{product:string, to?:string}} */
export function parseRollbackArgs(args) {
  const parsed = { product: 'default' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--to') {
      parsed.to = args[i + 1];
      i += 1;
    } else {
      parsed.product = args[i];
    }
  }
  if (parsed.to !== undefined && !VERSION_ID.test(parsed.to)) throw new Error('--to needs a Cloudflare version ID');
  return parsed;
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
// Run the project's Wrangler through Node directly so Windows needs no shell quoting.
const WRANGLER_BIN = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
const wrangler = (args, capture = true) => execFileSync(process.execPath, [WRANGLER_BIN, ...args], {
  encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit', maxBuffer: 20 * 1024 * 1024,
}) ?? '';
const wranglerJson = (args) => {
  const text = wrangler([...args, '--json']);
  return JSON.parse(text.slice(text.search(/[[{]/)));
};

async function confirm(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(`${question} [y/N] `)).trim().toLowerCase() === 'y';
  } finally {
    rl.close();
  }
}

function assertCleanMain() {
  if (git('status', '--porcelain')) throw new Error('Commit or stash local changes before releasing');
  if (git('rev-parse', '--abbrev-ref', 'HEAD') !== 'main') throw new Error('Release from the main branch');
  git('fetch', 'origin', 'main', '--tags');
  const head = git('rev-parse', 'HEAD');
  if (head !== git('rev-parse', 'origin/main')) throw new Error('Local main differs from origin/main; pull or push first');
  return head;
}

function readDeployment(product) {
  return wranglerJson(['deployments', 'status', '--name', product.worker]);
}

function recoveryBookmark() {
  const info = wranglerJson(['d1', 'time-travel', 'info', D1_DATABASE.name]);
  if (typeof info?.bookmark !== 'string' || !info.bookmark) throw new Error('D1 recovery bookmark is unavailable; stopping before any change');
  return info.bookmark;
}

function promote(product, specs, message) {
  wrangler(['versions', 'deploy', ...specs, '--name', product.worker, '--message', message, '--yes'], false);
}

/** Annotated tag `prod-YYYY-MM-DD.N` with the release record (release rule 7). */
function recordTag(lines) {
  const tag = nextReleaseTag(git('tag', '--list', 'prod-*').split('\n').filter(Boolean), new Date());
  git('tag', '-a', tag, '-m', lines.join('\n'));
  git('push', 'origin', tag);
  console.log(`Recorded ${tag}`);
  return tag;
}

async function smokeOrFail(product, label, options) {
  try {
    const summary = await runSmoke(product, options);
    console.log(`${label}: ${summary}`);
    return summary;
  } catch (error) {
    throw new Error(`${label} failed: ${error instanceof Error ? error.message : error}`);
  }
}

async function release([stage, productKey = 'default']) {
  if (stage === 'staging') throw new Error('Clean_Style has no staging Worker; use `pnpm release production`');
  if (stage !== 'production') throw new Error('Usage: pnpm release production [default|student]');
  const product = getProduct(productKey);
  const commitSha = assertCleanMain();

  const versionId = findVersionForCommit(wranglerJson(['versions', 'list', '--name', product.worker]), commitSha);
  if (!versionId) throw new Error(`No stored ${product.worker} version for ${commitSha}; wait for Workers Builds to finish`);
  verifyStoredVersion(wranglerJson(['versions', 'view', versionId, '--name', product.worker]), product, commitSha);
  const previousVersionId = activeVersionId(readDeployment(product));
  if (!previousVersionId) throw new Error('Production is not served by exactly one version at 100%; resolve that first');
  if (previousVersionId === versionId) {
    console.log(`${product.worker} already serves ${versionId} (${commitSha}); nothing to release`);
    return;
  }

  const pending = parsePendingMigrations(wrangler(['d1', 'migrations', 'list', D1_DATABASE.name, '--remote']));
  console.log(`Release ${product.worker}: ${previousVersionId} -> ${versionId} (${commitSha})`);
  console.log(pending.length ? `Pending D1 migrations: ${pending.join(', ')}` : 'No pending D1 migrations');
  if (!(await confirm('Continue? (0% candidate smoke first, then 100%)'))) return;

  const bookmark = recoveryBookmark();
  console.log(`D1 recovery bookmark: ${bookmark}`);
  if (pending.length) {
    // Additive migrations only, applied before the new version takes traffic (release rule 6).
    if (!(await confirm(`Apply ${pending.join(', ')} to remote ${D1_DATABASE.name}? These must be additive`))) return;
    wrangler(['d1', 'migrations', 'apply', D1_DATABASE.name, '--remote'], false);
  }

  promote(product, [`${previousVersionId}@100%`, `${versionId}@0%`], `candidate ${commitSha}`);
  let candidateSmoke;
  try {
    candidateSmoke = await smokeOrFail(product, 'Candidate smoke (0%)', { candidateVersionId: versionId });
  } catch (error) {
    promote(product, [`${previousVersionId}@100%`], `candidate failed ${commitSha}`);
    throw new Error(`${error.message}; production stays on ${previousVersionId}`);
  }

  promote(product, [`${versionId}@100%`], `release ${commitSha}`);
  let liveSmoke;
  try {
    liveSmoke = await smokeOrFail(product, 'Production smoke (100%)', {});
  } catch (error) {
    promote(product, [`${previousVersionId}@100%`], `smoke failed ${commitSha}`);
    recordTag([`rollback ${product.worker} after failed release smoke`, `commit: ${commitSha}`,
      `failed version: ${versionId}`, `restored version: ${previousVersionId}`, `D1 bookmark: ${bookmark}`,
      `migrations applied: ${pending.join(', ') || 'none'}`, `smoke: ${error.message}`]);
    throw new Error(`${error.message}; rolled back to ${previousVersionId}`);
  }

  recordTag([`release ${product.worker}`, `commit: ${commitSha}`, `version: ${versionId}`,
    `previous version: ${previousVersionId}`, `D1 bookmark: ${bookmark}`,
    `migrations applied: ${pending.join(', ') || 'none'}`, `candidate smoke: ${candidateSmoke}`, `production smoke: ${liveSmoke}`]);
}

async function rollback(args) {
  const { product: productKey, to } = parseRollbackArgs(args);
  const product = getProduct(productKey);
  assertCleanMain();
  const currentVersionId = activeVersionId(readDeployment(product));
  if (!currentVersionId) throw new Error('Production is not served by exactly one version at 100%; resolve that first');
  if (to === currentVersionId) throw new Error(`${to} is already serving 100%`);
  console.log(`Roll back ${product.worker} from ${currentVersionId} to ${to ?? 'the previous deployment'}`);
  console.log('D1 data is not rolled back; restore it separately from the bookmark if needed');
  if (!(await confirm('Continue?'))) return;

  wrangler(['rollback', ...(to ? [to] : []), '--name', product.worker, '--message', 'pnpm release:rollback', '--yes'], false);
  const restoredVersionId = activeVersionId(readDeployment(product));
  if (!restoredVersionId || restoredVersionId === currentVersionId) throw new Error('Rollback was not confirmed; inspect `wrangler deployments status`');
  const smoke = await runSmoke(product).then((summary) => summary, (error) => `FAILED ${error.message}`);
  console.log(`Production smoke: ${smoke}`);
  recordTag([`rollback ${product.worker}`, `from version: ${currentVersionId}`, `to version: ${restoredVersionId}`, `smoke: ${smoke}`]);
  if (smoke.startsWith('FAILED')) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, ...rest] = process.argv.slice(2);
  Promise.resolve()
    .then(() => assertPcContext(process.env, Boolean(process.stdin.isTTY)))
    .then(() => {
      if (command === 'release') return release(rest);
      if (command === 'rollback') return rollback(rest);
      throw new Error('Usage: node scripts/release.mjs <release|rollback> ...');
    })
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
