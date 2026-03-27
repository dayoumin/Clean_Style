// 문항 시뮬레이션 스크립트 — npx tsx tests/questions-simulation.ts
import { questions, calculateResult, styleTypes } from '../src/data/questions';

let pass = 0;
let fail = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    pass++;
  } else {
    fail++;
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

// ── 1. 기본 구조 ──
console.log('\n═══ 기본 구조 검증 ═══');

assert(questions.length === 15, `15문항이어야 함 (현재 ${questions.length})`);

const catCounts = { research: 0, admin: 0, relation: 0 };
for (const q of questions) catCounts[q.category]++;
assert(catCounts.research === 5, `연구 5문항 (현재 ${catCounts.research})`);
assert(catCounts.admin === 5, `행정 5문항 (현재 ${catCounts.admin})`);
assert(catCounts.relation === 5, `관계 5문항 (현재 ${catCounts.relation})`);
console.log(`  카테고리: 연구 ${catCounts.research}, 행정 ${catCounts.admin}, 관계 ${catCounts.relation}`);

const ids = questions.map((q) => q.id);
assert(JSON.stringify(ids) === JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]), 'ID가 1~15 연속');

for (const q of questions) {
  assert(q.choices.length === 4, `Q${q.id}: 선택지 4개 (현재 ${q.choices.length})`);
  for (const c of q.choices) {
    assert(c.text.trim().length > 0, `Q${q.id}: 빈 선택지 텍스트`);
    for (const [k, v] of Object.entries(c.scores)) {
      assert(v === 1 || v === -1, `Q${q.id} "${c.text}": ${k}=${v} (±1이어야 함)`);
    }
  }
}
console.log(`  구조 검증 완료`);

// ── 2. 점수 균형 ──
console.log('\n═══ 점수 균형 검증 ═══');
const axes = ['principle', 'transparency', 'independence'] as const;

for (const axis of axes) {
  let plus = 0, minus = 0;
  for (const q of questions) {
    for (const c of q.choices) {
      const v = c.scores[axis] ?? 0;
      if (v > 0) plus++;
      if (v < 0) minus++;
    }
  }
  const diff = Math.abs(plus - minus);
  console.log(`  ${axis.padEnd(14)}: +1 기회 ${plus}회, -1 기회 ${minus}회 (차이: ${diff})`);
  assert(diff <= 3, `${axis} ±1 기회 차이가 3 이하여야 함 (현재 ${diff})`);
}

// 각 선택지에 최소 1개 축 점수
for (const q of questions) {
  for (const c of q.choices) {
    const scored = Object.values(c.scores).filter((v) => v !== 0).length;
    assert(scored >= 1, `Q${q.id} "${c.text}": 점수 없는 선택지`);
    // 강제 참여 보장을 위해 3축 동시 허용 (축별 최소 참여 체크리스트 #4 참고)
    assert(scored <= 3, `Q${q.id} "${c.text}": 점수 과부하 (최대 3축)`);
  }
}
console.log(`  선택지별 점수 분포 검증 완료`);

// ── 3. 이론적 점수 범위 ──
console.log('\n═══ 이론적 점수 범위 ═══');
for (const axis of axes) {
  let maxSum = 0, minSum = 0;
  for (const q of questions) {
    const vals = q.choices.map((c) => c.scores[axis] ?? 0);
    maxSum += Math.max(...vals);
    minSum += Math.min(...vals);
  }
  console.log(`  ${axis.padEnd(14)}: [${minSum}, +${maxSum}]`);
  assert(maxSum >= 5, `${axis} 최대값 5 이상 (현재 ${maxSum})`);
  assert(minSum <= -5, `${axis} 최소값 -5 이하 (현재 ${minSum})`);
}

// ── 4. 극단 선택 검증 ──
console.log('\n═══ 극단 선택 검증 ═══');

