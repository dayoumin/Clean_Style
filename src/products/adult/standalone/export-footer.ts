// Export-only typography. No changes to the interactive result or server UI.
export const EXPORT_FOOTER_GAP = 16;

export function createExportFooter(): HTMLElement {
  const footer = document.createElement('footer');
  footer.dataset.exportFooter = 'true';
  Object.assign(footer.style, {
    boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '9px',
    padding: '20px 14px 21px', borderRadius: '16px', margin: '0',
    background: 'linear-gradient(180deg, #edf6f1 0%, #f7faf7 100%)',
    textAlign: 'center', fontFamily: 'inherit', whiteSpace: 'normal',
  });

  const institution = document.createElement('p');
  institution.textContent = '국립수산과학원';
  Object.assign(institution.style, {
    margin: '0', color: '#53675f', fontSize: '12px', fontWeight: '600',
    lineHeight: '1.5', letterSpacing: '.02em', wordBreak: 'keep-all', flexShrink: '0',
  });

  const message = document.createElement('p');
  Object.assign(message.style, {
    margin: '0', maxWidth: '100%', color: '#263e36', fontSize: '20px',
    fontWeight: '600', lineHeight: '1.5', letterSpacing: '-.03em',
    wordBreak: 'keep-all', whiteSpace: 'nowrap', flexShrink: '0',
  });
  const emphasis = document.createElement('strong');
  emphasis.textContent = '청렴한 당신';
  Object.assign(emphasis.style, {
    color: '#26735f', fontWeight: '800', textDecorationLine: 'underline',
    textDecorationColor: '#c8e3d7', textDecorationThickness: '3px',
    textUnderlineOffset: '5px',
  });
  message.append(emphasis, document.createTextNode('을 응원합니다.'));
  footer.append(message, institution);
  return footer;
}
