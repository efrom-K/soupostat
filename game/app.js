'use strict';
const $ = (id) => document.getElementById(id);
const rules = SoupGame;
const saveKey = 'soupostat.game.v1';
let state = rules.initial(),
  soundOn = true,
  saveWarning = '',
  tab = 'moves',
  audio;
try {
  const raw = localStorage.getItem(saveKey);
  if (raw) {
    const saved = JSON.parse(raw);
    if (rules.valid(saved)) state = saved;
    else saveWarning = 'Прежнее сохранение не удалось прочитать.';
  }
  soundOn = localStorage.getItem('soupostat.sound') !== 'off';
} catch {
  saveWarning = 'Локальное сохранение недоступно.';
}
const titles = [
  'Забытый суп',
  'Дозор на ободке',
  'Огуречный порт',
  'Республика полки',
  'Город под лампой',
];
const stories = [
  'В бульоне шевельнулась первая колония.',
  'Дозорные заняли ободок. Вид отсюда лучше. И вас виднее.',
  'На огуречной банке подняли первый флаг.',
  'Сырная пристань и стеклянная полка теперь ваши.',
  'На полке зажглись окна. Человек тихо закрывает дверцу.',
];
const stageIcons = ['pot', 'rim', 'jar', 'cheese', 'fridge'];
const shortNames = ['Кастрюля', 'Ободок', 'Банка', 'Полка', 'Холодильник'];
const moves = {
  eat: ['carrot', 'Съесть кусочек'],
  photo: ['bulb', 'Поймать свет'],
  divide: ['divide', 'Разделиться'],
  hide: ['hide', 'Затаиться'],
};
const techs = {
  eaters: [
    'carrot',
    'Крошкоеды',
    'Едоки · основа',
    'Каждая порция приносит на 2 энергии больше и добавляет ещё 2 мути.',
    'Первая ступень ветки едоков.',
  ],
  feast: [
    'pot',
    'Большая ложка',
    'Едоки · специализация',
    'Каждая порция даёт ещё 3 энергии и поднимает ещё 4 мути.',
    'Нужны «Крошкоеды». Альтернатива — «Тихий ужин».',
  ],
  quiet: [
    'hide',
    'Тихий ужин',
    'Едоки · специализация',
    'Каждая порция поднимает на 3 мути меньше. Вы сохраняете выход энергии от «Крошкоедов».',
    'Нужны «Крошкоеды». Альтернатива — «Большая ложка».',
  ],
  banquet: [
    'cheese',
    'Пиршество',
    'Едоки · вершина',
    'Каждая порция также создаёт 2 колонии, но добавляет ещё 4 мути. Запас порций конечен.',
    'Нужна любая специализация едоков.',
  ],
  lights: [
    'bulb',
    'Искра',
    'Светляки · основа',
    'Свет даёт на 3 энергии больше. После каждого сбора в супе остаётся ещё 3 пигмента.',
    'Первая ступень ветки светляков.',
  ],
  flare: [
    'sun',
    'Люстра',
    'Светляки · специализация',
    'Сбор света даёт ещё 4 энергии и добавляет ещё 6 пигмента.',
    'Нужна «Искра». Альтернатива — «Абажур».',
  ],
  shade: [
    'moon',
    'Абажур',
    'Светляки · специализация',
    'При сборе света образуется на 6 пигмента меньше, а выход энергии уменьшается на 1.',
    'Нужна «Искра». Альтернатива — «Люстра».',
  ],
  festival: [
    'flag',
    'Праздник огней',
    'Светляки · вершина',
    'Каждый сбор света также создаёт 2 колонии и добавляет ещё 4 пигмента.',
    'Нужна любая специализация светляков.',
  ],
  pact: [
    'divide',
    'Сговор под крышкой',
    'Общий талант',
    'Укрытие дополнительно снимает 4 очка обнаружения на свету или 8 в темноте.',
    'Требуются обе основы — «Крошкоеды» и «Искра».',
  ],
};
const owned = (id, s = state) =>
  ({
    eaters: s.eaters >= 1,
    lights: s.lights >= 1,
    banquet: s.eaters === 3,
    festival: s.lights === 3,
    pact: s.pact,
  })[id] ||
  s.eatStyle === id ||
  s.lightStyle === id;
