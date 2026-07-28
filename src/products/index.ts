import { defaultProduct } from './default';
import { plusProduct } from './plus';
import { studentProduct } from './student';
import type { AppVariant, ProductDefinition } from './types';

export const PRODUCTS_BY_VARIANT: Readonly<Record<AppVariant, ProductDefinition>> = {
  default: defaultProduct,
  plus: plusProduct,
  student: studentProduct,
};

export function resolveProduct(variant: string | undefined): ProductDefinition {
  if (variant === 'plus' || variant === 'student') {
    return PRODUCTS_BY_VARIANT[variant];
  }
  if (variant === undefined || variant === '' || variant === 'default') {
    return PRODUCTS_BY_VARIANT.default;
  }

  throw new Error(`Unknown NEXT_PUBLIC_APP_VARIANT: ${variant}`);
}

export const ACTIVE_PRODUCT = resolveProduct(process.env.NEXT_PUBLIC_APP_VARIANT);

export type {
  AppVariant,
  ProductCopy,
  ProductDefinition,
  ProductId,
} from './types';
