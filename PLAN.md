# 청렴 스타일 테스트 - 기획 문서

## 개요

- **테스트명**: "나의 청렴 스타일은?"
- **대상**: 공공 연구기관 종사자 (연구원, 행정직, 법무/규제 담당 등)
- **목적**: 부담 없이 자신의 청렴 성향을 발견하고, AI 맞춤 조언 제공
- **톤**: 시험/평가가 아닌 "일상 시나리오 기반 자기발견"
- **소요 시간**: 3~5분 (15문항)
- **배포**: Vercel 독립 배포

---

## 1. 학술적 근거

### 1.1 이론적 배경

이 테스트의 3축 모델은 아래 조직윤리 학술 이론에 기반합니다.

| 이론 | 저자/연도 | 핵심 개념 | 본 테스트 적용 |
|------|----------|----------|--------------|
| **윤리풍토 이론** | Victor & Cullen (1988) | 조직의 윤리 기준(Rules/Benevolence/Principle) × 분석 초점(Individual/Local/Cosmopolitan) | 축 1 + 축 3의 직접적 근거 |
| **도덕 발달 단계** | Kohlberg (1969) | 4단계(법·질서) = 규칙 기반, 5~6단계(사회계약·보편원리) = 상황적 원칙 적용 | 축 1 근거 |
| **개인-상황 상호작용 모델** | Trevino (1986) | 개인 요인(ego strength, locus of control) vs 상황 요인(조직문화, 동료 압력) | 축 3 근거 |
| **4-Component Model** | Rest (1986) | 도덕적 민감성 → 판단 → 동기 → 실행. 투명성은 Component 3(도덕적 동기)의 발현 | 축 2 부분 근거 |
| **내부고발 의사결정** | Miceli & Near (1992) | 공개(disclosure) vs 내부 해결 연속선 — 실증적으로 확인된 차원 | 축 2 근거 |
| **Issue-Contingent Model** | Jones (1991) | "도덕적 강도"에 따라 같은 사람도 규칙적/상황적으로 전환 | 문항 설계 원리 |
| **ACRC 청렴도 측정** | 국민권익위원회 | "규정 준수", "업무 투명성", "조직문화"를 별도 영역으로 평가 | 한국 공직 맥락 적합성 |

### 1.2 각 축의 학술적 근거

#### 축 1: 원칙(Rule-based) ↔ 유연(Situational) — 의사결정 기준
- **근거 강도**: ★★★ 강함
- **앵커 이론**: Victor & Cullen(1988)의 "Ethical Criteria" 차원 + 의무론(Deontology) vs 결과론(Consequentialism)
- **설명**: 윤리풍토 이론에서 "Rules" 기준(조직 규칙 준수)과 "Principle" 기준(상황적 판단)을 명시적으로 구분. Kohlberg 도덕 발달 이론에서도 규칙 준수(4단계)와 상위 원칙 적용(5~6단계)의 구분이 핵심.

#### 축 2: 투명(Transparent) ↔ 신중(Cautious) — 정보 처리/공유 방식
- **근거 강도**: ★★☆ 중간 (복수 이론이 부분 지지)
- **앵커 이론**: Miceli & Near(1992) 내부고발 연구 + ACRC 업무투명성 지표
- **설명**: 단일 이론에서 나온 축은 아니나, 조직 투명성(organizational transparency)은 청렴 연구에서 독립 변수로 널리 사용됨. 내부고발 연구에서 "공개 vs 내부 해결" 연속선이 실증적으로 검증됨.
- **비고**: "투명 vs 신중"은 양쪽 모두 긍정적 뉘앙스를 유지하여 테스트 참여자가 부담을 느끼지 않도록 설계.

#### 축 3: 독립(Independent) ↔ 협력(Cooperative) — 행동 패턴
- **근거 강도**: ★★★ 강함
- **앵커 이론**: Victor & Cullen(1988)의 "Locus of Analysis" 차원 + Trevino(1986) 개인-상황 모델
- **설명**: 윤리풍토 이론의 핵심 2축 중 하나가 "Individual - Local - Cosmopolitan"(분석의 초점). 독립적 판단 vs 집단/조직 차원의 협력적 판단과 직접 대응. Rotter(1966)의 통제 소재(Locus of Control) 개념도 이 축을 지지.

### 1.3 8유형 분류의 타당성

