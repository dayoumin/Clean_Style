import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/ai';
import { styleTypes, questions } from '@/data/questions';
import { isValidAnalysisResult } from '@/types/analysis';
import type { AnalysisResult } from '@/types/analysis';

// System 프롬프트 (상수 — 매 요청마다 재생성 방지)
const SYSTEM_PROMPT = `당신은 공공 연구기관 종사자를 위한 청렴 스타일 분석 전문가입니다.

## 역할
- 따뜻하고 실용적인 피드백 제공
- 평가가 아닌 "자기발견" 관점
- 부드럽고 격려하는 톤 (비난/판정 절대 금지)
- 선택에 대한 옳고 그름 판단 금지

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.

{
  "styleSummary": "유형을 2~3문장으로 자연스럽게 설명",
  "strengths": ["강점1 (1~2문장)", "강점2", "강점3"],
  "cautions": ["주의 포인트1 (부드러운 조언)", "포인트2", "포인트3"],
  "tips": {
    "research": "연구비·데이터 관련 구체적 팁",
    "admin": "구매·계약 관련 구체적 팁",
    "relation": "외부 협력·소통 관련 구체적 팁"
  },
  "message": "격려와 동기부여 메시지 1~2문장"
}

## 작성 원칙
- 공공 연구기관의 실제 업무 맥락(연구비 집행, 물품 구매, 용역 계약, 생명자원/LMO, 외부 협력)에 기반
- 강점은 업무 상황과 연결된 구체적 예시로 서술
- 주의 포인트는 "~하면 좋겠어요", "~해보는 것도 방법이에요" 형태
- 팁은 바로 실행 가능한 행동 수준`;

function describeAxis(
  score: number,
  positiveStrong: string,
  positiveSoft: string,
  negativeSoft: string,
  negativeStrong: string,
): string {
  if (score >= 5) return positiveStrong;
  if (score >= 1) return positiveSoft;
  if (score <= -5) return negativeStrong;
  if (score <= -1) return negativeSoft;
  return '상황에 따라 균형 있게 판단하는 편';
}

function generateFallbackAnalysis(
  style: { name: string; description: string },
  scores: { principle: number; transparency: number; independence: number },
): AnalysisResult {
  const principleText = describeAxis(
    scores.principle,
    '규정과 기준을 매우 분명하게 붙드는 성향',
    '기준을 우선 확인하고 판단하는 성향',
    '상황과 맥락을 함께 보며 유연하게 조율하는 성향',
    '현장 상황에 맞춰 실용적으로 해법을 찾는 성향',
  );

  const transparencyText = describeAxis(
    scores.transparency,
    '이슈를 빠르게 공유하고 드러내는 성향',
    '필요한 내용을 비교적 솔직하게 공유하는 성향',
    '먼저 확인한 뒤 신중하게 공유 범위를 정하는 성향',
    '공개보다 정리와 맥락 파악을 먼저 중시하는 성향',
  );

  const independenceText = describeAxis(
    scores.independence,
    '혼자 기준을 세우고 실행까지 밀고 가는 성향',
    '스스로 판단하며 주도적으로 움직이는 성향',
    '주변 의견을 반영하며 함께 움직이는 성향',
    '협의와 합의를 통해 안정적으로 진행하는 성향',
  );

  return {
    styleSummary:
      `${style.name} 유형입니다. ${principleText}, ${transparencyText}, ${independenceText}이 함께 드러났습니다. ` +
      `${style.description} 강점이 있으므로, 실무에서는 판단 근거를 짧게라도 남기면 장점이 더 선명해집니다.`,
    strengths: [
      '애매한 상황에서도 기준을 세우고 다음 행동을 정하는 속도가 비교적 안정적입니다.',
      '연구비 집행, 데이터 정리, 대외 협업처럼 판단 근거가 중요한 일에서 자신의 스타일을 일관되게 유지할 가능성이 큽니다.',
      '업무 방식이 비교적 분명해 동료가 역할과 기대치를 이해하기 쉽습니다.',
    ],
    cautions: [
      '내 방식이 익숙할수록 다른 사람이 왜 다른 판단을 하는지 한 번 더 확인해보면 좋겠어요.',
      '빠르게 처리해야 하는 상황일수록 근거와 과정 기록을 짧게라도 남겨두면 이후 설명 부담이 줄어듭니다.',
      '혼자 판단하거나 반대로 합의에 오래 머무르는 경향이 강하다면, 중요한 건은 중간 점검 시점을 먼저 정해두는 것도 방법이에요.',
    ],
    tips: {
      research: '연구비·데이터 업무에서는 원자료, 수정 이력, 판단 기준을 한 번에 볼 수 있게 정리해두면 실수를 줄이는 데 도움이 됩니다.',
      admin: '구매·계약 업무에서는 비교견적 사유, 예외 처리 근거, 승인 경로를 짧게 메모로 남겨두면 이후 검토가 훨씬 수월해집니다.',
      relation: '외부 협력·소통에서는 구두 합의만 두지 말고 핵심 결정사항을 메일이나 회의 기록으로 정리해두면 불필요한 오해를 줄일 수 있습니다.',
    },
    message:
      '당신의 판단 스타일에는 이미 분명한 장점이 있습니다. 조금만 기록과 공유 방식을 다듬으면 더 신뢰받는 업무 습관으로 이어질 수 있어요.',
  };
}

