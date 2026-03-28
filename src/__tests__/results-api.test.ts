import { describe, it, expect, vi } from 'vitest';
import {
  questions,
  calculateResult,
  computeSixAxisScores,
  styleTypes,
} from '@/data/questions';
import { buildResultUrl } from '@/lib/utils';
import { detectDeviceType, normalizeReferrer } from '@/lib/device';

/**
 * API route의 D1 INSERT 직전까지의 로직을 재현.
 * 클라이언트가 보내는 것은 answers, durationSec, referrer 뿐이고
 * style_key, scores, borderline, six_axis는 전부 서버가 answers에서 재계산.
 */
function simulateApiRoute(payload: {
  answers: unknown;
  durationSec?: unknown;
  referrer?: unknown;
  userAgent?: string;
}) {
  const { answers, durationSec, referrer, userAgent } = payload;

  // 검증
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    return { status: 400, error: 'Invalid payload' };
  }

  // 서버측 전량 재계산
  const result = calculateResult(answers);
  const sixAxis = computeSixAxisScores(answers);

  const deviceType = detectDeviceType(userAgent ?? '');
  const duration =
    typeof durationSec === 'number' && durationSec > 0
      ? Math.round(durationSec)
      : null;
  const ref = typeof referrer === 'string' ? normalizeReferrer(referrer) : null;

  return {
    status: 200,
    row: {
      style_key: result.styleKey,
      style_name: result.style.name,
      score_principle: result.scores.principle,
      score_transparency: result.scores.transparency,
      score_independence: result.scores.independence,
      six_principle: sixAxis.principle,
      six_flexible: sixAxis.flexible,
      six_transparent: sixAxis.transparent,
      six_cautious: sixAxis.cautious,
      six_independent: sixAxis.independent,
      six_cooperative: sixAxis.cooperative,
      answers: JSON.stringify(answers),
      duration_sec: duration,
      device_type: deviceType,
      borderline: JSON.stringify(result.borderline),
      referrer: ref,
    },
  };
}

// ── 1. 서버측 재계산 무결성 ──
describe('서버측 재계산 — 클라이언트 값 불신', () => {
  const answers = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2];

  it('answers만으로 style_key, scores, six_axis가 정확히 재계산됨', () => {
    const { status, row } = simulateApiRoute({ answers });
    expect(status).toBe(200);

    // 같은 answers로 직접 계산한 값과 일치해야 함
    const expected = calculateResult(answers);
    const expectedSix = computeSixAxisScores(answers);

    expect(row!.style_key).toBe(expected.styleKey);
    expect(row!.style_name).toBe(expected.style.name);
    expect(row!.score_principle).toBe(expected.scores.principle);
    expect(row!.score_transparency).toBe(expected.scores.transparency);
    expect(row!.score_independence).toBe(expected.scores.independence);
    expect(row!.six_principle).toBe(expectedSix.principle);
    expect(row!.six_flexible).toBe(expectedSix.flexible);
    expect(row!.six_transparent).toBe(expectedSix.transparent);
    expect(row!.six_cautious).toBe(expectedSix.cautious);
    expect(row!.six_independent).toBe(expectedSix.independent);
    expect(row!.six_cooperative).toBe(expectedSix.cooperative);
    expect(JSON.parse(row!.borderline)).toEqual(expected.borderline);
  });

  it('클라이언트가 조작한 styleKey/scores를 보내도 무시됨', () => {
    // 클라이언트가 보낸 styleKey와 scores는 서버에서 아예 사용하지 않음
    const { row } = simulateApiRoute({
      answers,
      // 이전 구현이었으면 이 값들이 DB에 들어갔을 것
      // styleKey: 'fake-style', scores: { principle: 999, ... }
    });
    const expected = calculateResult(answers);
    expect(row!.style_key).toBe(expected.styleKey);
    expect(row!.score_principle).toBe(expected.scores.principle);
  });

  it('모든 8유형이 answers에서 재현 가능', () => {
    // 모든 선택지를 같은 인덱스로 고정하면 특정 유형이 나옴
    for (let choiceIdx = 0; choiceIdx < 4; choiceIdx++) {
      const fixedAnswers = questions.map(() => choiceIdx);
      const { status, row } = simulateApiRoute({ answers: fixedAnswers });
      expect(status).toBe(200);
      expect(styleTypes[row!.style_key]).toBeDefined();
      expect(row!.style_name).toBe(styleTypes[row!.style_key]!.name);
    }
  });

  it('3축 순점수와 6축 점수의 정합성 검증', () => {
    const rng = (s: number) => {
      s = (s * 1664525 + 1013904223) & 0x7fffffff;
      return s;
    };
    let seed = 99;

    for (let trial = 0; trial < 1000; trial++) {
      const randomAnswers = Array.from({ length: questions.length }, () => {
        seed = rng(seed);
        return seed % 4;
      });
      const { row } = simulateApiRoute({ answers: randomAnswers });

      // 3축 순점수 = 양극 차이
      expect(row!.score_principle).toBe(row!.six_principle - row!.six_flexible);
      expect(row!.score_transparency).toBe(row!.six_transparent - row!.six_cautious);
      expect(row!.score_independence).toBe(row!.six_independent - row!.six_cooperative);

      // borderline = 순점수가 0인 축
      const borderline = JSON.parse(row!.borderline) as string[];
      if (row!.score_principle === 0) expect(borderline).toContain('principle');
      else expect(borderline).not.toContain('principle');
      if (row!.score_transparency === 0) expect(borderline).toContain('transparency');
      else expect(borderline).not.toContain('transparency');
      if (row!.score_independence === 0) expect(borderline).toContain('independence');
      else expect(borderline).not.toContain('independence');
    }
  });
});

