# Code Review Request

## Summary

대화 요약(summarize) 기능 추가로 이어서 질문을 4턴 → 8턴으로 확장. 4턴 도달 시 AI가 대화를 3문장으로 요약하고, 이후 턴에서는 요약본 + 최근 대화만 API에 전송하여 토큰 절감 및 대화 품질 유지.

## Changed Files

| File | Changes |
|------|---------|
| `src/lib/constants.ts` | `MAX_HISTORY_MESSAGES` 8→16, `SUMMARIZE_AT_MESSAGES = 8` 추가 |
| `src/app/api/analyze/route.ts` | `mode: 'summarize'` 핸들러 추가, Q&A 모드에서 summary 수신 및 system prompt 주입, 프롬프트 개선 |
| `src/app/result/page.tsx` | `chatSummary` state + `summarizingRef` guard 추가, 요약 트리거/활용 로직, 모달 UX 개선 |
| `docs/token-cost-analysis.md` | 토큰 단가, 상수 테이블, 축약 전략 문서 전면 갱신 |

## Architecture

### 요약 흐름

```
턴 1~4: chatHistory에 원본 대화 누적, 전체를 API에 전송
턴 4 완료 → fetchAnswer 내에서 조건 충족 시:
  triggerSummarize(newHistory) 백그라운드 호출
    → POST /api/analyze { mode: 'summarize', history }
    → AI가 3문장 요약 반환
    → setChatSummary(summary)  (React state에만 저장, localStorage 아님)
턴 5~8: API에 [summary + 최근 2턴(4msg) + 현재 질문] 전송
  → system prompt에 "이전 대화 요약" 섹션 주입
```

### 턴별 API 전송 구성

| 턴 | history 전송 | 입력 토큰 (추정) |
|----|-------------|-----------------|
| 1~4 | 원본 대화 전체 | 800→1,400 (누적) |
| 요약 | 턴1~4 대화 → 3문장 축약 | ~880 |
| 5 | 요약본만 | ~500 |
| 6 | 요약본 + 턴5(2msg) | ~700 |
| 7~8 | 요약본 + 최근 2턴(4msg) | ~900 |

### API route 모드 분기

```
POST /api/analyze
  ├─ mode: 'summarize' → 대화 요약 (temp 0.3, maxTokens 200)
  ├─ mode: 'question'  → Q&A 답변 (temp 0.7, maxTokens 600)
  │   └─ summary 필드 있으면 system prompt에 주입
  └─ mode: 'analysis'  → 초기 분석 (temp 0.7, maxTokens 1500)
```

## Key Design Decisions

1. **요약본은 React state에만 저장**: 세션 중에만 필요하므로 localStorage 미사용. 재방문 시 요약 없이 전체 히스토리(최대 16msg)로 동작
2. **summarizingRef guard**: 빠른 연타 시 triggerSummarize 중복 호출 방지. useState 대신 ref 사용 (리렌더 불필요)
3. **연산자 우선순위 명시**: `(safeSummary || hasHistory) ? CONTINUE : FIRST` — 괄호로 의도 명확화
4. **summary도 sanitize**: `sanitizeUserInput(summary.slice(0, MAX_CONTENT_LENGTH))` — 클라이언트에서 오는 모든 문자열 정제
5. **isFirstTurn 판별**: `!hasHistory && !safeSummary` — 요약만 있고 history 없는 턴 5도 CONTINUE 프롬프트 사용
6. **서버/클라이언트 양쪽 slice**: 클라이언트가 `slice(0, SUMMARIZE_AT_MESSAGES)`로 전송량 최소화, 서버도 방어적으로 동일 slice (defensive programming)

## Review Focus

1. **triggerSummarize의 fire-and-forget 패턴**: fetchAnswer 내에서 await 없이 호출 — 요약 실패 시 사용자에게 알리지 않음. 적절한가?
2. **stale closure**: fetchAnswer에서 `chatSummary`, `chatHistory`를 closure로 참조. `setChatHistory(newHistory)` 후 `!chatSummary` 체크는 closure 값 기준. 현재는 `newHistory`를 직접 전달하므로 안전하지만, 리팩토링 시 깨질 수 있음
3. **double-slice**: `chatHistory.slice(SUMMARIZE_AT_MESSAGES).slice(-4)` — SUMMARIZE_AT_MESSAGES(8) 이후 메시지 중 최근 4개만 추출. 가독성 vs 간결성 트레이드오프
4. **요약 품질**: 3문장 요약이 이후 턴에서 충분한 맥락을 제공하는지 (temperature 0.3으로 일관성 우선)
5. **SUMMARIZE_AT_MESSAGES 상수 커플링**: 클라이언트와 서버 양쪽에서 참조 — constants.ts로 공유하지만, 의미가 달라질 여지 있음
