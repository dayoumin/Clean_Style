'use client';

import { useState, useEffect } from 'react';
import type { Choice, Question } from '@/data/questions';

const categoryLabel: Record<string, string> = {
  research: '연구·데이터',
  admin: '행정·계약',
  relation: '관계·소통',
};

const categoryColor: Record<string, string> = {
  research: '#4361ee',
  admin: '#f4a261',
  relation: '#06d6a0',
};

const axisLabel: Record<string, string> = {
  principle: '원칙↔유연',
  transparency: '투명↔신중',
  independence: '독립↔협력',
};

export default function QuestionsAdmin() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/questions')
      .then((r) => r.json())
      .then(setQuestions);
  }, []);

  function startEdit(q: Question) {
    setEditing(q.id);
    setDraft(JSON.parse(JSON.stringify(q)));
  }

  function cancelEdit() {
    setEditing(null);
    setDraft(null);
  }

  function updateSituation(value: string) {
    if (!draft) return;
    setDraft({ ...draft, situation: value });
  }

  function updateChoiceText(ci: number, value: string) {
    if (!draft) return;
    const choices = [...draft.choices];
    choices[ci] = { ...choices[ci], text: value };
    setDraft({ ...draft, choices });
  }

  function updateScore(ci: number, axis: keyof Choice['scores'], value: number) {
    if (!draft) return;
    const choices = [...draft.choices];
    const scores = { ...choices[ci].scores };
    if (value === 0) {
      delete scores[axis];
    } else {
      scores[axis] = value;
    }
    choices[ci] = { ...choices[ci], scores };
    setDraft({ ...draft, choices });
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setMessage('');

    const updated = questions.map((q) => (q.id === draft.id ? draft : q));

    const res = await fetch('/api/questions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });

    if (res.ok) {
      setQuestions(updated);
      setEditing(null);
      setDraft(null);
      setMessage('저장 완료 — 소스 파일이 수정되었습니다');
    } else {
      const err = await res.json();
      setMessage(`오류: ${err.error}`);
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px', fontFamily: 'Pretendard, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>문항 관리</h1>
      <p style={{ color: '#6b7194', marginBottom: 24, fontSize: 14 }}>
        수정하면 <code>src/data/questions.ts</code> 소스 파일이 직접 변경됩니다. (개발 환경 전용)
      </p>

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 16,
          background: message.startsWith('오류') ? '#fff0f0' : '#f0fff4',
          color: message.startsWith('오류') ? '#c53030' : '#22543d',
          fontSize: 14,
        }}>
          {message}
        </div>
      )}

      {questions.map((q) => (
        <div
          key={q.id}
          style={{
            border: '1px solid #eceef5',
            borderRadius: 12,
            padding: 20,
            marginBottom: 12,
            background: editing === q.id ? '#fafbff' : '#fff',
          }}
        >
          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{
              background: categoryColor[q.category],
              color: '#fff',
              padding: '2px 10px',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 600,
            }}>
              {categoryLabel[q.category]}
            </span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Q{q.id}</span>
            {editing !== q.id && (
              <button
                onClick={() => startEdit(q)}
                style={{
                  marginLeft: 'auto',
                  padding: '4px 14px',
                  borderRadius: 6,
                  border: '1px solid #dde3ff',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: '#4361ee',
                }}
              >
                수정
              </button>
            )}
          </div>

          {editing === q.id && draft ? (
            /* 편집 모드 */
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7194' }}>상황</label>
              <textarea
                value={draft.situation}
                onChange={(e) => updateSituation(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid #dde3ff',
                  marginBottom: 16,
                  fontSize: 14,
                  resize: 'vertical',
                  minHeight: 60,
                  boxSizing: 'border-box',
                }}
              />

              {draft.choices.map((c, ci) => (
                <div key={ci} style={{ marginBottom: 14, padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #eceef5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7194' }}>{ci + 1}.</span>
                    <input
                      value={c.text}
                      onChange={(e) => updateChoiceText(ci, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid #dde3ff',
                        fontSize: 14,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {(Object.keys(axisLabel) as Array<keyof Choice['scores']>).map((axis) => (
                      <div key={axis} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 11, color: '#6b7194' }}>{axisLabel[axis]}</span>
                        <select
                          value={c.scores[axis] ?? 0}
                          onChange={(e) => updateScore(ci, axis, Number(e.target.value))}
                          style={{
                            padding: '2px 4px',
                            borderRadius: 4,
                            border: '1px solid #dde3ff',
                            fontSize: 12,
                            background: (c.scores[axis] ?? 0) !== 0 ? '#eef1ff' : '#fff',
                          }}
                        >
                          <option value={1}>+1</option>
                          <option value={0}>0</option>
                          <option value={-1}>-1</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={save}
                  disabled={saving}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#4361ee',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  {saving ? '저장 중...' : '저장 (소스 반영)'}
                </button>
                <button
                  onClick={cancelEdit}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    border: '1px solid #dde3ff',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            /* 보기 모드 */
            <div>
              <p style={{ fontSize: 15, marginBottom: 12, lineHeight: 1.6 }}>{q.situation}</p>
              {q.choices.map((c, ci) => (
                <div key={ci} style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#6b7194', minWidth: 18 }}>{ci + 1}.</span>
                  <span style={{ fontSize: 14 }}>{c.text}</span>
                  <span style={{ fontSize: 11, color: '#aeb3cc', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                    {Object.entries(c.scores)
                      .filter(([, v]) => v !== 0)
                      .map(([k, v]) => `${k}${v > 0 ? '+' : ''}${v}`)
                      .join(' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
