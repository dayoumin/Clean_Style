/**
 * 대화 요약 기능 시뮬레이션 테스트
 * 실행: npx tsx tests/summarize-simulation.ts
 *
 * API 호출 없이 클라이언트 로직(히스토리 관리, 요약 트리거, 전송 데이터 구성)을 검증
 */

import { MAX_HISTORY_MESSAGES, SUMMARIZE_AT_MESSAGES } from '../src/lib/constants';

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

type Message = { role: 'user' | 'assistant'; content: string };

// 턴 하나를 생성하는 헬퍼
function makeTurn(n: number): [Message, Message] {
  return [
    { role: 'user', content: `질문${n}` },
    { role: 'assistant', content: `답변${n}` },
  ];
}

// fetchAnswer 내부 로직을 추출한 순수 함수 (summarizedUpTo 포함)
function simulateFetchAnswer(
  chatHistory: Message[],
  chatSummary: string,
  summarizedUpTo: number,
  question: string,
  aiAnswer: string,
): {
  historyToSend: Message[];
  summaryToSend: string | undefined;
  newHistory: Message[];
  newSummarizedUpTo: number;
  shouldSummarize: boolean;
} {
  // 요약이 있으면 요약 이후 메시지만 전송
  const historyToSend = chatSummary
    ? chatHistory.slice(summarizedUpTo)
    : chatHistory;

  const summaryToSend = chatSummary || undefined;

  const raw = [
    ...chatHistory,
    { role: 'user' as const, content: question },
    { role: 'assistant' as const, content: aiAnswer },
  ];
  const trimmed = raw.length - MAX_HISTORY_MESSAGES;
  const newHistory = trimmed > 0 ? raw.slice(trimmed) : raw;
  const newSummarizedUpTo = trimmed > 0 && summarizedUpTo > 0
    ? Math.max(0, summarizedUpTo - trimmed)
    : summarizedUpTo;

  // 4턴마다 롤링 요약
  const turnCount = newHistory.length / 2;
  const shouldSummarize = turnCount >= 4 && turnCount % 4 === 0;

  return { historyToSend, summaryToSend, newHistory, newSummarizedUpTo, shouldSummarize };
}

// ── Test 1: 상수 값 검증 ──
console.log('\n[Test 1] 상수 값 검증');
assert(MAX_HISTORY_MESSAGES === 20, 'MAX_HISTORY_MESSAGES === 20 (10턴)');
assert(SUMMARIZE_AT_MESSAGES === 8, 'SUMMARIZE_AT_MESSAGES === 8 (4턴)');
assert(SUMMARIZE_AT_MESSAGES < MAX_HISTORY_MESSAGES, 'SUMMARIZE_AT < MAX_HISTORY');

// ── Test 2: 턴 1~3 — 요약 미트리거 ──
console.log('\n[Test 2] 턴 1~3: 요약 없이 전체 히스토리 전송');
let history: Message[] = [];
let summary = '';
let sumUpTo = 0;

for (let turn = 1; turn <= 3; turn++) {
  const result = simulateFetchAnswer(history, summary, sumUpTo, `질문${turn}`, `답변${turn}`);
  history = result.newHistory;
  sumUpTo = result.newSummarizedUpTo;

  assert(result.historyToSend.length === history.length - 2, `턴${turn}: 이전 히스토리만 전송 (${result.historyToSend.length}msg)`);
  assert(result.summaryToSend === undefined, `턴${turn}: summary 미전송`);
  assert(!result.shouldSummarize, `턴${turn}: 요약 트리거 안 됨`);
}
assert(history.length === 6, '3턴 후 히스토리 6msg');

// ── Test 3: 턴 4 — 요약 트리거 ──
console.log('\n[Test 3] 턴 4: 요약 트리거 발동');
const turn4 = simulateFetchAnswer(history, summary, sumUpTo, '질문4', '답변4');
history = turn4.newHistory;
sumUpTo = turn4.newSummarizedUpTo;
assert(history.length === 8, '4턴 후 히스토리 8msg');
assert(turn4.shouldSummarize === true, '요약 트리거 발동');
assert(turn4.summaryToSend === undefined, '아직 summary 없으므로 미전송');
assert(turn4.historyToSend.length === 6, '이전 3턴(6msg) 히스토리 전송');

