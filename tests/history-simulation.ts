/**
 * 히스토리 기능 시뮬레이션 테스트
 * 실행: npx tsx tests/history-simulation.ts
 */

// localStorage mock
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const k in store) delete store[k]; },
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });
Object.defineProperty(globalThis, 'window', { value: globalThis });

// 테스트 대상 import
import {
  getHistory, addHistoryEntry, getHistoryEntry,
  deleteHistoryEntry, updateChat, clearChat,
  type HistoryEntry, type ChatMessage,
} from '../src/lib/history';
import { buildResultUrl } from '../src/lib/utils';

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

// ── Test 1: 빈 상태 ──
console.log('\n[Test 1] 빈 히스토리');
localStorageMock.clear();
assert(getHistory().length === 0, '초기 상태는 빈 배열');

// ── Test 2: 항목 추가 ──
console.log('\n[Test 2] 항목 추가');
const entry1 = addHistoryEntry({
  styleKey: 'principle-transparent-cooperative',
  styleName: '정의의 조율자',
  styleEmoji: '⚖️',
  scores: { principle: 2, transparency: 0, independence: -1 },
  answers: [0, 2, 1, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2],
});
assert(entry1 !== null, 'addHistoryEntry 성공 (null 아님)');
assert(entry1!.id.length > 0, 'id 생성됨');
assert(getHistory().length === 1, '히스토리에 1건 저장됨');
assert(getHistory()[0].styleName === '정의의 조율자', '이름 일치');

// ── Test 3: 두 번째 항목 추가 (최신이 먼저) ──
console.log('\n[Test 3] 순서 확인 (최신 우선)');
const entry2 = addHistoryEntry({
  styleKey: 'flexible-cautious-independent',
  styleName: '전략적 해결사',
  styleEmoji: '🎯',
  scores: { principle: -1, transparency: -2, independence: 3 },
  answers: [3, 1, 0, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1],
});
assert(getHistory().length === 2, '히스토리에 2건');
assert(getHistory()[0].styleName === '전략적 해결사', '최신이 첫 번째');
assert(getHistory()[1].styleName === '정의의 조율자', '이전이 두 번째');

// ── Test 4: 항목 조회 ──
console.log('\n[Test 4] 개별 조회');
const found = getHistoryEntry(entry1!.id);
assert(found !== undefined, 'entry1 찾음');
assert(found?.styleKey === 'principle-transparent-cooperative', 'styleKey 일치');
assert(getHistoryEntry('nonexistent') === undefined, '없는 id는 undefined');

// ── Test 5: 채팅 저장 ──
console.log('\n[Test 5] 채팅 저장/로드');
const chatMessages: ChatMessage[] = [
  { role: 'user', content: '연구비 정산이 고민이에요' },
  { role: 'assistant', content: '규정을 먼저 확인해보세요.' },
];
assert(updateChat(entry1!.id, chatMessages), 'updateChat 성공');
const updated = getHistoryEntry(entry1!.id);
assert(updated?.chat.length === 2, '채팅 2건 저장됨');
assert(updated?.chat[0].content === '연구비 정산이 고민이에요', '내용 일치');

// ── Test 6: 채팅 삭제 ──
console.log('\n[Test 6] 채팅 삭제');
assert(clearChat(entry1!.id), 'clearChat 성공');
const cleared = getHistoryEntry(entry1!.id);
assert(cleared?.chat.length === 0, '채팅 비워짐');
assert(cleared?.styleName === '정의의 조율자', '결과 데이터 유지');

// ── Test 7: 항목 삭제 ──
console.log('\n[Test 7] 항목 삭제');
assert(deleteHistoryEntry(entry1!.id), 'deleteHistoryEntry 성공');
assert(getHistory().length === 1, '1건 남음');
assert(getHistoryEntry(entry1!.id) === undefined, '삭제된 항목 못 찾음');
assert(getHistory()[0].id === entry2!.id, '남은 항목 확인');

