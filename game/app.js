'use strict';
const $ = (id) => document.getElementById(id);
const rules = SoupGame;
const saveKey = 'soupostat.game.v2';
const legacyKey = 'soupostat.game.v1';
let state = rules.initial(),
  soundOn = true,
  saveWarning = '',
  tab = 'moves',
  audio;
let running = false,
  speed = 1,
  lastFrame = 0,
  elapsed = 0,
  lastSave = 0,
  branchFilter = '';
let renderedEvent = null,
  frameId = 0;
try {
  let raw = localStorage.getItem(saveKey);
  if (raw) {
    const restored = rules.restore(JSON.parse(raw));
    if (restored) state = restored;
    else saveWarning = 'Сохранение игры не удалось прочитать.';
  } else if ((raw = localStorage.getItem(legacyKey))) {
    const restored = rules.restore(JSON.parse(raw));
    if (restored) {
      state = restored;
      localStorage.setItem(saveKey, JSON.stringify(state));
    } else saveWarning = 'Старое сохранение игры не удалось перенести.';
  }
  soundOn = localStorage.getItem('soupostat.sound') !== 'off';
} catch {
  saveWarning = 'Сохранение игры не удалось прочитать или записать.';
}
const stageIcons = ['pot', 'rim', 'jar', 'cheese', 'fridge'];
const modeInfo = {
  auto: ['sun', 'Авто', 'Свет днём, еда ночью'],
  eat: ['carrot', 'Органика', 'Питаться из запаса при любой фазе'],
  photo: ['bulb', 'Свет', 'Копить энергию при открытой дверце'],
  rest: ['moon', 'Покой', 'Осветлить суп и снизить подозрение'],
};
const count = (n, forms) =>
  n +
  ' ' +
  forms[
    n % 10 === 1 && n % 100 !== 11
      ? 0
      : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)
        ? 1
        : 2
  ];
