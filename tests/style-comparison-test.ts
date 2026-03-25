/**
 * 동일 질문, 8개 스타일 전체 → AI 답변 비교 테스트
 * 실행: npx tsx tests/style-comparison-test.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const API = 'http://localhost:3000/api/analyze';
const QUESTION = '연구비로 구매한 노트북을 집에 가져가서 개인 업무에도 사용해도 될까요?';

interface TestCase {
  label: string;
  styleKey: string;
  scores: { principle: number; transparency: number; independence: number };
}

const cases: TestCase[] = [
  {
    label: '소신 수호자 (원칙 뚜렷 / 투명 / 독립)',
    styleKey: 'principle-transparent-independent',
    scores: { principle: 5, transparency: 3, independence: 4 },
  },
  {
    label: '정의의 조율자 (원칙 / 투명 / 협력)',
    styleKey: 'principle-transparent-cooperative',
    scores: { principle: 4, transparency: 3, independence: -3 },
  },
  {
    label: '묵묵한 파수꾼 (원칙 / 신중 / 독립)',
    styleKey: 'principle-cautious-independent',
    scores: { principle: 4, transparency: -3, independence: 4 },
  },
  {
    label: '신중한 중재자 (원칙 / 신중 / 협력)',
    styleKey: 'principle-cautious-cooperative',
    scores: { principle: 3, transparency: -4, independence: -3 },
  },
  {
    label: '실용주의 개척자 (유연 / 투명 / 독립)',
    styleKey: 'flexible-transparent-independent',
    scores: { principle: -3, transparency: 2, independence: 5 },
  },
  {
    label: '열린 소통가 (유연 / 투명 / 협력)',
    styleKey: 'flexible-transparent-cooperative',
    scores: { principle: -3, transparency: 3, independence: -4 },
  },
  {
    label: '전략적 해결사 (유연 / 신중 / 독립)',
    styleKey: 'flexible-cautious-independent',
    scores: { principle: -4, transparency: -3, independence: 5 },
  },
  {
    label: '온건한 조정자 (유연 / 신중 / 협력)',
    styleKey: 'flexible-cautious-cooperative',
    scores: { principle: -5, transparency: -3, independence: -4 },
  },
];

async function test(c: TestCase): Promise<string> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      styleKey: c.styleKey,
      mode: 'question',
      userContext: QUESTION,
      scores: c.scores,
    }),
  });
  const data = await res.json();
  return data.answer ?? `ERROR: ${JSON.stringify(data)}`;
}

async function main() {
  const lines: string[] = [];
  const log = (s: string) => { console.log(s); lines.push(s); };

  log(`질문: "${QUESTION}"`);
  log(`테스트 일시: ${new Date().toLocaleString('ko-KR')}`);
  log('');
  log('='.repeat(70));

  for (const c of cases) {
    log('');
    log(`【${c.label}】`);
    log(`  scores: 원칙↔유연=${c.scores.principle}  투명↔신중=${c.scores.transparency}  독립↔협력=${c.scores.independence}`);
    log('-'.repeat(70));
    try {
      const answer = await test(c);
      log(answer);
    } catch (err) {
      log(`  API 호출 실패: ${err}`);
    }
    log('');
    log('='.repeat(70));
  }

  // 파일 저장
  const outPath = path.resolve(__dirname, '../docs/style-comparison-result.txt');
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
  log(`\n결과 저장: ${outPath}`);
}

main();
