# 나의 청렴 스타일은?

공공 연구기관 종사자를 위한 청렴 스타일 자기발견 테스트.

## 기능

- 15문항 시나리오 기반 테스트 (3~5분)
- 3개 축 분석: 원칙↔유연, 투명↔신중, 독립↔협력
- 8가지 청렴 스타일 유형 분류
- AI 맞춤 분석 및 업무별 실용 팁 제공
- Recharts + shadcn/ui 레이더 차트 시각화

## 시작하기

```bash
pnpm install

cp .env.local.example .env.local
# .env.local에 OPENROUTER_API_KEY 입력

pnpm dev
```

http://localhost:3000 에서 확인

## 배포

Cloudflare Workers (OpenNext SSR). `main` 브랜치에 push하면 GitHub Actions가 자동 배포.

- **URL**: `https://clean-style.ecomarin.workers.dev`
- **설정**: `wrangler.toml` + `open-next.config.ts`
- **Secrets**: `CLOUDFLARE_API_TOKEN` (GitHub repo settings)
- **상세**: `D:\Projects\html-docs\deployment-guide.html`

## 기술 스택

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Recharts + shadcn/ui Charts (레이더 차트)
- OpenRouter API (AI 분석 — Claude, GPT 등 멀티 모델)

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx              # 랜딩
│   ├── test/page.tsx         # 테스트 진행
│   ├── result/page.tsx       # AI 분석 결과
│   └── api/analyze/route.ts  # AI 분석 API
├── lib/
│   ├── ai.ts                 # 멀티 프로바이더 AI 호출
│   └── utils.ts              # cn() 유틸
├── data/
│   └── questions.ts          # 15문항 + 8유형 + 점수 계산
├── components/
│   ├── ui/chart.tsx          # shadcn/ui 차트 래퍼
│   ├── StyleRadarChart.tsx   # 6축 단극 레이더 차트
│   ├── ProgressBar.tsx       # 진행률 바
│   └── QuestionCard.tsx      # 문항 카드
└── styles/
    └── globals.css           # 디자인 토큰 + 애니메이션
```

## 학술적 근거

3축 모델은 다학제적 수렴 근거에 기반:
- **원칙↔유연**: HEXACO(C/A 직교), Schwartz 가치이론(Conservation↔Openness), Forsyth EPQ, Victor & Cullen(1988)
- **투명↔신중**: VIA(정직 vs 신중성), HEXACO(H/C 직교), 진정성 리더십 ALQ, DCA-투명성 척도
- **독립↔협력**: 대인관계 원형모델(Agency↔Communion 수학적 직교), GLOBE, 자기해석 이론, Miceli & Near(1992)

상세: `PLAN.md` 및 `research/scientific_validity_overview.md` 참조.
