import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/ai';
import { styleTypes, questions, calculateResult } from '@/data/questions';
import { isValidAnalysisResult } from '@/types/analysis';
import type { AnalysisResult } from '@/types/analysis';

// 이어서 질문 시 유지할 최대 대화 턴 수 (토큰 예산 제한)
const MAX_HISTORY_TURNS = 6;

// System 프롬프트 (상수 — 매 요청마다 재생성 방지)
const SYSTEM_PROMPT = `당신은 공공 연구기관 종사자를 위한 청렴 스타일 분석 전문가입니다.

## 역할
- 기분 좋고 긍정적인 분위기의 피드백 제공
- 평가가 아닌 "자기발견"과 "응원" 관점
- 밝고 따뜻하며 격려하는 톤 유지
- 선택에 대한 옳고 그름 판단 절대 금지 — 모든 스타일은 장점이 있음을 강조
- 잘못 여부를 따지는 것이 아니라, 각자의 강점을 발견하고 키워가는 테스트임을 전제

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
- 주의 포인트도 부정적 표현 대신 "~하면 더 빛날 수 있어요", "~해보는 것도 좋은 방법이에요" 같은 긍정적 제안
- 팁은 바로 실행 가능한 행동 수준, 격려 톤으로
- 사용자가 추가 맥락(업무 고민, 구체적 상황)을 제공한 경우, 해당 내용을 분석 전체에 자연스럽게 반영하여 맞춤형 조언을 제공하세요`;

// Q&A 프롬프트 공통 베이스
const QA_BASE = `당신은 공공 연구기관 종사자를 위한 청렴 조언 도우미입니다.

## 역할
- 사용자의 구체적인 질문에 **직접적이고 실용적인 답변** 제공
- 밝고 따뜻한 톤, 실행 가능한 조언
- 옳고 그름을 판단하지 않고 안전한 방법을 안내

## 응답 원칙
- 5~7문장 이내로 핵심만 간결하게
- 관련 규정이나 주의점이 있으면 짧게 언급
- 마지막에 한 줄 격려
- JSON이 아닌 일반 텍스트로 응답`;

// 첫 질문: 스타일을 도입부에서 한 번 언급
const QA_SYSTEM_PROMPT = `${QA_BASE}

## 스타일 반영 원칙
- 사용자의 청렴 스타일 유형을 참고하되, 질문에 대한 답변이 핵심
- 답변 도입부에서 사용자의 스타일 특성과 질문을 자연스럽게 연결하세요
  - 예: "원칙을 중시하는 소신 수호자답게 기준이 궁금하셨군요."
  - 예: "유연한 판단을 선호하시는 만큼, 상황별 대처가 중요하겠네요."
- 스타일 언급은 도입부에서 한 번만, 이후에는 질문 자체에 집중하세요
- 유형명을 매번 반복하거나 과도하게 강조하지 마세요`;

// 이어서 질문: 스타일 반복 언급 방지
const QA_SYSTEM_PROMPT_CONTINUE = `${QA_BASE}

## 스타일 반영 원칙
- 이전 대화에서 이미 스타일을 언급했으므로, 유형명이나 스타일 특성을 다시 언급하지 마세요
- 이전 대화 맥락을 자연스럽게 이어가세요`;

