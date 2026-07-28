export const APP_VARIANT = process.env.NEXT_PUBLIC_APP_VARIANT ?? 'default';
export const AI_CHAT_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AI_CHAT !== '0';
export const IS_STUDENT_VARIANT = APP_VARIANT === 'student';
export const RESPECT_PILOT_ENABLED = process.env.NEXT_PUBLIC_ENABLE_RESPECT_PILOT !== '0';

export const APP_COPY = IS_STUDENT_VARIANT
  ? {
      title: '청소년 청렴 교육',
      shortTitle: '청렴교육',
      description: '상황형 질문으로 올바른 선택과 책임 있는 태도를 점검합니다.',
      homePrompt: '상황으로 배워 볼까요?',
      primaryDiagnosticTitle: '청소년 청렴 진단',
      primaryDiagnosticDescription: '나의 선택 습관 돌아보기',
    }
  : RESPECT_PILOT_ENABLED
    ? {
      title: '청렴·존중 셀프 점검',
      shortTitle: '청렴·존중',
      description: '청렴 스타일 진단과 일터 존중 점검을 통해 업무 상황을 기준으로 필요한 조언과 도움 경로를 확인합니다.',
      homePrompt: '잠깐 체크해 볼까요?',
      primaryDiagnosticTitle: '청렴 스타일 진단',
      primaryDiagnosticDescription: '나의 청렴 성향 파악하기',
    }
    : {
      title: '청렴 스타일 테스트',
      shortTitle: '청렴스타일',
      description: '재미로 알아보는 청렴 스타일 자기발견 테스트. 15개 상황, 3분이면 나의 업무 스타일을 알 수 있어요.',
      homePrompt: '잠깐 체크해 볼까요?',
      primaryDiagnosticTitle: '청렴 스타일 진단',
      primaryDiagnosticDescription: '나의 청렴 성향 파악하기',
    };
