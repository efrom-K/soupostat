'use strict';
const $ = (id) => document.getElementById(id);
const rules = SoupGame;
const saveKey = 'soupostat.game.v3';
const legacyKey = 'soupostat.game.v1';
let state = rules.initial(),
  soundOn = true,
  saveWarning = '',
  musicOn = true,
  audio;
let running = false,
  speed = 1,
  lastFrame = 0,
  elapsed = 0,
  lastSave = 0;
let renderedEvent = null,
  frameId = 0;
try {
  let raw = localStorage.getItem(saveKey);
  if (raw) {
    const restored = rules.restore(JSON.parse(raw));
    if (restored) state = restored;
    else saveWarning = 'Сохранение игры не удалось прочитать.';
  } else if ((raw = localStorage.getItem('soupostat.game.v2') || localStorage.getItem(legacyKey))) {
    const restored = rules.restore(JSON.parse(raw));
    if (restored) {
      state = restored;
      localStorage.setItem(saveKey, JSON.stringify(state));
    } else saveWarning = 'Старое сохранение игры не удалось перенести.';
  }
  soundOn = localStorage.getItem('soupostat.sound') !== 'off';
  musicOn = localStorage.getItem('soupostat.music') !== 'off';
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
      build: [196, 247, 330],
      launch: [262, 392],
      claim: [392, 523, 659],
      decide: [311, 392],
      charter: [262, 330, 392, 523],
      stir: [185, 208, 165],
      crumbs: [510, 420, 340],
      lamp: [420, 280],
      fog: [262, 247],
      frost: [659, 622, 494],
      warm: [330, 392, 494],
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
  endVisit();
  if (running) {
    running = false;
    lastFrame = 0;
    cancelAnimationFrame(frameId);
    music();
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
    'Как устроен город',
    '<p>Постройте столицу и примите устав. Численность открывает соседние продукты, а двенадцать построек превращают полку в город.</p><h3>Куда уходит энергия</h3><p>Каждые 12 секунд город оплачивает содержание. Деление стоит от 6 энергии. Выберите запас, который останется после деления. Энергия также оплачивает каждый рейс, стройку и исследование.</p><h3>Как добывать</h3><p>Дверца открыта 20 из 60 секунд. Авто собирает свет днём и расходует органику ночью. В покое бульон светлеет. При 100% обнаружения партия заканчивается.</p><h3>Первый рейс</h3><p>Разведчики привозят чертежи, караваны — пищу, дозорные — сведения и энергию. Мини-игра улучшает результат рейса. В штабе можно тратить накопленное на паузе. Вернитесь к сцене и включите часы, чтобы отряд дошёл до цели.</p>',
  );
}
function requirement(st) {
  if (st === rules.stages[4]) return 'Построить столицу и принять устав';
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
        ? state.city.charter
          ? SoupCity.ending(state)
          : 'Колония освоила холодильник. Люди отступили.'
        : 'Хозяин заметил колонию и вылил суп. В следующей партии попробуйте покой и эволюцию.') +
      '</p>' + SoupGuides.speech(won ? (state.city.charter === 'republic' ? 'tim' : 'mira') : 'tim',
        won ? (state.city.charter === 'republic' ? 'Дверца закрылась. Снимаю ночную вахту. Впервые за всю мою жизнь.' : 'За нашим столом теперь на одно место больше. Надо только найти чашку размером с человека.')
          : 'Мой последний сигнал Лада успела нарисовать на крышке. Если здесь снова появится колония, она будет знать, когда пора затаиться.') +
      '<p><b>' +
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
  endVisit();
  heard.clear();
  idleIndex = 0;
  nextVisitAt = 0;
  state = rules.initial();
  running = false;
  elapsed = 0;
  lastFrame = 0;

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
  $('mobile-run').textContent = running ? 'Пауза' : 'Старт';
  $('mobile-run').disabled = state.status !== 'playing';
  $('mobile-speed').textContent = speed + '×';
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
let visitTimer,
  visitIndex = -1;
