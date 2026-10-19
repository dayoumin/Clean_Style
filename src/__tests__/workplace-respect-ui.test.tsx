import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { getRespectQuestions } from '@/data/workplaceRespectQuestions';
import { createRespectResponse } from '@/diagnostics/workplace-respect/response';

const fixture = vi.hoisted(() => ({ mode: 'check', answers: [] as number[], stored: null as unknown }));
vi.mock('react', async importOriginal => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useState(initial?: unknown) {
    const seeded = fixture.mode === 'result' && initial === undefined ? fixture.stored
      : fixture.mode === 'check' && Array.isArray(initial) && initial.length === 0 ? fixture.answers : initial;
    return actual.useState(seeded);
  } };
});
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('@/data/appVariant', () => ({ AI_CHAT_ENABLED: false }));
import RespectCheckClient from '@/app/(public)/respect/check/RespectCheckClient';
import RespectResultClient from '@/app/(public)/respect/result/RespectResultClient';

function resultMarkup(entry: 'action' | 'experience', value: number, missing = false) {
  fixture.mode = 'result';
  const answers = getRespectQuestions(entry).map(q => q.axis === 'crisisGate' ? 0 : value);
  if (missing) answers[answers.length - 1] = 5;
  fixture.stored = { response: createRespectResponse(entry, answers), answers };
  return renderToStaticMarkup(createElement(RespectResultClient, { entry }));
}

describe('source scores and independent help in rendered UI', () => {
  beforeEach(() => { fixture.mode = 'check'; fixture.answers = []; fixture.stored = null; });
  it('별도 안전 단계를 진행률과 섞지 않고 질문 전에 내용을 예고한다', () => {
    const html = renderToStaticMarkup(createElement(RespectCheckClient, { entry: 'action' }));
    expect(html).toContain('10문항');
    expect(html).toContain('안전·도움 확인 · 점수에 포함하지 않음');
    expect(html).not.toContain('role="progressbar"');
    expect(html).toContain('점검을 마치기 전 상담·도움 안내');
    expect(html).toContain('신체 안전을 확인하는 질문');
    expect(html.indexOf('신체 안전을 확인하는 질문')).toBeLessThan(html.indexOf(getRespectQuestions('action')[0].prompt));
    expect(html).not.toContain('마음건강');
    const experienceHtml = renderToStaticMarkup(createElement(RespectCheckClient, { entry: 'experience' }));
    expect(experienceHtml).toContain('마음건강 질문에는 스스로를 해칠 생각이 있는지');
    expect(experienceHtml.indexOf('스스로를 해칠 생각')).toBeLessThan(experienceHtml.indexOf(getRespectQuestions('experience')[0].prompt));
  });
  it('행동 원문 첫 문항·5개 원표 응답과 별도 모름·건너뛰기를 표시한다', () => {
    fixture.answers = [0];
    const html = renderToStaticMarkup(createElement(RespectCheckClient, { entry: 'action' }));
    expect(html).toContain('aria-valuemax="10"');
    expect(html).toContain('업무지시를 할 때 화를 내거나 욕을 한 적이 있다.');
    expect(html).toContain('전혀 아니다');
    expect(html).toContain('매우 그렇다');
    expect(html).toContain('답변하지 않고 건너뛰기');
    expect(html).toContain('모름·건너뛰기는 0점으로 계산하지 않으며, 하나라도 있으면 전체 합계를 표시하지 않습니다.');
    expect(html).toContain('유효 응답 수와 상담 안내는 볼 수 있습니다.');
    expect(html).not.toContain('아래 별도 버튼');
    expect(html.indexOf('응답 기준')).toBeGreaterThan(html.indexOf(getRespectQuestions('action')[1].prompt));
    expect(html.indexOf('응답 기준')).toBeLessThan(html.indexOf('전혀 아니다'));
    expect(html).not.toContain('최근 6개월');
  });
  it('경험 첫 문항은 25개 진행률·선택 도움말·최근 6개월을 표시한다', () => {
    fixture.answers = [0,0];
    const html = renderToStaticMarkup(createElement(RespectCheckClient, { entry: 'experience' }));
    expect(html).toContain('aria-valuemax="25"');
    expect(html).toContain('문항 이해 도움말(자체 작성) · 선택');
    expect(html).toContain('최근 6개월');
    expect(html.indexOf('다음은 최근 6개월')).toBeGreaterThan(html.indexOf(getRespectQuestions('experience')[2].prompt));
    expect(html.indexOf('다음은 최근 6개월')).toBeLessThan(html.indexOf('문항 이해 도움말'));
    expect(html.indexOf('다음은 최근 6개월')).toBeLessThan(html.indexOf('전혀 없음'));
    expect(html).toContain('6개월에 1-2회');
    expect(html).toContain('href="tel:112"');
    expect(html).toContain('모름·건너뛰기가 하나라도 있으면 전체 합계를 표시하지 않습니다.');
    expect(html).toContain('사업장 조직문화 진단용 설문에서 경험 25문항을 발췌해 개인 자가점검에 활용');
  });
  it('행동 40점에는 출처를 붙인 원표 구간을 표시한다', () => {
    const html = resultMarkup('action',4);
    expect(html).toContain('40점 / 40점 범위');
    expect(html).toContain('2019년 원표 기준 구간: 갑질 발생 가능성이 매우 높다.');
    expect(html).not.toContain('결과 수준');
  });
  it('경험 최대 점수에도 위험 배지를 붙이지 않고 별도 도움을 유지한다', () => {
    const html = resultMarkup('experience',4);
    expect(html).toContain('100점 / 100점 범위');
    expect(html).toContain('일터 경험 빈도 합계(시험용)');
    expect(html).toContain('사업장 조직문화 진단용 설문에서 경험 25문항을 발췌해 개인 자가점검에 활용');
    expect(html).toContain('위험 등급 기준은 아직 정하지 않았습니다.');
    expect(html).not.toContain('2019년 원표 기준 구간');
    expect(html).not.toContain('결과 수준');
    expect(html).toContain('href="tel:112"');
    expect(html).toContain('답변한 경험 살펴보기');
  });
  it('모름이 있으면 점수 대신 미산출과 유효 응답 수·상담 안내를 표시한다', () => {
    const html = resultMarkup('experience',0,true);
    expect(html).toContain('전체 합계 미산출');
    expect(html).toContain('유효 응답 24 / 25개');
    expect(html).not.toContain('0점 / 100점');
    expect(html).toContain('상담');
    expect(html).not.toContain('답변한 경험 살펴보기');
  });
});
