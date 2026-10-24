import test from 'node:test';
import assert from 'node:assert/strict';
import {
  D1_DATABASE, PRODUCTS, activeVersionId, findVersionForCommit, nextReleaseTag,
  parsePendingMigrations, verifyStoredVersion, versionVarArgs,
} from '../release/products.mjs';
import { overrideHeaders } from '../release/smoke.mjs';
import { assertBuildContext, assertBuildMode, assertPreviewsDisabled, parseUploadedVersionId, verifyBuildMarker } from '../workers-builds.mjs';
import { assertPcContext, parseRollbackArgs } from '../release.mjs';

const SHA = 'a'.repeat(40);
const V1 = '11111111-1111-4111-8111-111111111111';
const V2 = '22222222-2222-4222-8222-222222222222';

function storedVersion(product, overrides = {}) {
  const vars = { ...product.vars, DEPLOYMENT_COMMIT_SHA: SHA };
  return {
    id: V1,
    annotations: { 'workers/tag': SHA },
    resources: {
      bindings: [
        { type: 'd1', name: D1_DATABASE.binding, id: D1_DATABASE.id },
        ...Object.entries(vars).map(([name, text]) => ({ type: 'plain_text', name, text })),
        ...product.secrets.map((name) => ({ type: 'secret_text', name })),
      ],
    },
    ...overrides,
  };
}

test('Plus stays out of the deployable products', () => {
  assert.deepEqual(Object.keys(PRODUCTS).sort(), ['default', 'student']);
  assert.equal(PRODUCTS.student.vars.NEXT_PUBLIC_ENABLE_AI_CHAT, '0');
  assert.deepEqual(PRODUCTS.student.secrets, []);
});

test('version vars record the product settings and commit', () => {
  const args = versionVarArgs(PRODUCTS.student, SHA);
  assert.ok(args.includes('NEXT_PUBLIC_APP_VARIANT:student'));
  assert.ok(args.includes(`DEPLOYMENT_COMMIT_SHA:${SHA}`));
  assert.equal(args.filter((arg) => arg === '--var').length, args.length / 2);
});

test('stored version must match commit, D1, vars and secrets', () => {
  const product = PRODUCTS.default;
  assert.doesNotThrow(() => verifyStoredVersion(storedVersion(product), product, SHA));
  assert.throws(() => verifyStoredVersion(storedVersion(product), product, 'b'.repeat(40)), /not tagged/);
  assert.throws(() => verifyStoredVersion(storedVersion(PRODUCTS.student), product, SHA), /var|secret/);
  const noSecret = storedVersion(product);
  noSecret.resources.bindings = noSecret.resources.bindings.filter((b) => b.name !== 'OPENAI_API_KEY');
  assert.throws(() => verifyStoredVersion(noSecret, product, SHA), /OPENAI_API_KEY/);
  const otherDb = storedVersion(product);
  otherDb.resources.bindings[0].id = 'other';
  assert.throws(() => verifyStoredVersion(otherDb, product, SHA), /D1/);
});

test('finds the newest version for a commit', () => {
  const versions = [
    { id: V1, annotations: { 'workers/tag': SHA }, metadata: { created_on: '2026-10-24T01:00:00Z' } },
    { id: V2, annotations: { 'workers/tag': SHA }, metadata: { created_on: '2026-10-24T02:00:00Z' } },
    { id: V1, annotations: { 'workers/tag': 'b'.repeat(40) } },
  ];
  assert.equal(findVersionForCommit(versions, SHA), V2);
  assert.equal(findVersionForCommit(versions, 'c'.repeat(40)), null);
  assert.equal(findVersionForCommit(null, SHA), null);
});

test('active version requires exactly one version at 100%', () => {
  assert.equal(activeVersionId({ versions: [{ version_id: V1, percentage: 100 }] }), V1);
  assert.equal(activeVersionId({ versions: [{ version_id: V1, percentage: 50 }, { version_id: V2, percentage: 50 }] }), null);
  assert.equal(activeVersionId(null), null);
});

test('release tags use the UTC date and the next sequence number', () => {
  const now = new Date('2026-10-24T23:30:00-05:00');
  assert.equal(nextReleaseTag([], now), 'prod-2026-10-25.1');
  assert.equal(nextReleaseTag(['prod-2026-10-25.1', 'prod-2026-10-25.3', 'prod-2026-10-24.9'], now), 'prod-2026-10-25.4');
});

test('pending migrations are parsed from wrangler output', () => {
  assert.deepEqual(parsePendingMigrations('✅ No migrations to apply!'), []);
  assert.deepEqual(parsePendingMigrations('│ 0003_add_x.sql │\n│ 0004_add-y.sql │'), ['0003_add_x.sql', '0004_add-y.sql']);
});

test('candidate smoke pins requests to the candidate version', () => {
  assert.deepEqual(overrideHeaders(PRODUCTS.default, V1), { 'Cloudflare-Workers-Version-Overrides': `clean-style="${V1}"` });
  assert.deepEqual(overrideHeaders(PRODUCTS.default, undefined), {});
});

test('Workers Builds only builds or uploads main', () => {
  const env = { WORKERS_CI: '1', WORKERS_CI_BRANCH: 'main', WORKERS_CI_COMMIT_SHA: SHA };
  assert.equal(assertBuildContext(env, SHA), SHA);
  assert.throws(() => assertBuildContext({ ...env, WORKERS_CI_BRANCH: 'feature' }, SHA), /Only main/);
  assert.throws(() => assertBuildContext({ ...env, WORKERS_CI: undefined }, SHA), /only inside/);
  assert.throws(() => assertBuildContext(env, 'b'.repeat(40)), /differs/);
  assert.throws(() => assertBuildMode('deploy'), /pnpm release/);
});

test('upload requires the verified build and disabled preview URLs', () => {
  assert.doesNotThrow(() => verifyBuildMarker({ product: 'default', commitSha: SHA, workerHash: 'h' }, 'default', SHA, 'h'));
  assert.throws(() => verifyBuildMarker({ product: 'student', commitSha: SHA, workerHash: 'h' }, 'default', SHA, 'h'));
  assert.doesNotThrow(() => assertPreviewsDisabled({ success: true, result: { subdomain: { previews_enabled: false } } }));
  assert.throws(() => assertPreviewsDisabled({ success: true, result: { subdomain: { previews_enabled: true } } }), /preview/);
  assert.equal(parseUploadedVersionId(`Worker Version ID: ${V1}`), V1);
  assert.equal(parseUploadedVersionId('nothing'), null);
});

test('releases refuse cloud sessions, CI and non-interactive runs', () => {
  assert.doesNotThrow(() => assertPcContext({}, true));
  assert.throws(() => assertPcContext({ CLAUDE_CODE_REMOTE: 'true' }, true), /PC/);
  assert.throws(() => assertPcContext({ WORKERS_CI: '1' }, true), /PC/);
  assert.throws(() => assertPcContext({}, false), /interactive/);
});

test('rollback arguments', () => {
  assert.deepEqual(parseRollbackArgs([]), { product: 'default' });
  assert.deepEqual(parseRollbackArgs(['student', '--to', V1]), { product: 'student', to: V1 });
  assert.throws(() => parseRollbackArgs(['--to', 'prod-2026-10-24.1']), /version ID/);
});