// User 프롬프트 — 테스트 결과 데이터 전달
function buildUserPrompt(
  style: { name: string; subtitle: string; description: string },
  scores: { principle: number; transparency: number; independence: number },
  answers: number[],
): string {
  const choiceSummary = answers
    .map((choiceIdx, qIdx) => {
      const q = questions[qIdx];
      if (!q) return '';
      const c = q.choices[choiceIdx];
      if (!c) return '';
      return `Q${qIdx + 1}(${q.category}): "${c.text}"`;
    })
    .filter(Boolean)
    .join('\n');

  return `## 테스트 결과
- 유형: ${style.name} (${style.subtitle})
- 설명: ${style.description}
- 점수: 원칙↔유연(${scores.principle}), 투명↔신중(${scores.transparency}), 독립↔협력(${scores.independence})
  - 양수 = 원칙/투명/독립 성향, 음수 = 유연/신중/협력 성향, 0 = 균형

## 선택 패턴
${choiceSummary}

위 결과를 분석하여 JSON으로 응답해주세요.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { styleKey, scores, answers } = body as {
      styleKey: string;
      scores: { principle: number; transparency: number; independence: number };
      answers: number[];
    };

    // 입력 검증
    if (!styleKey || typeof styleKey !== 'string') {
      return NextResponse.json({ error: 'styleKey is required' }, { status: 400 });
    }

    const style = styleTypes[styleKey];
    if (!style) {
      return NextResponse.json({ error: 'Invalid style' }, { status: 400 });
    }

    if (!Array.isArray(answers) || answers.length !== questions.length) {
      return NextResponse.json({ error: `answers must be array of ${questions.length}` }, { status: 400 });
    }

    if (answers.some(a => typeof a !== 'number' || a < 0 || a > 3)) {
      return NextResponse.json({ error: 'Each answer must be 0-3' }, { status: 400 });
    }

    if (!scores || typeof scores.principle !== 'number' || typeof scores.transparency !== 'number' || typeof scores.independence !== 'number') {
      return NextResponse.json({ error: 'Invalid scores' }, { status: 400 });
    }

    let response;
    try {
      response = await chat({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(style, scores, answers) },
        ],
        temperature: 0.7,
        maxTokens: 1500,
      });
    } catch (error) {
      console.warn('Falling back to local analysis:', error instanceof Error ? error.message : error);
      return NextResponse.json({
        analysis: generateFallbackAnalysis(style, scores),
        style,
        structured: true,
        provider: 'local-fallback',
      });
    }

    // JSON 파싱 + 구조 검증 (```json ... ``` 래핑 대응)
    let analysisJson: AnalysisResult;
    try {
      const cleaned = response.content
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      const parsed: unknown = JSON.parse(cleaned);
      if (!isValidAnalysisResult(parsed)) {
        throw new Error('Invalid AI response structure');
      }
      analysisJson = parsed;
    } catch {
      // JSON 파싱/검증 실패 시 마크다운 텍스트로 폴백
      return NextResponse.json({
        analysis: response.content,
        style,
        structured: false,
        provider: response.provider,
      });
    }

    return NextResponse.json({
      analysis: analysisJson,
      style,
      structured: true,
      provider: response.provider,
    });
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
