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

    const response = await chat({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(style, scores, answers) },
      ],
      temperature: 0.7,
      maxTokens: 1500,
    });

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
