# Project Operating Notes

<!-- BEGIN:release-rules v2 · 정본: playbook/stack/release-flow.md -->
## 브랜치·배포 공통 규칙
1. 장기 브랜치는 `main` 하나다. 작업 브랜치·worktree는 짧게 쓰고 병합 후 지운다.
2. 검증(저장소 지침이 정한 검사, 없으면 타입 검사와 관련 테스트)을 마친 작업은 AI가 `main`에 직접 push한다. 단, push 전 hook이 실제로 도는 환경(`git config core.hooksPath`가 저장소 hook 폴더를 가리키고 pre-push가 있음)이어야 하고, `git revert`로 다 되돌아가지 않는 변경(DB·데이터 스크립트, 인증·권한·비밀값, 사용자 기록, 배포·빌드·CI, AI 지침·hook)은 사용자 확인 후 push한다. 조건이 안 되면 커밋까지만 하고 묻는다. `--no-verify`·force-push는 쓰지 않는다.
3. push는 운영 트래픽·데이터를 바꾸지 않는다. 미리 빌드해 트래픽 없는 버전으로 올리는 것까지만 된다.
4. 배포·롤백·DB 구조 변경·비밀값 변경은 사용자가 요청할 때만 `pnpm release`로 한다. `pnpm release`가 없으면 그 저장소 배포 문서의 기존 경로를 쓰고, 그것도 없으면 묻는다. 맨 `wrangler deploy`·`wrangler secret put`과 대시보드 직접 변경은 하지 않는다.
5. 클라우드 세션은 4의 작업을 실행하지 않고, PC에서 실행할 명령과 대상 SHA만 안내한다. Cloudflare 토큰을 저장소·`.env*`·`.dev.vars`·클라우드 작업 공간에 두거나 요청하지 않는다.
6. DB migration은 추가만 하고 새 버전 승격 전에 적용한다. 삭제·이름 변경은 다음 릴리스에서, Durable Object 생성·삭제·이름 변경은 단독 릴리스로 한다. 원격 데이터 쓰기는 승인된 예약 작업이나 사용자가 요청한 스크립트로, 복원 지점을 남긴 뒤에만 한다.
7. 운영 릴리스와 롤백마다 annotated 태그 `prod-YYYY-MM-DD.N`(UTC 날짜)을 남긴다. 데스크톱 앱은 `vX.Y.Z`(설치 파일 버전)를 쓴다.
8. GitHub Actions는 push·pull_request 때 돌지 않는다. 예약 데이터 작업과 수동 실행만 둔다.
<!-- END:release-rules -->

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
- Branching and pushing follow the release rules block above (rules 1–2): `main` is the only
  long-lived branch, short-lived work branches are deleted after merge, and there is no permanent
  branch per deployed product. `.githooks/pre-push` runs `pnpm check` (typecheck, Vitest, and the
  `node:test` tests in `scripts/`); `pnpm install` enables it by setting `core.hooksPath` to
  `.githooks`. If that setting is missing in a session, run `pnpm install` first, or commit and
  ask. `pnpm lint` has no ESLint install or config yet and is not part of the check. Every
  Actions job keeps a `timeout-minutes` limit.
- Student development must follow
  `docs/research/student-integrity/product-and-student-implementation-plan.html`.
- Student scientific and safety claims must remain consistent with the student research hub.
  Update the evidence register and literature review log when adding or changing a claim.

## Product Deployment Policy

- Deployment, rollback, D1 schema changes, and secret changes follow the release rules block
  above (rules 3–8) and happen only when the user explicitly asks in the current task. Pushes
  and merges must not affect production. Commit, push, merge, and HTML generation requests do
  not authorize a deployment. Cloud sessions never run them; they give the PC command and the
  target SHA instead.
- `pnpm release production [default|student]` and `pnpm release:rollback` are the release path;
  `docs/release.md` describes the flow and the one-time setup. They refuse to run in cloud
  sessions, CI, or Workers Builds.
- Transitional existing path (release rule 4, until the one-time setup in `docs/release.md` is
  done and `TODO.md` closes the migration): the manual `workflow_dispatch` workflows
  `.github/workflows/deploy.yml` (reviewed `main` only) and `deploy-student.yml` remain.
  Do not add new deployment workflows.
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
- Do not add `wrangler secret put` steps. Transitional: the manual default workflow still deploys Worker secrets together with code using `wrangler deploy --secrets-file`, then verifies `/api/chat` with a production smoke test. After the `pnpm release` migration, secrets change only through `wrangler versions secret put` plus a release promotion, on user request.

## AI Runtime Configuration

- Production AI calls depend on Cloudflare Worker runtime values:
  - `OPENAI_API_KEY` as a Worker secret for direct `gpt-6-luna` calls to `https://api.openai.com/v1/chat/completions`.
  - `NEXT_PUBLIC_APP_URL=https://clean-style.ecomarin.workers.dev` as a Worker var.
- OpenRouter and NVIDIA fallback are no longer used. Keep the adult chat, summary, and workplace-respect advice on the same direct OpenAI runtime.
- A local `.env.local` success only proves the local key/model works. It does not prove the deployed Worker has the same secret or OpenAI model permissions.

## Environment File Policy

- For this project, treat `.env.local` as the only human-edited local env file.
- Transitional: GitHub Actions secrets are still the production source of truth, flowing through `wrangler deploy --secrets-file` into Cloudflare Worker secrets. The `pnpm release` migration moves the source of truth to Cloudflare Worker secrets (a user-performed step); after that, do not reintroduce GitHub Secrets as a deployment input.
- Do not use another project's `.dev.vars` as evidence that Clean_style production has a secret.
- Do not maintain a project `.dev.vars` unless explicitly running `wrangler dev` or another Cloudflare-local runtime that requires it. If one is needed temporarily, mirror values from `.env.local`, keep it uncommitted, and do not treat it as the source of truth.

## Windows Task-Local Tool Caches

- If Corepack's sandbox profile cache is missing or inaccessible, set `COREPACK_HOME=D:\Projects\Clean_style\artifacts\tool-cache\corepack` for the command; reuse the existing `node_modules`.
- For Vitest/Vite temporary-file rename failures under the sandbox user-profile temp directory, create `artifacts/tool-cache/test-temp/` and set both `TEMP` and `TMP` to its absolute Windows path for the test command. Do not change user-global environment variables.
