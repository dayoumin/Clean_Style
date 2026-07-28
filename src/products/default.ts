import type { ProductDefinition } from './types';

export const defaultProduct: ProductDefinition = {
  id: 'clean-style',
  variant: 'default',
  audience: 'adult',
  diagnostics: ['adult-integrity'],
  primaryDiagnosticId: 'adult-integrity',
  features: {
    aiChat: true,
    workplaceRespect: false,
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
