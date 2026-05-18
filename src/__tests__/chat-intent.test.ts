import { describe, expect, it } from 'vitest';
import { classifyChatIntent, getChatResponseMode } from '@/lib/chat-intent';

describe('chat intent routing', () => {
  it('도우미 이름/역할 질문은 중립 응답으로 처리', () => {
    expect(classifyChatIntent('너의 이름은 뭐니?')).toBe('assistant-meta');
    expect(getChatResponseMode('너의 이름은 뭐니?', false)).toBe('neutral');
  });

  it('본인 청렴 스타일 질문은 유형 정보 응답으로 처리', () => {
    expect(classifyChatIntent('내 청렴 스타일이 뭐야?')).toBe('style-info');
    expect(getChatResponseMode('내 청렴 스타일이 뭐야?', false)).toBe('style-info');
  });

  it('청렴 업무 상황은 첫 턴부터 조언 응답으로 처리', () => {
    expect(classifyChatIntent('연구비로 구매한 노트북을 집에 가져가도 되나요?')).toBe('integrity-advice');
    expect(getChatResponseMode('연구비로 구매한 노트북을 집에 가져가도 되나요?', false)).toBe('advice');
  });

  it('질문형이 아니어도 청렴 맥락이 있으면 조언 응답으로 처리', () => {
    expect(classifyChatIntent('출장비 정산이 애매해요')).toBe('integrity-advice');
    expect(getChatResponseMode('출장비 정산이 애매해요', false)).toBe('advice');
  });

  it('이전 상담이 있는 후속 질문은 조언 응답을 유지', () => {
    expect(classifyChatIntent('그러면 주말에만 잠깐 쓰는 건요?')).toBe('follow-up');
    expect(getChatResponseMode('그러면 주말에만 잠깐 쓰는 건요?', true)).toBe('advice');
    expect(getChatResponseMode('그러면 주말에만 잠깐 쓰는 건요?', false)).toBe('neutral');
  });

  it('인사와 불명확한 입력은 스타일을 쓰지 않는 중립 응답으로 처리', () => {
    expect(getChatResponseMode('안녕하세요', false)).toBe('neutral');
    expect(getChatResponseMode('테스트', false)).toBe('neutral');
  });
});
