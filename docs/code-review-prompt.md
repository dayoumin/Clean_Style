# 코드 리뷰 요청 — 스트리밍 + 롤링 요약 + 성향 반영 조언 (v2)

아래 프롬프트를 ChatGPT, Gemini 등에 붙여넣어 리뷰를 받으세요.

---

## 프롬프트 (복사해서 사용)

```
아래는 Next.js 15 App Router 프로젝트의 코드이다.
공공기관 청렴 스타일 테스트 앱의 AI Q&A 기능 전체 구조를 검토해줘.

## 아키텍처 요약

### 전체 흐름
사용자가 15문항 테스트 완료 → 8가지 유형 판정 → 결과 화면에서 "AI 맞춤 조언" 모달 열기 → Q&A 대화 (최대 10턴)

### 핵심 상수
- MAX_HISTORY_MESSAGES = 20 (10턴 = user+assistant 20개)
- SUMMARIZE_AT_MESSAGES = 8 (4턴마다 요약 트리거)
- MAX_CONTENT_LENGTH = 2000 (메시지당 최대 길이)
- MAX_QUESTION_LENGTH = 500 (사용자 질문 입력 제한)

### 정량 참고
- AI 모델: x-ai/grok-4.1-fast (OpenRouter 경유, 입력 ~$5/1M tokens)
- 평균 메시지 길이: user ~50토큰, assistant ~150토큰
- 20메시지 전체 전송 시 약 2,000토큰 (≈$0.01)
- 스트리밍 타임아웃: 30s (non-stream: 10s) — 600토큰 생성에 ~5-15s 소요
- describeScores 임계값: ±1(약간), ±3(뚜렷) — 15문항 기준 점수 범위 -13~+14, 시뮬레이션 평균 ±3 이내

### 스트리밍 (SSE)
- 서버: `chatStream()` → OpenRouter API에 `stream: true` 요청 → SSE ReadableStream 반환
- API route: Q&A 모드에서 `new Response(stream, { 'Content-Type': 'text/event-stream' })` 반환
- 프론트: `res.body.getReader()` 루프로 토큰 수신, 5토큰마다 `setAiAnswer()` 갱신 (리렌더 절감)

### 롤링 요약
- 4턴 배수마다 요약 트리거: `turnCount >= 4 && turnCount % 4 === 0`
- `summarizedUpTo` state로 요약된 메시지 위치 추적
- Q&A 전송: `chatHistory.slice(summarizedUpTo)` (요약 이후 메시지만)
- 재요약 시: "이전 요약 + 최근 8메시지" → 누적 요약
- 히스토리 trim(MAX 초과) 시 `summarizedUpTo` 도 같이 감소

### abort 전파
- `chatStream()`에 `cancel()` 콜백 → 클라이언트 disconnect 시 OpenRouter 업스트림도 중단
- `abortRef` + `summarizeAbortRef` 둘 다 unmount cleanup에서 정리
- abort된 스트림은 `abortCtrl.signal.aborted` 체크 후 조용히 close

### 성향 반영 조언
- 클라이언트에서 `scores` 객체를 API에 전달
- 서버: `isValidScores()` 검증(범위 ±15) → `describeScores()`로 한글 변환
- 첫 턴: user 메시지에 스타일명+성향 포함 / 이어서: system 프롬프트에 "조언 방향 참고용, 직접 언급 금지" 삽입

## 검토 요청 사항

### A. 스트리밍 안정성
1. `chatStream()`의 `cancel()` 콜백이 Cloudflare Workers 환경에서 확실히 호출되나? (확실하지 않으면 "불확실"로 표시하고, 출처가 있으면 링크 첨부)
2. 서버에서 OpenRouter error frame(`chunk.error`)은 감지하고 SSE 에러로 전달. 하지만 malformed JSON chunk는 `catch { continue }`로 스킵됨 — 에러가 malformed chunk에 담겨오면 유실 가능한가?
3. 5토큰 배치 갱신(`tokenCount % 5 === 0`) — 마지막 토큰이 5의 배수가 아닐 때 `if (tokenCount % 5 !== 0) setAiAnswer(fullAnswer)` 로 마무리. 이 패턴에 엣지 케이스는?

### B. 롤링 요약 + summarizedUpTo
1. `summarizedUpTo`가 히스토리 trim에 연동됨: `Math.max(0, summarizedUpTo - trimmed)`. 이 계산이 모든 경우에 올바른가?
2. 요약 실패 시 `summarizedUpTo`는 갱신 안 됨 → `chatHistory.slice(summarizedUpTo)`가 전체 미요약 히스토리를 보냄. 이 fallback이 토큰 비용 면에서 괜찮은가? (최대 20메시지 전체 전송)
3. 재방문 시 `chatSummary=''`, `summarizedUpTo=0`이지만 localStorage에서 12메시지 로드 → 즉시 요약 트리거 → 성공 시 `summarizedUpTo=12` → 다음 질문에서 `slice(12)` = 빈 배열. 이 흐름이 정확한가?
4. `triggerSummarize`는 in-flight 요약을 abort하고 최신으로 교체하는 방식. abort 후 새 요청 사이에 race condition이 있는가? closure가 `chatSummary`를 캡처하는데 이 시점의 값이 최신인가?
5. 4턴(8msg), 8턴(16msg)에서 트리거. 그런데 10턴(20msg)에서는 `20/2=10, 10%4=2`이므로 트리거 안 됨. 이게 의도된 건가?

### C. 성향 반영 프롬프트
1. `scores`는 클라이언트에서 오는데 `isValidScores()`로 범위만 검증. 실제 `answers`와 대조하지 않으므로 위조 가능. 위험도는?
2. `describeScores()`의 임계값(±1, ±3)이 15문항 기준 점수 범위(-13~+14)에서 적절한가? 대부분의 사용자가 ±3 이하일 텐데, "뚜렷"이 너무 쉽게 나오는 건 아닌가?
3. 첫 턴에는 user 메시지에, 이어서에는 system 프롬프트에 성향 삽입. 위치가 다른 이유와 영향은?

### D. localStorage 일관성
1. `resetModal()`이 `clearChat(historyId)` 호출 → localStorage에서 chat을 빈 배열로 설정. 하지만 히스토리 엔트리 자체(스타일, 점수)는 남음. 이게 맞는 동작인가?
2. 저장 effect는 `chatHistory.length > 0`일 때만 동작. 빈 배열은 저장 안 됨 → `clearChat()`이 아니면 대화 삭제가 영속화되지 않음. resetModal 외에 빈 배열이 되는 경로가 더 있나?

### E. 전반적 구조
1. SSE 파싱 로직이 서버(`ai.ts`)와 클라이언트(`page.tsx`) 양쪽에 중복 — 공유 유틸로 빼야 하나?
2. `isValidScores()`와 `describeScores()`가 route.ts 내부 함수인데, 테스트에서도 동일 로직을 복사 사용 중. 공유 모듈로 추출해야 하나?
3. 30s 스트리밍 타임아웃 vs 10s non-stream 타임아웃 — 적절한가?

## 핵심 코드

### src/lib/ai.ts — chatStream()

```typescript
export function chatStream(options: ChatOptions): ReadableStream {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');
  const encoder = new TextEncoder();
  const abortCtrl = new AbortController();

  return new ReadableStream({
    async start(ctrl) {
      const timeout = setTimeout(() => abortCtrl.abort(), 30_000);
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { ... },
          body: JSON.stringify({ ...options, stream: true }),
          signal: abortCtrl.signal,
        });

        if (!res.ok || !res.body) {
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `API ${res.status}` })}\n\n`));
          ctrl.close(); return;
        }

        const reader = res.body.getReader();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += new TextDecoder().decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim().startsWith('data: ')) continue;
            const payload = line.trim().slice(6);
            if (payload === '[DONE]') continue;
            try {
              const chunk = JSON.parse(payload);
              if (chunk.error) {
                ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ error: chunk.error.message ?? 'provider error' })}\n\n`));
                ctrl.close(); return;
              }
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ token: delta })}\n\n`));
            } catch { /* skip malformed */ }
          }
        }
        ctrl.enqueue(encoder.encode('data: [DONE]\n\n'));
        ctrl.close();
      } catch (err) {
        if (abortCtrl.signal.aborted) { ctrl.close(); return; }
        ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
        ctrl.close();
      } finally { clearTimeout(timeout); }
    },
    cancel() { abortCtrl.abort(); },  // 클라이언트 disconnect → 업스트림 중단
  });
}
```