// 모두 +방향 최대화
const maxAnswers = questions.map((q) => {
  let bestIdx = 0, bestScore = -Infinity;
  q.choices.forEach((c, i) => {
    const s = (c.scores.principle ?? 0) + (c.scores.transparency ?? 0) + (c.scores.independence ?? 0);
    if (s > bestScore) { bestScore = s; bestIdx = i; }
  });
  return bestIdx;
});
const maxResult = calculateResult(maxAnswers);
console.log(`  최대 양수 선택: ${maxResult.style.name} (${maxResult.styleKey})`);
console.log(`    점수: P=${maxResult.scores.principle}, T=${maxResult.scores.transparency}, I=${maxResult.scores.independence}`);
assert(maxResult.styleKey === 'principle-transparent-independent', '최대 양수 = 소신 수호자');

// 모두 -방향 최대화
const minAnswers = questions.map((q) => {
  let bestIdx = 0, bestScore = Infinity;
  q.choices.forEach((c, i) => {
    const s = (c.scores.principle ?? 0) + (c.scores.transparency ?? 0) + (c.scores.independence ?? 0);
    if (s < bestScore) { bestScore = s; bestIdx = i; }
  });
  return bestIdx;
});
const minResult = calculateResult(minAnswers);
console.log(`  최대 음수 선택: ${minResult.style.name} (${minResult.styleKey})`);
console.log(`    점수: P=${minResult.scores.principle}, T=${minResult.scores.transparency}, I=${minResult.scores.independence}`);
assert(minResult.styleKey === 'flexible-cautious-cooperative', '최대 음수 = 온건한 조정자');

// ── 5. 랜덤 시뮬레이션: 8유형 도달 ──
console.log('\n═══ 랜덤 시뮬레이션 (100,000회) ═══');

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SAMPLES = 100_000;
const rng = mulberry32(42);
const typeCounts: Record<string, number> = {};
const scoreStats = {
  principle: { min: Infinity, max: -Infinity, sum: 0 },
  transparency: { min: Infinity, max: -Infinity, sum: 0 },
  independence: { min: Infinity, max: -Infinity, sum: 0 },
};

for (let i = 0; i < SAMPLES; i++) {
  const answers = Array.from({ length: 15 }, () => Math.floor(rng() * 4));
  const result = calculateResult(answers);
  typeCounts[result.styleKey] = (typeCounts[result.styleKey] ?? 0) + 1;
  for (const axis of axes) {
    const v = result.scores[axis];
    if (v < scoreStats[axis].min) scoreStats[axis].min = v;
    if (v > scoreStats[axis].max) scoreStats[axis].max = v;
    scoreStats[axis].sum += v;
  }
}

console.log('\n  유형별 출현 비율:');
const allKeys = Object.keys(styleTypes);
const reachable = new Set(Object.keys(typeCounts));

for (const key of allKeys) {
  const count = typeCounts[key] ?? 0;
  const pct = (count / SAMPLES * 100).toFixed(1);
  const bar = '█'.repeat(Math.round(count / SAMPLES * 100));
  const name = styleTypes[key].name;
  const reached = reachable.has(key) ? '✓' : '✗';
  console.log(`    ${reached} ${pct.padStart(5)}% ${bar} ${name}`);
}

assert(reachable.size === 8, `8가지 유형 모두 도달 가능해야 함 (현재 ${reachable.size}개)`);

// 편향 체크
for (const key of allKeys) {
  const pct = (typeCounts[key] ?? 0) / SAMPLES * 100;
  assert(pct > 2, `${styleTypes[key].name}: ${pct.toFixed(1)}% (2% 미만 = 도달 어려움)`);
  assert(pct < 40, `${styleTypes[key].name}: ${pct.toFixed(1)}% (40% 초과 = 과도한 편향)`);
}

console.log('\n  점수 분포:');
for (const [axis, s] of Object.entries(scoreStats)) {
  const avg = (s.sum / SAMPLES).toFixed(2);
  console.log(`    ${axis.padEnd(14)}: min=${String(s.min).padStart(3)}, max=${String(s.max).padStart(3)}, 평균=${avg}`);
  assert(Math.abs(s.sum / SAMPLES) < 2, `${axis} 평균이 ±2 이내여야 함`);
}

// ── 결과 ──
console.log('\n═══════════════════════════════');
console.log(`  결과: ${pass} passed, ${fail} failed`);
console.log('═══════════════════════════════\n');
process.exit(fail > 0 ? 1 : 0);
