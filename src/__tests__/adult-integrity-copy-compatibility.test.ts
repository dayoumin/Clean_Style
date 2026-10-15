import { describe, expect, it } from 'vitest';
import { calculateResult, questions, styleTypes } from '@/data/questions';

// 문구 수정 전 원본 배열 순서의 [principle, transparency, independence].
// 표시 순서는 섞이더라도 저장된 답안 인덱스의 점수는 바뀌면 안 된다.
const originalScores = [
  [[1, -1, 1], [0, 1, -1], [-1, -1, 1], [0, 1, -1]],
  [[1, 0, 0], [0, -1, 1], [-1, 0, 0], [0, 0, -1]],
  [[1, 0, 0], [-1, 0, 1], [0, 1, -1], [0, -1, -1]],
  [[0, 1, 0], [-1, -1, 0], [0, -1, -1], [-1, -1, 1]],
  [[1, 0, 1], [0, 1, -1], [-1, -1, 1], [0, 0, -1]],
  [[1, 0, 0], [-1, 0, 1], [0, -1, -1], [0, 1, 0]],
  [[1, 0, 1], [0, 1, -1], [-1, -1, 1], [0, 0, -1]],
  [[1, 0, 0], [-1, 0, 1], [0, -1, -1], [0, 1, 0]],
  [[1, 0, 1], [1, -1, 0], [-1, 0, 0], [1, 1, -1]],
  [[1, 0, 0], [-1, 0, 1], [1, -1, 0], [-1, 0, -1]],
  [[1, 0, 1], [-1, 0, 1], [1, 1, -1], [-1, 1, 0]],
  [[1, -1, 1], [0, 1, -1], [-1, -1, 0], [1, 1, 0]],
  [[1, 0, 1], [-1, 0, 0], [-1, 1, 0], [1, 1, -1]],
  [[1, 1, 1], [-1, -1, 0], [0, 1, -1], [0, 1, 0]],
  [[1, 0, 1], [-1, 0, 1], [-1, 0, -1], [1, -1, 1]],
];

describe('성인 청렴 문구 수정의 기존 답안 호환성', () => {
  it('15문항 ID·영역·60개 선택지 점수가 원본 순서와 같다', () => {
    expect(questions.map(q => q.id)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    expect(questions.map(q => q.category)).toEqual([
      ...Array(5).fill('research'), ...Array(5).fill('admin'), ...Array(5).fill('relation'),
    ]);
    expect(questions.map(q => q.choices.map(({ scores }) => [
      scores.principle ?? 0, scores.transparency ?? 0, scores.independence ?? 0,
    ]))).toEqual(originalScores);
  });

  it('8유형 ID·이름·축 조합과 승인된 표시 상징이 유지된다', () => {
    expect(Object.entries(styleTypes).map(([key, s]) => [key, s.id, s.name, s.subtitle, s.emoji])).toEqual([
      ['principle-transparent-independent', 'principle-transparent-independent', '소신 수호자', '원칙-투명-독립', '🛡️'],
      ['principle-transparent-cooperative', 'principle-transparent-cooperative', '정의의 조율자', '원칙-투명-협력', '⚖️'],
      ['principle-cautious-independent', 'principle-cautious-independent', '묵묵한 파수꾼', '원칙-신중-독립', '🏔️'],
      ['principle-cautious-cooperative', 'principle-cautious-cooperative', '신중한 중재자', '원칙-신중-협력', '🤝'],
      // 2026-10-15 사용자 요청으로 이 유형의 로켓만 나침반으로 교체했다.
      ['flexible-transparent-independent', 'flexible-transparent-independent', '실용주의 개척자', '유연-투명-독립', '🧭'],
      ['flexible-transparent-cooperative', 'flexible-transparent-cooperative', '열린 소통가', '유연-투명-협력', '💬'],
      ['flexible-cautious-independent', 'flexible-cautious-independent', '전략적 해결사', '유연-신중-독립', '🎯'],
      ['flexible-cautious-cooperative', 'flexible-cautious-cooperative', '온건한 조정자', '유연-신중-협력', '🕊️'],
    ]);
  });

  it('실제 15문항의 세 축 동점 답안도 기존 대표 유형과 동점 표시를 유지한다', () => {
    const answers = [0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 1, 1, 2, 1, 2];
    const result = calculateResult(answers);
    expect(result.scores).toEqual({ principle: 0, transparency: 0, independence: 0 });
    expect(result.styleKey).toBe('principle-transparent-independent');
    expect(result.style.name).toBe('소신 수호자');
    expect(result.borderline).toEqual(['principle', 'transparency', 'independence']);
    expect(result.answers).toEqual(answers);
  });
});
