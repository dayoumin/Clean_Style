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

- The default and plus products may deploy from reviewed `main` according to their workflows.
- The student product stays manual-deploy only until its content, safeguarding, and validation
  gates are approved. Do not restore automatic student deployment merely for convenience.
- Do not deploy any product unless the user explicitly asks for deployment in the current task.
- A successful build for one product does not prove the other product variants are correct.
  Run product-matrix checks when changing shared product or diagnostic boundaries.

## Production Cloudflare Issues

- If the user says an error happened after deployment, in production, on Cloudflare Workers, or on the public `workers.dev` URL, diagnose the deployed Worker first.
- Use local Windows commands only as HTTP clients, file inspection, or narrow verification helpers for that production diagnosis.
- Do not start `next dev`, run local browser verification, or frame the issue as a Windows/runtime problem unless the user explicitly asks for local reproduction or the evidence points to local-only behavior.
- For AI answer failures in production, first check the deployed `/api/chat` response, Cloudflare Worker environment/secrets, OpenRouter status/body, and deployment workflow.
- Do not add post-deploy `wrangler secret put` steps for normal CI. This project deploys Worker secrets together with code using `wrangler deploy --secrets-file`, then verifies `/api/chat` with a production smoke test.

## AI Runtime Configuration

- Production AI calls depend on Cloudflare Worker runtime values:
  - `OPENROUTER_API_KEY` as a Worker secret.
  - `NVIDIA_API_KEY` as an optional Worker secret for `nvidia:` model fallback.
  - `NEXT_PUBLIC_APP_URL=https://clean-style.ecomarin.workers.dev` as a Worker var.
- A local `.env.local` success only proves the local key/model works. It does not prove the deployed Worker has the same secret or OpenRouter permissions.

## Environment File Policy

- For this project, treat `.env.local` as the only human-edited local env file.
- Treat GitHub Actions secrets as the production source of truth. Production values flow from GitHub Secrets through `wrangler deploy --secrets-file` into Cloudflare Worker secrets.
- Do not use another project's `.dev.vars` as evidence that Clean_style production has a secret.
- Do not maintain a project `.dev.vars` unless explicitly running `wrangler dev` or another Cloudflare-local runtime that requires it. If one is needed temporarily, mirror values from `.env.local`, keep it uncommitted, and do not treat it as the source of truth.
