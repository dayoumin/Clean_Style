export const RESPECT_FEATURE_ENABLED = (
  process.env.NEXT_PUBLIC_ENABLE_RESPECT_PILOT === '1'
  || process.env.NODE_ENV !== 'production'
);

