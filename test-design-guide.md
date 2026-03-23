# 심리 스타일 테스트 설계 가이드

청렴 스타일 테스트(15문항, 4지선다, 3축) 설계 시 참고할 편향과 대응 방법 정리.

---

## 1. 자기보고 설문의 주요 편향

### 사회적 바람직성 편향 (Social Desirability Bias)
- 타인에게 좋아 보이는 답을 고르는 경향
- 청렴 테스트에서 가장 큰 위협: "도덕적으로 올바른 답"이 보이면 성향이 아닌 정답을 고르게 됨
- Edwards(1953)의 연구에서 사회적 바람직성 평점과 실제 응답 확률이 매우 높은 상관을 보임

### 묵인 편향 (Acquiescence Bias)
- 내용과 무관하게 동의하는 경향 ("예-예 편향")
- Likert 척도에서 주로 문제가 되며, 4지선다 강제선택에서는 **크게 완화되지만 완전히 제거되지는 않는다** — 최근 연구(Bäckström & Björklund, 2023)는 FC도 사회적 바람직성 정보를 그대로 담을 수 있다고 보고

### 순서 효과 (Order Effect)
- 시각적 제시에서는 첫 번째 선택지 선호(초두 효과), 구두 제시에서는 마지막 선호(최신 효과)
- 4개 이하 선택지에서는 효과 미미 (1-3%p 수준)
- 대응: 선택지 순서 랜덤화 (비용 거의 없음)

### 극단 응답 경향 / 중앙 집중 경향
- 극단값을 피하거나 반대로 극단만 고르는 경향
- 강제선택에서는 등간 척도가 없으므로 **영향이 크게 줄어듦** (단, 선택지 중 "중간 입장"처럼 보이는 것이 있으면 유사한 효과 발생 가능)

---

## 2. 강제선택(Forced-Choice) vs Likert 척도

### 강제선택의 장점
- 묵인 편향 원천 차단 (반드시 하나를 골라야 함)
- 선택지 간 사회적 바람직성이 잘 매칭되면 faking 저항성 높음
- 가치 간 트레이드오프를 강제해서 실제 의사결정에 가까움

### 강제선택의 단점
- 일부 연구(Ferrando et al., 2019)에서는 FC의 요인 적재량이 Likert보다 낮게 나타남 (특정 비교에서 0.37 vs 0.56). 다만 이는 일반 법칙이 아니라 문항 품질과 표본에 좌우됨
- 동일 정밀도를 위해 더 많은 문항이 필요할 수 있음. 최종 판단은 파일럿 데이터로 해야 함

### 핵심 결론 (Bäckström & Björklund, 2023; PMC 2024년 6월호)
> "형식(강제선택 vs Likert)보다 **문항 내용의 질**이 편향 저항에 더 중요하다"

잘못 설계된 강제선택(정답이 보이는)이 잘 설계된 Likert보다 나쁘다.

---

## 3. 이 테스트에서 중요한 것 / 중요하지 않은 것

### 중요한 것

| 항목 | 이유 |
|---|---|
| **선택지 간 사회적 바람직성 매칭** | 4개 선택지가 모두 "동등하게 괜찮아 보여야" 성향을 측정할 수 있음. 하나가 더 도덕적으로 보이면 정답 맞추기가 됨 |
| **시나리오 기반 출제** | "투명성이 중요하다고 생각하십니까?" → 안 됨. "동료가 실수를 했는데 고객이 모른다. 어떻게 하겠는가?" → 됨 |
| **축당 충분한 문항 수** | 최소 5문항 (현재 충족) |
| **선택지 순서 랜덤화** | 비용 없이 순서 효과 제거. 현재 구현: `QuestionCard.tsx`에서 시드 기반 셔플 적용 완료 |

### 중요하지 않은 것

| 항목 | 이유 |
|---|---|
| **랜덤 시뮬레이션 기반 유형 비율 균등화** | 실제 응답 분포는 알 수 없으므로, 균등 랜덤을 가정하고 비율을 조정하는 것은 근거 없는 가정에 기반한 과잉 최적화 |
| **역채점 문항 비율 맞추기** | 학계에서도 합의 없음 (Frontiers, 2025). 강제선택에서는 불필요 |

### 주의: +1/-1 기회 수 균형

일반적으로 강제선택에서 +1/-1 산술 균형은 Likert의 묵인 상쇄 기법이므로 해당되지 않는다. **단, 이 구현에서는 동점(0점) 시 `>= 0` 조건으로 양의 축(원칙/투명/독립)에 분류하므로**, +1 기회가 더 많으면 양의 유형으로의 편향이 실제로 발생할 수 있다. 이는 심리측정 원리가 아니라 이 앱의 분류 규칙에서 오는 구현 이슈이다.

