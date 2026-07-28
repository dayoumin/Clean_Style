import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  validateStudentCandidateItems,
  type StudentCandidateItem,
} from '@/diagnostics/student-integrity/candidate-registry';

const root = process.cwd();
const itemBankPath = path.join(root, 'content/student-integrity/item-bank.json');
const items = JSON.parse(fs.readFileSync(itemBankPath, 'utf8')) as StudentCandidateItem[];

describe('student candidate item registry', () => {
  it('contains a valid, review-gated seed set', () => {
    expect(validateStudentCandidateItems(items)).toEqual([]);
    expect(items).toHaveLength(12);
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
    expect(new Set(items.map((item) => item.domain)).size).toBe(6);

    for (const item of items) {
      expect(item.status).toBe('draft');
      expect(item.choices).toHaveLength(4);
      expect(item.reasons).toHaveLength(4);
      expect(Object.values(item.reviews)).toEqual(['pending', 'pending', 'pending']);
    }
  });

  it('keeps help-seeking candidates explicitly marked with safety notes and evidence', () => {
    const helpSeekingItems = items.filter((item) => item.safetyMode === 'help-seeking');

    expect(helpSeekingItems).toHaveLength(4);
    for (const item of helpSeekingItems) {
      expect(item.riskNotes.length).toBeGreaterThan(0);
      expect(item.sourceBasis.content.length).toBeGreaterThan(0);
      expect(item.sourceBasis.method.length).toBeGreaterThan(0);
    }
  });

  it('rejects approval unless every required review is approved', () => {
    const candidate = structuredClone(items[0]);
    candidate.status = 'approved-candidate';
    candidate.reviews = {
      content: 'approved',
      studentLanguage: 'approved',
      safeguarding: 'pending',
    };

    expect(validateStudentCandidateItems([candidate])).toContain(
      `${candidate.id}: approved candidates require all reviews`,
    );

    const missingReview = structuredClone(items[0]) as StudentCandidateItem;
    delete (missingReview.reviews as Partial<StudentCandidateItem['reviews']>).safeguarding;
    expect(validateStudentCandidateItems([missingReview])).toContain(
      `${missingReview.id}: invalid safeguarding review status`,
    );
  });

  it('keeps the generated review-board data synchronized with the canonical JSON', () => {
    const generated = fs.readFileSync(
      path.join(root, 'docs/research/student-integrity/item-bank-data.js'),
      'utf8',
    );
    const serialized = generated
      .replace(/^\/\/.*\r?\nwindow\.STUDENT_ITEM_BANK = /, '')
      .replace(/;\s*$/, '');

    expect(JSON.parse(serialized)).toEqual(items);
  });

  it('links the review board from the student research hub and its evidence anchors exist', () => {
    const hub = fs.readFileSync(
      path.join(root, 'docs/research/student-integrity/index.html'),
      'utf8',
    );
    const evidence = fs.readFileSync(
      path.join(root, 'docs/research/student-integrity/korean-evidence-base.html'),
      'utf8',
    );

    expect(hub).toContain('href="item-bank.html"');
    const sourceIds = items.flatMap((item) => [
      ...item.sourceBasis.content,
      ...item.sourceBasis.method,
    ]);
    for (const sourceId of new Set(sourceIds)) {
      expect(evidence).toContain(`id="${sourceId.toLowerCase()}"`);
    }
  });
});
