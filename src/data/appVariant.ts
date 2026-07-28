import { ACTIVE_PRODUCT } from '@/products';

export const APP_VARIANT = ACTIVE_PRODUCT.variant;
export const IS_STUDENT_VARIANT = ACTIVE_PRODUCT.id === 'clean-style-student';
export const AI_CHAT_ENABLED =
  ACTIVE_PRODUCT.features.aiChat
  && process.env.NEXT_PUBLIC_ENABLE_AI_CHAT !== '0';
export const RESPECT_PILOT_ENABLED =
  ACTIVE_PRODUCT.features.workplaceRespect
  && process.env.NEXT_PUBLIC_ENABLE_RESPECT_PILOT !== '0';
export const ADULT_RESULT_HISTORY_ENABLED = ACTIVE_PRODUCT.features.adultResultHistory;
export const APP_COPY = ACTIVE_PRODUCT.copy;