// 유형별 폴백 분석 데이터 (AI 실패 시 사용)
const FALLBACK_DATA: Record<string, Omit<AnalysisResult, 'styleSummary'>> = {
  'principle-transparent-independent': {
    strengths: [
      '기준이 명확해서 애매한 상황에서도 빠르게 판단할 수 있어요.',
      '문제를 발견하면 바로 공유해 조직의 투명성을 높여요.',
    ],
    cautions: [
      '동료가 다른 판단을 할 때, 그 맥락을 한 번 더 들어보면 좋겠어요.',
      '혼자 밀고 나가기 전에 핵심 이해관계자에게 한마디 공유하면 마찰이 줄어요.',
    ],
    tips: {
      research: '데이터 이상치 발견 시 기록과 함께 팀에 즉시 공유해보세요.',
      admin: '비교견적 사유를 한 줄로 메모해두면 나중에 든든해요.',
      relation: '외부 미팅 후 핵심 합의사항을 메일로 정리해보세요.',
    },
    message: '소신 있는 판단력이 큰 강점이에요! 주변과 살짝 더 공유하면 더 빛날 거예요.',
  },
  'principle-transparent-cooperative': {
    strengths: [
      '규정을 잘 알면서도 팀과 함께 풀어가는 균형 감각이 있어요.',
      '과정을 공유하니 동료들이 신뢰하고 따르기 쉬워요.',
    ],
    cautions: [
      '합의에 시간이 걸릴 때, 기한을 먼저 정해두면 효율이 올라요.',
      '모두의 의견을 듣다 보면 본인 판단이 흐려질 수 있으니 기준을 먼저 세워보세요.',
    ],
    tips: {
      research: '연구비 집행 기준을 팀과 미리 공유해 혼선을 줄여보세요.',
      admin: '계약 검토 시 체크리스트를 팀과 함께 만들어보세요.',
      relation: '외부 협력 시 역할 분담을 문서로 남겨두면 좋아요.',
    },
    message: '팀의 신뢰를 이끄는 조율 능력이 돋보여요! 그대로 가세요.',
  },
  'principle-cautious-independent': {
    strengths: [
      '원칙을 지키면서도 꼼꼼히 확인 후 행동해 실수가 적어요.',
      '독립적으로 판단하고 처리하는 추진력이 있어요.',
    ],
    cautions: [
      '혼자 확인하고 처리하다 보면 동료가 진행 상황을 모를 수 있어요.',
      '중요한 결정은 결과만이라도 짧게 공유하면 협업이 수월해져요.',
    ],
    tips: {
      research: '데이터 검증 후 판단 근거를 한 줄 메모로 남겨보세요.',
      admin: '수의계약 사유 등 예외 처리 시 근거 문서를 먼저 만들어두세요.',
      relation: '외부 요청에 대한 검토 결과를 간단히라도 팀에 알려주세요.',
    },
    message: '꼼꼼하고 신뢰감 있는 업무 스타일이에요! 공유만 살짝 더하면 완벽해요.',
  },
  'principle-cautious-cooperative': {
    strengths: [
      '신중하게 파악한 뒤 팀과 협의해 안정적인 결정을 이끌어요.',
      '원칙을 기반으로 하되 다양한 의견을 반영하는 중재력이 있어요.',
    ],
    cautions: [
      '신중함이 지나치면 결정이 늦어질 수 있으니 데드라인을 먼저 정해보세요.',
      '확인 과정이 길어질 때 중간 보고를 짧게 넣으면 불안감이 줄어요.',
    ],
    tips: {
      research: '실험 결과 검토 시 1차 판단 기한을 미리 정해두세요.',
      admin: '구매 절차에서 검토 단계별 예상 일정을 팀에 공유해보세요.',
      relation: '외부 협의 시 내부 합의 기한을 먼저 안내하면 신뢰가 높아져요.',
    },
    message: '안정감 있는 판단 스타일이에요! 속도감만 살짝 더하면 더 좋아요.',
  },
  'flexible-transparent-independent': {
    strengths: [
      '상황에 맞게 유연하게 대처하면서도 과정을 공유해 투명해요.',
      '주도적으로 실행하니 업무 속도가 빨라요.',
    ],
    cautions: [
      '유연한 판단이 일관성 없어 보일 수 있으니 판단 근거를 남겨두면 좋아요.',
      '빠른 실행 전에 핵심 이해관계자 한 명에게만이라도 확인해보세요.',
    ],
    tips: {
      research: '연구비 변경 집행 시 사유를 간단히 기록해두세요.',
      admin: '견적 비교 시 선택 근거를 한 줄로 남겨두면 나중에 편해요.',
      relation: '외부 파트너와의 구두 합의를 메일로 확인해보세요.',
    },
    message: '실행력과 유연함이 매력적이에요! 기록 습관만 더하면 완벽해요.',
  },
  'flexible-transparent-cooperative': {
    strengths: [
      '상황에 맞게 유연하게 판단하면서 모두와 소통하는 능력이 뛰어나요.',
      '분위기를 부드럽게 이끌어 협업이 원활해요.',
    ],
    cautions: [
      '모두에게 맞추다 보면 본인의 기준이 흔들릴 수 있어요.',
      '중요한 결정에서는 "이건 양보 안 돼" 하는 선을 미리 정해두세요.',
    ],
    tips: {
      research: '공동연구 시 데이터 관리 원칙을 처음에 합의해두세요.',
      admin: '예산 조정 시 변경 사유와 합의 내용을 기록해두세요.',
      relation: '외부 소통 시 내부 원칙을 먼저 정리한 뒤 미팅에 임해보세요.',
    },
    message: '소통과 유연함의 달인이에요! 자신만의 기준선도 함께 지켜가세요.',
  },
  'flexible-cautious-independent': {
    strengths: [
      '상황을 먼저 파악하고 최선의 방법을 찾아 실행하는 전략가예요.',
      '조용히 문제를 해결하는 추진력이 인상적이에요.',
    ],
    cautions: [
      '혼자 판단하고 처리한 뒤에라도 과정을 짧게 공유해보세요.',
      '유연한 판단이 자의적으로 보이지 않도록 근거를 남겨두면 좋아요.',
    ],
    tips: {
      research: '연구 방향 변경 시 변경 사유를 한 줄로 기록해두세요.',
      admin: '절차 간소화 시 어떤 부분을 왜 줄였는지 메모해두세요.',
      relation: '외부 요청 대응 후 결과를 팀에 간단히 공유해보세요.',
    },
    message: '전략적 판단력이 큰 강점이에요! 과정 공유를 더하면 신뢰가 배가 돼요.',
  },
  'flexible-cautious-cooperative': {
    strengths: [
      '분위기를 살피며 팀 합의로 부드럽게 풀어가는 조정력이 있어요.',
      '갈등 상황에서 완충 역할을 잘 해내요.',
    ],
    cautions: [
      '신중함과 합의 추구가 겹치면 결정이 느려질 수 있어요.',
      '때로는 "일단 이렇게 하고 나중에 조정하자"는 추진력도 필요해요.',
    ],
    tips: {
      research: '실험 계획 변경 시 팀 합의와 함께 기한도 정해두세요.',
      admin: '구매 결정이 늦어질 때 "이날까지 결정" 기한을 먼저 잡아보세요.',
      relation: '외부 협력 시 내부 논의 기한을 정해두면 효율이 올라요.',
    },
    message: '팀의 분위기를 만드는 소중한 존재예요! 가끔은 과감하게 밀어보세요.',
  },
};

