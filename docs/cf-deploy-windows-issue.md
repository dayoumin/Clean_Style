# Cloudflare 배포 pnpm 이슈 정리

> 2026-03-24 발생 → 해결. 이 문서는 같은 문제 재발 시 참고용.

## 무슨 문제?

`opennextjs-cloudflare build` → `wrangler deploy`로 배포하면,
사이트가 **500 Internal Server Error**를 반환한다.

에러 메시지:
```
Dynamic require of "/.next/server/middleware-manifest.json" is not supported
```

## 왜 발생하나?

**pnpm 심링크 문제** (workers-sdk #10236)

- pnpm은 `node_modules`를 심링크로 관리한다
- 이 구조에서 빌드하면 `require("/.next/server/middleware-manifest.json")` 같은 절대경로가 번들에 포함된다
- Cloudflare Workers는 동적 require를 지원하지 않아서 에러 발생

처음엔 Windows 경로 문제로 추정했으나, 실제로는 pnpm 구조 문제였다. `.npmrc`에 hoisted 설정 추가 후 Windows에서도 정상 배포 확인.

## 해결 방법 (확인됨)

프로젝트 루트에 `.npmrc` 파일 추가:

```
shamefully-hoist=true
node-linker=hoisted
```

이후:
1. `node_modules` 삭제 (rimraf 또는 탐색기에서)
2. `pnpm install` 재실행
3. `pnpm run build` → 배포

이 설정으로 Windows 로컬 배포 성공 확인 (2026-03-24).

## 대안: GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build
      - run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
```

## 롤백 방법

500 에러가 발생했을 때:

1. Cloudflare 대시보드 > Workers & Pages > 프로젝트 > Deployments
2. Version History에서 정상 버전 찾기 (`main` 태그가 붙은 것이 Git 빌드)
3. 해당 버전 옆 `...` > **Deploy version**

## 에러 확인 방법

```bash
npx wrangler tail --format json
```

별도 터미널에서 사이트에 접속하면 실시간 에러 로그가 나온다.

## 핵심 기억할 것

- **Windows에서 `wrangler deploy` 하지 않기** — 항상 Linux 환경에서 빌드
- Cloudflare 대시보드의 Version History에서 `main` 태그 = Git 빌드(안전), `Wrangler` = 로컬 배포(위험)
- 로컬 개발(`next dev`)은 Windows에서 문제없음. 배포만 Linux 필요

## 관련 이슈

| 이슈 | 상태 | 내용 |
|------|------|------|
| [opennextjs #494](https://github.com/opennextjs/opennextjs-cloudflare/issues/494) | Closed | Windows 경로로 middleware 빌드 실패 |
| [opennextjs #826](https://github.com/opennextjs/opennextjs-cloudflare/issues/826) | Closed | ERR_UNSUPPORTED_ESM_URL_SCHEME |
| [opennextjs #1089](https://github.com/opennextjs/opennextjs-cloudflare/issues/1089) | Closed | WASM ENOENT — "use WSL" |
| [workers-sdk #10236](https://github.com/cloudflare/workers-sdk/issues/10236) | Open | pnpm + middleware-manifest.json 동적 require |
