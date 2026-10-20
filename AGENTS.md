# Project Operating Notes

## Product And Diagnostic Boundaries

This repository builds three products from one `main` branch. Product identity comes from
the product definition and build configuration, not from a long-lived product branch.

| Product | Audience | Diagnostics | AI chat |
| --- | --- | --- | --- |
| `clean-style` (`default`) | Adults | `adult-integrity` | Enabled |
| `clean-style-plus` (`plus`) | Adults | `adult-integrity`, `workplace-respect` | Enabled |
| `clean-style-student` (`student`) | Korean middle/high school students | `student-integrity` only | Disabled |

- `clean-style-plus` is the adult product with the additional workplace-respect diagnostic.
- `clean-style-student` is a separate instrument, not a student skin for the adult test.
- Never expose adult questions, adult three-axis scoring, adult eight-style results, AI chat,
  name entry, or adult result history in the student product.
- Never reuse adult norms, scoring keys, result tables, or array-position answer contracts for
  student responses.
- Shared code may cover session flow, progress, accessibility, layout, errors, and versioned
  response contracts. Questions, scoring, interpretation, storage policy, safety, and validation
  evidence remain diagnostic-owned.
- Keep product composition in `src/products/` and diagnostic-owned code in `src/diagnostics/`.
  Read the nearest nested `AGENTS.md` before changing those folders.
- Use short-lived feature branches for changes, then merge reviewed work into `main`. Do not
  maintain one permanent branch per deployed product.
- Student development must follow
  `docs/research/student-integrity/product-and-student-implementation-plan.html`.
- Student scientific and safety claims must remain consistent with the student research hub.
  Update the evidence register and literature review log when adding or changing a claim.

## Product Deployment Policy

- The default server product deploys only by explicitly invoking its manual `workflow_dispatch`
  workflow on reviewed `main`. Pushes and merges must not trigger deployment. Commit, push,
  merge, and HTML generation requests do not authorize dispatching a server deployment.
- The separate `clean-style-plus` deployment was retired on 2026-10-15. Keep its deployment
  workflow removed and do not recreate its Cloudflare Worker unless the user explicitly requests it.
  The Plus product definition and diagnostic code remain available for local use.
- The student product stays manual-deploy only until its content, safeguarding, and validation
  gates are approved. Do not restore automatic student deployment merely for convenience.
- Do not deploy any product unless the user explicitly asks for deployment in the current task.
- A successful build for one product does not prove the other product variants are correct.
  Run product-matrix checks when changing shared product or diagnostic boundaries.

## Project-Local Temporary Files

- Keep Codex-started development-server logs under
  `artifacts/dev-server/<port>/`; `artifacts/` is already ignored by Git.
- Do not place temporary server logs directly in the repository root.
- Keep Next.js caches in the existing `.next-*` directories and do not reuse or delete another
  session's `.codex-tmp` contents when ownership is unclear.
- Record the command, port, working directory, and log directory in the work summary.

## Production Cloudflare Issues

- If the user says an error happened after deployment, in production, on Cloudflare Workers, or on the public `workers.dev` URL, diagnose the deployed Worker first.
- Use local Windows commands only as HTTP clients, file inspection, or narrow verification helpers for that production diagnosis.
- Do not start `next dev`, run local browser verification, or frame the issue as a Windows/runtime problem unless the user explicitly asks for local reproduction or the evidence points to local-only behavior.
- For AI answer failures in production, first check the deployed `/api/chat` response, Cloudflare Worker environment/secrets, OpenAI status/body, and deployment workflow.
- Do not add post-deploy `wrangler secret put` steps for normal CI. This project deploys Worker secrets together with code using `wrangler deploy --secrets-file`, then verifies `/api/chat` with a production smoke test.

## AI Runtime Configuration

- Production AI calls depend on Cloudflare Worker runtime values:
  - `OPENAI_API_KEY` as a Worker secret for direct `gpt-6-luna` calls to `https://api.openai.com/v1/chat/completions`.
  - `NEXT_PUBLIC_APP_URL=https://clean-style.ecomarin.workers.dev` as a Worker var.
- OpenRouter and NVIDIA fallback are no longer used. Keep the adult chat, summary, and workplace-respect advice on the same direct OpenAI runtime.
- A local `.env.local` success only proves the local key/model works. It does not prove the deployed Worker has the same secret or OpenAI model permissions.

## Environment File Policy

- For this project, treat `.env.local` as the only human-edited local env file.
- Treat GitHub Actions secrets as the production source of truth. Production values flow from GitHub Secrets through `wrangler deploy --secrets-file` into Cloudflare Worker secrets.
- Do not use another project's `.dev.vars` as evidence that Clean_style production has a secret.
- Do not maintain a project `.dev.vars` unless explicitly running `wrangler dev` or another Cloudflare-local runtime that requires it. If one is needed temporarily, mirror values from `.env.local`, keep it uncommitted, and do not treat it as the source of truth.

## Windows Task-Local Tool Caches

- If Corepack's sandbox profile cache is missing or inaccessible, set `COREPACK_HOME=D:\Projects\Clean_style\artifacts\tool-cache\corepack` for the command; reuse the existing `node_modules`.
- For Vitest/Vite temporary-file rename failures under the sandbox user-profile temp directory, create `artifacts/tool-cache/test-temp/` and set both `TEMP` and `TMP` to its absolute Windows path for the test command. Do not change user-global environment variables.
