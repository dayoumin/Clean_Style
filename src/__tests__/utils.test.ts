import { describe, it, expect } from 'vitest';
import { buildResultUrl } from '@/lib/utils';
describe('buildResultUrl', () => {
  const scores = { principle: 3, transparency: -2, independence: 1 };
  const answers = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2];

  it('historyId 있으면 hid 포함', () => {
    const url = buildResultUrl('principle-transparent-independent', scores, answers, 'abc-123');
    expect(url).toContain('hid=abc-123');
    expect(url).toContain('style=principle-transparent-independent');
  });

  it('isNew=true면 new=1 포함, 기본값은 없음', () => {
    const url = buildResultUrl('principle-transparent-independent', scores, answers, undefined, true);
    expect(url).toContain('new=1');
    const urlDefault = buildResultUrl('principle-transparent-independent', scores, answers);
    expect(urlDefault).not.toContain('new=');
  });

  it('historyId 없으면 hid 없음', () => {
    const url = buildResultUrl('principle-transparent-independent', scores, answers);
    expect(url).not.toContain('hid=');
  });

  it('scores가 URL 파라미터에 포함', () => {
    const url = buildResultUrl('flexible-cautious-cooperative', scores, answers);
    expect(url).toContain('p=3');
    expect(url).toContain('t=-2');
    expect(url).toContain('i=1');
  });

  it('answers가 콤마 구분으로 포함', () => {
    const url = buildResultUrl('flexible-cautious-cooperative', scores, [0, 1, 2]);
    expect(url).toContain('a=0%2C1%2C2');
  });

  it('/result? 경로로 시작', () => {
    const url = buildResultUrl('principle-transparent-independent', scores, answers);
    expect(url).toMatch(/^\/result\?/);
  });
});
