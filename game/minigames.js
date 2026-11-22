(function (root) {
  'use strict';

  const dirs = [
    { dx: 0, dy: -1, bit: 1, opposite: 4, name: 'сверху' },
    { dx: 1, dy: 0, bit: 2, opposite: 8, name: 'справа' },
    { dx: 0, dy: 1, bit: 4, opposite: 1, name: 'снизу' },
    { dx: -1, dy: 0, bit: 8, opposite: 2, name: 'слева' },
  ];

  function randomFor(seed) {
    let state;
    if (typeof seed === 'number' && Number.isFinite(seed)) state = seed >>> 0;
    else {
      state = 2166136261;
      for (const char of String(seed ?? ''))
        state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
    }
    if (!state) state = 0x6d2b79f5;
    return function () {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 0x100000000;
    };
  }

  function rotate(mask, amount = 1) {
    for (let i = 0; i < amount; i++) mask = ((mask << 1) & 15) | (mask >>> 3);
    return mask;
  }

  function createSurvey(seed) {
    const rand = randomFor(seed);
    const size = 5;
    const vertical = rand() < 0.5;
    const path = [];
    if (vertical) {
      for (let x = 0; x < size; x++) {
        const ys = x % 2 ? [...Array(size).keys()].reverse() : [...Array(size).keys()];
        for (const y of ys) path.push(y * size + x);
      }
    } else {
      for (let y = 0; y < size; y++) {
        const xs = y % 2 ? [...Array(size).keys()].reverse() : [...Array(size).keys()];
        for (const x of xs) path.push(y * size + x);
      }
    }
    const masks = Array(size * size).fill(0);
    for (let i = 0; i < path.length; i++) {
      for (const otherIndex of [i - 1, i + 1]) {
        if (otherIndex < 0 || otherIndex >= path.length) continue;
        const from = path[i],
          to = path[otherIndex];
        const x = from % size,
          y = Math.floor(from / size);
        const nx = to % size,
          ny = Math.floor(to / size);
        const dir = dirs.find((d) => d.dx === nx - x && d.dy === ny - y);
        masks[from] |= dir.bit;
      }
    }
    const tiles = masks.map((mask, index) => ({
      id: index,
      mask,
      turns: index === path[0] ? 1 : Math.floor(rand() * 4),
      start: index === path[0],
      exit: index === path[path.length - 1],
    }));
    return { size, tiles };
  }

  function surveyRoute(board) {
    const { size, tiles } = board;
    const target = tiles.length - 1;
    const visited = new Set();
    const path = [];
    function walk(id) {
      if (id === target) {
        path.push(id);
        return true;
      }
      visited.add(id);
      path.push(id);
      const x = id % size,
        y = Math.floor(id / size);
      const mask = rotate(tiles[id].mask, tiles[id].turns);
      for (const dir of dirs) {
        if (!(mask & dir.bit)) continue;
        const nx = x + dir.dx,
          ny = y + dir.dy;
        if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
        const next = ny * size + nx;
        if (visited.has(next)) continue;
        const nextMask = rotate(tiles[next].mask, tiles[next].turns);
        if (nextMask & dir.opposite && walk(next)) return true;
      }
      path.pop();
      return false;
    }
    return walk(0) ? [...path] : null;
  }

  function createSupply(seed) {
    const rand = randomFor(seed);
    const names = [
      'Морковная стружка',
      'Крошка сыра',
      'Семечко',
      'Капля бульона',
      'Листик зелени',
      'Сухарь',
    ];
    let items = [];
    let limit = 0;
    for (let attempt = 0; attempt < 80; attempt++) {
      items = names.map((name, id) => ({ name, weight: 1 + Math.floor(rand() * 11), id }));
      const chosen = new Set();
      while (chosen.size < 3) chosen.add(Math.floor(rand() * items.length));
      limit = [...chosen].reduce((sum, id) => sum + items[id].weight, 0);
      let matches = 0;
      for (let a = 0; a < 4; a++)
        for (let b = a + 1; b < 5; b++)
          for (let c = b + 1; c < 6; c++) {
            if (items[a].weight + items[b].weight + items[c].weight === limit) matches++;
          }
      if (matches === 1) return { items, limit };
    }
    items = [1, 2, 3, 4, 6, 8].map((weight, id) => ({ name: names[id], weight, id }));
    return { items, limit: 10 };
  }

  const glyphs = [
    { word: 'Капля', color: '#39899a', shape: '●' },
    { word: 'Лист', color: '#568044', shape: '◆' },
    { word: 'Звезда', color: '#c36a36', shape: '▲' },
    { word: 'Косточка', color: '#8a6791', shape: '■' },
  ];

  function esc(value) {
    return String(value).replace(
      /[&<>"']/g,
      (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
    );
  }

  function gameDialog(kind, seed, onFinish, playCue) {
    const old = document.querySelector('.field-game-dialog');
    if (old?.open) old.close();
    let done = false;
    const timers = new Set();
    const dialog = document.createElement('dialog');
    dialog.className = 'field-game-dialog';
    dialog.setAttribute('aria-labelledby', 'field-game-title');
    const later = (fn, delay) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (!done) fn();
      }, delay);
      timers.add(timer);
      return timer;
    };
    const finish = (success) => {
      if (done) return;
      done = true;
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      if (dialog.open) dialog.close();
      dialog.remove();
      if (typeof onFinish === 'function') onFinish(Boolean(success));
    };
    const frame = (title, hint, content) => {
      dialog.innerHTML = `<header class="fg-head"><div><p class="fg-kicker">Экспедиция · полевой журнал</p><h2 id="field-game-title">${title}</h2></div><button class="fg-close" type="button" aria-label="Завершить экспедицию">×</button></header>${root.SoupGuides.speech(root.SoupGuides.routeCrew[kind], hint)}${content}<p class="fg-status" aria-live="polite" data-status></p>`;
      dialog.querySelector('.fg-close').addEventListener('click', () => finish(false));
    };
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      finish(false);
    });
    dialog.addEventListener('close', () => finish(false));
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) finish(false);
    });
    document.body.append(dialog);

    if (kind === 'survey') {
      const board = createSurvey(seed);
      const cell = (tile) => {
        const paths = dirs
          .filter((dir) => tile.mask & dir.bit)
          .map((dir) => {
            const end =
              dir.bit === 1 ? '32 2' : dir.bit === 2 ? '62 32' : dir.bit === 4 ? '32 62' : '2 32';
            return `<path d="M32 32 L${end}"/>`;
          })
          .join('');
        return `<button class="fg-tile${tile.start ? ' is-start' : ''}${tile.exit ? ' is-exit' : ''}" type="button" data-cell="${tile.id}" aria-label="Плитка ${tile.id + 1}${tile.start ? ', старт' : ''}${tile.exit ? ', выход' : ''}; повернуть по часовой стрелке"><svg viewBox="0 0 64 64" aria-hidden="true"><rect x="3" y="3" width="58" height="58" rx="12"/><g class="fg-pipe" transform="rotate(${tile.turns * 90} 32 32)">${paths}</g><circle cx="32" cy="32" r="7" class="fg-joint"/></svg>${tile.start ? '<span class="fg-mark">СТАРТ</span>' : tile.exit ? '<span class="fg-mark">ВЫХОД</span>' : ''}<span class="fg-rotate" aria-hidden="true">↻</span></button>`;
      };
      frame(
        'Маршрут в отстойнике',
        'Поворачивай плитки, пока открытые концы не соединят старт и выход. Касайся плитки или выбери её клавишами и нажми Enter / пробел.',
        `<div class="fg-survey" role="group" aria-label="Поворотные плитки маршрута">${board.tiles.map(cell).join('')}</div><div class="fg-legend"><span><i class="fg-dot fg-dot-start"></i>Старт</span><span><i class="fg-dot fg-dot-exit"></i>Выход</span><span>Труба должна совпасть с соседней с обеих сторон.</span></div>`,
      );
      const status = dialog.querySelector('[data-status]');
      const buttons = [...dialog.querySelectorAll('[data-cell]')];
      const update = () => {
        const connected = surveyRoute(board);
        for (const button of buttons)
          button.classList.toggle(
            'is-on-route',
            Boolean(connected?.includes(Number(button.dataset.cell))),
          );
        if (connected) {
          buttons.forEach((button) => {
            button.disabled = true;
          });
          status.textContent = 'Есть проход! Разведчики добрались до выхода.';
          later(() => finish(true), 420);
        } else status.textContent = 'Пути пока нет. Проверь, совпадают ли стыки.';
      };
      for (const button of buttons)
        button.addEventListener('click', () => {
          board.tiles[Number(button.dataset.cell)].turns =
            (board.tiles[Number(button.dataset.cell)].turns + 1) % 4;
          button
            .querySelector('svg g')
            .setAttribute(
              'transform',
              `rotate(${board.tiles[Number(button.dataset.cell)].turns * 90} 32 32)`,
            );
          update();
        });
      dialog.querySelector('.fg-survey').addEventListener('keydown', (event) => {
        const current = document.activeElement?.closest('[data-cell]');
        if (!current || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        const id = Number(current.dataset.cell),
          x = id % board.size,
          y = Math.floor(id / board.size);
        const next = {
          ArrowUp: [x, y - 1],
          ArrowDown: [x, y + 1],
          ArrowLeft: [x - 1, y],
          ArrowRight: [x + 1, y],
        }[event.key];
        if (next[0] >= 0 && next[0] < board.size && next[1] >= 0 && next[1] < board.size) {
          event.preventDefault();
          buttons[next[1] * board.size + next[0]].focus();
        }
      });
      status.textContent = 'Найди непрерывный путь от зелёного старта к выходу.';
    } else if (kind === 'supply') {
      const { items, limit } = createSupply(seed);
      const selected = new Set();
      const drawings = [
        '<path d="M17 45 Q27 52 47 28 L41 22 Q27 35 16 37Z"/><path d="M39 23 Q42 12 50 15 M39 23 Q48 23 52 19"/>',
        '<path d="M14 39 Q17 18 42 18 L51 29 Q47 48 25 49Z"/><circle cx="29" cy="32" r="3"/><circle cx="40" cy="39" r="3"/>',
        '<ellipse cx="32" cy="36" rx="13" ry="18" transform="rotate(-24 32 36)"/><path d="M24 22 Q30 30 39 48"/>',
        '<path d="M18 44 Q22 25 37 24 Q48 24 47 37 Q46 48 27 49Z"/><path d="M22 41 Q34 31 44 34"/>',
        '<path d="M17 44 Q31 31 48 36 Q39 50 24 51Z"/><path d="M19 43 Q32 42 43 38 M31 42 L35 49"/>',
        '<path d="M18 25 L43 21 L48 43 L23 48Z"/><path d="M25 28 L39 27 M26 35 L41 33"/>',
      ];
      frame(
        'Укладка припасов',
        `Выбери ровно три припаса. Их общий вес должен быть ровно <b>${limit} г</b>. Припасы можно снять повторным нажатием.`,
        `<div class="fg-cargo"><span>Груз</span><b data-weight>0 / ${limit} г</b><span data-count>0 из 3 припасов</span><div class="fg-cargo-track"><i data-cargo-bar></i></div></div><div class="fg-supplies" role="group" aria-label="Припасы экспедиции">${items.map((item) => `<button class="fg-supply" type="button" data-item="${item.id}" aria-pressed="false"><svg viewBox="0 0 64 64" aria-hidden="true"><path class="fg-food-shape fg-food-${item.id}" d="M0 0"/>${drawings[item.id]}</svg><span>${esc(item.name)}</span><b>${item.weight} г</b></button>`).join('')}</div><button class="fg-primary" type="button" data-submit disabled>Закрепить груз</button>`,
      );
      const status = dialog.querySelector('[data-status]');
      const weightOut = dialog.querySelector('[data-weight]');
      const countOut = dialog.querySelector('[data-count]');
      const bar = dialog.querySelector('[data-cargo-bar]');
      const submit = dialog.querySelector('[data-submit]');
      const update = () => {
        const weight = [...selected].reduce((sum, id) => sum + items[id].weight, 0);
        weightOut.textContent = `${weight} / ${limit} г`;
        countOut.textContent = `${selected.size} из 3 припасов`;
        bar.style.width = `${Math.min(100, (weight / limit) * 100)}%`;
        bar.classList.toggle('is-over', weight > limit);
        submit.disabled = selected.size !== 3 || weight !== limit;
        status.textContent =
          selected.size > 3
            ? 'Нужно оставить ровно три припаса.'
            : weight > limit
              ? 'Груз тяжелее лимита — сними один припас.'
              : selected.size === 3 && weight !== limit
                ? 'Три припаса выбраны, но вес должен точно совпасть.'
                : 'Собери подходящий груз; выбранный припас можно снять.';
      };
      dialog.querySelectorAll('[data-item]').forEach((button) =>
        button.addEventListener('click', () => {
          const id = Number(button.dataset.item);
          if (selected.has(id)) {
            selected.delete(id);
            button.setAttribute('aria-pressed', 'false');
            button.classList.remove('is-picked');
          } else if (selected.size < 3) {
            selected.add(id);
            button.setAttribute('aria-pressed', 'true');
            button.classList.add('is-picked');
          }
          update();
        }),
      );
      submit.addEventListener('click', () => {
        if (!submit.disabled) finish(true);
      });
      update();
    } else if (kind === 'relay') {
      const rand = randomFor(seed);
      const sequence = Array.from({ length: 4 + Math.floor(rand() * 3) }, () =>
        Math.floor(rand() * glyphs.length),
      );
      frame(
        'Перекличка дозорных',
        'Запомни порядок слов, фигур и вспышек. Звук можно включить или выключить: подсказка всегда видна и написана. Затем повтори последовательность.',
        `<div class="fg-relay-readout" data-readout aria-live="polite" aria-atomic="true">Нажми «Показать последовательность», когда будешь готов.</div><div class="fg-glyphs" role="group" aria-label="Сигнальные знаки дозорных">${glyphs.map((glyph, id) => `<button type="button" class="fg-glyph" data-glyph="${id}" style="--glyph:${glyph.color}" aria-label="${glyph.word}, клавиша ${id + 1}"><span class="fg-shape" aria-hidden="true">${glyph.shape}</span><b>${glyph.word}</b><small>Клавиша ${id + 1}</small></button>`).join('')}</div><div class="fg-relay-actions"><button class="fg-secondary" type="button" data-replay>Показать последовательность</button><span data-progress>0 из ${sequence.length}</span></div>`,
      );
      let showing = false;
      let input = [];
      let active = -1;
      const status = dialog.querySelector('[data-status]');
      const readout = dialog.querySelector('[data-readout]');
      const progress = dialog.querySelector('[data-progress]');
      const glyphButtons = [...dialog.querySelectorAll('[data-glyph]')];
      const replay = dialog.querySelector('[data-replay]');
      const cue = (pitch) => {
        try {
          if (typeof playCue === 'function') playCue(pitch);
        } catch (_) {
          /* visual cue is sufficient */
        }
      };
      const reveal = (at = 0) => {
        if (done) return;
        if (at >= sequence.length) {
          showing = false;
          active = -1;
          glyphButtons.forEach((button) => button.classList.remove('is-lit'));
          readout.textContent = 'Теперь повтори знаки по порядку. Можно снова посмотреть подсказку.';
          status.textContent = 'Твой ход.';
          return;
        }
        active = sequence[at];
        glyphButtons.forEach((button, index) => button.classList.toggle('is-lit', index === active));
        readout.textContent = `Сигнал ${at + 1} из ${sequence.length}: ${glyphs[active].word}.`;
        cue(active);
        later(() => {
          glyphButtons[active]?.classList.remove('is-lit');
          later(() => reveal(at + 1), 150);
        }, 490);
      };
      replay.addEventListener('click', () => {
        if (showing) return;
        showing = true;
        input = [];
        progress.textContent = `0 из ${sequence.length}`;
        glyphButtons.forEach((button) => button.classList.remove('is-lit'));
        status.textContent = 'Смотри и слушай внимательно.';
        reveal();
      });
      glyphButtons.forEach((button) =>
        button.addEventListener('click', () => {
          if (showing) return;
          const id = Number(button.dataset.glyph);
          cue(id);
          button.classList.add('is-lit');
          later(() => button.classList.remove('is-lit'), 180);
          if (id !== sequence[input.length]) {
            input = [];
            progress.textContent = `0 из ${sequence.length}`;
            readout.textContent = `${glyphs[id].word} — не тот знак. Подсказку можно показать ещё раз.`;
            status.textContent = 'Не страшно: начни снова, когда будешь готов.';
            return;
          }
          input.push(id);
          progress.textContent = `${input.length} из ${sequence.length}`;
          status.textContent =
            input.length === sequence.length ? 'Перекличка совпала!' : 'Верно. Продолжай по памяти.';
          if (input.length === sequence.length) {
            glyphButtons.forEach((glyph) => {
              glyph.disabled = true;
            });
            replay.disabled = true;
            later(() => finish(true), 350);
          }
        }),
      );
      dialog.addEventListener('keydown', (event) => {
        if (/^[1-4]$/.test(event.key) && !showing) {
          event.preventDefault();
          glyphButtons[Number(event.key) - 1].click();
        }
      });
    } else {
      finish(false);
      return;
    }

    dialog.showModal();
    dialog.querySelector('.fg-close').focus();
  }

  root.playFieldGame = gameDialog;
  if (typeof module !== 'undefined' && module.exports)
    module.exports = { createSurvey, surveyRoute, createSupply, randomFor };
})(typeof window !== 'undefined' ? window : globalThis);
