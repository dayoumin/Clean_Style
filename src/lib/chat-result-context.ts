import type { StyleType } from '@/diagnostics/adult-integrity';

type Scores = { principle: number; transparency: number; independence: number };

// Preserve only tentative response directions, not unvalidated strength/deficit prescriptions.
export function buildChatResultContext(style: StyleType, scores: Scores | null, explainResult = false): string {
  const direction = (value: number, positive: string, negative: string) => value === 0
    ? `${positive}↔${negative}: 우세 방향 미확정(균형)`
    : `${positive}↔${negative}: 이번 응답은 ${value > 0 ? positive : negative} 쪽`;
  const profile = scores ? [
    direction(scores.principle, '원칙', '유연'),
    direction(scores.transparency, '투명', '신중'),
    direction(scores.independence, '독립', '협력'),
  ].join('\n') : `응답 프로파일 후보: ${style.subtitle} (축별 점수 미제공, 우세 정도와 안정성은 알 수 없음)`;

  return `\n\n## 테스트 응답 프로파일 (약한 참고 자료)
${explainResult ? `이번 응답에 가까운 설명용 이름: ${style.name}\n설명용 문구: ${style.description}\n` : ''}${profile}
이 정보는 검증된 성격 진단이나 사용자 약점의 증거가 아닙니다. 규준·성향 강도·개인별 조언 효과를 뜻하지 않습니다.
사용자가 말한 현재 상황·어려움·제약·선호를 우선하세요. 그 설명과 다르거나 관련성이 없으면 이 참고 정보는 사용하지 마세요.
유형별 약점 보완 행동을 자동으로 권하지 마세요. 충분한 상황 정보만으로 답할 수 있으면 스타일을 사용하지 않아도 됩니다.
유형 설명을 직접 요청한 경우 외에는 유형명·특성 소개를 자동으로 출력하지 마세요.`;
}