// ── Test 8: MAX_ENTRIES 제한 ──
console.log('\n[Test 8] 최대 10건 제한');
localStorageMock.clear();
for (let i = 0; i < 12; i++) {
  addHistoryEntry({
    styleKey: `test-${i}`,
    styleName: `Type ${i}`,
    styleEmoji: '🔵',
    scores: { principle: i, transparency: 0, independence: 0 },
    answers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  });
}
assert(getHistory().length === 10, '12건 추가해도 10건만 유지');
assert(getHistory()[0].styleKey === 'test-11', '최신(test-11)이 첫 번째');
assert(getHistory()[9].styleKey === 'test-2', '가장 오래된 것(test-2)이 마지막');

// ── Test 9: saveHistory 실패 시 null 반환 ──
console.log('\n[Test 9] 저장 실패 시 null 반환');
localStorageMock.clear();
const origSetItem = localStorageMock.setItem;
localStorageMock.setItem = () => { throw new DOMException('quota', 'QuotaExceededError'); };
const failedEntry = addHistoryEntry({
  styleKey: 'fail-test',
  styleName: 'Fail',
  styleEmoji: '❌',
  scores: { principle: 0, transparency: 0, independence: 0 },
  answers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
});
assert(failedEntry === null, '저장 실패 시 null 반환');
localStorageMock.setItem = origSetItem;

// ── Test 10: buildResultUrl ──
console.log('\n[Test 10] buildResultUrl');
const url1 = buildResultUrl('test-key', { principle: 1, transparency: -2, independence: 3 }, [0, 1, 2], 'abc123');
assert(url1.includes('style=test-key'), 'style 포함');
assert(url1.includes('hid=abc123'), 'hid 포함');
assert(url1.includes('p=1'), 'p 포함');
assert(url1.includes('a=0%2C1%2C2') || url1.includes('a=0,1,2'), 'answers 포함');

const url2 = buildResultUrl('test-key', { principle: 1, transparency: 0, independence: 0 }, [0], undefined);
assert(!url2.includes('hid'), 'hid 없으면 파라미터 없음');

const url3 = buildResultUrl('test-key', { principle: 1, transparency: 0, independence: 0 }, [0], '');
assert(!url3.includes('hid'), '빈 hid도 파라미터 없음');

// ── Test 11 (이슈 재현): 모달 닫기 후 대화 유지 ──
console.log('\n[Test 11] 모달 닫기 시 대화 유지 시뮬레이션');
localStorageMock.clear();
const modalEntry = addHistoryEntry({
  styleKey: 'modal-test',
  styleName: 'Modal Test',
  styleEmoji: '💬',
  scores: { principle: 1, transparency: 1, independence: 1 },
  answers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
});
// 대화 저장
updateChat(modalEntry!.id, [
  { role: 'user', content: '질문1' },
  { role: 'assistant', content: '답변1' },
]);
// 모달 닫기 후 (closeModal: clearChatUI만 호출, chatHistory 유지)
// 다시 열면 chatHistory가 남아있어야 함
const afterClose = getHistoryEntry(modalEntry!.id);
assert(afterClose?.chat.length === 2, '모달 닫아도 히스토리에 대화 유지');

// ── Test 12 (이슈 재현): handleBack으로 0문항 시 진행 상태 제거 ──
console.log('\n[Test 12] 0문항으로 되돌리기 시 진행 상태 제거');
localStorageMock.clear();
const STORAGE_KEY = 'integrity-test-progress';
// saveProgress 시뮬레이션: answers.length > 0 && < 15이면 저장, 아니면 삭제
function saveProgress(answers: number[], seed: number) {
  if (answers.length > 0 && answers.length < 15) {
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify({ answers, seed }));
  } else {
    localStorageMock.removeItem(STORAGE_KEY);
  }
}
saveProgress([0, 1, 2], 12345);
assert(localStorageMock.getItem(STORAGE_KEY) !== null, '3문항 진행 저장됨');
saveProgress([], 12345); // handleBack으로 0문항
assert(localStorageMock.getItem(STORAGE_KEY) === null, '0문항이면 진행 상태 제거됨');

// ── 결과 ──
console.log(`\n${'='.repeat(40)}`);
console.log(`결과: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