### src/app/result/page.tsx — fetchAnswer() (SSE 소비 + 롤링 요약)

```typescript
const fetchAnswer = async () => {
  setAiAnswer('');
  const controller = new AbortController();
  abortRef.current = controller;

  const historyToSend = chatSummary
    ? chatHistory.slice(summarizedUpTo)  // 요약 이후 메시지만
    : chatHistory;

  const res = await fetch('/api/analyze', {
    body: JSON.stringify({
      mode: 'question', styleKey, scores, answers,
      userContext: question,
      history: historyToSend.length > 0 ? historyToSend : undefined,
      summary: chatSummary || undefined,
    }),
    signal: controller.signal,
  });

  if (!res.ok || !res.body) throw new Error('API 응답 오류');

  // SSE 소비 — 5토큰 배치 갱신
  const reader = res.body.getReader();
  let fullAnswer = '', buffer = '', tokenCount = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim().startsWith('data: ')) continue;
      const payload = line.trim().slice(6);
      if (payload === '[DONE]') continue;
      let parsed;
      try { parsed = JSON.parse(payload); } catch { continue; }
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.token) {
        fullAnswer += parsed.token;
        if (++tokenCount % 5 === 0) setAiAnswer(fullAnswer);
      }
    }
  }
  if (tokenCount % 5 !== 0) setAiAnswer(fullAnswer);

  // 히스토리 갱신 + trim
  const raw = [...chatHistory, { role: 'user', content: question }, { role: 'assistant', content: fullAnswer }];
  const trimmed = raw.length - MAX_HISTORY_MESSAGES;
  const newHistory = trimmed > 0 ? raw.slice(trimmed) : raw;
  if (trimmed > 0 && summarizedUpTo > 0) {
    setSummarizedUpTo(Math.max(0, summarizedUpTo - trimmed));
  }
  setChatHistory(newHistory);

  // 4턴마다 롤링 요약
  const turnCount = newHistory.length / 2;
  if (turnCount >= 4 && turnCount % 4 === 0) {
    triggerSummarize(newHistory);
  }
};
```

