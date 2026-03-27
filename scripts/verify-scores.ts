/**
 * 점수 매핑 전수 점검 스크립트
 * 현재 코드 상태를 출력하여 문서와 대조 가능
 */
import { questions, AXIS_MAXIMUMS } from '../src/data/questions.js';

console.log('=== AXIS_MAXIMUMS ===');
console.log(JSON.stringify(AXIS_MAXIMUMS));

console.log('\n=== 전체 60개 선택지 점수 매핑 ===');
for (const q of questions) {
  for (let i = 0; i < q.choices.length; i++) {
    const c = q.choices[i];
    const p = c.scores.principle ?? 0;
    const t = c.scores.transparency ?? 0;
    const ind = c.scores.independence ?? 0;
    const count = [p, t, ind].filter(v => v !== 0).length;
    console.log(
      `Q${String(q.id).padStart(2)}-${String.fromCharCode(65 + i)}` +
      ` | P:${p > 0 ? '+1' : p < 0 ? '-1' : ' 0'}` +
      ` T:${t > 0 ? '+1' : t < 0 ? '-1' : ' 0'}` +
      ` I:${ind > 0 ? '+1' : ind < 0 ? '-1' : ' 0'}` +
      ` | ${count}축` +
      ` | ${c.text.substring(0, 28)}`
    );
  }
}

console.log('\n=== 점수 균형 ===');
let pPos = 0, pNeg = 0, tPos = 0, tNeg = 0, iPos = 0, iNeg = 0;
for (const q of questions) {
  for (const c of q.choices) {
    const p = c.scores.principle ?? 0;
    const t = c.scores.transparency ?? 0;
    const i = c.scores.independence ?? 0;
    if (p > 0) pPos++; if (p < 0) pNeg++;
    if (t > 0) tPos++; if (t < 0) tNeg++;
    if (i > 0) iPos++; if (i < 0) iNeg++;
  }
}
console.log(`principle   : +1=${pPos}  -1=${pNeg}  차이=${Math.abs(pPos - pNeg)}`);
console.log(`transparency: +1=${tPos}  -1=${tNeg}  차이=${Math.abs(tPos - tNeg)}`);
console.log(`independence: +1=${iPos}  -1=${iNeg}  차이=${Math.abs(iPos - iNeg)}`);

console.log('\n=== 3축 동시 점수 선택지 (13건 추가분) ===');
for (const q of questions) {
  for (let i = 0; i < q.choices.length; i++) {
    const c = q.choices[i];
    const p = c.scores.principle ?? 0;
    const t = c.scores.transparency ?? 0;
    const ind = c.scores.independence ?? 0;
    const count = [p, t, ind].filter(v => v !== 0).length;
    if (count === 3) {
      console.log(
        `  Q${q.id}-${String.fromCharCode(65 + i)}` +
        ` P:${p > 0 ? '+1' : '-1'}` +
        ` T:${t > 0 ? '+1' : '-1'}` +
        ` I:${ind > 0 ? '+1' : '-1'}` +
        ` | ${c.text.substring(0, 30)}`
      );
    }
  }
}
