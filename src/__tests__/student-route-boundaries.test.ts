import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/data/appVariant', () => ({
  AI_CHAT_ENABLED: false,
  APP_COPY: {
    title: '청소년 청렴 교육',
    primaryDiagnosticDescription: '학생용 진단을 준비하고 있어요',
  },
  IS_STUDENT_VARIANT: true,
}));

vi.mock('@/data/workplaceRespectFeature', () => ({
  RESPECT_FEATURE_ENABLED: false,
}));

import { GET as getQuestions, PUT as putQuestions } from '@/app/api/questions/route';
import { POST as saveResult } from '@/app/api/results/route';
import { POST as chat } from '@/app/api/chat/route';
import { POST as summarize } from '@/app/api/summarize/route';
import { POST as respectAdvice } from '@/app/api/respect-advice/route';
import {
  GET as getAdminDashboard,
  HEAD as headAdminDashboard,
} from '@/app/api/admin/dashboard/route';

function request(path: string, method: string) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify({}),
  });
}

describe('student product route boundaries', () => {
  it('blocks adult questions and result storage', async () => {
    expect((await getQuestions()).status).toBe(404);
    expect((await putQuestions(request('/api/questions', 'PUT'))).status).toBe(404);
    expect((await saveResult(request('/api/results', 'POST'))).status).toBe(404);
  });

  it('blocks adult AI and workplace-respect advice', async () => {
    expect((await chat(request('/api/chat', 'POST'))).status).toBe(404);
    expect((await summarize(request('/api/summarize', 'POST'))).status).toBe(404);
    expect((await respectAdvice(request('/api/respect-advice', 'POST'))).status).toBe(404);
  });

  it('blocks the adult administration API', async () => {
    expect((await headAdminDashboard(request('/api/admin/dashboard', 'HEAD'))).status).toBe(404);
    expect((await getAdminDashboard(request('/api/admin/dashboard', 'GET'))).status).toBe(404);
  });
});
