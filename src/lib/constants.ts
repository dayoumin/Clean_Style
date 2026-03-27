// 이어서 질문 시 유지할 최대 대화 메시지 수 (10턴 = user+assistant 20개)
export const MAX_HISTORY_MESSAGES = 20;

// 대화 요약 트리거 시점 (4턴 = user+assistant 8개)
export const SUMMARIZE_AT_MESSAGES = 8;

// history 메시지 1건당 최대 허용 길이
export const MAX_CONTENT_LENGTH = 2000;

// 사용자 질문 입력 최대 글자 수
export const MAX_QUESTION_LENGTH = 500;

// sessionStorage 키 — 분석용 메타데이터
export const TEST_START_TIME_KEY = 'integrity-test-start';
export const TEST_REFERRER_KEY = 'integrity-test-referrer';
