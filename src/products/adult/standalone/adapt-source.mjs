// Adapt browser services only, in memory. Server source files remain untouched.
export function adaptSource(source, filename) {
  function replace(before, after) {
    if (!source.includes(before)) throw new Error(`HTML adapter needs review: ${filename}: ${before.slice(0, 80)}`);
    source = source.replace(before, after);
  }
  if (filename.endsWith('/pages/test-page.tsx')) {
    replace("const STORAGE_KEY = 'integrity-test-progress';", "const STORAGE_KEY = 'clean-style-html-progress-v1';");
    const start = source.indexOf('function loadProgress()');
    const end = source.indexOf('export default function TestPage()');
    if (start < 0 || end < start) throw Error('Test lifecycle adapter needs review');
    source = source.slice(0, start) + source.slice(end);
    source = "import { loadProgress, saveProgress, rememberName, startNew } from '@/products/adult/standalone/runtime';\n" + source;
    replace('setResumeData(saved);', `if (saved.answers.length === questions.length) {
        setAnswers(saved.answers); setShuffleSeed(saved.seed);
        setShareName('name' in saved ? String(saved.name) : '');
      } else setResumeData(saved);`);
    replace('        answers,\n', '        answers,\n        standaloneSeed: shuffleSeed,\n');
    replace('const handleStartNew = () => {', 'const handleStartNew = () => {\n    startNew();');
    replace('new URL(resultUrlRef.current, window.location.origin)', "new URL(resultUrlRef.current, 'https://standalone.invalid')");
    replace('onChange={(event) => setShareName(event.target.value)}', 'onChange={(event) => { setShareName(event.target.value); rememberName(event.target.value); }}');
  }
  if (filename.endsWith('/pages/ResultClient.tsx')) {
    // Drop the entire analytics effect, not just its visible controls.
    const start = source.indexOf('  const savedRef = useRef(false);');
    const end = source.indexOf('  useEffect(() => {\n    return () => clearTimeout', start);
    if (start < 0 || end < 0) throw Error('Result analytics adapter needs review');
    source = source.slice(0, start) + source.slice(end);
    const shareStart = source.indexOf('          {!isShared ? (');
    const shareEnd = source.indexOf('          <div className="adult-result-title">', shareStart);
    if (shareStart < 0 || shareEnd < 0) throw Error('File share adapter needs review');
    source = source.slice(0, shareStart) + source.slice(shareEnd);
    const actionStart = source.indexOf('            {AI_CHAT_ENABLED && (');
    const actionEnd = source.indexOf('\n          </div>', actionStart);
    if (actionStart < 0 || actionEnd < 0) throw Error('Result export adapter needs review');
    source = source.slice(0, actionStart) + '            <ExportActions historyId={historyId} />' + source.slice(actionEnd);
    // No copy-link behavior in a file; preserve its reserved spacing for screen parity.
    const functionsStart = source.indexOf('  const getShareUrl = () => {');
    const functionsEnd = source.indexOf('  if (!style)', functionsStart);
    if (functionsStart < 0 || functionsEnd < 0) throw Error('Result service adapter needs review');
    source = source.slice(0, functionsStart) + source.slice(functionsEnd);
    replace('  const chat = useAiChat({ styleKey, historyId, scores });', '');
    const sheetStart = source.indexOf('      {!isShared && AI_CHAT_ENABLED && showModal && (');
    const sheetEnd = source.indexOf('\n    </div>', sheetStart);
    if (sheetStart < 0 || sheetEnd < 0) throw Error('AI sheet adapter needs review');
    source = source.slice(0, sheetStart) + source.slice(sheetEnd);
    source = source.split('\n').filter(line => !/from ['"](?:@\/hooks\/useAiChat|@\/components\/AiAdviceSheet|@\/lib\/client-id)['"]/.test(line)).join('\n');
    source = "import ExportActions from '@/products/adult/standalone/ExportActions';\n" + source;
  }
  if (filename.endsWith('/components/HistoryList.tsx')) {
    replace('    deleteHistoryEntry(id);', '    if (!deleteHistoryEntry(id)) return;');
  }
  return source;
}
