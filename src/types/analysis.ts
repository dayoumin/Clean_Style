// AI 분석 결과 구조 (API + 클라이언트 공유)
export interface AnalysisResult {
  styleSummary: string;
  strengths: string[];
  cautions: string[];
  tips: {
    research: string;
    admin: string;
    relation: string;
  };
  message: string;
}

// AnalysisResult 런타임 검증
export function isValidAnalysisResult(obj: unknown): obj is AnalysisResult {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.styleSummary === 'string' &&
    Array.isArray(o.strengths) &&
    Array.isArray(o.cautions) &&
    typeof o.tips === 'object' && o.tips !== null &&
    typeof (o.tips as Record<string, unknown>).research === 'string' &&
    typeof (o.tips as Record<string, unknown>).admin === 'string' &&
    typeof (o.tips as Record<string, unknown>).relation === 'string' &&
    typeof o.message === 'string'
  );
}