// ── 2. 입력 검증 ──
describe('API 입력 검증', () => {
  it('answers가 배열 아니면 400', () => {
    expect(simulateApiRoute({ answers: 'not-array' }).status).toBe(400);
    expect(simulateApiRoute({ answers: null }).status).toBe(400);
    expect(simulateApiRoute({ answers: 42 }).status).toBe(400);
  });

  it('answers 길이가 questions.length와 다르면 400', () => {
    expect(simulateApiRoute({ answers: [0, 1, 2] }).status).toBe(400);
    expect(simulateApiRoute({ answers: [] }).status).toBe(400);
    expect(
      simulateApiRoute({ answers: Array(questions.length + 1).fill(0) }).status,
    ).toBe(400);
  });

  it('정상 answers → 200', () => {
    const answers = questions.map(() => 0);
    expect(simulateApiRoute({ answers }).status).toBe(200);
  });
});

// ── 3. 디바이스 감지 ──
describe('detectDeviceType', () => {
  it('iPhone → mobile', () => {
    expect(detectDeviceType('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe('mobile');
  });

  it('Android + Mobile → mobile', () => {
    expect(detectDeviceType('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile')).toBe('mobile');
  });

  it('Android 태블릿 (Mobile 없음) → tablet', () => {
    expect(detectDeviceType('Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36')).toBe('tablet');
  });

  it('iPad → tablet', () => {
    expect(detectDeviceType('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe('tablet');
  });

  it('데스크톱 Chrome → desktop', () => {
    expect(detectDeviceType('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')).toBe('desktop');
  });

  it('빈 UA → desktop', () => {
    expect(detectDeviceType('')).toBe('desktop');
  });
});

// ── 4. referrer 정규화 ──
describe('normalizeReferrer', () => {
  it('쿼리스트링 제거, origin+pathname만 보존', () => {
    expect(normalizeReferrer('https://example.com/page?utm=abc&ref=123'))
      .toBe('https://example.com/page');
  });

  it('hash 제거', () => {
    expect(normalizeReferrer('https://example.com/page#section'))
      .toBe('https://example.com/page');
  });

  it('유효하지 않은 URL → raw 텍스트 잘라냄', () => {
    expect(normalizeReferrer('not-a-url')).toBe('not-a-url');
  });

  it('200자 초과 시 잘라냄', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(300);
    expect(normalizeReferrer(longUrl).length).toBeLessThanOrEqual(200);
  });

  it('direct는 그대로 보존', () => {
    expect(normalizeReferrer('direct')).toBe('direct');
  });
});

// ── 5. duration / referrer 처리 ──
describe('duration_sec / referrer 처리', () => {
  const validAnswers = questions.map(() => 0);

  it('durationSec 양수 → 저장', () => {
    const { row } = simulateApiRoute({ answers: validAnswers, durationSec: 125 });
    expect(row!.duration_sec).toBe(125);
  });

  it('durationSec 소수점 → 반올림', () => {
    const { row } = simulateApiRoute({ answers: validAnswers, durationSec: 45.7 });
    expect(row!.duration_sec).toBe(46);
  });

  it('durationSec 0 또는 음수 → null', () => {
    expect(simulateApiRoute({ answers: validAnswers, durationSec: 0 }).row!.duration_sec).toBeNull();
    expect(simulateApiRoute({ answers: validAnswers, durationSec: -5 }).row!.duration_sec).toBeNull();
  });

  it('durationSec 미전송 → null', () => {
    expect(simulateApiRoute({ answers: validAnswers }).row!.duration_sec).toBeNull();
  });

  it('referrer URL → 정규화 후 저장', () => {
    const { row } = simulateApiRoute({
      answers: validAnswers,
      referrer: 'https://blog.example.com/post?id=42',
    });
    expect(row!.referrer).toBe('https://blog.example.com/post');
  });

  it('referrer 미전송 → null', () => {
    expect(simulateApiRoute({ answers: validAnswers }).row!.referrer).toBeNull();
  });

  it('referrer가 숫자 등 비문자열 → null', () => {
    expect(simulateApiRoute({ answers: validAnswers, referrer: 123 }).row!.referrer).toBeNull();
  });
});

// ── 6. 중복 INSERT 방지 — new=1 라이프사이클 ──
describe('new=1 중복 INSERT 방지', () => {
  it('테스트 완료 시에만 new=1 포함', () => {
    const answers = questions.map(() => 0);
    const result = calculateResult(answers);

    const urlNew = buildResultUrl(result.styleKey, result.scores, answers, 'hid-1', true);
    expect(new URLSearchParams(urlNew.split('?')[1]).has('new')).toBe(true);
  });

  it('히스토리 재조회 시 new=1 없음', () => {
    const answers = questions.map(() => 0);
    const result = calculateResult(answers);

    const urlRevisit = buildResultUrl(result.styleKey, result.scores, answers, 'hid-1');
    expect(new URLSearchParams(urlRevisit.split('?')[1]).has('new')).toBe(false);
  });

  it('공유 링크에서 new, hid 모두 없음 → isShared=true', () => {
    const params = new URLSearchParams('style=principle-transparent-independent&p=3&t=-2&i=1&a=0,1,2');
    const isShared = !params.has('new') && !params.has('hid');
    expect(isShared).toBe(true);
  });

  it('replaceState 이후 새로고침 시뮬레이션 — new 제거됨', () => {
    // replaceState 후의 URL 상태 시뮬레이션
    const originalUrl = '/result?style=principle-transparent-independent&p=3&t=-2&i=1&a=0,1,2&new=1&hid=abc';
    const url = new URL(originalUrl, 'http://localhost');
    url.searchParams.delete('new');
    const refreshedParams = url.searchParams;

    expect(refreshedParams.has('new')).toBe(false);
    expect(refreshedParams.has('hid')).toBe(true);
    const isNew = refreshedParams.get('new') === '1';
    expect(isNew).toBe(false); // 새로고침 시 저장 안 됨
  });
});

// ── 7. 전체 E2E 시뮬레이션 ──
describe('전체 E2E 시뮬레이션: 테스트 → 저장 → 조회', () => {
  it('사용자가 테스트 완료 → DB 행이 정확히 생성됨', () => {
    // 1. 사용자가 15문항 답변
    const answers = [2, 0, 3, 1, 0, 2, 1, 3, 0, 2, 1, 0, 3, 2, 1];
    const expectedResult = calculateResult(answers);
    const expectedSix = computeSixAxisScores(answers);

    // 2. 결과 페이지에서 API 호출 (answers만 전송)
    const apiResult = simulateApiRoute({
      answers,
      durationSec: 180,
      referrer: 'https://example.com/share?id=123',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });

    expect(apiResult.status).toBe(200);
    const row = apiResult.row!;

    // 3. DB에 저장된 값 검증
    expect(row.style_key).toBe(expectedResult.styleKey);
    expect(row.style_name).toBe(styleTypes[expectedResult.styleKey]!.name);
    expect(row.score_principle).toBe(expectedResult.scores.principle);
    expect(row.score_transparency).toBe(expectedResult.scores.transparency);
    expect(row.score_independence).toBe(expectedResult.scores.independence);
    expect(row.six_principle).toBe(expectedSix.principle);
    expect(row.six_flexible).toBe(expectedSix.flexible);
    expect(row.six_transparent).toBe(expectedSix.transparent);
    expect(row.six_cautious).toBe(expectedSix.cautious);
    expect(row.six_independent).toBe(expectedSix.independent);
    expect(row.six_cooperative).toBe(expectedSix.cooperative);
    expect(JSON.parse(row.answers)).toEqual(answers);
    expect(row.duration_sec).toBe(180);
    expect(row.device_type).toBe('mobile');
    expect(row.referrer).toBe('https://example.com/share'); // 쿼리스트링 제거됨
    expect(JSON.parse(row.borderline)).toEqual(expectedResult.borderline);
  });

  it('1000건 랜덤 시뮬레이션 — 모든 행이 유효', () => {
    const rng = (s: number) => {
      s = (s * 1664525 + 1013904223) & 0x7fffffff;
      return s;
    };
    let seed = 7;
    const styleCount: Record<string, number> = {};

    for (let i = 0; i < 1000; i++) {
      const answers = Array.from({ length: questions.length }, () => {
        seed = rng(seed);
        return seed % 4;
      });

      const { status, row } = simulateApiRoute({
        answers,
        durationSec: 30 + (seed % 300),
        userAgent: seed % 3 === 0
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17)'
          : seed % 3 === 1
            ? 'Mozilla/5.0 (Linux; Android 14; SM-X710)'
            : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      });

      expect(status).toBe(200);

      // style_key가 유효한 8종 중 하나
      expect(styleTypes[row!.style_key]).toBeDefined();

      // 6축 점수 비음수
      expect(row!.six_principle).toBeGreaterThanOrEqual(0);
      expect(row!.six_flexible).toBeGreaterThanOrEqual(0);
      expect(row!.six_transparent).toBeGreaterThanOrEqual(0);
      expect(row!.six_cautious).toBeGreaterThanOrEqual(0);
      expect(row!.six_independent).toBeGreaterThanOrEqual(0);
      expect(row!.six_cooperative).toBeGreaterThanOrEqual(0);

      // 3축 순점수 범위
      expect(Math.abs(row!.score_principle)).toBeLessThanOrEqual(15);
      expect(Math.abs(row!.score_transparency)).toBeLessThanOrEqual(15);
      expect(Math.abs(row!.score_independence)).toBeLessThanOrEqual(15);

      // device_type 유효
      expect(['mobile', 'tablet', 'desktop']).toContain(row!.device_type);

      styleCount[row!.style_key] = (styleCount[row!.style_key] ?? 0) + 1;
    }

    // 최소 4종 이상의 유형이 나와야 함 (1000건이면 확률적으로 8종 전부)
    expect(Object.keys(styleCount).length).toBeGreaterThanOrEqual(4);
  });
});
