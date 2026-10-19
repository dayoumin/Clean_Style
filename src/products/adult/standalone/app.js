const {
  questions, calculateResult, normalizeDisplayName, formatNamedResultTitle,
  adultCommonArtwork, getAdultResultArtwork, chartValues, AXIS_LABELS, shuffle,
  INSTRUMENT_VERSION, SCORING_VERSION, HISTORY_KEY, PROGRESS_KEY,
  readHistory, writeHistory, readProgress, validAnswers,
} = require('./model');

const { assets, metadata } = JSON.parse(document.getElementById('standalone-data').textContent);
const app = document.getElementById('app');
const notice = document.getElementById('notice');
let storage;
try { storage = window.localStorage; } catch { storage = null; }
let answers = [];
let seed = 0;
let currentResult = null;
let noticeTimer;
let previewUrl = '';
let exportBusy = false;
let renderedRoute = '';
let restoringNavigation = false;
let completed = false;
const resultCache = new Map();

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function button(text, action, className = '') {
  const node = el('button', text, className);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}
function picture(path, className, alt = '') {
  if (!assets[path]) throw new Error(`누락된 그림: ${path}`);
  const node = el('img', null, className);
  node.src = assets[path];
  node.alt = alt;
  node.draggable = false;
  return node;
}
function questionIcon(name) {
  const template = document.createElement('template');
  // Shared authored SVGs are rendered from local source at build time.
  template.innerHTML = metadata.icons[name];
  return template.content.cloneNode(true);
}
function questionNavigation(label, action, previous = false) {
  const control = button('', action, 'question-nav');
  control.setAttribute('aria-label', label); control.title = label;
  const circle = el('span');
  if (previous) {
    const svg = svgElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false' });
    svg.append(svgElement('path', { d: 'm14 6-6 6 6 6' })); circle.append(svg);
  } else circle.append(questionIcon('close'));
  control.append(circle);
  return control;
}
function announce(text) {
  clearTimeout(noticeTimer);
  notice.textContent = text;
  noticeTimer = setTimeout(() => { notice.textContent = ''; }, 6500);
}
function persistProgress() {
  try {
    storage?.setItem(PROGRESS_KEY, JSON.stringify(answers.length && answers.length <= questions.length
      ? { instrumentVersion: INSTRUMENT_VERSION, scoringVersion: SCORING_VERSION, answers, seed } : null));
  } catch { /* The current in-memory test remains usable if file storage is denied. */ }
}
function resetView(route, focus = true) {
  const previousRoute = renderedRoute;
  renderedRoute = route;
  app.replaceChildren();
  const state = { route, answers: [...answers], seed, resultId: route === 'result' ? currentResult?.id : null };
  if (!previousRoute || restoringNavigation || previousRoute === route) window.history.replaceState(state, '', `#${route}`);
  else window.history.pushState(state, '', `#${route}`);
  window.scrollTo(0, 0);
  if (focus) requestAnimationFrame(() => {
    const heading = app.querySelector('h1');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  });
}
function home() {
  resetView('home', false);
  const box = el('section', null, 'home');
  const brand = el('div', null, 'brand');
  // Trusted build-time markup from the shared institutional SVG component only.
  const template = document.createElement('template'); template.innerHTML = metadata.brandMarkup;
  brand.append(template.content.cloneNode(true));
  const heading = el('h1');
  heading.append(el('span', '나의 청렴 스타일은?', 'sr-only'), picture('/images/integrity-home-title-smile.png', 'title-image'));
  const facts = el('div', null, 'facts');
  ['15개 상황', '약 3분', '정답 없음'].forEach(text => facts.append(el('span', text)));
  box.append(brand, heading, picture(adultCommonArtwork.home, 'hero-image'), facts);
  const progress = !completed && answers.length ? { answers: [...answers], seed } : readProgress(storage);
  if (progress) {
    box.append(button(`이어하기 · ${progress.answers.length}/${questions.length}`, () => {
      answers = [...progress.answers]; seed = progress.seed; completed = false; question();
    }, 'primary wide'));
    box.append(button('처음부터 시작하기', start, 'quiet'));
  } else box.append(button('시작하기', start, 'primary wide'));
  if (readHistory(storage).length) box.append(button('이전 결과 보기', history, 'quiet'));
  app.append(box);
}
function start() {
  answers = []; completed = false; seed = Math.floor(Math.random() * 100000);
  persistProgress(); question();
}
function question() {
  if (answers.length === questions.length) { finish(); return; }
  resetView('test');
  const index = answers.length;
  const item = questions[index];
  const toolbar = el('div', null, 'toolbar');
  toolbar.append(el('h1', '나의 청렴 스타일은?'));
  const navigation = el('div', null, 'question-navigation');
  if (index) navigation.append(questionNavigation('이전 문항', () => { answers.pop(); persistProgress(); question(); }, true));
  navigation.append(questionNavigation('검사 중단', home));
  toolbar.append(navigation);
  const progress = el('progress'); progress.max = questions.length; progress.value = index + 1;
  progress.setAttribute('aria-label', `${questions.length}문항 중 ${index + 1}번째`);
  const heading = el('h2', item.situation, 'situation'); heading.tabIndex = -1;
  const choices = el('div', null, 'choices');
  const options = shuffle(item.choices.map((choice, originalIndex) => ({ choice, originalIndex })), item.id * 1000 + seed);
  options.forEach(({ choice, originalIndex }, position) => {
    const control = button('', () => {
      // Ignore a second click from the just-detached previous question.
      if (answers.length !== index) return;
      answers.push(originalIndex); persistProgress(); question();
    }, 'choice');
    control.append(el('span', 'ABCD'[position], 'choice-label'), el('div', choice.text));
    choices.append(control);
  });
  const scene = shuffle(metadata.sceneFiles, seed + 74291)[index % metadata.sceneFiles.length];
  const category = el('div', null, 'category');
  category.append(questionIcon({ research: 'research', admin: 'document', relation: 'handshake' }[item.category]),
    el('span', { research: '연구·데이터', admin: '행정·계약', relation: '관계·소통' }[item.category]));
  app.append(toolbar, el('p', `${index + 1} / ${questions.length}`, 'progress-label'), progress,
    category,
    heading, choices, picture(`/images/adult-integrity/question-ocean/${scene}`, 'ocean'));
  requestAnimationFrame(() => heading.focus({ preventScroll: true }));
}
function finish() {
  resetView('finish');
  app.append(el('h1', '결과가 준비됐어요'), picture(adultCommonArtwork.pause, 'hero-image'));
  const form = el('form');
  const label = el('label', '공유용 이름(선택)', 'field');
  const input = el('input'); input.maxLength = 24; input.placeholder = '이름'; input.autocomplete = 'off';
  label.append(input);
  const submit = el('button', '결과 보기', 'primary wide'); submit.type = 'submit';
  form.append(label, submit);
  form.addEventListener('submit', event => {
    event.preventDefault(); submit.disabled = true;
    currentResult = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(), instrumentVersion: INSTRUMENT_VERSION, scoringVersion: SCORING_VERSION,
      answers: [...answers], name: normalizeDisplayName(input.value),
    };
    const saved = writeHistory(storage, [currentResult, ...readHistory(storage)]);
    completed = true;
    if (saved) {
      try { storage?.setItem(PROGRESS_KEY, 'null'); } catch { /* History already contains the complete result. */ }
    }
    result();
    if (!saved) announce('브라우저에 기록을 저장하지 못했어요. 결과를 이미지로 저장해 주세요.');
  });
  app.append(form, el('p', '이름을 입력하지 않아도 결과를 볼 수 있어요.', 'fine'));
}
function history() {
  resetView('history');
  const heading = el('h1', '이전 결과');
  app.append(heading, el('p', '이 브라우저에 최근 10건을 보관합니다. 파일 이동·이름 변경·브라우저 데이터 삭제 시 기록이 이어지지 않을 수 있어요. 오래 보관할 결과는 이미지로 저장해 주세요.', 'storage-note'));
  const entries = readHistory(storage);
  if (!entries.length) app.append(el('p', '저장된 결과가 없어요.'));
  entries.forEach(entry => {
    const row = el('div', null, 'history-row');
    const info = el('div');
    const calculated = calculateResult(entry.answers);
    info.append(el('p', calculated.style.name), el('small', new Date(entry.createdAt).toLocaleDateString('ko-KR')));
    row.append(info, button('보기', () => { currentResult = entry; result(); }), button('삭제', () => {
      if (!writeHistory(storage, readHistory(storage).filter(item => item.id !== entry.id))) {
        announce('기록을 삭제하지 못했어요. 브라우저 저장 권한을 확인해 주세요.'); return;
      }
      resultCache.delete(entry.id);
      if (currentResult?.id === entry.id) {
        currentResult = null;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = '';
      }
      history();
    }, 'delete'));
    row.querySelector('.delete').setAttribute('aria-label', `${calculated.style.name} 결과 삭제`);
    app.append(row);
  });
  app.append(button('처음으로', home, 'wide'));
}
function svgElement(tag, attributes) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
  return node;
}
function radar(values) {
  const svg = svgElement('svg', { viewBox: '0 0 400 290', class: 'chart', role: 'img', 'aria-label': `나의 성향: ${values.map((value, i) => `${AXIS_LABELS[i]} ${value}점`).join(', ')} (5점 만점)` });
  const point = (i, radius) => [200 + Math.sin(i * Math.PI / 3) * radius, 145 - Math.cos(i * Math.PI / 3) * radius];
  for (let level = 1; level <= 5; level++) svg.append(svgElement('polygon', {
    points: values.map((_, i) => point(i, level * 19).join(',')).join(' '), fill: 'none', stroke: '#dce6e0',
  }));
  values.forEach((value, i) => {
    const [x, y] = point(i, 121);
    const text = svgElement('text', { x, y: y + 5, 'text-anchor': 'middle', fill: '#53675f', 'font-size': 14 });
    text.textContent = `${AXIS_LABELS[i]} ${value}`; svg.append(text);
  });
  svg.append(svgElement('polygon', { points: values.map((value, i) => point(i, value * 19).join(',')).join(' '), fill: '#26735f30', stroke: '#26735f', 'stroke-width': 2 }));
  return svg;
}
function result() {
  if (!currentResult) { home(); return; }
  resultCache.set(currentResult.id, currentResult);
  resetView('result');
  const calculated = calculateResult(currentResult.answers);
  const { style } = calculated;
  const hero = el('section', null, 'result-hero');
  const text = el('div');
  text.append(el('h1', formatNamedResultTitle(currentResult.name, style.name)), el('p', style.description));
  hero.append(text, picture(getAdultResultArtwork(calculated.styleKey), 'result-art'));
  const traits = el('div', null, 'traits');
  style.subtitle.split('-').forEach(item => traits.append(el('span', item)));
  app.append(hero, traits, el('h2', '나의 성향'), radar(chartValues(currentResult.answers)));
  for (const [label, key] of [['강점', 'strength'], ['주의', 'caution'], ['팁', 'tip']]) {
    const section = el('section', null, 'interpretation');
    section.append(el('h3', label), el('p', style[key])); app.append(section);
  }
  const actions = el('div', null, 'actions');
  actions.append(button('처음으로', home), button('이미지로 저장', exportImage, 'primary'));
  app.append(actions);
  const preview = el('section', null, 'preview'); preview.id = 'image-preview'; app.append(preview);
}