---

## 4. 사회적 바람직성 매칭 체크리스트

문항을 검토할 때 각 질문에 대해:

1. 4개 선택지를 읽고, "어떤 게 가장 올바른 답인가?"가 바로 보이는가?
   - 보이면 → 해당 선택지를 덜 도덕적으로 보이게 수정하거나, 다른 선택지를 더 매력적으로 수정
2. 각 선택지가 "이것도 합리적인 판단"이라고 느껴지는가?
   - 아니면 → 상황 설정을 더 모호하게 만들어서 갈등 유발
3. 청렴 교육 교재에 나올 법한 정답이 있는가?
   - 있으면 → "교육 퀴즈"가 아닌 "성향 측정"이 되도록 재구성

### 좋은 예 vs 나쁜 예

**나쁜 예 (정답이 보임):**
> 업체에서 선물을 보내왔다.
> A. 돌려보낸다 ← 누가 봐도 정답
> B. 받는다

**좋은 예 (성향 차이):**
> 퇴직하는 업체 담당자가 커피 한 잔 하자고 한다. 앞으로 업무 관계는 없다.
> A. 정중히 사양한다
> B. 규정을 확인해본다
> C. 편하게 만난다
> D. 팀장에게 알린다
> → 모두 합리적. "어떤 가치를 우선하느냐"의 차이

---

## 5. 강제선택의 구조적 한계: 이프사티브 채점

현재 테스트는 4지선다에서 각 선택지가 서로 다른 축에 점수를 부여하는 구조. 이는 이프사티브(ipsative, 개인 내 상대적) 점수를 생성한다.

### 이프사티브 vs 규준적(normative) 점수

| | 이프사티브 (현재) | 규준적 |
|---|---|---|
| 의미 | "이 사람 안에서 어떤 축이 상대적으로 높은가" | "이 사람의 절대적 수준이 어느 정도인가" |
| 사람 간 비교 | 불가 | 가능 |
| 모든 축이 높을 수 있는가 | 불가 (하나가 오르면 다른 것이 내려감) | 가능 |
| 적합한 용도 | 개인 내 성향 탐색, 자기 인식 | 선발, 평가, 집단 비교 |

### 실질적 의미

- "원칙 성향이 높다"는 것은 "투명/독립보다 원칙을 더 자주 선택했다"는 뜻이지, "이 사람이 절대적으로 원칙적이다"는 뜻이 아님
- A의 원칙 점수 8과 B의 원칙 점수 3을 비교하는 것은 통계적으로 무의미
- **이 테스트의 목적(자기 인식 도구)에서는 이프사티브 채점이 적합함**
- 인사 평가나 선발에 사용하면 안 됨

---

## 6. 한국 공공기관 맥락의 추가 편향

### 체면 (Face-saving)
- 사회적으로 적절한 모습을 유지하려는 문화적 경향
- 서구의 일반적 사회적 바람직성 편향보다 강하게 작용
- "가장 조직적으로 무난한" 선택지를 고를 가능성

### 위계 혼동
- "팀장에게 보고한다"를 투명성이나 협력 성향이 아닌 **위계적 순응**으로 선택할 수 있음
- 선택지가 의도한 축과 실제 응답 동기가 다를 수 있음

### 대응
- 파일럿 테스트에서 각 문항에 대해 "가장 올바른 답"을 골라달라고 요청
- 40% 이상이 같은 선택지를 고르면 해당 문항의 바람직성 매칭 재조정 필요

---

## 7. 결과 피드백 프레이밍

### 원칙

테스트 결과를 어떻게 전달하느냐가 테스트 자체만큼 중요하다. Kluger & DeNisi(1996) 메타분석에서 피드백의 1/3이 오히려 성과를 악화시켰다.

### 해야 할 것

- **성향으로 표현.** "당신은 X 유형" → "X를 우선하는 경향이 있어요"
- **모든 결과가 긍정적.** 어떤 축도 "더 나은" 것이 아님을 명확히
- **맥락 의존성 강조.** "A 상황에서는 B 성향이 강점이고, C 상황에서는 D를 고려해볼 수 있어요"
- **변화 가능성 명시.** "오늘 응답 기준이며, 상황과 경험에 따라 달라질 수 있습니다"

### 하지 말아야 할 것

- "가장 약한 영역은..."이라는 비교 표현 (이프사티브 점수에서 "가장 낮음"은 구조적으로 강제된 결과)
- 유형을 고정 정체성처럼 표현 ("당신은 소신 수호자입니다" → "소신 수호자 성향이 나타났어요")
- 다른 유형과의 우열 비교