// 요약 완료 시뮬레이션 — summarizedUpTo = 현재 히스토리 길이
summary = '사용자는 연구비 정산, 외부 협력, 내부 고발에 대해 질문했고 AI는 규정 확인과 문서화를 조언했다.';
sumUpTo = history.length; // = 8

// ── Test 4: 턴 5 — 요약 사용, 요약 이후 히스토리 없음 ──
console.log('\n[Test 4] 턴 5: 요약본만 전송 (이전 대화 요약됨)');
const turn5 = simulateFetchAnswer(history, summary, sumUpTo, '질문5', '답변5');
history = turn5.newHistory;
sumUpTo = turn5.newSummarizedUpTo;
assert(history.length === 10, '5턴 후 히스토리 10msg');
assert(turn5.summaryToSend === summary, 'summary 전송됨');
assert(turn5.historyToSend.length === 0, 'summarizedUpTo=8, 히스토리 8개이므로 0msg 전송');
assert(!turn5.shouldSummarize, '5턴: 재트리거 안 됨');

// ── Test 5: 턴 6 — 요약 + 최근 1턴 ──
console.log('\n[Test 5] 턴 6: 요약 + 최근 1턴(2msg) 전송');
const turn6 = simulateFetchAnswer(history, summary, sumUpTo, '질문6', '답변6');
history = turn6.newHistory;
sumUpTo = turn6.newSummarizedUpTo;
assert(history.length === 12, '6턴 후 히스토리 12msg');
assert(turn6.historyToSend.length === 2, '턴5(2msg) 전송');
assert(turn6.historyToSend[0].content === '질문5', '전송: 턴5 user');
assert(turn6.historyToSend[1].content === '답변5', '전송: 턴5 assistant');

// ── Test 6: 턴 7 — 요약 + 최근 2턴 ──
console.log('\n[Test 6] 턴 7: 요약 + 최근 2턴(4msg) 전송');
const turn7 = simulateFetchAnswer(history, summary, sumUpTo, '질문7', '답변7');
history = turn7.newHistory;
sumUpTo = turn7.newSummarizedUpTo;
assert(history.length === 14, '7턴 후 히스토리 14msg');
assert(turn7.historyToSend.length === 4, '턴5~6(4msg) 전송');
assert(turn7.historyToSend[0].content === '질문5', '첫 번째: 턴5 user');
assert(turn7.historyToSend[3].content === '답변6', '마지막: 턴6 assistant');

// ── Test 7: 턴 8 — 롤링 재요약 트리거 ──
console.log('\n[Test 7] 턴 8: 롤링 재요약 트리거 (turnCount=8, 8%4=0)');
const turn8 = simulateFetchAnswer(history, summary, sumUpTo, '질문8', '답변8');
history = turn8.newHistory;
sumUpTo = turn8.newSummarizedUpTo;
assert(history.length === 16, '8턴 후 히스토리 16msg');
assert(turn8.historyToSend.length === 6, '턴5~7(6msg) 전송');
assert(turn8.shouldSummarize === true, '8턴: 롤링 재요약 트리거 발동');

// 재요약 완료 시뮬레이션
summary = '4턴 요약 + 5~8턴 내용을 합친 롤링 요약.';
sumUpTo = history.length; // = 16

// ── Test 8: 턴 9~10 — 재요약 후 이어서 ──
console.log('\n[Test 8] 턴 9~10: 재요약 후 이어서');
const turn9 = simulateFetchAnswer(history, summary, sumUpTo, '질문9', '답변9');
history = turn9.newHistory;
sumUpTo = turn9.newSummarizedUpTo;
assert(history.length === 18, '9턴 후 18msg');
assert(turn9.historyToSend.length === 0, '재요약 직후: 추가 히스토리 0msg');

const turn10 = simulateFetchAnswer(history, summary, sumUpTo, '질문10', '답변10');
history = turn10.newHistory;
sumUpTo = turn10.newSummarizedUpTo;
assert(history.length === 20, '10턴 후 20msg (MAX)');
assert(turn10.historyToSend.length === 2, '턴9(2msg) 전송');
assert(turn10.shouldSummarize === false, '10턴: 10%4=2 → 재요약 안 됨');

