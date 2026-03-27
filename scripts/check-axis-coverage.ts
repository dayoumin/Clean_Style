/**
 * 축별 최소 참여 검증 스크립트
 *
 * 각 문항의 선택지가 3개 축쌍에 점수를 부여하는지 전수 검사.
 * "강제 참여 문항" = 4개 선택지 모두 해당 축에 점수를 주는 문항
 * (어떤 선택을 해도 반드시 해당 축에 점수가 쌓임)
 *
 * 사용: npx tsx scripts/check-axis-coverage.ts
 */

import { questions } from '../src/data/questions.js';

interface AxisPair {
  name: string;
  posLabel: string;
  negLabel: string;
  key: 'principle' | 'transparency' | 'independence';
}

const AXIS_PAIRS: AxisPair[] = [
  { name: '원칙↔유연', posLabel: '원칙', negLabel: '유연', key: 'principle' },
  { name: '투명↔신중', posLabel: '투명', negLabel: '신중', key: 'transparency' },
  { name: '독립↔협력', posLabel: '독립', negLabel: '협력', key: 'independence' },
];

const MIN_FORCED = 3; // 축쌍당 강제 참여 문항 최소 수

console.log('=== 축별 최소 참여 검증 ===\n');

let allPass = true;

for (const axis of AXIS_PAIRS) {
  console.log(`── ${axis.name} ──`);

  let forcedCount = 0;
  let totalNeutralChoices = 0;

  for (const q of questions) {
    const choiceDetails = q.choices.map((c, i) => {
      const val = c.scores[axis.key] ?? 0;
      const label = val > 0 ? axis.posLabel : val < 0 ? axis.negLabel : '--';
      return { index: i, letter: String.fromCharCode(65 + i), label, val };
    });

    const neutralCount = choiceDetails.filter(d => d.val === 0).length;
    totalNeutralChoices += neutralCount;
    const isForced = neutralCount === 0;
    if (isForced) forcedCount++;

    const tag = isForced ? '★강제' : neutralCount >= 3 ? '⚠위험' : '  ' + neutralCount + '무관';
    const details = choiceDetails.map(d => `${d.letter}:${d.label.padEnd(2)}`).join(' ');
    console.log(`  Q${String(q.id).padStart(2)} | ${details} | ${tag}`);
  }

  const pass = forcedCount >= MIN_FORCED;
  if (!pass) allPass = false;

  console.log(`  ────`);
  console.log(`  강제 참여 문항: ${forcedCount}/${questions.length} (최소 ${MIN_FORCED} 필요) ${pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  무관 선택지 총: ${totalNeutralChoices}/60\n`);
}

// 종합 결과
console.log('=== 종합 ===');
console.log(allPass ? '✅ 모든 축 최소 참여 충족' : '❌ 일부 축 최소 참여 미충족');

process.exit(allPass ? 0 : 1);