- **구조적 타당성**: 3개 이진 축 = 2³ = 8유형은 심리 테스트에서 검증된 방식 (MBTI 4축 16유형, DISC 2축 4유형)
- **한국 공직 맥락 적합성**: ACRC 청렴도 조사가 "규정 준수", "투명성", "조직문화"를 별도 영역으로 평가하고 있어 얼굴 타당도(face validity) 높음
- **한계**: 축 간 상관(multicollinearity) 가능성 존재 — "원칙적인 사람"이 "투명"하고 "독립적"일 확률이 높을 수 있음. 단, 재미 기반 자기발견 테스트에서는 이 수준이 적절

### 1.4 참고 문헌

- Kohlberg, L. (1969). *Stages in the Development of Moral Thought and Action*
- Rest, J. R. (1986). *Moral Development: Advances in Research and Theory*
- Trevino, L. K. (1986). "Ethical Decision Making in Organizations." *Academy of Management Review*, 11(3)
- Victor, B. & Cullen, J. B. (1988). "The Organizational Bases of Ethical Work Climates." *Administrative Science Quarterly*, 33(1)
- Jones, T. M. (1991). "Ethical Decision Making by Individuals in Organizations." *Academy of Management Review*, 16(2)
- Miceli, M. P. & Near, J. P. (1992). *Blowing the Whistle*
- Rotter, J. B. (1966). "Generalized Expectancies for Internal Versus External Control of Reinforcement."
- 국민권익위원회(ACRC). 공공기관 청렴도 측정 모델

---

## 2. 3개 성향 축

각 문항의 선택지가 아래 3개 축에 점수를 부여. 축마다 높은 쪽으로 유형 결정.

| 축 | 한쪽 | 반대쪽 | 측정하는 것 | 학술 앵커 |
|----|------|--------|------------|----------|
| **원칙 ↔ 유연** | 규정·기준 우선 | 상황·맥락 고려 | 의사결정 기준 | Victor & Cullen, Kohlberg |
| **투명 ↔ 신중** | 즉시 공유·보고 | 상황 파악 후 판단 | 정보 처리 방식 | Miceli & Near, ACRC |
| **독립 ↔ 협력** | 개인 판단·실행 | 팀 합의·공동 대응 | 행동 패턴 | Victor & Cullen, Trevino |

---

## 3. 8가지 청렴 스타일

| # | 조합 | 스타일명 | 한 줄 설명 |
|---|------|---------|-----------|
| 1 | 원칙-투명-독립 | **소신 수호자** | 규정대로, 바로 말하고, 혼자서도 밀고 나감 |
| 2 | 원칙-투명-협력 | **정의의 조율자** | 규정 중시하되, 팀과 공유하며 함께 해결 |
| 3 | 원칙-신중-독립 | **묵묵한 파수꾼** | 원칙은 지키되, 조용히 혼자 판단하고 처리 |
| 4 | 원칙-신중-협력 | **신중한 중재자** | 원칙 기반이지만, 상황 파악 후 팀과 협의 |
| 5 | 유연-투명-독립 | **실용주의 개척자** | 상황에 맞게 판단, 과정은 공개, 주도적 실행 |
| 6 | 유연-투명-협력 | **열린 소통가** | 유연하게 판단하고, 모두와 공유하며 진행 |
| 7 | 유연-신중-독립 | **전략적 해결사** | 상황 판단 후 조용히 최선의 방법을 찾아냄 |
| 8 | 유연-신중-협력 | **온건한 조정자** | 분위기 살피며, 팀 합의로 부드럽게 풀어감 |

---

## 4. 문항 설계 원칙

### 톤 & 형식
- 일상적인 상황 묘사 ("~하는데", "~이런 상황이다")
- 4개 선택지, **어떤 것도 "틀린 답"이 아님**
- 정답이 보이지 않도록 모든 선택지가 합리적
- 공공 연구기관 용어 사용 (팀장, 선임연구원, 동료, 기관 윤리담당 등)

### 선택지 → 점수 매핑
- 각 선택지는 3개 축 중 1~2개에 +1/-1 점수
- 양수 = 원칙/투명/독립 방향, 음수 = 유연/신중/협력 방향
- 예시:
  - "규정집 먼저 확인한다" → 원칙 +1
  - "팀장에게 바로 보고한다" → 투명 +1, 협력 -1 (→ 투명 + 협력)
  - "혼자 조용히 정리해본다" → 신중 -1, 독립 +1