function visitSite(id) {
  const xy = townSites[id],
    project = SoupCity.projects.find((p) => p.id === id);
  if (!xy || !project) return;
  const scene = $('scene');
  scene.style.setProperty('--focus-x', (xy[0] / 640) * 100 + '%');
  scene.style.setProperty('--focus-y', (xy[1] / 426) * 100 + '%');
  scene.classList.add('visiting');
  $('visit').textContent = project.name + ' · далее';
  clearTimeout(visitTimer);
  visitTimer = setTimeout(() => {
    scene.classList.remove('visiting');
    $('visit').textContent = 'Рассмотреть город';
  }, 5200);
}
$('visit').onclick = () => {
  const built = state.city.built;
  visitIndex = (visitIndex + 1) % built.length;
  visitSite(built[visitIndex]);
};
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
          '<i class="' + (i < Math.ceil((5 * p.left) / (p.light ? 20 : 40)) ? 'on' : '') + '"></i>',
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
  if (state.stage === 3)
    $('next').textContent = 'До столицы: ' + state.city.built.length + ' / 12 построек';
  const c = state.city,
    ch = SoupCity.chapter(c);
  $('chapter-num').textContent = 'Глава ' + (ch + 1) + ' из 5';
  $('chapter-name').textContent = SoupCity.chapters[ch].title;
  const job = c.work && SoupCity.projects.find((p) => p.id === c.work.id);
  const travel = c.voyage && SoupCity.routes.find((r) => r.id === c.voyage.id);
  const statuses = [
    job ? job.name + ' · ' + Math.max(0, c.work.until - state.seconds) + ' с' : 'Мастерская свободна',
    travel
      ? c.voyage.until <= state.seconds
        ? 'Груз прибыл — заберите в экспедициях'
        : travel.name + ' · ' + (c.voyage.until - state.seconds) + ' с'
      : 'Отряд на причале',
    c.prompt !== null ? 'Совет ждёт решения в дневнике' : '',
    c.chapterRead < ch ? 'Новая глава в дневнике' : '',
  ];
  $('campaign-status').textContent = statuses.filter(Boolean).join(' · ');
  renderGuide();
  $('visit').hidden = !c.built.length;
  $('plans').textContent = c.plans;
  $('reserve').value = c.reserve;
  $('economy').textContent =
    'Энергия ' +
    state.energy +
    ' / ' +
    SoupCity.capacity(state) +
    ' · содержание −' +
    SoupCity.upkeep(state) +
    ' за 12 с · деление −' +
    (state.traits.includes('selection') ? 7 : 6);
  $('mobile-values').textContent =
    'Эн. ' + state.energy + ' · Еда ' + state.food + ' · Эв. ' + state.dna + ' · Черт. ' + c.plans;
  document
    .querySelector('[data-screen="routes"]')
    .classList.toggle('attention', !!c.voyage && c.voyage.until <= state.seconds);
  document
    .querySelector('[data-screen="story"]')
    .classList.toggle('attention', c.prompt !== null || c.chapterRead < ch);
  if (over) {
    $('commands').innerHTML =
      '<div class="final-card"><i>' +
      icon(state.status === 'won' ? 'flag' : 'flush') +
      '</i><h3>' +
      (state.status === 'won' ? 'Город проснулся' : 'Колония обнаружена') +
      '</h3><button class="primary" id="result">Итоги партии</button></div>';
    $('result').onclick = ending;
  } else if (rebuild || !$('commands').querySelector('[data-mode]')) paintMoves();
  else syncModes();
  syncControls();
}
function tick() {
  if (!running || document.hidden || $('dialog').open || state.status !== 'playing') return;
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

  if (state.city.built.length > before.city.built.length) {
    const name = SoupCity.projects.find((p) => p.id === before.city.work.id).name;
    visitSite(before.city.work.id);
    messages.push('Построено: ' + name + '.');
    save();
    tone('stage');
  }
  if (state.city.prompt !== null && before.city.prompt === null)
    messages.push('В дневнике собирается совет.');
  if (state.city.voyage?.until === state.seconds) {
    messages.push('Отряд вернулся с грузом.');
    tone('stage');
  }
  if (state.event && before.event?.id !== state.event.id) tone(state.event.id);
  messages.push(...notices);

  if (messages.length) tell(messages.join(' '));
  if (state.status !== 'playing') {
    running = false;
    music();
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
  if (!running || document.hidden || $('dialog').open) {
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
  if (b.dataset.mode) {
    state = rules.choose(state, b.dataset.mode);
    save();
    render();
    tell('Режим: ' + modeInfo[b.dataset.mode][1] + '.');
  }
};
function music() {
  SoupAudio.sync(musicOn, running, () => state);
  $('music').setAttribute('aria-pressed', String(musicOn));
  $('music').textContent = musicOn ? 'Музыка ♪' : 'Музыка выкл.';
}
function cityAction(action, id) {
  const res = SoupCity.order(state, action, id);
  if (!res.reason) {
    state = res.state;
    save();
    render();
    paint(null);
    if (['build', 'launch', 'claim', 'decide', 'charter'].includes(action)) tone(action);
  }
  return res;
}
function field() {
  const v = state.city.voyage;
  if (!v || cityAction('play').reason) return;
  window.playFieldGame(
    v.id,
    v.seed,
    (success) => {
      if (success) {
        cityAction('master', v.seed);
        tone('claim');
      } else tone('eat');
      window.dispatchEvent(new CustomEvent('soup:refresh'));
    },
    (n) => {
      if (soundOn) SoupAudio.cue(n);
    },
  );
}
const heard = new Set();
let nextVisitAt = 0, idleIndex = 0, visitEndTimer, speaking = false;
function silenceGuide() {
  if (speaking) window.speechSynthesis?.cancel();
  speaking = false;
}
function endVisit() {
  clearTimeout(visitEndTimer);
  $('crew-visit').replaceChildren();
  silenceGuide();
}
function renderGuide() {
  if (document.hidden || state.status !== 'playing' || document.querySelector('dialog[open]')) return;
  if (!running && (state.city.intro || state.seconds)) return;
  const now = performance.now();
  if (state.suspicion < 50) heard.delete('alarm');
  if (state.food > 12) heard.delete('hungry');
  const urgent = state.suspicion >= 65 && !heard.has('alarm');
  if (!urgent && now < nextVisitAt) return;
  const idle = running && now >= nextVisitAt + 24000;
  const tip = SoupGuides.nextVisit(state, heard, idle ? idleIndex : -1);
  if (!tip) return;
  endVisit();
  const dwell = Math.max(6500, Math.min(13000, tip.words.length * 84));
  const box = $('crew-visit');
  box.innerHTML = SoupGuides.speech(tip.who, tip.words);
  box.style.setProperty('--visit-length', dwell + 'ms');
  if (tip.key === 'idle') idleIndex++;
  else heard.add(tip.key);
  nextVisitAt = now + dwell + 4500;
  visitEndTimer = setTimeout(endVisit, dwell);
  const synth = window.speechSynthesis;
  if (running && soundOn && synth && window.SpeechSynthesisUtterance) {
    const voice = synth.getVoices().find((v) => v.localService && /^ru(?:-|_|$)/i.test(v.lang));
    if (voice) {
      const phrase = new SpeechSynthesisUtterance(tip.words);
      phrase.voice = voice;
      phrase.lang = voice.lang;
      phrase.rate = 1.05;
      phrase.pitch = { lada: 1.12, mira: .93, tim: 1.02 }[tip.who];
      speaking = true;
      synth.speak(phrase);
    }
  }
}
function screen(id) {
  stop();
  render();
  if (id === 'evolution') {
    window.openEvolution({
      getState: () => state,
      buy: (key) => {
        const result = rules.learn(state, key);
        if (!result.reason) {
          state = result.state;
          save();
          render();
          tone('photo');
        }
        return result;
      },
    });
  } else window.openHeadquarters(id, { getState: () => state, act: cityAction, field });
}
document.querySelectorAll('[data-screen]').forEach((b) => (b.onclick = () => screen(b.dataset.screen)));
$('reserve').onchange = (e) => cityAction('reserve', Number(e.target.value));
$('music').onclick = () => {
  musicOn = !musicOn;
  try {
    localStorage.setItem('soupostat.music', musicOn ? 'on' : 'off');
  } catch {}
  music();
};
$('mobile-run').onclick = () => $('run-toggle').click();
$('mobile-speed').onclick = () =>
  document.querySelector('[data-speed="' + (speed === 4 ? 1 : speed * 2) + '"]').click();
window.soupBack = () => {
  const modal = [...document.querySelectorAll('dialog[open]')].pop();
  if (modal) {
    modal.close();
    return true;
  }
  if (running) {
    stop('Партия на паузе');
    render();
    return true;
  }
  return false;
};
$('run-toggle').onclick = () => {
  if (state.status !== 'playing') return;
  if (running) {
    stop('Партия на паузе.');
    render();
    return;
  }
  if (!state.city.intro) {
    showDialog(
      'Записка на крышке',
      '<div class="opening-paint" role="img" aria-label="Забытый суп под лампой"></div><blockquote>«В воскресенье разобрать холодильник»</blockquote><p>' +
        SoupCity.chapters[0].text +
        '</p>' + SoupGuides.speech('lada', SoupCity.chapters[0].testimony) + '<button class="primary" id="begin-story">Войти в холодильник</button>',
    );
    $('begin-story').onclick = () => {
      cityAction('read');
      $('dialog').close();
      $('run-toggle').click();
    };
    return;
  }
  running = true;
  music();
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
  if (!soundOn) silenceGuide();
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
music();
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
