# 청렴 스타일 테스트 - 기획 문서

## 개요

- **테스트명**: "나의 청렴 스타일은?"
- **대상**: 공공 연구기관 종사자 (연구원, 행정직, 법무/규제 담당 등)
- **목적**: 부담 없이 자신의 청렴 성향을 발견하고, AI 맞춤 조언 제공
- **톤**: 시험/평가가 아닌 "일상 시나리오 기반 자기발견"
- **소요 시간**: 3~5분 (15문항)
- **배포**: Cloudflare Workers (OpenNext SSR)

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
- **근거 강도**: ★★★ 강함 (다수의 독립적 이론 전통에서 수렴적으로 확인)
- **앵커 이론**: HEXACO(C: Prudence/Diligence vs A: Flexibility), Schwartz 가치이론(Conservation ↔ Openness to Change), Forsyth EPQ(이상주의 × 상대주의), Victor & Cullen(1988) ECQ, Kohlberg 도덕 발달, Gawronski CNI 모형(N 규범민감성 vs C 결과민감성)
- **설명**: Schwartz 원형 가치 모형에서 보존(동조+전통+안전) ↔ 변화개방(자기결정+자극)이 양극 차원으로 명시적 모형화됨(PVQ-RR, 49개 문화 검증). HEXACO에서 C와 A가 직교 요인이며 Zettler et al.(2020) 메타분석에서 별도 결과 영역(Duty vs Obstruction)에 매핑됨. Forsyth EPQ의 상대주의 차원이 규칙 유연성을 직접 측정.
- **상세 근거**: `research/axis2_principle_flexibility.md` 참조

#### 축 2: 투명(Transparent) ↔ 신중(Cautious) — 정보 처리/공유 방식
- **근거 강도**: ★★★ 강함 (다수의 독립적 이론 전통에서 수렴적으로 확인)
- **앵커 이론**: VIA 강점 분류(정직 vs 신중성), HEXACO(H vs C), 진정성 리더십 ALQ(관계적 투명성 vs 균형잡힌 정보처리), DCA-투명성 척도(시의성 vs 정확성), Miceli & Near(1992) 내부고발 연구
- **설명**: VIA에서 정직(용기 미덕)과 신중성(절제 미덕)은 독립 차원으로 측정되며, HEXACO에서도 H와 C가 직교 요인으로 확인됨. 진정성 리더십 이론에서 관계적 투명성은 균형잡힌 정보 처리(신중성)와 결합될 때에만 긍정적으로 기능함. 고도 규제 산업(FDA, ICH GCP)에서 "즉시 경보 + 사후 검증 보고"의 이중 계층 시스템으로 딜레마가 구조적으로 해소됨.
- **비고**: "투명 vs 신중"은 양쪽 모두 긍정적 뉘앙스를 유지하여 테스트 참여자가 부담을 느끼지 않도록 설계.
- **상세 근거**: `research/rese.md` 참조 (76개 참고문헌, 다학제적 심층 분석)

#### 축 3: 독립(Independent) ↔ 협력(Cooperative) — 행동 패턴
- **근거 강도**: ★★★ 강함 (다수의 독립적 이론 전통에서 수렴적으로 확인)
- **앵커 이론**: 대인관계 원형모델(Agency ↔ Communion, 수학적 직교), Markus & Kitayama(1991) 자기해석 이론(독립적 vs 상호의존적), Singelis & Triandis(1995) HI/VI/HC/VC 4요인, GLOBE 연구(제도적/내집단 집단주의 분리), Victor & Cullen(1988), Trevino(1986)
- **설명**: 대인관계 원형모델(Leary, 1957; Wiggins, 1979)에서 주도성(Agency)과 친화성(Communion)이 수학적 직교 축으로 확인됨. GLOBE 연구에서 Hofstede의 단일 개인주의-집단주의를 두 별도 차원으로 분리. 한국 공직 맥락에서 Park et al.(2005)의 공무원 343명 연구가 수평적 집단주의는 내부고발을 촉진, 수직적 집단주의는 무관함을 실증. 적극행정 면책제도(2017)에서 자율성이 핵심 예측 변인(Lee et al., 2025).
- **상세 근거**: `research/axis3_independence_cooperation.md` 참조

### 1.3 3축 간 독립성(직교성) 근거

3축이 서로 중복되지 않는 독립적 차원임을 뒷받침하는 핵심 근거:

- **HEXACO 통합 직교 구조**: 투명성(H) vs 원칙(C) vs 협력(A)이 직교 회전으로 추출되며, Zettler et al.(2020) 메타분석에서 각각 Exploitation, Duty, Obstruction이라는 별도 결과 영역에 매핑
- **Schwartz 가치이론**: 보존↔변화개방(원칙-유연)과 자기향상↔자기초월(독립-협력 동기 기반)이 원형 모형 내에서 직교 배치, 49개 문화에서 구조 동치성 확인
- **대인관계 원형모델**: Agency↔Communion이 수학적 직교 구조로 도덕 추론(원칙)이나 정보 공유(투명성)와는 질적으로 다른 대인행동 차원
- **상세 근거**: `research/scientific_validity_overview.md` 3절 참조

### 1.4 8유형 분류의 타당성

- **구조적 타당성**: 3개 이진 축 = 2³ = 8유형은 심리 테스트에서 검증된 방식 (MBTI 4축 16유형, DISC 2축 4유형)
- **한국 공직 맥락 적합성**: ACRC 청렴도 조사가 "규정 준수", "투명성", "조직문화"를 별도 영역으로 평가하고 있어 얼굴 타당도(face validity) 높음
- **알려진 한계**: 원칙-독립 공동출현(9/15 문항) → 축 간 부분 상관 존재. 자기발견 도구 목적에서는 허용 범위이며, Q16-Q18 추가 시 해소 예정

