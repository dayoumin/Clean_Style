// 한 대화의 최대 질문·답변 20회 (user+assistant 40개). 도달 후 사용자가 새 대화를 시작.
export const MAX_HISTORY_MESSAGES = 40;

// 일터 존중 점검 AI 조언은 상황 정리가 길어질 수 있어 조금 더 긴 맥락을 유지
export const RESPECT_MAX_HISTORY_MESSAGES = 32;

// 요약의 최소 메시지 수 (4회 = user+assistant 8개). 실제 요약은 추가 길이 조건 충족 시에만.
export const SUMMARIZE_AT_MESSAGES = 8;

// history 메시지 1건당 최대 허용 길이
export const MAX_CONTENT_LENGTH = 2000;

// 사용자 질문 입력 최대 글자 수
export const MAX_QUESTION_LENGTH = 500;

// 간단한 상담 채팅 기준 요청 상한. 대화 기록은 최근 메시지부터 이 글자 수까지만 보낸다.
export const MAX_CHAT_HISTORY_CHARS = 12_000;
// 요청 본문 상한 (기록 12,000자 + 요약 + 질문을 한글 UTF-8로 담고도 남는 크기)
export const MAX_CHAT_REQUEST_BYTES = 64 * 1024;

// 익명 브라우저 식별자 — rate limit 분산용 가명 운영 식별자
export const CLIENT_ID_STORAGE_KEY = 'integrity-client-id';
export const CLIENT_ID_HEADER = 'x-clean-style-client-id';

// sessionStorage 키 — 분석용 메타데이터
export const TEST_START_TIME_KEY = 'integrity-test-start';
export const TEST_REFERRER_KEY = 'integrity-test-referrer';
