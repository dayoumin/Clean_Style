// Deployable products for `pnpm release` and Cloudflare Workers Builds.
// The Plus deployment was retired on 2026-10-15 and stays out of this table (AGENTS.md).

export const D1_DATABASE = { binding: 'DB', name: 'clean-style-db', id: '50c80b79-0e38-4c8e-8b38-a7652b35114c' };

/** @typedef {{key:string, worker:string, url:string, vars:Record<string,string>, secrets:string[], smoke:'chat'|'student'}} Product */

/** @type {Record<string, Product>} */
export const PRODUCTS = {
  default: {
    key: 'default',
    worker: 'clean-style',
    url: 'https://clean-style.ecomarin.workers.dev',
    vars: {
      NEXT_PUBLIC_APP_URL: 'https://clean-style.ecomarin.workers.dev',
      NEXT_PUBLIC_ENABLE_RESPECT_PILOT: '0',
      NEXT_PUBLIC_ENABLE_AI_CHAT: '1',
      NEXT_PUBLIC_APP_VARIANT: 'default',
    },
    secrets: ['OPENAI_API_KEY', 'ADMIN_SECRET'],
    smoke: 'chat',
  },
  student: {
    key: 'student',
    worker: 'clean-style-student',
    url: 'https://clean-style-student.ecomarin.workers.dev',
    vars: {
      NEXT_PUBLIC_APP_URL: 'https://clean-style-student.ecomarin.workers.dev',
      NEXT_PUBLIC_ENABLE_RESPECT_PILOT: '0',
      NEXT_PUBLIC_ENABLE_AI_CHAT: '0',
      NEXT_PUBLIC_APP_VARIANT: 'student',
    },
    secrets: [],
    smoke: 'student',
  },
};

export const COMMIT_SHA = /^[a-f0-9]{40}$/;
export const VERSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** @param {string | undefined} key @returns {Product} */
export function getProduct(key) {
  const product = PRODUCTS[key ?? ''];
  if (!product) throw new Error(`Unknown product "${key}". Use one of: ${Object.keys(PRODUCTS).join(', ')}`);
  return product;
}

/** `--var` arguments shared by the build-time upload and the release-time check.
 * @param {Product} product @param {string} commitSha @returns {string[]} */
export function versionVarArgs(product, commitSha) {
  return [...Object.entries(product.vars), ['DEPLOYMENT_COMMIT_SHA', commitSha]]
    .flatMap(([name, value]) => ['--var', `${name}:${value}`]);
}

/** Checks that a stored version is the verified upload of this commit for this product.
 * `version` is `wrangler versions view <id> --json` output.
 * @param {any} version @param {Product} product @param {string} commitSha @returns {void} */
export function verifyStoredVersion(version, product, commitSha) {
  if (version?.annotations?.['workers/tag'] !== commitSha) throw new Error(`Version ${version?.id} is not tagged with ${commitSha}`);
  const bindings = version?.resources?.bindings;
  if (!Array.isArray(bindings)) throw new Error(`Version ${version?.id} has no binding list`);
  const d1 = bindings.filter((binding) => binding.type === 'd1');
  if (d1.length !== 1 || d1[0].name !== D1_DATABASE.binding || d1[0].id !== D1_DATABASE.id) {
    throw new Error(`Version ${version.id} does not bind the production D1 as ${D1_DATABASE.binding}`);
  }
  const expectedVars = { ...product.vars, DEPLOYMENT_COMMIT_SHA: commitSha };
  for (const [name, text] of Object.entries(expectedVars)) {
    if (!bindings.some((binding) => binding.type === 'plain_text' && binding.name === name && binding.text === text)) {
      throw new Error(`Version ${version.id} var ${name} is not "${text}"`);
    }
  }
  for (const name of product.secrets) {
    if (!bindings.some((binding) => binding.type === 'secret_text' && binding.name === name)) {
      throw new Error(`Version ${version.id} is missing Worker secret ${name}`);
    }
  }
}

/** Finds the newest stored version tagged with the commit. `versions` is `wrangler versions list --json` output.
 * @param {any[]} versions @param {string} commitSha @returns {string | null} */
export function findVersionForCommit(versions, commitSha) {
  if (!Array.isArray(versions)) return null;
  const matches = versions
    .filter((version) => version?.annotations?.['workers/tag'] === commitSha && VERSION_ID.test(version.id ?? ''))
    .sort((a, b) => String(b.metadata?.created_on ?? '').localeCompare(String(a.metadata?.created_on ?? '')));
  return matches[0]?.id ?? null;
}

/** The single version serving 100% of traffic. `deployment` is `wrangler deployments status --json` output.
 * @param {any} deployment @returns {string | null} */
export function activeVersionId(deployment) {
  const versions = Array.isArray(deployment?.versions) ? deployment.versions : [];
  const full = versions.filter((version) => version?.percentage === 100 && VERSION_ID.test(version.version_id ?? ''));
  return full.length === 1 ? full[0].version_id : null;
}

/** Next `prod-YYYY-MM-DD.N` tag for the UTC date (release rule 7).
 * @param {string[]} existingTags @param {Date} now @returns {string} */
export function nextReleaseTag(existingTags, now) {
  const prefix = `prod-${now.toISOString().slice(0, 10)}.`;
  const used = existingTags
    .filter((tag) => tag.startsWith(prefix))
    .map((tag) => Number(tag.slice(prefix.length)))
    .filter((n) => Number.isInteger(n) && n > 0);
  return `${prefix}${used.length ? Math.max(...used) + 1 : 1}`;
}

/** Pending migration file names from `wrangler d1 migrations list --remote` text output.
 * @param {string} output @returns {string[]} */
export function parsePendingMigrations(output) {
  if (/No migrations to apply/i.test(output)) return [];
  return [...new Set([...output.matchAll(/\b(\d{4}_[\w-]+\.sql)\b/g)].map((match) => match[1]))];
}
