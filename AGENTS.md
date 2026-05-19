# Project Operating Notes

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
