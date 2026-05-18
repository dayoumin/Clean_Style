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