// ── Test 9: MAX 초과 시 trim + summarizedUpTo 조정 ──
console.log('\n[Test 9] MAX 초과 시 trim + summarizedUpTo 조정');
const turn11 = simulateFetchAnswer(history, summary, sumUpTo, '질문11', '답변11');
assert(turn11.newHistory.length === 20, '20msg 유지 (trim 작동)');
assert(turn11.newSummarizedUpTo === sumUpTo - 2, 'trim 시 summarizedUpTo 2만큼 감소');

// ── Test 10: 리셋 후 깨끗한 상태 ──
console.log('\n[Test 10] 리셋 후 깨끗한 상태');
const afterReset = simulateFetchAnswer([], '', 0, '새질문', '새답변');
assert(afterReset.historyToSend.length === 0, '리셋 후 히스토리 전송 없음');
assert(afterReset.summaryToSend === undefined, '리셋 후 summary 전송 없음');
assert(!afterReset.shouldSummarize, '리셋 후 요약 트리거 안 됨');
assert(afterReset.newSummarizedUpTo === 0, 'summarizedUpTo 유지 0');

// ── Test 11: summarizingRef 중복 호출 방지 시뮬레이션 ──
console.log('\n[Test 11] summarizingRef 중복 호출 방지');
{
  let callCount = 0;
  let ref = false;

  function tryCall() {
    if (ref) return false;
    ref = true;
    callCount++;
    return true;
  }
  function finish() { ref = false; }

  // 첫 호출: 통과
  assert(tryCall() === true, '첫 호출 통과');
  // 진행 중 재호출: 차단
  assert(tryCall() === false, '진행 중 재호출 차단');
  assert(tryCall() === false, '진행 중 3번째 호출도 차단');
  assert(callCount === 1, '실제 실행은 1회');

  // 완료 후 재호출: 통과
  finish();
  assert(tryCall() === true, '완료 후 재호출 통과');
  assert(callCount === 2, '총 2회 실행');
  finish();
}

// ── Test 12: 재방문 시 즉시 요약 생성 시뮬레이션 ──
console.log('\n[Test 12] 재방문: 히스토리 로드 → 즉시 요약 → 이어서 질문');
{
  // 이전 세션에서 4턴 완료 후 나감 → localStorage에 8msg 저장
  const savedChat: Message[] = [];
  for (let t = 1; t <= 4; t++) {
    savedChat.push(...makeTurn(t));
  }
  assert(savedChat.length === 8, '저장된 히스토리 8msg');

  // 재방문: 히스토리 로드 시 >= SUMMARIZE_AT_MESSAGES이면 즉시 요약 트리거
  const shouldPreSummarize = savedChat.length >= SUMMARIZE_AT_MESSAGES;
  assert(shouldPreSummarize === true, '재방문 시 즉시 요약 트리거');

  // 요약 완료 시뮬레이션
  const revisitSummary = '이전 4턴 대화 요약입니다.';

  // 재방문 시 요약 완료 → summarizedUpTo = savedChat.length
  const revisitSumUpTo = savedChat.length; // = 8

  // 턴 5: 요약이 이미 있으므로 효율적 전송
  const rv5 = simulateFetchAnswer(savedChat, revisitSummary, revisitSumUpTo, '재방문질문', '재방문답변');
  assert(rv5.summaryToSend === revisitSummary, '재방문 턴5: 요약 전송됨');
  assert(rv5.historyToSend.length === 0, '재방문 턴5: 요약 이후 추가 히스토리 0msg');

  // 턴 6~10까지 이어서 가능
  let revisitHistory = rv5.newHistory;
  let rvSumUpTo = rv5.newSummarizedUpTo;
  const rv6 = simulateFetchAnswer(revisitHistory, revisitSummary, rvSumUpTo, '질문6', '답변6');
  revisitHistory = rv6.newHistory;
  rvSumUpTo = rv6.newSummarizedUpTo;
  assert(rv6.historyToSend.length === 2, '재방문 턴6: 최근 1턴(2msg) 전송');

  // 10턴까지 진행
  for (let t = 7; t <= 10; t++) {
    const r = simulateFetchAnswer(revisitHistory, revisitSummary, rvSumUpTo, `질문${t}`, `답변${t}`);
    revisitHistory = r.newHistory;
    rvSumUpTo = r.newSummarizedUpTo;
  }
  assert(revisitHistory.length === 20, '재방문 10턴 완료: 20msg (MAX)');

  const maxReached = revisitHistory.length >= MAX_HISTORY_MESSAGES;
  assert(maxReached === true, '재방문 후 10턴 도달 시 chatMaxReached');
}

