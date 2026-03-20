# 나의 청렴 스타일은?

공공 연구기관 종사자를 위한 청렴 스타일 자기발견 테스트.

> **Kemi 프로젝트 AI 점검 제외 대상**
> 이 폴더는 별도 프로젝트로 분리 예정입니다.
> Kemi 프로젝트 작업 시 이 폴더는 점검/수정하지 마세요.

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

## Vercel 배포

1. GitHub에 이 폴더를 별도 저장소로 push
2. Vercel에서 Import
3. Environment Variables에 `OPENROUTER_API_KEY` 추가
4. Deploy

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
│   ├── StyleRadarChart.tsx   # 3축 레이더 차트
│   ├── ProgressBar.tsx       # 진행률 바
│   └── QuestionCard.tsx      # 문항 카드
└── styles/
    └── globals.css           # 디자인 토큰 + 애니메이션
```

## 학술적 근거

3축 모델은 Victor & Cullen(1988) 윤리풍토 이론, Kohlberg(1969) 도덕 발달 이론, Trevino(1986) 개인-상황 모델, Miceli & Near(1992) 내부고발 연구에 기반. 상세: PLAN.md 참조.
