# 릴리스 절차 (`pnpm release`)

공통 규칙은 `AGENTS.md`의 "브랜치·배포 공통 규칙"이 정본이다. 이 문서는 Clean_Style에서 그 규칙을 실행하는 방법만 적는다.

## 흐름

1. `main`에 push하면 Cloudflare Workers Builds가 제품별로 `pnpm check`와 빌드를 돌리고, 버전을 **트래픽 0%로 저장만** 한다(`scripts/workers-builds.mjs`).
2. 배포는 사용자가 PC 터미널에서 직접 실행한다.

   ```
   git checkout main && git pull
   pnpm release production            # 기본 제품 clean-style
   pnpm release production student    # 학생 제품 clean-style-student
   ```

   스크립트(`scripts/release.mjs`)가 하는 일:
   1. 그 SHA의 저장된 버전을 찾고 설정을 검증한다(D1, 변수, 비밀값 이름).
   2. D1 복원 지점(Time Travel bookmark)을 기록한다.
   3. 대기 중인 migration이 있으면 확인을 받은 뒤 적용한다.
   4. 새 버전을 0% 후보로 올리고 version override 헤더로 smoke를 돌린다.
   5. 통과하면 100%로 승격하고 smoke를 다시 돌린다.
   6. annotated 태그 `prod-YYYY-MM-DD.N`(UTC)을 남긴다.

   후보 smoke가 실패하면 기존 버전을 100%로 유지한다. 승격 뒤 smoke가 실패하면 이전 버전으로 되돌리고 그 롤백도 태그로 남긴다.
3. 롤백: `pnpm release:rollback [default|student] [--to <version-id>]`. D1 데이터는 되돌리지 않는다. 데이터 복원이 필요하면 태그에 적힌 bookmark로 따로 복원한다.

클라우드 세션·CI·Workers Builds에서는 `pnpm release`가 실행을 거부한다(규칙 5). 인증은 PC의 `wrangler login`을 쓰고, 토큰을 저장소나 `.env*`에 두지 않는다.

## 처음 한 번 설정 (사용자 작업)

1. **Next.js 지원 종료 해결 (완료).** 2026-10-24에 Next 16.4.3·OpenNext 1.20.13·Wrangler 4.152로 올렸다. 제품별 페이지 연결이 webpack 설정에 있어 `next build --webpack`·`next dev --webpack`을 쓴다.
2. **비밀값 확인.** PC에서 `npx wrangler secret list --name clean-style`를 실행해 `OPENAI_API_KEY`·`ADMIN_SECRET`이 있는지 본다. 기존 배포로 이미 들어가 있으므로 새로 등록할 필요는 없다. 앞으로 바꿀 때는 `wrangler versions secret put <NAME> --name clean-style`로 넣고 `pnpm release`로 승격한다.
3. **버전 preview URL 끄기.** 대시보드에서 Worker → Settings → Domains & Routes → Preview URLs를 두 Worker 모두 끈다. 켜져 있으면 저장된 미배포 버전이 운영 D1·비밀값을 쓴 채 열린다. 업로드 스크립트는 켜져 있으면 업로드를 거부한다.
4. **D1 migration 기록 확인.** `npx wrangler d1 migrations list clean-style-db --remote`에서 `0001`·`0002`가 대기 중으로 나오면, 예전에 손으로 적용해서 기록만 빠진 상태일 수 있다. 이때는 `pnpm release`가 적용을 묻더라도 승인하지 말고 먼저 AI와 기준선 정리 방법을 정한다. `0002`는 `ALTER TABLE ADD COLUMN`이라 다시 실행하면 실패한다.
5. **Workers Builds 연결.** 대시보드에서 `clean-style`·`clean-style-student` Worker마다 Settings → Builds → Connect로 `dayoumin/Clean_Style`을 연결한다.
   - Production branch: `main`. Non-production branch builds: 끔.
   - Build command: `node scripts/workers-builds.mjs build default` (학생은 `student`)
   - Deploy command: `node scripts/workers-builds.mjs upload default` (학생은 `student`)
   - 두 Worker가 같은 `wrangler.toml`(`name = "clean-style"`)을 쓴다. 학생 Worker 연결 때 이름 불일치로 막히면 AI에게 제품별 설정 분리를 요청한다.
6. **첫 릴리스 시험.** push 뒤 두 Worker의 Builds가 성공하면 PC에서 `pnpm release production`과 `pnpm release:rollback`을 한 번씩 시험한다.
7. **정리.** 시험이 끝나면 `.github/workflows/deploy.yml`·`deploy-student.yml` 삭제를 AI에게 요청한다. GitHub Secrets의 `CLOUDFLARE_API_TOKEN`·`OPENAI_API_KEY`·`ADMIN_SECRET`은 사용자가 직접 지운다.
