import type { ProductDefinition } from './types';

export const plusProduct: ProductDefinition = {
  id: 'clean-style-plus',
  variant: 'plus',
  audience: 'adult',
  diagnostics: ['adult-integrity', 'workplace-respect'],
  primaryDiagnosticId: 'adult-integrity',
  features: {
    aiChat: true,
    workplaceRespect: true,
    adultResultHistory: true,
  },
  copy: {
    title: '청렴·존중 셀프 점검',
    shortTitle: '청렴·존중',
    description: '청렴 스타일 진단과 일터 존중 점검을 통해 업무 상황을 기준으로 필요한 조언과 도움 경로를 확인합니다.',
    homePrompt: '잠깐 체크해 볼까요?',
    primaryDiagnosticTitle: '청렴 스타일 진단',
    primaryDiagnosticDescription: '나의 청렴 성향 파악하기',
  },
};