function generateFallbackAnalysis(
  style: { name: string; description: string },
  styleKey: string,
): AnalysisResult {
  const fallback = FALLBACK_DATA[styleKey];

  return {
    styleSummary: `${style.name} — ${style.description}`,
    ...(fallback ?? {
      strengths: ['자신만의 판단 기준이 있어요.'],
      cautions: ['판단 근거를 짧게 기록해두면 도움이 돼요.'],
      tips: { research: '기록을 남겨보세요.', admin: '절차를 확인해보세요.', relation: '합의를 문서화해보세요.' },
      message: '당신만의 스타일이 있어요!',
    }),
  };
}

// User 프롬프트 — 테스트 결과 데이터 전달
function buildUserPrompt(
  style: { name: string; subtitle: string; description: string },
  scores: { principle: number; transparency: number; independence: number },
  answers: number[],
  borderline: string[],
  userContext?: string,
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

  const axisNames: Record<string, string> = { principle: '원칙↔유연', transparency: '투명↔신중', independence: '독립↔협력' };
  const borderlineNote = borderline.length > 0
    ? `\n- 균형 축: ${borderline.map(b => axisNames[b] ?? b).join(', ')} — 이 축은 어느 한쪽 성향이 뚜렷하지 않으므로, 고정된 유형으로 프레이밍하지 말고 "상황에 따라 양쪽을 활용하는 경향"으로 설명해주세요.`
    : '';

  let prompt = `## 테스트 결과
- 유형: ${style.name} (${style.subtitle})
- 설명: ${style.description}
- 점수: 원칙↔유연(${scores.principle}), 투명↔신중(${scores.transparency}), 독립↔협력(${scores.independence})
  - 양수 = 원칙/투명/독립 성향, 음수 = 유연/신중/협력 성향, 0 = 균형${borderlineNote}

## 선택 패턴
${choiceSummary}`;

  if (userContext) {
    prompt += `

## 사용자가 알려준 업무 상황/고민
${userContext}

위 테스트 결과와 사용자의 상황을 함께 고려하여 맞춤형 분석을 JSON으로 응답해주세요.`;
  } else {
    prompt += `

위 결과를 분석하여 JSON으로 응답해주세요.`;
  }

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { styleKey, answers, userContext, mode, history } = body as {
      styleKey: string;
      answers: number[];
      userContext?: string;
      mode?: 'analysis' | 'question';
      history?: { role: 'user' | 'assistant'; content: string }[];
    };

    // 입력 검증
    if (!styleKey || typeof styleKey !== 'string') {
      return NextResponse.json({ error: 'styleKey is required' }, { status: 400 });
    }

    const style = styleTypes[styleKey];
    if (!style) {
      return NextResponse.json({ error: 'Invalid style' }, { status: 400 });
    }

    if (userContext && (typeof userContext !== 'string' || userContext.length > 500)) {
      return NextResponse.json({ error: 'userContext must be string under 500 chars' }, { status: 400 });
    }

    // ── Q&A 모드: 사용자 질문에 직접 답변 (answers 검증 불필요) ──
    if (mode === 'question') {
      if (!userContext?.trim()) {
        return NextResponse.json({ error: 'question is required' }, { status: 400 });
      }

      try {
        const hasHistory = Array.isArray(history) && history.length > 0;
        const systemPrompt = hasHistory ? QA_SYSTEM_PROMPT_CONTINUE : QA_SYSTEM_PROMPT;
        const userMessage = hasHistory
          ? userContext
          : `나의 청렴 스타일: ${style.name} (${style.description})\n\n질문: ${userContext}`;

        const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
          { role: 'system', content: systemPrompt },
          ...(hasHistory ? history.slice(-MAX_HISTORY_TURNS) : []),
          { role: 'user', content: userMessage },
        ];

        const response = await chat({
          messages,
          temperature: 0.7,
          maxTokens: 600,
        });

        return NextResponse.json({
          answer: response.content,
          provider: response.provider,
        });
      } catch {
        return NextResponse.json(
          { error: '답변 생성에 실패했어요. 다시 시도해주세요.' },
          { status: 500 }
        );
      }
    }

    // ── 기존 분석 모드: answers 검증 필요 ──
    if (!Array.isArray(answers) || answers.length !== questions.length) {
      return NextResponse.json({ error: `answers must be array of ${questions.length}` }, { status: 400 });
    }

    if (answers.some(a => typeof a !== 'number' || a < 0 || a > 3)) {
      return NextResponse.json({ error: 'Each answer must be 0-3' }, { status: 400 });
    }

    const serverResult = calculateResult(answers);
    const verifiedScores = serverResult.scores;
    const borderline = serverResult.borderline;

    let response;
    try {
      response = await chat({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(style, verifiedScores, answers, borderline, userContext) },
        ],
        temperature: 0.7,
        maxTokens: 1500,
      });
    } catch (error) {
      console.warn('Falling back to local analysis:', error instanceof Error ? error.message : error);
      return NextResponse.json({
        analysis: generateFallbackAnalysis(style, styleKey),
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