---

## 8. 윤리적 사용 가이드라인

### 목적 제한
이 테스트는 자기 인식과 발전을 위한 도구이며, 인사 평가·선발·승진에 사용할 수 없다.

### 참여자 동의
- 테스트의 목적과 결과 활용 방법을 사전에 안내
- 참여는 자발적이어야 함
- 결과는 본인만 확인 (조직에 공유되지 않음)

### 오용 방지
- 결과를 기반으로 한 인사 조치 금지
- "이 유형이 더 청렴하다"는 해석 금지 (유형은 스타일이지 수준이 아님)
- 결과 데이터의 보관 기간과 접근 권한 명시

---

## 9. 검증 로드맵

테스트의 타당성을 확인하기 위한 단계별 계획:

### Phase 1: 파일럿 (최소)
- 200명+ 대상 실시
- 각 문항의 변별도 확인 (수정된 문항-총점 상관 ≥ 0.20)
- 확인적 요인분석(CFA)으로 3요인 구조 검증
- 사회적 바람직성 매칭 점검 (40% 합의 기준)

### Phase 2: 수렴·판별 타당도 (권장)
- 축별 점수와 관련 검증된 도구 간 상관 확인
  - 원칙 ↔ 도덕 판단력 척도
  - 투명 ↔ 개방성/공개 성향 척도
  - 독립 ↔ 자율성/동조 저항 척도
- 축 간 상관이 각 축의 신뢰도보다 낮은지 확인 (판별 타당도)

### Phase 3: 검사-재검사 신뢰도
- 2~4주 간격으로 동일 집단 재실시
- 개발 도구 기준 r ≥ 0.65 목표

---

## 10. 설계 메모: 선택지 수 (4지선다 vs 3지선다)

현재 3개 축에 4개 선택지를 사용 중. 학술적으로는:

- **3지선다 (트리플렛):** 각 선택지가 축 하나에 1:1 매핑. 가장 깔끔한 구조. Thurstonian IRT에서 가장 잘 연구됨
- **4지선다 (현재):** 하나의 축이 2개 선택지에 중복 매핑되거나, 점수 없는 선택지가 존재. 인지 부하 약간 높음. 단, 현실적 상황에서 4가지 대응이 자연스러운 경우가 많음

현재 4지선다를 유지하는 이유: 상황에 대한 반응이 자연스럽게 4가지로 나뉘는 경우가 많고, 이미 15문항 모두 4지선다로 설계 완료. 변경 비용 대비 이점이 크지 않음.

---

## 11. 참고 문헌

- Edwards, A. L. (1953). The relationship between the judged desirability of a trait and the probability that the trait will be endorsed.
- Paulhus, D. L. (1991). Balanced Inventory of Desirable Responding (BIDR).
- Ones, D. S., Viswesvaran, C., & Reiss, A. D. - Social desirability and integrity test validity.
- Bäckström, M. & Björklund, F. (2023). Why forced-choice and Likert items provide the same information on personality, including social desirability. PMC (2024년 6월호). https://pmc.ncbi.nlm.nih.gov/articles/PMC11095325/
- Martínez, A. & Salgado, J. F. (2021). Meta-analysis of faking resistance of forced-choice personality inventories. Frontiers in Psychology. https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.732241/full
- Ferrando et al. (2019). Controlling for response biases in forced-choice. Frontiers/PMC.
- Frontiers in Psychology (2025). Advancing psychometrics of reverse-keyed items.
- AERA/APA/NCME (2014). Standards for Educational and Psychological Testing.
- Lang et al. BFI-S validation. ScienceDirect.
- Brown, A. & Maydeu-Olivares, A. (2011). How IRT can solve problems of ipsative data in forced-choice questionnaires. Psychological Methods.
- Buerkner et al. (2019). Thurstonian IRT for forced-choice questionnaires. PMC.
- Kluger, A. N. & DeNisi, A. (1996). The effects of feedback interventions on performance. Psychological Bulletin.
- Kim, S. & Kim, D. (2016). Does government make people happy? Exploring new research directions for government's roles in happiness. Journal of Happiness Studies.
- Campbell, D. T. & Fiske, D. W. (1959). Convergent and discriminant validation by the multitrait-multimethod matrix. Psychological Bulletin.
- Nunnally, J. C. (1978). Psychometric Theory. McGraw-Hill.
- Cox, E. P. (1980). The optimal number of response alternatives for a scale. Journal of Marketing Research.
