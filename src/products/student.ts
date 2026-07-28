import type { ProductDefinition } from './types';

export const studentProduct: ProductDefinition = {
  id: 'clean-style-student',
  variant: 'student',
  audience: 'student',
  diagnostics: ['student-integrity'],
  primaryDiagnosticId: 'student-integrity',
  features: {
    aiChat: false,
    workplaceRespect: false,
    adultResultHistory: false,
  },
  copy: {
    title: '청소년 청렴 교육',
    shortTitle: '청렴교육',
    description: '학교생활 상황에서 선택과 판단 이유를 돌아보는 청소년 청렴 교육입니다.',
    homePrompt: '상황으로 배워 볼까요?',
    primaryDiagnosticTitle: '청소년 청렴 진단',
    primaryDiagnosticDescription: '학생용 진단을 준비하고 있어요',
  },
};
