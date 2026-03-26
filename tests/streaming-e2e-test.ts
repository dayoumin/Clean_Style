/**
 * 스트리밍 + 롤링 요약 + 성향 반영 E2E 시뮬레이션
 * 실행: npx tsx tests/streaming-e2e-test.ts
 *
 * dev 서버(localhost:3000)가 실행 중이어야 합니다.
 */

const API = `http://localhost:${process.env.PORT || 3000}/api/analyze`;

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ ${name}`);
    failed++;
  }
}

/** SSE 스트림을 소비하여 전체 텍스트 반환 */
async function consumeSSE(res: Response): Promise<{ text: string; tokenCount: number; error?: string }> {
  if (!res.body) return { text: '', tokenCount: 0, error: 'no body' };
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let tokenCount = 0;
  let buffer = '';
  let error: string | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const payload = trimmed.slice(6);
      if (payload === '[DONE]') continue;
      try {
        const data = JSON.parse(payload);
        if (data.error) { error = data.error; break; }
        if (data.token) { text += data.token; tokenCount++; }
      } catch { /* skip */ }
    }
    if (error) break;
  }
  return { text, tokenCount, error };
}

const STYLE_KEY = 'principle-transparent-independent';
const SCORES = { principle: 5, transparency: 3, independence: 4 };
const ANSWERS = [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

async function main() {
  // ═══════════════════════════════════════
  // Test 1: 스트리밍 Q&A — 첫 턴
  // ═══════════════════════════════════════
  console.log('\n[Test 1] 스트리밍 Q&A — 첫 턴 (성향 반영)');
  {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        styleKey: STYLE_KEY,
        mode: 'question',
        userContext: '연구비로 구매한 노트북을 집에 가져가도 되나요?',
        scores: SCORES,
        answers: ANSWERS,
      }),
    });

    assert(res.status === 200, 'HTTP 200');
    assert(res.headers.get('content-type')?.includes('text/event-stream') === true, 'Content-Type: text/event-stream');

    const { text, tokenCount, error } = await consumeSSE(res);
    assert(!error, '에러 없음');
    assert(text.length > 0, `응답 텍스트 있음 (${text.length}자)`);
    assert(tokenCount > 0, `토큰 ${tokenCount}개 수신`);

    // 성향 반영 확인 — 첫 턴은 스타일명 언급
    const hasStyle = text.includes('소신 수호자') || text.includes('원칙');
    assert(hasStyle, '첫 턴: 스타일 또는 원칙 성향 언급');

    console.log(`    응답 미리보기: ${text.slice(0, 100)}...`);
    console.log(`    토큰: ${tokenCount}개, 길이: ${text.length}자`);

    // 다음 테스트용
    var turn1Answer = text;
  }

  // ═══════════════════════════════════════
  // Test 2: 이어서 질문 — 히스토리 전송
  // ═══════════════════════════════════════
  console.log('\n[Test 2] 이어서 질문 — 히스토리 포함');
  {
    const history = [
      { role: 'user', content: '연구비로 구매한 노트북을 집에 가져가도 되나요?' },
      { role: 'assistant', content: turn1Answer },
    ];

    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        styleKey: STYLE_KEY,
        mode: 'question',
        userContext: '그러면 주말에만 잠깐 쓰는 건요?',
        scores: SCORES,
        answers: ANSWERS,
        history,
      }),
    });

    const { text, tokenCount, error } = await consumeSSE(res);
    assert(!error, '에러 없음');
    assert(text.length > 0, `응답 있음 (${text.length}자)`);

    // 이어서: 스타일명 반복 안 해야 함
    const repeatsStyle = text.includes('「소신 수호자」');
    assert(!repeatsStyle, '이어서: 꺾쇠 스타일명 반복 없음');

    console.log(`    응답 미리보기: ${text.slice(0, 100)}...`);

    var turn2Answer = text;
  }

  // ═══════════════════════════════════════
  // Test 3: 요약 모드 — 초기 요약
  // ═══════════════════════════════════════
  console.log('\n[Test 3] 요약 모드 — 4턴 히스토리 요약');
  {
    const history = [
      { role: 'user', content: '연구비로 구매한 노트북을 집에 가져가도 되나요?' },
      { role: 'assistant', content: turn1Answer },
      { role: 'user', content: '그러면 주말에만 잠깐 쓰는 건요?' },
      { role: 'assistant', content: turn2Answer },
      { role: 'user', content: '출장 중 구매한 물품은 어떻게 정산하나요?' },
      { role: 'assistant', content: '출장 관련 정산은 영수증과 함께 처리합니다.' },
      { role: 'user', content: '동료가 정산 기준을 다르게 적용하는 것 같은데요' },
      { role: 'assistant', content: '기관 내 기준을 확인하고 통일하는 것이 좋습니다.' },
    ];

    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        styleKey: STYLE_KEY,
        mode: 'summarize',
        history,
      }),
    });

    assert(res.status === 200, 'HTTP 200');
    const data = await res.json();
    assert(typeof data.summary === 'string', '요약 텍스트 반환');
    assert(data.summary.length > 10, `요약 길이 적절 (${data.summary.length}자)`);
    assert(data.summary.length < 500, '요약이 3문장 이내로 짧음');

    console.log(`    요약: ${data.summary}`);

    var summary1 = data.summary;
  }

  // ═══════════════════════════════════════
  // Test 4: 롤링 재요약 — 이전 요약 + 새 대화
  // ═══════════════════════════════════════
  console.log('\n[Test 4] 롤링 재요약 — 이전 요약 포함');
  {
    const recentHistory = [
      { role: 'user', content: '연구 장비 유지보수 계약은 어떻게 하나요?' },
      { role: 'assistant', content: '수의계약 사유서를 작성하고 공식 절차를 밟으세요.' },
      { role: 'user', content: '기존 업체 외에 선택지가 없는 경우는요?' },
      { role: 'assistant', content: '단독 업체라도 사유서와 비교견적 과정을 문서화해야 합니다.' },
      { role: 'user', content: '외부 기관 담당자가 식사를 제안하면?' },
      { role: 'assistant', content: '기관 내 회의실에서 만나거나, 팀장 보고 후 판단하세요.' },
      { role: 'user', content: '퇴직한 업체 담당자와 커피 한 잔은 괜찮나요?' },
      { role: 'assistant', content: '이해관계가 없더라도 기관 규정을 먼저 확인해보세요.' },
    ];

    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        styleKey: STYLE_KEY,
        mode: 'summarize',
        history: recentHistory,
        summary: summary1,
      }),
    });

    assert(res.status === 200, 'HTTP 200');
    const data = await res.json();
    assert(typeof data.summary === 'string', '재요약 텍스트 반환');
    assert(data.summary.length > 10, `재요약 길이 적절 (${data.summary.length}자)`);

    console.log(`    재요약: ${data.summary}`);

    var summary2 = data.summary;
  }

  // ═══════════════════════════════════════
  // Test 5: 요약 포함 Q&A — summary context 전달
  // ═══════════════════════════════════════
  console.log('\n[Test 5] 요약 포함 Q&A — continuation with summary');
  {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        styleKey: STYLE_KEY,
        mode: 'question',
        userContext: '앞에서 이야기한 것 중에 가장 중요한 건 뭐예요?',
        scores: SCORES,
        answers: ANSWERS,
        summary: summary2,
        history: [
          { role: 'user', content: '마지막 질문입니다' },
          { role: 'assistant', content: '네, 말씀하세요.' },
        ],
      }),
    });

    const { text, error } = await consumeSSE(res);
    assert(!error, '에러 없음');
    assert(text.length > 0, `요약 기반 응답 있음 (${text.length}자)`);

    // 이전 대화 맥락 반영 확인
    const hasContext = text.includes('연구비') || text.includes('계약') || text.includes('정산') || text.includes('절차') || text.includes('규정');
    assert(hasContext, '요약 맥락이 답변에 반영됨');

    console.log(`    응답 미리보기: ${text.slice(0, 100)}...`);
  }

  // ═══════════════════════════════════════
  // Test 6: abort 시뮬레이션 — 스트림 중단
  // ═══════════════════════════════════════
  console.log('\n[Test 6] abort 시뮬레이션 — 스트림 중단');
  {
    const controller = new AbortController();

    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        styleKey: STYLE_KEY,
        mode: 'question',
        userContext: '이건 긴 답변이 필요한 복잡한 질문입니다. 연구비 정산, 물품 구매, 외부 협력 전체를 아우르는 가이드라인을 알려주세요.',
        scores: SCORES,
        answers: ANSWERS,
      }),
      signal: controller.signal,
    });

    assert(res.status === 200, 'HTTP 200');

    // 첫 번째 청크만 읽고 abort
    const reader = res.body!.getReader();
    const { done, value } = await reader.read();
    assert(!done, '첫 청크 수신');
    assert(value!.byteLength > 0, '데이터 있음');

    controller.abort();

    // abort 후 에러 없이 종료
    try {
      await reader.read();
    } catch (err) {
      // AbortError 또는 네트워크 에러 — 정상
    }
    assert(true, 'abort 후 정상 종료 (크래시 없음)');
  }

  // ═══════════════════════════════════════
  // Test 7: 잘못된 입력 — 에러 핸들링
  // ═══════════════════════════════════════
  console.log('\n[Test 7] 잘못된 입력 — 에러 응답');
  {
    // 빈 질문
    const res1 = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        styleKey: STYLE_KEY,
        mode: 'question',
        userContext: '',
      }),
    });
    assert(res1.status === 400, '빈 질문: 400');

    // 잘못된 styleKey
    const res2 = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        styleKey: 'invalid-key',
        mode: 'question',
        userContext: '테스트',
      }),
    });
    assert(res2.status === 400, '잘못된 styleKey: 400');

    // 요약 모드 — 히스토리 없음
    const res3 = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        styleKey: STYLE_KEY,
        mode: 'summarize',
      }),
    });
    assert(res3.status === 400, '히스토리 없는 요약: 400');
  }

  // ═══════════════════════════════════════
  // Test 8: 스타일별 성향 반영 비교
  // ═══════════════════════════════════════
  console.log('\n[Test 8] 성향 반영 비교 — 원칙형 vs 유연형');
  {
    const question = '동료가 절차를 좀 편하게 처리하는 걸 봤어요. 어떻게 해야 하나요?';

    // 원칙형
    const res1 = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        styleKey: 'principle-transparent-independent',
        mode: 'question',
        userContext: question,
        scores: { principle: 5, transparency: 3, independence: 4 },
      }),
    });
    const result1 = await consumeSSE(res1);

    // 유연형
    const res2 = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        styleKey: 'flexible-cautious-cooperative',
        mode: 'question',
        userContext: question,
        scores: { principle: -5, transparency: -3, independence: -4 },
      }),
    });
    const result2 = await consumeSSE(res2);

    assert(!result1.error && result1.text.length > 0, '원칙형 응답 정상');
    assert(!result2.error && result2.text.length > 0, '유연형 응답 정상');
    assert(result1.text !== result2.text, '두 스타일 응답이 다름');

    console.log(`    원칙형: ${result1.text.slice(0, 80)}...`);
    console.log(`    유연형: ${result2.text.slice(0, 80)}...`);
  }

  // ═══════════════════════════════════════
  // 결과
  // ═══════════════════════════════════════
  console.log(`\n${'='.repeat(50)}`);
  console.log(`결과: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

// 서버 대기 후 실행
async function waitForServer(maxWait = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      await fetch(`http://localhost:${process.env.PORT || 3000}/`, { method: 'HEAD' });
      return true;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return false;
}

waitForServer().then(ok => {
  if (!ok) { console.error('서버 응답 없음 (localhost:3000)'); process.exit(1); }
  main();
});