async function loadImage(src) {
  const image = new Image(); image.src = src;
  await image.decode();
  if (!image.naturalWidth) throw new Error('Image could not be decoded');
  return image;
}
// Draw directly to canvas: no HTML screenshots, hidden tabs, SVG foreignObject,
// remote fonts, network image services or animation timing are involved.
async function createResultImage(entry) {
  const calculated = calculateResult(entry.answers);
  const { style } = calculated;
  const artwork = await loadImage(assets[getAdultResultArtwork(calculated.styleKey)]);
  await document.fonts?.ready;
  const width = 1000;
  const canvas = document.createElement('canvas'); canvas.width = width;
  const measuring = canvas.getContext('2d');
  if (!measuring) throw new Error('Canvas unavailable');
  const font = '"Segoe UI","Noto Sans KR","Malgun Gothic",sans-serif';
  function lines(text, maxWidth, size, weight = 400) {
    measuring.font = `${weight} ${size}px ${font}`;
    const output = []; let line = '';
    for (const char of Array.from(text)) {
      if (char === '\n') { output.push(line); line = ''; continue; }
      if (line && measuring.measureText(line + char).width > maxWidth) { output.push(line.trimEnd()); line = char.trimStart(); }
      else line += char;
    }
    if (line) output.push(line);
    return output;
  }
  const title = lines(formatNamedResultTitle(entry.name, style.name), 810, 46, 700);
  const description = lines(style.description, 810, 28);
  const sections = [['강점', style.strength], ['주의', style.caution], ['팁', style.tip]]
    .map(([label, content]) => ({ label, content: lines(content, 810, 28) }));
  const headerHeight = 155 + title.length * 62 + description.length * 42;
  canvas.height = headerHeight + 835 + sections.reduce((sum, item) => sum + 90 + item.content.length * 43, 0) + 120;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fffffc'; ctx.fillRect(0, 0, width, canvas.height);
  ctx.fillStyle = '#edf6f1'; ctx.fillRect(0, 0, width, headerHeight);
  function drawText(text, x, y, size, weight = 400, color = '#263e36') {
    ctx.font = `${weight} ${size}px ${font}`; ctx.fillStyle = color; ctx.fillText(text, x, y);
  }
  drawText('Clean Style · 나의 청렴 스타일', 90, 70, 24, 600, '#26735f');
  let y = 140;
  title.forEach(line => { drawText(line, 90, y, 46, 700); y += 62; });
  y += 6;
  description.forEach(line => { drawText(line, 90, y, 28, 400, '#53675f'); y += 42; });
  const imageSize = 300;
  const ratio = Math.min(imageSize / artwork.naturalWidth, imageSize / artwork.naturalHeight);
  const imageWidth = artwork.naturalWidth * ratio; const imageHeight = artwork.naturalHeight * ratio;
  ctx.drawImage(artwork, (width - imageWidth) / 2, headerHeight + 20 + (imageSize - imageHeight) / 2, imageWidth, imageHeight);
  drawText(style.subtitle.split('-').join(' · '), 90, headerHeight + 362, 28, 600, '#26735f');
  const values = chartValues(entry.answers);
  const centerY = headerHeight + 570;
  const point = (i, radius) => [500 + Math.sin(i * Math.PI / 3) * radius, centerY - Math.cos(i * Math.PI / 3) * radius];
  function polygon(points, fill) {
    ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.stroke();
  }
  ctx.strokeStyle = '#dce6e0'; ctx.lineWidth = 2;
  for (let level = 1; level <= 5; level++) polygon(values.map((_, i) => point(i, level * 28)));
  ctx.strokeStyle = '#26735f'; ctx.lineWidth = 3;
  polygon(values.map((value, i) => point(i, value * 28)), '#26735f30');
  ctx.textAlign = 'center';
  values.forEach((value, i) => { const [x, py] = point(i, 191); drawText(`${AXIS_LABELS[i]} ${value}`, x, py + 10, 26); });
  ctx.textAlign = 'left';
  y = headerHeight + 835;
  for (const section of sections) {
    ctx.strokeStyle = '#dce6e0'; ctx.beginPath(); ctx.moveTo(90, y - 28); ctx.lineTo(910, y - 28); ctx.stroke();
    drawText(section.label, 90, y + 10, 30, 700, '#26735f'); y += 62;
    section.content.forEach(line => { drawText(line, 90, y, 28); y += 43; });
    y += 28;
  }
  drawText('재미로 알아보는 청렴 스타일 자기발견 테스트', 90, y + 20, 22, 400, '#53675f');
  drawText(`${INSTRUMENT_VERSION} · ${new Date(entry.createdAt).toLocaleDateString('ko-KR')}`, 90, y + 55, 20, 400, '#53675f');
  const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG generation failed')), 'image/png'));
  return blob;
}
async function exportImage(event) {
  if (exportBusy || !currentResult) return;
  exportBusy = true;
  const control = event.currentTarget; const entry = currentResult;
  control.disabled = true; control.textContent = '이미지 만드는 중…';
  try {
    const blob = await createResultImage(entry);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(blob);
    const download = el('a', 'PNG 다운로드'); download.href = previewUrl;
    download.download = `clean-style-${entry.createdAt.slice(0, 10)}.png`;
    const preview = document.getElementById('image-preview');
    if (preview && currentResult === entry) {
      const image = el('img'); image.src = previewUrl; image.alt = '저장할 청렴 스타일 결과 이미지';
      preview.replaceChildren(el('h2', '결과 이미지'), image, download,
        el('p', '다운로드가 시작되지 않으면 PNG 다운로드를 눌러주세요. 휴대폰에서는 이미지를 길게 눌러 저장할 수도 있어요.', 'fine'));
      download.click();
    }
    if (preview && currentResult === entry) announce('결과 이미지를 만들었어요. 다운로드 또는 아래 미리보기에서 저장해 주세요.');
  } catch {
    announce('이미지를 만들지 못했어요. 결과는 그대로 있으니 다시 시도해 주세요.');
  } finally {
    exportBusy = false; control.disabled = false; control.textContent = '이미지로 저장';
  }
}

window.addEventListener('popstate', event => {
  const state = event.state;
  restoringNavigation = true;
  try {
    if (state && (validAnswers(state.answers, false) || validAnswers(state.answers, true))
      && Number.isInteger(state.seed) && state.seed >= 0 && state.seed < 100000) {
      answers = [...state.answers]; seed = state.seed;
    }
    if (state?.route === 'result') {
      currentResult = resultCache.get(state.resultId) ?? readHistory(storage).find(entry => entry.id === state.resultId) ?? null;
      result();
    } else if (state?.route === 'test') {
      completed = false; persistProgress(); question();
    } else if (state?.route === 'finish' && answers.length === questions.length) {
      completed = false; persistProgress(); finish();
    } else if (state?.route === 'history') history();
    else home();
  } finally { restoringNavigation = false; }
});
window.addEventListener('beforeunload', () => { if (previewUrl) URL.revokeObjectURL(previewUrl); });
home();
