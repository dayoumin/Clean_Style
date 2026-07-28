import type { DiagnosticId } from '../diagnostics/core/types';

export type AppVariant = 'default' | 'plus' | 'student';
export type ProductId = 'clean-style' | 'clean-style-plus' | 'clean-style-student';

export interface ProductCopy {
  title: string;
  shortTitle: string;
  description: string;
  homePrompt: string;
  primaryDiagnosticTitle: string;
  primaryDiagnosticDescription: string;
}

export interface ProductDefinition {
  id: ProductId;
  variant: AppVariant;
  audience: 'adult' | 'student';
  diagnostics: readonly DiagnosticId[];
  primaryDiagnosticId: DiagnosticId;
  features: {
    aiChat: boolean;
    workplaceRespect: boolean;
    adultResultHistory: boolean;
  };
  copy: ProductCopy;
}