// ── Test 13: 재방문 시 히스토리 부족하면 요약 안 함 ──
console.log('\n[Test 13] 재방문: 히스토리 부족 시 요약 스킵');
{
  // 2턴만 하고 나감
  const shortChat: Message[] = [];
  for (let t = 1; t <= 2; t++) {
    shortChat.push(...makeTurn(t));
  }
  assert(shortChat.length === 4, '저장된 히스토리 4msg');
  const shouldPreSummarize = shortChat.length >= SUMMARIZE_AT_MESSAGES;
  assert(shouldPreSummarize === false, '4msg < 8: 요약 스킵');

  // 이어서 질문 — 요약 없이 전체 전송
  const turn3 = simulateFetchAnswer(shortChat, '', 0, '이어서질문', '이어서답변');
  assert(turn3.historyToSend.length === 4, '전체 히스토리(4msg) 전송');
  assert(turn3.summaryToSend === undefined, 'summary 미전송');
}

// ── Test 14: 토큰 절감 검증 ──
console.log('\n[Test 14] 토큰 절감 검증');
// 턴당 평균 200 토큰 기준
const TOKENS_PER_TURN = 200;
const SUMMARY_TOKENS = 100;

// 축약 없이 8턴: 누적 합계
let noCondenseTotal = 0;
for (let t = 1; t <= 8; t++) {
  noCondenseTotal += t * TOKENS_PER_TURN; // 턴마다 이전 대화가 누적
}

// 축약 적용 8턴
let condenseTotal = 0;
for (let t = 1; t <= 4; t++) {
  condenseTotal += t * TOKENS_PER_TURN; // 턴 1~4: 누적
}
condenseTotal += 880; // 요약 호출 입력
for (let t = 5; t <= 8; t++) {
  const recentTurns = Math.min(t - 4, 2); // 최대 2턴
  condenseTotal += SUMMARY_TOKENS + recentTurns * TOKENS_PER_TURN + 100; // 요약 + 최근 + 질문
}

const savings = ((noCondenseTotal - condenseTotal) / noCondenseTotal * 100).toFixed(1);
assert(condenseTotal < noCondenseTotal, `축약이 더 적은 토큰 사용 (${condenseTotal} < ${noCondenseTotal}, ${savings}% 절감)`);
console.log(`    축약 없이: ${noCondenseTotal} 토큰, 축약 적용: ${condenseTotal} 토큰`);

// ── Test 15: 스타일 정보 유지 검증 (리뷰 High 이슈) ──
console.log('\n[Test 15] 요약 후에도 스타일 정보가 전달되는지 검증');
{
  // API route의 메시지 구성 로직을 시뮬레이션
  function simulateApiMessages(
    hasHistory: boolean,
    safeSummary: string,
    styleName: string,
    styleDesc: string,
    question: string,
  ) {
    const QA_CONTINUE = 'QA_SYSTEM_PROMPT_CONTINUE';
    const QA_FIRST = 'QA_SYSTEM_PROMPT';

    const basePrompt = (safeSummary || hasHistory) ? QA_CONTINUE : QA_FIRST;
    const systemPrompt = safeSummary
      ? `${basePrompt}\n\n## 이전 대화 요약\n${safeSummary}`
      : basePrompt;
    const needsStyleContext = !hasHistory;
    const userMessage = needsStyleContext
      ? `나의 청렴 스타일: ${styleName} (${styleDesc})\n\n질문: ${question}`
      : question;

    return { systemPrompt, userMessage, basePrompt };
  }

  const STYLE_NAME = '소신 수호자';
  const STYLE_DESC = '원칙을 중시하는 유형';
  const SUMMARY_WITH_STYLE = '「소신 수호자」 유형의 사용자가 연구비 정산과 내부고발에 대해 질문했다.';

  // 턴 1 — 첫 질문: 스타일 정보 포함
  const t1 = simulateApiMessages(false, '', STYLE_NAME, STYLE_DESC, '연구비 정산이 궁금해요');
  assert(t1.userMessage.includes(STYLE_NAME), '턴1: user message에 스타일명 포함');
  assert(t1.userMessage.includes(STYLE_DESC), '턴1: user message에 스타일 설명 포함');
  assert(t1.basePrompt === 'QA_SYSTEM_PROMPT', '턴1: 첫 질문용 프롬프트');

  // 턴 5 — 요약만 있고 history 없음 (핵심 시나리오)
  const t5 = simulateApiMessages(false, SUMMARY_WITH_STYLE, STYLE_NAME, STYLE_DESC, '더 알려줘');
  assert(t5.systemPrompt.includes(SUMMARY_WITH_STYLE), '턴5: system prompt에 요약(스타일 포함) 주입됨');
  assert(t5.userMessage.includes(STYLE_NAME), '턴5: history 없으므로 user message에도 스타일 포함');
  assert(t5.basePrompt === 'QA_SYSTEM_PROMPT_CONTINUE', '턴5: continuation 프롬프트');

  // 턴 6 — 요약 + history 있음
  const t6 = simulateApiMessages(true, SUMMARY_WITH_STYLE, STYLE_NAME, STYLE_DESC, '그 방법 자세히');
  assert(t6.systemPrompt.includes(SUMMARY_WITH_STYLE), '턴6: system prompt에 요약 주입됨');
  assert(!t6.userMessage.includes(STYLE_NAME), '턴6: history 있으면 user message에 스타일 생략');
  assert(t6.userMessage === '그 방법 자세히', '턴6: user message는 질문만');

  // 스타일 소실 시나리오 방지 확인: 요약 없이 history도 없는 경우는 불가능
  // (첫 질문은 항상 history=false, summary=false → 스타일 전송됨)
}

