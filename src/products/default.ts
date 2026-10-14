import type { ProductDefinition } from './types';

export const defaultProduct: ProductDefinition = {
  id: 'clean-style',
  variant: 'default',
  audience: 'adult',
  // 일터 존중 점검은 홈 오른쪽 위 아이콘으로 들어가는 개인용 점검이다(결과는 브라우저에만 저장).
  diagnostics: ['adult-integrity', 'workplace-respect'],
  primaryDiagnosticId: 'adult-integrity',
  features: {
    aiChat: true,
    workplaceRespect: true,
    adultResultHistory: true,
  },
  copy: {
    title: '청렴 스타일 테스트',
    shortTitle: '청렴스타일',
    description: '재미로 알아보는 청렴 스타일 자기발견 테스트. 15개 상황, 3분이면 나의 업무 스타일을 알 수 있어요.',
    homePrompt: '잠깐 체크해 볼까요?',
    primaryDiagnosticTitle: '청렴 스타일 진단',
    primaryDiagnosticDescription: '나의 청렴 성향 파악하기',
  },
};
