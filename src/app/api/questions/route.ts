import { NextResponse } from 'next/server';
import { questions } from '@/data/questions';
import type { Question } from '@/data/questions';
import fs from 'fs';
import path from 'path';

export async function GET() {
  return NextResponse.json(questions);
}

export async function PUT(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: '프로덕션에서는 수정할 수 없습니다' }, { status: 403 });
  }

  const updated = await request.json();
  const filePath = path.join(process.cwd(), 'src/data/questions.ts');
  const source = fs.readFileSync(filePath, 'utf-8');

  // questions 배열 부분만 재생성
  const questionsCode = generateQuestionsArray(updated);

  // 기존 파일에서 questions 배열 부분만 교체
  const startMarker = 'export const questions: Question[] = [';
  const startIdx = source.indexOf(startMarker);
  if (startIdx === -1) {
    return NextResponse.json({ error: 'questions 배열을 찾을 수 없습니다' }, { status: 500 });
  }

  // 배열 끝 찾기: 대응하는 ];
  let depth = 0;
  let endIdx = -1;
  for (let i = startIdx + startMarker.length; i < source.length; i++) {
    if (source[i] === '[') depth++;
    if (source[i] === ']') {
      if (depth === 0) {
        endIdx = i + 2; // ]; 포함
        break;
      }
      depth--;
    }
  }

  if (endIdx === -1) {
    return NextResponse.json({ error: '배열 끝을 찾을 수 없습니다' }, { status: 500 });
  }

  const newSource = source.slice(0, startIdx) + questionsCode + source.slice(endIdx);
  fs.writeFileSync(filePath, newSource, 'utf-8');

  return NextResponse.json({ success: true });
}

function generateQuestionsArray(questions: Question[]): string {
  const categoryLabels: Record<string, string> = {
    research: '연구·데이터 영역 (5문항)',
    admin: '행정·계약 영역 (5문항)',
    relation: '관계·소통 영역 (5문항)',
  };

  const lines: string[] = [];
  lines.push('export const questions: Question[] = [');

  let lastCategory = '';
  for (const q of questions) {
    if (q.category !== lastCategory) {
      lines.push(`  // ── ${categoryLabels[q.category] ?? q.category} ──`);
      lastCategory = q.category;
    }

    lines.push('  {');
    lines.push(`    id: ${q.id},`);
    lines.push(`    category: '${q.category}',`);
    lines.push(`    situation: '${escapeStr(q.situation)}',`);
    lines.push('    choices: [');

    for (const c of q.choices) {
      const scoreEntries = Object.entries(c.scores)
        .filter(([, v]) => v !== 0)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      lines.push(`      { text: '${escapeStr(c.text)}', scores: { ${scoreEntries} } },`);
    }

    lines.push('    ],');
    lines.push('  },');
  }

  lines.push('];');
  return lines.join('\n');
}

function escapeStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