### 1.5 참고 문헌

**기본 이론:**
- Kohlberg, L. (1969). *Stages in the Development of Moral Thought and Action*
- Rest, J. R. (1986). *Moral Development: Advances in Research and Theory*
- Trevino, L. K. (1986). "Ethical Decision Making in Organizations." *Academy of Management Review*, 11(3)
- Victor, B. & Cullen, J. B. (1988). "The Organizational Bases of Ethical Work Climates." *Administrative Science Quarterly*, 33(1)
- Jones, T. M. (1991). "Ethical Decision Making by Individuals in Organizations." *Academy of Management Review*, 16(2)
- Miceli, M. P. & Near, J. P. (1992). *Blowing the Whistle*
- 국민권익위원회(ACRC). 공공기관 청렴도 측정 모델

**3축 독립성 근거 (추가 핵심 문헌):**
- Ashton, M. C. & Lee, K. (2007). HEXACO model. *PSPR*, 11(2)
- Zettler, I. et al. (2020). Nomological net of HEXACO. *Perspectives on Psychological Science*, 15(3)
- Schwartz, S. H. & Cieciuch, J. (2022). PVQ-RR 49개 문화 검증. *Assessment*, 29(5)
- Forsyth, D. R. & O'Boyle, E. H. (2021). EPQ-5. *PLOS ONE*
- Leary, T. (1957). *Interpersonal Diagnosis of Personality* (대인관계 원형모델)
- Wiggins, J. S. (1979). Agency-Communion 직교 구조. *JPSP*, 37(3)
- Markus, H. R. & Kitayama, S. (1991). Culture and the self. *Psychological Review*, 98(2)
- Park, H. et al. (2005). Confucian ethics and whistleblowing in Korea. *JBE*, 58(4)
- Bernstein, E. S. (2017). 투명성 역설. *Academy of Management Annals*
- Walumbwa, F. O. et al. (2008). Authentic Leadership. *Journal of Management*, 34(1)

**상세 문헌 목록:** `research/` 폴더 내 각 문서의 참고 자료 섹션 참조

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
- **OpenRouter** — Grok 4.1-fast (분석 + Q&A 스트리밍)

→ `src/lib/ai.ts` + `src/app/api/analyze/route.ts` 참조

---

## 7. 기술 구현

### 폴더 구조
```
Clean_style/
├── PLAN.md                  ← 이 문서
├── README.md
├── test-design-guide.md     ← 테스트 설계 노트 (점수 균형, 알려진 한계)
├── package.json
├── next.config.ts
├── wrangler.toml            ← Cloudflare Workers 배포 설정
├── open-next.config.ts      ← OpenNext SSR 설정
├── .env.local.example       ← OPENROUTER_API_KEY
├── research/                ← 학술적 근거 조사 문서
│   ├── scientific_validity_overview.md  ← 3축 과학적 타당성 종합
│   ├── rese.md                         ← 축2 투명↔신중 심층 조사
│   ├── axis2_principle_flexibility.md  ← 축1 원칙↔유연 심층 조사
│   ├── axis3_independence_cooperation.md ← 축3 독립↔협력 심층 조사
│   └── 공공기관_청렴_의사결정 및 설문도구 정리.md ← 기존 설문도구 서베이
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           ← 랜딩 (시작 버튼)
│   │   ├── test/page.tsx      ← 테스트 진행
│   │   ├── result/page.tsx    ← AI 분석 결과 + Q&A 채팅
│   │   └── api/
│   │       └── analyze/route.ts  ← AI 분석 API (3모드: 분석/Q&A/요약)
│   ├── lib/
│   │   ├── ai.ts              ← OpenRouter API 래퍼
│   │   ├── history.ts         ← IndexedDB 히스토리 관리
│   │   └── constants.ts       ← 대화 제한 상수
│   ├── data/
│   │   └── questions.ts       ← 15문항 + 8유형 + 점수 계산
│   ├── components/
│   │   ├── ProgressBar.tsx
│   │   ├── QuestionCard.tsx
│   │   └── StyleRadarChart.tsx ← 6축 레이더 차트
│   └── types/
│       └── analysis.ts        ← AnalysisResult 타입 + 검증
└── docs/
    └── index.html
```

### 기술 스택
- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- OpenRouter API (Grok 4.1-fast) — AI 분석 + Q&A 스트리밍
- Recharts + shadcn/ui — 6축 레이더 차트
- Cloudflare Workers 배포 (OpenNext SSR)

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
- [x] 3축 심층 학술 조사 (research/ 폴더: 축별 심층 문서 + 종합 타당성 보고서)
- [x] 프로젝트 초기화 (Next.js, Tailwind, TypeScript)
- [x] 문항 데이터 작성 (15문항, questions.ts)
- [x] 테스트 UI (랜딩 → 문항 → 결과)
- [x] AI 분석 API (분석/Q&A 스트리밍/롤링 요약 3모드)
- [x] 6축 레이더 차트 (Recharts + shadcn/ui)
- [x] 히스토리 관리 (IndexedDB)
- [x] 결과 공유 (URL 인코딩 + 이미지 내보내기)
- [x] Cloudflare Workers 배포 (OpenNext SSR)
- [ ] 디자인 다듬기
- [ ] 상황 이미지 + 이미지 생성 프롬프트
- [ ] 파일럿 테스트 (n=50-100) 및 요인 구조 검증
- [ ] Q16-Q18 추가 (투명/신중 완전 균형 + 원칙/독립 분리)