function save() {
  try {
    localStorage.setItem(saveKey, JSON.stringify(state));
    saveWarning = '';
  } catch {
    saveWarning = 'Не удалось сохранить партию. Продолжайте играть, пока страница открыта.';
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
    /* Audio is optional. */
  }
}
function showSound() {
  $('sound').innerHTML = icon(soundOn ? 'sound' : 'mute');
  $('sound').setAttribute('aria-pressed', String(soundOn));
  $('sound').setAttribute('aria-label', soundOn ? 'Отключить звук' : 'Включить звук');
}
function stop(message) {
  if (running) {
    running = false;
    lastFrame = 0;
    cancelAnimationFrame(frameId);
  }
  save();
  if (message) tell(message);
  syncControls();
}
function showDialog(title, body) {
  stop();
  $('dialog-title').textContent = title;
  $('dialog-body').innerHTML = body;
  if (!$('dialog').open) $('dialog').showModal();
}
function guide() {
  showDialog(
    'Как играть',
    '<p>Колония живёт в реальном времени: один игровой день длится 24 секунды — 10 секунд света и 14 секунд темноты.</p><h3>Выберите стратегию</h3><p>Авто собирает свет днём и ест ночью. Режимы еды и света повторяют выбранное действие, а покой осветляет бульон и снижает обнаружение; рост в покое остановлен.</p><h3>Растите и эволюционируйте</h3><p>Колония добывает ресурсы, делится и получает очки эволюции сама. Откройте карточку таланта, чтобы прочитать эффект и условия. Банка открывается при 24 колониях и приносит 32 органики. Гетеротрофы развивают питание органикой, фототрофы — сбор света. Общие признаки меняют рост популяции. При 100% обнаружения суп смоют.</p><p>Партия сохраняется автоматически. Скорость и паузу можно менять в любой момент.</p>',
  );
}
function requirement(st) {
  return st.pop + ' колоний · + ' + rules.foodReward(state, st) + ' органики · ' + st.source;
}
function map() {
  showDialog(
    'Карта захвата',
    rules.stages
      .map(
        (s, i) =>
          '<div class="maprow"><i>' +
          icon(stageIcons[i % stageIcons.length]) +
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
    won ? 'Холодильник ваш!' : 'Колония обнаружена',
    '<span class="end-art">' +
      icon(won ? 'flag' : 'flush') +
      '</span><p>' +
      (won
        ? 'Колония освоила холодильник. Человек отступил, а город на полке продолжает расти.'
        : 'Хозяин заметил колонию и вылил суп. В следующей партии попробуйте покой и эволюцию.') +
      '</p><p><b>' +
      count(Math.floor(state.seconds), ['секунда', 'секунды', 'секунд']) +
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
  running = false;
  elapsed = 0;
  lastFrame = 0;
  tab = 'moves';
  save();
  $('dialog').close();
  render(true);
  paint(null);
  tell('Новая колония готова. Нажмите «Начать», когда будете готовы.');
}
function restart() {
  showDialog(
    'Начать новую партию?',
    '<p>Текущая колония будет заменена новой.</p><button class="primary" id="new-game">Начать сначала</button>',
  );
  $('new-game').onclick = newGame;
}
function activeTraits() {
  return rules.traits.filter((t) => !branchFilter || t.branch === branchFilter);
}
function paintMoves() {
  $('commands').innerHTML =
    '<div class="mode-list">' +
    Object.entries(modeInfo)
      .map(
        ([id, m]) =>
          '<button class="move mode" data-mode="' +
          id +
          '"><i class="pict">' +
          icon(m[0]) +
          '</i><span class="move-copy"><strong>' +
          m[1] +
          '</strong><small>' +
          m[2] +
          '</small></span></button>',
      )
      .join('') +
    '</div>';
  syncModes();
}
function traitButton(t) {
  const learned = state.traits.includes(t.id),
    unavailable = !!rules.reason(state, t.id);
  return (
    '<button class="tech-node ' +
    (learned ? 'known' : unavailable ? 'locked' : 'buyable') +
    '" data-trait="' +
    t.id +
    '" aria-label="' +
    t.name +
    ', ' +
    (learned ? 'изучено' : t.cost + ' очков эволюции') +
    '"><i>' +
    icon(t.icon) +
    '</i><span>' +
    t.name +
    '</span><small>' +
    (learned ? 'Изучено' : (unavailable ? 'Закр. · ' : '') + t.cost + ' очк.') +
    '</small></button>'
  );
}
function paintTree() {
  const branches = [...new Set(rules.traits.map((t) => t.branch))];
  if (!branches.includes(branchFilter)) branchFilter = branches[0];
  const nodes = activeTraits(),
    tiers = [...new Set(nodes.map((t) => t.tier))].sort((a, b) => a - b);
  const firstAvailable = nodes
    .filter((t) => !rules.reason(state, t.id))
    .sort((a, b) => a.tier - b.tier)[0];
  const openTier = firstAvailable?.tier || 1;
  const tabs = branches
    .map(
      (b) =>
        '<button class="branch-tab" data-branch="' +
        b +
        '" aria-pressed="' +
        (b === branchFilter) +
        '">' +
        b +
        '</button>',
    )
    .join('');
  const rows = tiers
    .map((tier) => {
      const level = nodes.filter((t) => t.tier === tier);
      const ready = level.filter((t) => !rules.reason(state, t.id)).length;
      const learned = level.filter((t) => state.traits.includes(t.id)).length;
      const summary = ready
        ? 'Доступно ' + ready
        : learned
          ? 'Изучено ' + learned + ' из ' + level.length
          : count(level.length, ['признак', 'признака', 'признаков']);
      return (
        '<details class="tier" ' +
        (tier === openTier ? 'open' : '') +
        '><summary>Ярус ' +
        tier +
        '<small>' +
        summary +
        '</small></summary>' +
        level.map(traitButton).join('') +
        '</details>'
      );
    })
    .join('');
  $('commands').innerHTML =
    '<div class="branch-tabs" role="group" aria-label="Ветки эволюции">' +
    tabs +
    '</div><div class="tree">' +
    rows +
    '</div>';
}
function traitDetail(id) {
  const t = rules.traits.find((item) => item.id === id);
  if (!t) return;
  const blocked = rules.reason(state, id),
    learned = state.traits.includes(id);
  showDialog(
    t.name,
    '<div class="detail-kind"><i>' +
      icon(t.icon) +
      '</i>' +
      t.branch +
      ' · ступень ' +
      t.tier +
      '</div><p>' +
      t.definition +
      '</p><p><b>Эффект:</b> ' +
      t.effect +
      '</p><p><b>Зависимости:</b> ' +
      (t.parents.length
        ? t.parents.map((pid) => rules.traits.find((p) => p.id === pid)?.name || pid).join(', ')
        : 'нет') +
      '</p>' +
      (learned
        ? '<p><b>Талант изучен.</b></p>'
        : blocked
          ? '<p><b>' + t.cost + ' очков эволюции.</b> ' + blocked + '</p>'
          : '<p><b>Цена: ' +
            t.cost +
            ' очков эволюции.</b></p><button class="primary" id="purchase">Изучить</button>'),
  );
  if ($('purchase'))
    $('purchase').onclick = () => {
      const learnedResult = rules.learn(state, id);
      if (learnedResult.reason) {
        tell(learnedResult.reason);
        $('dialog').close();
        return;
      }
      state = learnedResult.state;
      save();
      $('dialog').close();
      render(true);
      tell('Изучено: «' + t.name + '».');
      tone('photo');
    };
}
function syncModes() {
  $('commands')
    .querySelectorAll('[data-mode]')
    .forEach((b) => {
      const id = b.dataset.mode;
      b.classList.toggle('selected', state.mode === id);
      b.setAttribute('aria-pressed', String(state.mode === id));
    });
}
function syncControls() {
  const button = $('run-toggle');
  if (button) {
    button.textContent = running ? 'Пауза' : state.seconds ? 'Продолжить' : 'Начать';
    button.setAttribute('aria-pressed', String(running));
    button.disabled = state.status !== 'playing';
  }
  document.querySelectorAll('[data-speed]').forEach((b) => {
    b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === speed));
  });
}
function phaseText(p) {
  return (
    (p.light ? 'Свет' : 'Темнота') + ' · ' + count(Math.ceil(p.left), ['секунда', 'секунды', 'секунд'])
  );
}
function eventInfo(event) {
  return (
    (rules.events || []).find((item) => item.id === event.id) || {
      name: 'Неизвестное событие',
      effect: '',
    }
  );
}
function eventKey(event) {
  return event ? event.id + ':' + event.start : null;
}
function syncEvent() {
  const event = state.event,
    banner = $('event-banner'),
    key = eventKey(event);
  banner.hidden = !event;
  banner.classList.toggle('is-active', !!event);
  if (event) {
    const info = eventInfo(event);
    if (key !== renderedEvent)
      $('event-mark').innerHTML = icon(
        { stir: 'pot', crumbs: 'carrot', lamp: 'bulb', fog: 'eye', frost: 'moon', warm: 'sun' }[
          event.id
        ],
      );
    $('event-name').textContent = info.name;
    $('event-detail').textContent = info.effect;
    $('event-timer').textContent = count(Math.max(0, event.until - state.seconds), [
      'секунда',
      'секунды',
      'секунд',
    ]);
  } else {
    $('event-name').textContent = 'Случайное событие';
    $('event-detail').textContent = 'Сейчас в колонии тихо';
    $('event-timer').textContent = '';
  }
  if (key && key !== renderedEvent) {
    banner.classList.remove('event-start');
    void banner.offsetWidth;
    banner.classList.add('event-start');
  }
  renderedEvent = key;
}
function eventNotices(before, after) {
  const oldKey = eventKey(before),
    newKey = eventKey(after),
    notices = [];
  if (oldKey && oldKey !== newKey) {
    const info = eventInfo(before);
    const message = 'Событие завершилось: ' + info.name + '.';
    notices.push(message);
  }
  if (newKey && oldKey !== newKey) {
    const info = eventInfo(after);
    const message = 'В холодильнике: ' + info.name + '. ' + info.effect;
    notices.push(message);
  }
  return notices;
}
function render(rebuild = false) {
  const p = rules.phase(state),
    st = rules.stages[state.stage],
    next = rules.stages[state.stage + 1],
    over = state.status !== 'playing';
  $('chapter').textContent =
    'Территория ' +
    String(state.stage + 1).padStart(2, '0') +
    ' / ' +
    String(rules.stages.length).padStart(2, '0');
  $('scene-title').textContent = st.name;
  $('day').textContent = 'День ' + String(p.day).padStart(2, '0');
  $('scene').classList.toggle('night', !p.light && !over);
  $('phase-chip').innerHTML = '<i>' + icon(p.light ? 'sun' : 'moon') + '</i>' + phaseText(p);
  syncEvent();
  $('territory-caption').textContent = over
    ? state.status === 'won'
      ? 'Цивилизация на полке'
      : 'Колония обнаружена'
    : 'Заселено · ' + st.name;
  $('watch-label').textContent = over
    ? state.status === 'won'
      ? 'Люди отступили'
      : 'Суп смыт'
    : running
      ? p.light
        ? p.inspection + ' осмотр'
        : 'Холодильник спит'
      : 'Партия на паузе';
  $('watch-note').textContent = over
    ? state.status === 'won'
      ? 'Холодильник теперь ваш.'
      : 'Хозяин заметил колонию.'
    : (running
        ? 'Режим «' + modeInfo[state.mode][1].toLowerCase() + '». '
        : 'Нажмите «' + (state.seconds ? 'Продолжить' : 'Начать') + '». ') +
      (p.light ? 'До темноты — ' : 'До света — ') +
      Math.ceil(p.left) +
      ' с.';
  $('phase-dots').innerHTML = over
    ? ''
    : Array.from(
        { length: 5 },
        (_, i) =>
          '<i class="' + (i < Math.ceil((5 * p.left) / (p.light ? 10 : 14)) ? 'on' : '') + '"></i>',
      ).join('');
  $('pop').innerHTML =
    '<i>' + icon('divide') + '</i>' + count(state.pop, ['колония', 'колонии', 'колоний']);
  $('energy').textContent = Math.floor(state.energy);
  $('food').textContent = Math.floor(state.food);
  $('risk').textContent = Math.floor(state.suspicion) + '%';
  $('risk-fill').style.width = state.suspicion + '%';
  $('risk-track').setAttribute('aria-valuenow', Math.floor(state.suspicion));
  $('risk').classList.toggle('warning', state.suspicion >= 70);
  $('visibility').textContent = 'Хлорофилл ' + state.pigment + ' · Муть ' + state.cloud;
  $('dna').textContent = state.dna;
  $('stage-num').textContent = state.stage + 1 + ' из ' + rules.stages.length;
  $('route-line').innerHTML = rules.stages
    .map(
      (s, i) =>
        '<span class="stop ' +
        (i <= state.stage ? 'reached ' : '') +
        (i === state.stage ? 'active' : '') +
        '"><i>' +
        icon(stageIcons[i % stageIcons.length]) +
        '</i>' +
        s.name +
        '</span>',
    )
    .join('');
  $('next').textContent = next
    ? 'Дальше — ' +
      next.name.toLowerCase() +
      ' · ещё ' +
      Math.max(0, next.pop - state.pop) +
      ' кол. до ' +
      next.pop +
      ' · награда: ' +
      rules.foodReward(state, next) +
      ' органики'
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
  } else if (rebuild || !$('commands').querySelector(tab === 'moves' ? '[data-mode]' : '[data-trait]'))
    tab === 'moves' ? paintMoves() : paintTree();
  else if (tab === 'moves') syncModes();
  syncControls();
}
function tick() {
  if (!running || document.hidden || $('dialog').open || tab === 'evo' || state.status !== 'playing')
    return;
  const before = state,
    oldStage = state.stage;
  state = rules.tick(state);
  const now = performance.now();
  const notices = eventNotices(before.event, state.event),
    messages = [];
  if (state.stage > oldStage) {
    save();
    messages.push(
      'Заселена территория «' +
        rules.stages[state.stage].name +
        '». Открыт запас: ' +
        rules.stages[state.stage].source +
        ' (+' +
        rules.foodReward(state, rules.stages[state.stage]) +
        ' органики).',
    );
    tone('stage');
  }

  messages.push(...notices);

  if (messages.length) tell(messages.join(' '));
  if (state.status !== 'playing') {
    running = false;
    save();
    render();
    tone(state.status);
    ending();
    return;
  }
  if (now - lastSave > 5000) {
    save();
    lastSave = now;
  }
  render();
}
function frame(now) {
  if (!running || document.hidden || $('dialog').open || tab === 'evo') {
    lastFrame = 0;
    return;
  }
  frameId = requestAnimationFrame(frame);
  if (!lastFrame) lastFrame = now;
  elapsed += (Math.min(1000, Math.max(0, now - lastFrame)) * speed) / 1000;
  lastFrame = now;
  while (elapsed >= 1 && running) {
    elapsed -= 1;
    tick();
  }
  paint();
}
document.querySelectorAll('[data-icon]').forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
$('commands').onclick = (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.trait) {
    stop();
    traitDetail(b.dataset.trait);
  }
  if (b.dataset.mode) {
    state = rules.choose(state, b.dataset.mode);
    save();
    render();
    tell('Режим: ' + modeInfo[b.dataset.mode][1] + '.');
  }
  if (b.dataset.branch) {
    branchFilter = b.dataset.branch;
    render(true);
  }
};
function setTab(t) {
  tab = t;
  if (t === 'evo')
    stop('Эволюция на паузе. Вернуться к симуляции можно кнопкой над шкалой обнаружения.');
  render(true);
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
$('run-toggle').onclick = () => {
  if (state.status !== 'playing') return;
  if (running) {
    stop('Партия на паузе.');
    render();
    return;
  }
  if (tab === 'evo') setTab('moves');
  running = true;
  lastFrame = 0;
  frameId = requestAnimationFrame(frame);
  render();
  tell('Колония живёт в режиме «' + modeInfo[state.mode][1] + '».');
};
document.querySelectorAll('[data-speed]').forEach(
  (b) =>
    (b.onclick = () => {
      speed = Number(b.dataset.speed);
      save();
      try {
        localStorage.setItem('soupostat.speed', String(speed));
      } catch {
        saveWarning = 'Не удалось сохранить настройку скорости.';
        tell('');
      }
      syncControls();
    }),
);
$('guide').onclick = guide;
$('map-top').onclick = map;
$('restart').onclick = restart;
$('close').onclick = () => $('dialog').close();
$('dialog').addEventListener('close', () => {
  save();
});
$('sound').onclick = () => {
  soundOn = !soundOn;
  try {
    localStorage.setItem('soupostat.sound', soundOn ? 'on' : 'off');
  } catch {}
  showSound();
  tone('photo');
};
document.addEventListener('visibilitychange', () => {
  if (document.hidden)
    stop('Автопауза: вкладка была скрыта. Нажмите «Продолжить», чтобы вернуться к игре.');
});
const paint = startScene(
  $('life'),
  () => state,
  () => state.seconds + elapsed,
);
try {
  const savedSpeed = Number(localStorage.getItem('soupostat.speed'));
  if ([1, 2, 4].includes(savedSpeed)) speed = savedSpeed;
} catch {}
showSound();
render(true);
paint(null);
syncControls();
if (state.status !== 'playing') ending();
else
  tell(
    state.seconds
      ? 'Партия восстановлена. Ваша территория — ' + rules.stages[state.stage].name.toLowerCase() + '.'
      : 'Дверца открыта. Нажмите «Начать», чтобы колония ожила.',
  );
window.addEventListener('pagehide', () => stop());
if (
  ['http:', 'https:'].includes(location.protocol) &&
  window.isSecureContext &&
  'serviceWorker' in navigator
)
  navigator.serviceWorker.register('./sw.js').catch(() => {});