### src/app/result/page.tsx — triggerSummarize()

```typescript
const triggerSummarize = async (messages) => {
  // in-flight 요약이 있으면 취소하고 최신으로 교체 (유실 방지)
  summarizeAbortRef.current?.abort();
  summarizingRef.current = true;
  const controller = new AbortController();
  summarizeAbortRef.current = controller;
  try {
    const res = await fetch('/api/analyze', {
      body: JSON.stringify({
        mode: 'summarize',
        history: chatSummary ? messages.slice(-SUMMARIZE_AT_MESSAGES) : messages,
        summary: chatSummary || undefined,
        styleKey,
      }),
      signal: controller.signal,
    });
    if (res.ok) {
      const data = await res.json();
      setChatSummary(data.summary);
      setSummarizedUpTo(messages.length);
    }
  } catch { /* 실패/취소 시 무시 — 전체 히스토리로 계속 진행 */ }
  finally { summarizingRef.current = false; }
};
```

### src/app/api/analyze/route.ts — 요약 모드 (롤링)

```typescript
if (mode === 'summarize') {
  const safeSummary = typeof summary === 'string' ? summary.slice(0, 2000) : '';
  const conversation = safeHistory
    .map(m => `${m.role === 'user' ? '사용자' : 'AI'}: ${m.content}`)
    .join('\n');
  const userContent = safeSummary
    ? `## 이전 요약\n${safeSummary}\n\n## 이후 대화\n${conversation}`
    : conversation;
  const response = await chat({
    messages: [
      { role: 'system', content: '아래 대화를 3문장 이내로 요약하세요. ...' },
      { role: 'user', content: userContent },
    ],
    temperature: 0.3, maxTokens: 300,
  });
  return NextResponse.json({ summary: response.content });
}
```

### src/app/api/analyze/route.ts — Q&A 모드 (스트리밍 + 성향 반영)

```typescript
if (mode === 'question') {
  const validScores = isValidScores(scores) ? scores : null;
  const isFirstTurn = !hasHistory && !safeSummary;
  const scoreContext = (!isFirstTurn && validScores)
    ? `\n\n## 사용자 성향 (조언 방향 참고용, 직접 언급 금지)\n${describeScores(validScores)}`
    : '';
  const summaryContext = safeSummary ? `\n\n## 이전 대화 요약\n${safeSummary}` : '';
  const systemPrompt = basePrompt + scoreContext + summaryContext;

  let userMessage;
  if (isFirstTurn) {
    userMessage = `나의 청렴 스타일: ${style.name} (${style.description})${scoreInfo}\n\n질문: ${question}`;
  } else {
    userMessage = question;
  }

  const stream = chatStream({ messages: [...], temperature: 0.7, maxTokens: 600 });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
}
```

### cleanup & reset

```typescript
// unmount
useEffect(() => {
  return () => {
    abortRef.current?.abort();
    summarizeAbortRef.current?.abort();
  };
}, []);

// 새 질문 (대화 초기화)
const resetModal = () => {
  summarizeAbortRef.current?.abort();
  clearChatUI();
  setChatHistory([]);
  setChatSummary('');
  setSummarizedUpTo(0);
  if (historyId) clearChat(historyId);  // localStorage도 정리
};
```

## 환경 정보
- Next.js 15.5 App Router, React 19
- 배포: Cloudflare Workers (OpenNext)
- AI: OpenRouter → x-ai/grok-4.1-fast
- 상태: React useState (전역 상태 없음)
- 히스토리: localStorage (최대 10건 보관)
- 테스트: 513개 시뮬레이션 테스트 통과 (문항 균형, 요약, 보안, 히스토리)

## 응답 형식

1. **확정 이슈 (Findings)** — 코드에서 확인 가능한 결함. 심각도(High/Medium/Low) + 근거 라인 표시
2. **추정/의견** — 코드만으로 확정 불가하지만 리스크가 있는 항목. "추정" 명시
3. **불확실** — 외부 플랫폼 동작(CF Workers, OpenRouter 등) 관련. 출처가 없으면 "불확실"로 남기고 추측하지 마

우선순위: summarizedUpTo 로직 정합성 > 스트리밍 abort 완전성 > 토큰 비용
```
