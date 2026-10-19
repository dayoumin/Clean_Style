import type { RespectResult } from './types';

export const respectHelpCalls = {
  help: { href: 'tel:109', number: '109', label: '자살예방상담', sheetPrompt: '사람과 바로 이야기하고 싶다면' },
  police: { href: 'tel:112', number: '112', label: '긴급신고', sheetPrompt: '지금 폭력·위협 위험이 있다면' },
  rescue: { href: 'tel:119', number: '119', label: '구조·응급', sheetPrompt: '상해나 즉각 실행 위험으로 응급 도움이 필요하면' },
};

// This orders help already requested by the response; it does not assess clinical risk.
export function getRespectHelpCalls(result: Pick<RespectResult, 'entry' | 'crisis' | 'crisisKinds' | 'safetyUncertain' | 'support'>) {
  const { help, police, rescue } = respectHelpCalls;
  if (result.crisis) return result.crisisKinds.includes('selfHarm') ? [rescue, police, help] : [police, rescue];
  if (result.safetyUncertain) return result.support ? [police, rescue, help] : [police, rescue];
  return result.support ? [help, rescue, police] : [];
}