const signed = (n) => (n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '0');
const plural = (n, forms) =>
  forms[
    n % 10 === 1 && n % 100 !== 11
      ? 0
      : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)
        ? 1
        : 2
  ];
function count(n, forms) {
  return n + ' ' + plural(n, forms);
}
function requirement(st) {
  const items = [st.pop + ' колоний'];
  if (st.eaters) items.push('едоки ' + st.eaters);
  if (st.lights) items.push('светляки ' + st.lights);
  return items.join(' · ');
}
function save() {
  try {
    localStorage.setItem(saveKey, JSON.stringify(state));
    saveWarning = '';
  } catch {
    saveWarning = 'Хранилище недоступно. Эта партия сохранится только до закрытия окна.';
  }
}
function tell(message) {
  $('feedback').textContent = [message, saveWarning].filter(Boolean).join(' ');
}
function tone(id) {
  if (!soundOn) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    const notes = {
      eat: [230, 290],
      photo: [470, 690],
      hide: [270, 190],
      divide: [330, 440],
      stage: [392, 494, 587],
      won: [392, 494, 587, 784],
      lost: [330, 247, 165],
    };
    (notes[id] || [350, 520]).forEach((f, i) => {
      const o = audio.createOscillator(),
        g = audio.createGain(),
        t = audio.currentTime + i * 0.085;
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.047, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      o.connect(g);
      g.connect(audio.destination);
      o.start(t);
      o.stop(t + 0.17);
    });
  } catch {
    /* Audio is optional on devices without a sound context. */
  }
}
function showSound() {
  $('sound').innerHTML = icon(soundOn ? 'sound' : 'mute');
  $('sound').setAttribute('aria-pressed', String(soundOn));
  $('sound').setAttribute('aria-label', soundOn ? 'Отключить звук' : 'Включить звук');
}
function showDialog(title, body) {
  $('dialog-title').textContent = title;
  $('dialog-body').innerHTML = body;
  if (!$('dialog').open) $('dialog').showModal();
}
function guide() {
  showDialog(
    'Как захватить холодильник',
    '<p>Начните с деления или откройте вкладку «Эволюция» и вложите первые 8 энергии в едоков или светляков.</p><h3>Дверца задаёт ритм</h3><p>Три хода горит лампа, следующие три хода темно. Свет даёт энергию. В бульоне накапливается зелёный пигмент — хлорофилл. Есть можно всегда, но в супе всего восемь порций.</p><h3>Берегитесь человека</h3><p>Зелень, муть и занятая территория добавляют очки видимости. При свете человек их замечает. Глаз рядом с действием показывает точное изменение шкалы. На 100% суп отправится в унитаз. Ночью подозрение спадает.</p><h3>Освойте полку</h3><p>Делитесь, развивайте обе ветки и сверяйтесь с картой. Два равных уровня веток дают больше колоний за деление. На 60 колониях и втором уровне обеих веток холодильник ваш.</p><p>Каждое действие или покупка занимает один ход. Время на выбор не ограничено. Партия сохраняется после хода.</p>',
  );
}
function map() {
  showDialog(
    'Карта захвата',
    rules.stages
      .map(
        (s, i) =>
          '<div class="maprow"><i>' +
          icon(stageIcons[i]) +
          '</i><div><strong>' +
          s.name +
          (i === state.stage ? ' · здесь вы' : '') +
          '</strong><small>' +
          requirement(s) +
          '</small></div></div>',
      )
      .join(''),
  );
}
function ending() {
  const won = state.status === 'won';
  showDialog(
    won ? 'Холодильник ваш!' : 'Большой смыв',
    '<span class="end-art">' +
      icon(won ? 'flag' : 'flush') +
      '</span><p>' +
      (won
        ? 'На банке работает порт, у сыра горят фонари. Человек тянется за молоком, видит город на полке и отступает. О выбрасывании супа больше никто не заговаривает.'
        : 'Хозяин заглянул в кастрюлю и заметил колонию. Суп отправился в унитаз. В следующей партии проверьте прогноз у глаза и попробуйте спрятаться до осмотра.') +
      '</p><p><b>' +
      count(state.turn, ['ход', 'хода', 'ходов']) +
      ' · ' +
      count(state.pop, ['колония', 'колонии', 'колоний']) +
      ' · ' +
      rules.stages[state.stage].name +
      '</b></p><button class="primary" id="new-game">Новая колония</button>',
  );
  $('new-game').onclick = newGame;
}
function newGame() {
  state = rules.initial();
  tab = 'moves';
  save();
  $('dialog').close();
  render();
  paint(null);
  tell(stories[0]);
}
function restart() {
  if (state.status !== 'playing') {
    ending();
    return;
  }
  showDialog(
    'Начать новую партию?',
    '<p>Текущая колония будет заменена четырьмя новыми жителями кастрюли.</p><button class="primary" id="new-game">Начать сначала</button>',
  );
  $('new-game').onclick = newGame;
}
function moveHint(id) {
  const y = rules.yields(state);
  if (id === 'eat')
    return '−3 органики · +' + y.eatEnergy + ' энергии' + (y.eatPop ? ' · +2 колонии' : '');
  if (id === 'photo')
    return (
      '+' +
      y.photoEnergy +
      ' энергии · +' +
      y.photoPigment +
      ' пигмента' +
      (y.photoPop ? ' · +2 колонии' : '')
    );
  if (id === 'divide')
    return (
      '−8 энергии · +' +
      count(4 + Math.min(state.eaters, state.lights), ['колония', 'колонии', 'колоний'])
    );
  return 'Осветлить бульон и осадить муть';
}
function paintMoves() {
  $('commands').innerHTML = Object.entries(moves)
    .map(([id, [pic, label]]) => {
      const preview = rules.step(state, id),
        delta = preview.state.suspicion - state.suspicion;
      const text = preview.reason || moveHint(id);
      return (
        '<button class="move" data-action="' +
        id +
        '" ' +
        (preview.reason ? 'disabled' : '') +
        '><i class="pict">' +
        icon(pic) +
        '</i><span class="move-copy"><strong>' +
        label +
        '</strong><small>' +
        text +
        '</small></span>' +
        (!preview.reason
          ? '<span class="forecast" title="Изменение обнаружения" aria-label="Изменение обнаружения ' +
            signed(delta) +
            '">' +
            icon('eye') +
            signed(delta) +
            '</span>'
          : '') +
        '</button>'
      );
    })
    .join('');
}
function listedCost(id) {
  const cost = rules.techCost(state, id);
  if (cost !== undefined) return cost;
  if (id === 'pact') return 9;
  if (id === 'banquet' || id === 'festival') return 19;
  if (id === 'eaters' || id === 'lights') return 8;
  return 13;
}
function nodeButton(id) {
  const known = owned(id),
    available = !rules.step(state, id).reason;
  return (
    '<button class="tech-node ' +
    (known ? 'known' : available ? 'buyable' : 'locked') +
    '" data-tech="' +
    id +
    '"><i>' +
    icon(techs[id][0]) +
    '</i><span>' +
    techs[id][1] +
    '</span><small>' +
    (known ? 'Изучено' : (available ? '' : 'Закр. · ') + listedCost(id) + ' эн.') +
    '</small></button>'
  );
}
function branch(title, ids, level) {
  return (
    '<div class="branch"><b>' +
    title +
    ' <small>' +
    level +
    '/3</small></b>' +
    nodeButton(ids[0]) +
    '<div class="fork">' +
    nodeButton(ids[1]) +
    nodeButton(ids[2]) +
    '</div>' +
    nodeButton(ids[3]) +
    '</div>'
  );
}
function paintTree() {
  $('commands').innerHTML =
    '<div class="tree">' +
    branch('Едоки', ['eaters', 'feast', 'quiet', 'banquet'], state.eaters) +
    branch('Светляки', ['lights', 'flare', 'shade', 'festival'], state.lights) +
    '</div><div class="joint">' +
    nodeButton('pact') +
    '</div><p class="evo-info">Нажмите на талант, чтобы узнать эффект и условия.</p>';
}
function techDetail(id) {
  const [pic, name, kind, description, requires] = techs[id],
    preview = rules.step(state, id);
  const swap =
    (['quiet', 'feast'].includes(id) && state.eatStyle && state.eatStyle !== id) ||
    (['shade', 'flare'].includes(id) && state.lightStyle && state.lightStyle !== id);
  const consequence = swap
    ? '<p>Новая специализация заменит прежнюю. Уровень ветки сохранится.</p>'
    : '';
  showDialog(
    name,
    '<div class="detail-kind"><i>' +
      icon(pic) +
      '</i>' +
      kind +
      '</div><p>' +
      description +
      '</p><p>' +
      requires +
      '</p>' +
      consequence +
      (owned(id)
        ? '<p><b>Талант изучен.</b></p>'
        : preview.reason
          ? '<p><b>' + listedCost(id) + ' энергии.</b> ' + preview.reason + '</p>'
          : '<p>Обнаружение после хода: ' +
            preview.state.suspicion +
            '% (' +
            signed(preview.state.suspicion - state.suspicion) +
            ').</p><button class="primary" id="purchase">' +
            (swap ? 'Сменить за ' : 'Изучить за ') +
            listedCost(id) +
            ' энергии</button>'),
  );
  if ($('purchase'))
    $('purchase').onclick = () => {
      $('dialog').close();
      act(id);
    };
}
function act(id) {
  const before = state,
    result = rules.step(state, id);
  if (result.reason) {
    tell(result.reason);
    return;
  }
  state = result.state;
  save();
  render();
  const diffEnergy = state.energy - before.energy,
    diffPop = state.pop - before.pop,
    change = state.suspicion - before.suspicion;
  const summary = techs[id] ? 'Изучено: «' + techs[id][1] + '»' : moves[id][1];
  const delta = [
    diffEnergy ? signed(diffEnergy) + ' энергии' : '',
    diffPop ? signed(diffPop) + ' кол.' : '',
    change ? 'обнаружение ' + signed(change) + '%' : '',
  ]
    .filter(Boolean)
    .join(' · ');
  paint(diffPop ? '+' + diffPop + ' кол.' : diffEnergy ? signed(diffEnergy) + ' эн.' : 'Тише…');
  tell(
    summary +
      (delta ? ' · ' + delta : '') +
      '. ' +
      (state.stage > before.stage ? stories[state.stage] : ''),
  );
  tone(state.status !== 'playing' ? state.status : state.stage > before.stage ? 'stage' : id);
  if (state.status !== 'playing') ending();
}
function render() {
  const over = state.status !== 'playing',
    p = rules.phase(over ? { ...state, turn: Math.max(0, state.turn - 1) } : state),
    st = rules.stages[state.stage],
    next = rules.stages[state.stage + 1];
  $('chapter').textContent = 'Территория ' + String(state.stage + 1).padStart(2, '0') + ' / 05';
  $('scene-title').textContent = titles[state.stage];
  $('day').textContent = 'День ' + String(p.day).padStart(2, '0');
  $('scene').classList.toggle('night', !p.light && state.status !== 'won');
  $('phase-chip').innerHTML =
    '<i>' + icon(p.light ? 'sun' : 'moon') + '</i>' + (p.light ? 'Дверца открыта' : 'Дверца закрыта');
  $('territory-caption').textContent =
    state.status === 'won'
      ? 'Цивилизация на полке'
      : state.status === 'lost'
        ? 'Колония обнаружена'
        : 'Заселено · ' + st.name;
  $('watch-label').textContent = over
    ? state.status === 'won'
      ? 'Люди отступили'
      : 'Суп смыт'
    : p.light
      ? p.inspection + ' осмотр'
      : 'Холодильник спит';
  $('watch-note').textContent = over
    ? state.status === 'won'
      ? stories[4]
      : 'Хозяин вылил остатки супа в унитаз.'
    : (p.light ? 'До темноты — ' : 'До включения лампы — ') +
      count(p.left, ['ход', 'хода', 'ходов']) +
      '. ' +
      (p.light ? 'Вас могут заметить.' : 'Вас никто не видит.');
  $('phase-dots').innerHTML = over
    ? ''
    : [1, 2, 3].map((i) => '<i class="' + (i <= p.left ? 'on' : '') + '"></i>').join('');
  $('pop').innerHTML =
    '<i>' + icon('divide') + '</i>' + count(state.pop, ['колония', 'колонии', 'колоний']);
  $('energy').textContent = state.energy;
  $('food').textContent = state.food;
  $('risk').textContent = state.suspicion + '%';
  $('risk-fill').style.width = state.suspicion + '%';
  $('risk-track').setAttribute('aria-valuenow', state.suspicion);
  $('risk').classList.toggle('warning', state.suspicion >= 70);
  const seen = Math.floor(state.pigment / 7) + Math.floor(state.cloud / 6) + state.stage;
  $('visibility').textContent =
    'Видимость ' + seen + ' · Хлорофилл ' + state.pigment + ' · Муть ' + state.cloud;
  $('stage-num').textContent = state.stage + 1 + ' из 5';
  $('route-line').innerHTML = shortNames
    .map(
      (name, i) =>
        '<span class="stop ' +
        (i <= state.stage ? 'reached ' : '') +
        (i === state.stage ? 'active' : '') +
        '"><i>' +
        icon(stageIcons[i]) +
        '</i>' +
        name +
        '</span>',
    )
    .join('');
  $('next').textContent = next
    ? 'Дальше — ' + next.name.toLowerCase() + ' · ' + requirement(next)
    : 'Все территории заселены';
  for (const t of ['moves', 'evo']) {
    $('tab-' + t).setAttribute('aria-selected', String(tab === t));
    $('tab-' + t).tabIndex = tab === t ? 0 : -1;
  }
  $('commands').setAttribute('aria-labelledby', 'tab-' + tab);
  if (over) {
    $('commands').innerHTML =
      '<div class="final-card"><i>' +
      icon(state.status === 'won' ? 'flag' : 'flush') +
      '</i><h3>' +
      (state.status === 'won' ? 'Город проснулся' : 'Колония обнаружена') +
      '</h3><button class="primary" id="result">Итоги партии</button></div>';
    $('result').onclick = ending;
  } else if (tab === 'moves') paintMoves();
  else paintTree();
}
document.querySelectorAll('[data-icon]').forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
$('commands').onclick = (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.tech) {
    techDetail(b.dataset.tech);
    return;
  }
  if (b.dataset.action) {
    act(b.dataset.action);
    const again = document.querySelector('[data-action="' + b.dataset.action + '"]:not(:disabled)');
    if (again && !$('dialog').open) again.focus({ preventScroll: true });
  }
};
function setTab(t) {
  tab = t;
  render();
  $('tab-' + t).focus({ preventScroll: true });
}
for (const t of ['moves', 'evo']) {
  $('tab-' + t).onclick = () => setTab(t);
  $('tab-' + t).onkeydown = (e) => {
    if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      setTab(t === 'moves' ? 'evo' : 'moves');
    }
  };
}
$('guide').onclick = guide;
$('map-top').onclick = map;
$('restart').onclick = restart;
$('close').onclick = () => $('dialog').close();
$('sound').onclick = () => {
  soundOn = !soundOn;
  try {
    localStorage.setItem('soupostat.sound', soundOn ? 'on' : 'off');
  } catch {}
  showSound();
  tone('photo');
};
const paint = startScene($('life'), () => state);
showSound();
render();
if (state.status !== 'playing') ending();
if (saveWarning || state.turn)
  tell(state.turn ? 'Партия восстановлена. ' + stories[state.stage] : stories[0]);
if (
  ['http:', 'https:'].includes(location.protocol) &&
  window.isSecureContext &&
  'serviceWorker' in navigator
)
  navigator.serviceWorker.register('./sw.js').catch(() => {});
