export const MAX_DISPLAY_NAME_LENGTH = 12;

export function normalizeDisplayName(value: string | null | undefined): string {
  const cleaned = (value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return Array.from(cleaned).slice(0, MAX_DISPLAY_NAME_LENGTH).join('');
}

export function formatNamedResultTitle(displayName: string, styleName: string): string {
  return displayName ? `'${displayName}'님은 ${styleName}` : styleName;
}