### 카테고리 (3개)
문항을 자연스럽게 섞되, 내부적으로 3개 영역을 균형 있게 배분.

| 카테고리 | 문항 수 | 상황 범위 |
|----------|--------|----------|
| **연구·데이터** | 5개 | 실험 데이터, 논문, 연구비 집행, 공동연구, AI 활용 |
| **행정·계약** | 5개 | 물품 구매, 용역 계약, 출장비, 선물, 수의계약 |
| **관계·소통** | 5개 | 외부 협력, 민원, 동료 관계, 부당 요청, 내부고발 |

---

## 5. 문항 (15문항)

→ `src/data/questions.ts` 참조

---

## 6. AI 분석 구조

### System/User 프롬프트 분리 (Kemi 패턴)

**System Prompt** — AI의 역할, 톤, 응답 형식(JSON) 정의
**User Prompt** — 테스트 결과 데이터 전달 (유형, 점수, 선택 패턴)

### JSON 구조화 응답

```json
{
  "styleSummary": "유형 2~3문장 설명",
  "strengths": ["강점1", "강점2", "강점3"],
  "cautions": ["주의 포인트1", "포인트2", "포인트3"],
  "tips": {
    "research": "연구비·데이터 관련 팁",
    "admin": "구매·계약 관련 팁",
    "relation": "외부 협력·소통 관련 팁"
  },
  "message": "격려 메시지"
}
```

### 마크다운 폴백
JSON 파싱 실패 시 마크다운 텍스트 그대로 표시.

### AI 프로바이더
- **OpenRouter** (1순위) — 하나의 키로 Claude, GPT 등 사용
- **Anthropic** (폴백)
- **OpenAI** (폴백)

→ `src/lib/ai.ts` + `src/app/api/analyze/route.ts` 참조

---

## 7. 기술 구현

### 폴더 구조
```
integrity-test/
├── PLAN.md              ← 이 문서
├── README.md            ← 프로젝트 설명 + Kemi 점검 제외 안내
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── .env.local.example   ← OPENROUTER_API_KEY
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           ← 랜딩 (시작 버튼)
│   │   ├── test/page.tsx      ← 테스트 진행
│   │   ├── result/page.tsx    ← AI 분석 결과
│   │   └── api/
│   │       └── analyze/route.ts  ← AI 분석 API
│   ├── lib/
│   │   └── ai.ts              ← 멀티 프로바이더 AI 호출
│   ├── data/
│   │   └── questions.ts       ← 15문항 + 8유형 + 점수 계산
│   ├── components/
│   │   ├── ProgressBar.tsx
│   │   └── QuestionCard.tsx
│   └── styles/
│       └── globals.css
└── vercel.json
```

### 기술 스택
- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- OpenRouter API (멀티 모델 지원) — 결과 분석
- Vercel 배포

### 점수 계산 로직
```
각 축 점수 합산:
- 원칙 점수 >= 0 → "원칙" / < 0 → "유연"
- 투명 점수 >= 0 → "투명" / < 0 → "신중"
- 독립 점수 >= 0 → "독립" / < 0 → "협력"
→ 3개 축 조합으로 8가지 유형 중 1개 결정
→ 동점(0) 시: 해당 축은 양쪽 특성을 모두 가진 것으로 AI에게 전달
```

---

## 8. 디자인 방향

- 심플하고 깔끔한 UI (과도한 장식 없이)
- 부드러운 색감 (공공기관 대상 → 신뢰감)
- 모바일 우선 반응형
- 진행률 표시 (ProgressBar)
- 결과 화면에서 공유 버튼 (링크 복사)
- 각 문항에 상황 일러스트 이미지 (TODO)

---

## 9. 작업 현황

- [x] 기획 문서 작성
- [x] 학술적 근거 조사 및 반영
- [x] 프로젝트 초기화 (Next.js, Tailwind, TypeScript)
- [x] 문항 데이터 작성 (15문항, questions.ts)
- [x] 테스트 UI (랜딩 → 문항 → 결과)
- [x] AI 분석 API (System/User 분리, JSON 구조화, 멀티 프로바이더)
- [ ] 디자인 다듬기
- [ ] 상황 이미지 + 이미지 생성 프롬프트
- [ ] Vercel 배포
