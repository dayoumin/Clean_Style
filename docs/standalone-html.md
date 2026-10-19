# 별도 HTML 파일 배포

기본 제품은 기존 Cloudflare 서버 배포입니다. `build:html`은 성인 기본형
`clean-style`의 파일 버전을 별도로 만들며 서버 빌드·배포·환경 파일·비밀값을 사용하지 않습니다.
Plus와 학생 제품은 이 생성 명령의 대상이 아닙니다.

| 항목 | 기존 서버용 | 별도 HTML용 |
| --- | --- | --- |
| 생성 명령 | `corepack pnpm build` | `corepack pnpm build:html` |
| 산출물 | 기존 Next/OpenNext 경로 | `artifacts/html/clean-style.html` |
| AI 조언·서버 기록 | 기존 기능 유지 | 없음 |
| 결과 보관 | 기존 정책 유지 | 이 브라우저의 이전 결과 및 PNG 저장 |
| 이미지·코드·스타일 | 서버 제공 | HTML 파일 내부에 포함 |

## 생성·전달

Windows PowerShell에서 프로젝트 루트 기준:

```powershell
$env:COREPACK_HOME = 'D:\Projects\Clean_style\artifacts\tool-cache\corepack'
corepack pnpm build:html
```

`artifacts/html/clean-style.html`을 더블클릭해 브라우저로 엽니다.
사용자에게는 **HTML 파일 하나만 전달**하면 됩니다. 함께 생성되는 `manifest.json`은
버전·생성 시각·SHA-256·포함 이미지 목록을 확인하는 제작자용 기록이며 실행에는 필요 없습니다.
생성물은 Git에서 제외된 `artifacts/`에 두고, 생성 명령을 서버 배포 workflow에 연결하지 않습니다.
기존 `build`, Next 설정, Worker 설정, GitHub Actions는 이 기능에서 바꾸지 않습니다.

이미지가 완성되거나 문항이 수정되면 명령을 다시 실행합니다. 생성 시점의 문항·채점·결과
원본과 최신 문항 이미지 목록을 읽으며 누락 이미지가 있으면 생성을 실패시킵니다.
사용 중인 홈·문항 30종·결과 8유형·대기·CSS 배경·favicon을 내장합니다.
외부 CDN·폰트·API 없이 실행하며 HTML의 보안 정책(CSP)도 네트워크 연결을 차단합니다.
글꼴은 기존 제품과 같이 시스템 글꼴을 사용하므로 기기에 따라 자형이 조금 다를 수 있습니다.

## 이전 결과·진행 복원

- 이전 결과는 최대 10건이며 기록이 없으면 메인 버튼을 숨깁니다.
- 같은 파일을 같은 브라우저로 다시 열면 저장 가능한 환경에서 기록과 진행을 복원합니다. 마지막 답변 후 결과 보기를 누르기 전에도 답변을 보존합니다.
- 서버 사이트의 이전 결과와 자동으로 합치지 않습니다. HTML 전용 저장 키를 사용합니다.
- 응답에는 진단·채점 버전을 기록하고, 손상되었거나 버전이 다른 기록은 결과로 표시하지 않습니다.
- 파일 이동·이름 변경·다른 브라우저·시크릿 모드·브라우저 데이터 삭제 시 보존을 보장하지 않습니다.
- 브라우저가 저장을 거부해도 현재 검사는 마칠 수 있습니다. 결과 보관 실패를 안내하고 PNG 저장을 제공합니다.
- 기록 삭제에 실패하면 삭제됐다고 표시하지 않습니다.

## 결과 이미지

HTML 결과 화면의 `이미지로 저장`을 누르면 PNG를 브라우저 안에서 생성합니다.
이름(입력한 경우), 유형, 설명, 캐릭터, 성향 그래프, 강점·주의·팁, 진단 버전과 날짜가 포함됩니다.
별도의 서버 이미지 API나 화면 캡처 라이브러리를 쓰지 않습니다.
그림 디코딩 후 고정 폭 1,000px 카드에 직접 그리므로 현재 선택한 탭이나 그래프 애니메이션에 의존하지 않습니다.
다운로드가 차단되면 미리보기 아래 `PNG 다운로드` 링크로 다시 저장할 수 있습니다.
실패해도 결과와 기록은 유지됩니다. 이전 결과에서도 같은 방식으로 저장할 수 있습니다.

## 검증

```powershell
corepack pnpm exec vitest run src/__tests__/standalone-html.test.ts
node tests/standalone-html.verify.mjs
```

두 번째 명령은 설치된 Windows Edge와 프로젝트에 버전을 고정한 Playwright 개발 의존성으로 **실제 파일 URL**을
네트워크 차단 상태에서 검사합니다. 서버를 시작하지 않습니다.
필요하면 프로젝트 지침대로 `TEMP`, `TMP`를 `artifacts/tool-cache/test-temp`로 지정합니다.
별도 브라우저 프로필만 사용하고 종료하며 사용자 브라우저나 다른 세션의 서버를 조작하지 않습니다.
증거는 `artifacts/html-verification/`에 저장합니다.

실제 휴대폰의 파일 열기·사진 앱 저장은 데스크톱의 모바일 화면 크기 검사로 입증되지 않습니다.
지원 기기별 출시 전 확인 상태는 `docs/adult-design-release-qa.html`의
`standalone-html-device-export` 항목에서 관리합니다.
