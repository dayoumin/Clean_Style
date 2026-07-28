import { describe, expect, it } from 'vitest';
import { DIAGNOSTIC_REGISTRY } from '@/diagnostics';
import { PRODUCTS_BY_VARIANT, resolveProduct } from '@/products';

describe('product definitions', () => {
  it('keeps the three product compositions distinct', () => {
    expect(PRODUCTS_BY_VARIANT.default.diagnostics).toEqual(['adult-integrity']);
    expect(PRODUCTS_BY_VARIANT.plus.diagnostics).toEqual([
      'adult-integrity',
      'workplace-respect',
    ]);
    expect(PRODUCTS_BY_VARIANT.student.diagnostics).toEqual(['student-integrity']);
  });

  it('does not enable adult capabilities for the student product', () => {
    const student = PRODUCTS_BY_VARIANT.student;

    expect(student.audience).toBe('student');
    expect(student.features.aiChat).toBe(false);
    expect(student.features.workplaceRespect).toBe(false);
    expect(student.features.adultResultHistory).toBe(false);
    expect(student.primaryDiagnosticId).toBe('student-integrity');
  });

  it('uses the default product only when the variant is omitted or explicit', () => {
    expect(resolveProduct(undefined).id).toBe('clean-style');
    expect(resolveProduct('')).toBe(PRODUCTS_BY_VARIANT.default);
    expect(resolveProduct('default')).toBe(PRODUCTS_BY_VARIANT.default);
  });

  it('fails closed for unknown product variants', () => {
    expect(() => resolveProduct('studnet')).toThrow('Unknown NEXT_PUBLIC_APP_VARIANT');
  });

  it('registers every diagnostic selected by a product', () => {
    for (const product of Object.values(PRODUCTS_BY_VARIANT)) {
      for (const diagnosticId of product.diagnostics) {
        expect(DIAGNOSTIC_REGISTRY[diagnosticId]).toBeDefined();
      }
    }
  });

  it('keeps student scoring explicitly unscored during planning', () => {
    const student = DIAGNOSTIC_REGISTRY['student-integrity'];

    expect(student.status).toBe('planning');
    expect(student.scoringVersion).toBe('unscored-p0');
    expect(student.storagePolicy).toBe('session-only');
    expect(student.resultMode).toBe('unscored-feedback');
  });
});