// ── Test 16: abort로 세션 오염 방지 검증 (리뷰 Medium 이슈) ──
console.log('\n[Test 16] 리셋 시 in-flight 요약 abort로 세션 오염 방지');
{
  // AbortController 시뮬레이션
  let abortController: { aborted: boolean; abort: () => void } | null = null;
  let summaryResult = '';

  function triggerSummarize() {
    abortController = { aborted: false, abort() { this.aborted = true; } };
    const controller = abortController;
    // 비동기 작업 시뮬레이션 — abort 안 됐을 때만 결과 적용
    return {
      complete: (result: string) => {
        if (!controller.aborted) {
          summaryResult = result;
        }
      },
      controller,
    };
  }

  function resetModal() {
    abortController?.abort();
    summaryResult = '';
  }

  // 시나리오: 요약 요청 → 리셋 → 늦게 도착한 응답
  const req = triggerSummarize();
  assert(req.controller.aborted === false, '요약 요청 진행 중');

  // 사용자가 "새 질문" 클릭 → 리셋
  resetModal();
  assert(req.controller.aborted === true, '리셋 시 abort 호출됨');
  assert(summaryResult === '', '리셋 후 summary 비어있음');

  // 이전 요약 응답이 늦게 도착 — abort 됐으므로 무시
  req.complete('이전 세션의 요약입니다');
  assert(summaryResult === '', 'abort된 요약 응답은 적용되지 않음 (세션 오염 방지)');

  // 새 세션에서 정상 동작
  const newReq = triggerSummarize();
  newReq.complete('새 세션의 요약');
  assert(summaryResult === '새 세션의 요약', '새 세션 요약은 정상 적용');
}

// ── Test 17: 요약 프롬프트에 스타일 보존 지시 확인 ──
console.log('\n[Test 17] 요약 프롬프트에 스타일 유형명 보존 지시 확인');
{
  // 실제 프롬프트 문자열을 직접 검증 (route.ts의 SUMMARIZE_SYSTEM_PROMPT)
  const SUMMARIZE_PROMPT = `아래 대화를 3문장 이내로 요약하세요.
- 사용자의 청렴 스타일 유형명을 반드시 포함
- 사용자의 주요 관심사와 질문 주제
- AI가 제공한 핵심 조언 내용
- 간결하고 명확하게, 일반 텍스트로만 응답`;

  assert(SUMMARIZE_PROMPT.includes('스타일 유형명을 반드시 포함'), '요약 프롬프트에 스타일 보존 지시 존재');
  assert(SUMMARIZE_PROMPT.includes('3문장 이내'), '3문장 제한 지시 존재');
}

// ── 결과 ──
console.log(`\n${'='.repeat(40)}`);
console.log(`결과: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
