(function (root) {
  'use strict';

  const labels = {
    energy: 'энергии',
    food: 'органики',
    dna: 'очк. эволюции',
    plans: 'чертежей',
    trust: 'доверия',
    suspicion: 'подозрения',
  };
  const resources = (items) =>
    Object.entries(items || {})
      .filter(([, value]) => value)
      .map(([key, value]) => `${value > 0 ? '+' : '−'}${Math.abs(value)} ${labels[key] || key}`)
      .join(' · ') || 'Без изменений';
  const esc = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
    );
  const time = (seconds) => `${Math.max(0, Math.ceil(seconds))} сек.`;
  const price = (spec) =>
    resources({ energy: -spec.energy, food: -spec.food, dna: -spec.dna, plans: -spec.plans });

  function openHeadquarters(section, { getState, act, field }) {
    const cityApi = root.SoupCity;
    const game = root.SoupGame;
    if (
      !cityApi ||
      !game ||
      !['routes', 'works', 'story'].includes(section) ||
      typeof getState !== 'function' ||
      typeof act !== 'function' ||
      typeof field !== 'function'
    )
      return null;
    document.getElementById('headquarters-dialog')?.remove();

    const dialog = document.createElement('dialog');
    dialog.id = 'headquarters-dialog';
    dialog.className = 'hq-dialog';
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'headquarters.css';
    dialog.append(stylesheet);
    dialog.insertAdjacentHTML(
      'beforeend',
      `
      <section class="hq-shell" aria-label="Штаб кампании">
        <header class="hq-header"><button type="button" class="hq-back" aria-label="Назад к игре"><span aria-hidden="true">←</span><b>Назад</b></button><div class="hq-title"><p>ПОСЕЛЕНИЯ НА ПОЛКАХ</p><h1>Штаб кампании</h1></div><div class="hq-resources" data-resources></div><button type="button" class="hq-x" aria-label="Закрыть штаб">×</button></header>
        <nav class="hq-tabs" role="tablist" aria-label="Раздел штаба">
          <button type="button" role="tab" data-tab="routes"><span class="hq-tab-icon">↗</span><span>Экспедиции</span></button>
          <button type="button" role="tab" data-tab="works"><span class="hq-tab-icon">⌂</span><span>Стройки</span></button>
          <button type="button" role="tab" data-tab="story"><span class="hq-tab-icon">▤</span><span>Дневник</span></button>
        </nav>
        <main class="hq-content" data-content tabindex="-1"></main>
        <div class="hq-toast" data-toast role="status" aria-live="polite" hidden></div>
      </section>`,
    );
    document.body.append(dialog);

    const content = dialog.querySelector('[data-content]');
    const toast = dialog.querySelector('[data-toast]');
    let active = section;
    let toastTimer;
    const icon = (name) => (typeof root.icon === 'function' ? root.icon(name) : '');
    const state = () => getState();
    const city = () => state().city;
    const chapterIndex = () => cityApi.chapter(city());
    const capacity = () => cityApi.capacity(state());

    function showMessage(message) {
      if (!message) {
        toast.hidden = true;
        return;
      }
      toast.textContent = message;
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.hidden = true;
      }, 4200);
    }
    function perform(action, id) {
      const result = act(action, id);
      showMessage(result?.reason || '');
      render();
      return result;
    }
    function currentResources() {
      const s = state();
      return `<span>${icon('bolt')} ${Math.floor(s.energy)}</span><span>◉ ${Math.floor(s.food)}</span><span>✦ ${Math.floor(s.dna)}</span><span>▧ ${city().plans}</span>`;
    }
    function bindActions() {
      content.querySelectorAll('[data-action]').forEach((button) =>
        button.addEventListener('click', () => {
          const action = button.dataset.action;
          const id = button.dataset.id;
          if (action === 'field') {
            field();
            return;
          }
          const numeric = button.hasAttribute('data-number') ? Number(id) : id;
          perform(action, numeric);
        }),
      );
      content.querySelectorAll('[data-tab-chapter]').forEach((button) =>
        button.addEventListener('click', () => {
          const index = Number(button.dataset.tabChapter);
          activeChapter = index;
          if (index === chapterIndex()) perform('read');
          else render();
        }),
      );
    }
    function routeCard(route, s) {
      const reason = cityApi.quote(s, route.id);
      const button = reason
        ? `<button class="hq-action" type="button" disabled>Недоступно</button><p class="hq-unavailable">${esc(reason)}</p>`
        : `<button class="hq-action" type="button" data-action="launch" data-id="${esc(route.id)}">Отправить экспедицию</button>`;
      return `<article class="hq-card hq-route"><div class="hq-card-top"><span class="hq-icon">${icon(route.id === 'survey' ? 'map' : route.id === 'supply' ? 'jar' : 'sound')}</span><div><p class="hq-overline">ЭКСПЕДИЦИЯ</p><h3>${esc(route.name)}</h3></div></div><p>${esc(route.description)}</p><div class="hq-facts"><span><small>В пути</small><b>${time(route.duration)}${s.city.built.includes('rail') ? ' · с дорогой −12 сек.' : ''}</b></span><span><small>Цена</small><b>${esc(price(route))}</b></span></div><p class="hq-reward"><small>Груз при возвращении</small><b>${esc(resources(cityApi.cargo({ ...s, city: { ...s.city, voyage: { id: route.id, mastery: false } } })))}</b><span>Груз при успехе: ${esc(resources(cityApi.cargo({ ...s, city: { ...s.city, voyage: { id: route.id, mastery: true } } })))}</span></p>${button}</article>`;
    }
    function routesPage() {
      const s = state(),
        voyage = s.city.voyage;
      let current = '';
      if (voyage) {
        const route = cityApi.routes.find((item) => item.id === voyage.id);
        const remaining = Math.max(0, voyage.until - s.seconds);
        const reward = cityApi.cargo(s);
        const status = remaining ? `Отряд в пути · осталось ${time(remaining)}` : 'Отряд вернулся';
        let actions = '';
        if (voyage.played)
          actions = `<p class="hq-game-result ${voyage.mastery ? 'is-success' : ''}">${voyage.mastery ? 'Мини-игра пройдена: бонус груза получен.' : 'Мини-игра завершена без бонуса.'}</p>`;
        else
          actions = `<button class="hq-action" type="button" data-action="field" data-id="${esc(voyage.id)}">Играть в задание</button>`;
        if (remaining && !voyage.hurried)
          actions += `<div><button class="hq-action" type="button" data-action="hurry" ${s.energy < 22 ? 'disabled' : ''}>Ускорить рейс · 22 энергии · до −18 сек.</button>${s.energy < 22 ? `<p class="hq-unavailable">Не хватает ${22 - Math.floor(s.energy)} энергии.</p>` : ''}</div>`;
        else if (voyage.hurried)
          actions += '<p class="hq-game-result">Рейс уже ускорен · 22 энергии · до −18 сек.</p>';
        if (!remaining)
          actions += `<button class="hq-action hq-primary" type="button" data-action="claim">Забрать груз · ${esc(resources(reward))}</button>`;
        current = `<article class="hq-card hq-voyage"><div class="hq-card-top"><span class="hq-icon">${icon('flag')}</span><div><p class="hq-overline">ТЕКУЩЕЕ ДЕЛО</p><h3>${esc(route?.name || 'Экспедиция')}</h3></div></div><p>${esc(status)}</p><div class="hq-result"><small>Результат при возвращении</small><b>${esc(resources(reward))}</b>${voyage.mastery ? '<span>Успешная мини-игра добавила бонусный груз.</span>' : '<span>Успешное задание может увеличить награду.</span>'}</div><div class="hq-actions">${actions}</div></article>`;
      }
      return `<div class="hq-page"><div class="hq-page-head"><div><p class="hq-overline">ДОРОГИ МЕЖДУ ПОСЕЛЕНИЯМИ</p><h2>Экспедиции</h2><p>Выберите рейс. Одновременно может идти одна команда.</p></div><span class="hq-stamp">${s.city.dispatches} рейсов</span></div>${current}<div class="hq-grid">${cityApi.routes.map((route) => routeCard(route, s)).join('')}</div></div>`;
    }
    function projectCard(project, s) {
      const quote = cityApi.quote(s, project.id);
      const built = s.city.built.includes(project.id);
      const working = s.city.work?.id === project.id;
      const parentNames = project.parents
        .map((id) => cityApi.projects.find((p) => p.id === id)?.name)
        .filter(Boolean);
      const territory = game.stages?.[project.stage]?.name || `территория ${project.stage + 1}`;
      const requirements = [
        { label: `${project.pop} колоний`, met: s.pop >= project.pop },
        { label: `территория: ${territory}`, met: s.stage >= project.stage },
        ...project.parents.map((id) => ({
          label: `сначала: ${cityApi.projects.find((p) => p.id === id)?.name || id}`,
          met: s.city.built.includes(id),
        })),
        ...(project.id === 'capital' ? [{ label: 'устав города', met: Boolean(s.city.charter) }] : []),
      ];
      const status = built
        ? '<span class="hq-status is-built">Построено</span>'
        : working
          ? `<span class="hq-status">Строится · ${time(s.city.work.until - s.seconds)}</span>`
          : `<div class="hq-requirements">${requirements.map((item) => `<span class="hq-condition ${item.met ? 'is-met' : ''}">${item.met ? '✓ ' : '· '}${esc(item.label)}</span>`).join('')}</div>`;
      const button =
        built || working
          ? ''
          : quote
            ? `<p class="hq-unavailable">${esc(quote)}</p>`
            : `<button class="hq-action" type="button" data-action="build" data-id="${esc(project.id)}">Начать строительство</button>`;
      return `<article class="hq-card hq-project ${built ? 'is-built' : ''}"><div class="hq-card-top"><span class="hq-icon">${icon(project.id === 'dock' || project.id === 'port' ? 'flag' : project.id === 'atlas' ? 'map' : 'pot')}</span><div><p class="hq-overline">${project.index + 1} · ЭТАП</p><h3>${esc(project.name)}</h3></div></div><p>${esc(project.detail)}</p><div class="hq-facts"><span><small>Срок</small><b>${time(project.duration)}</b></span><span><small>Цена</small><b>${esc(price(project))}</b></span></div>${status}${button}</article>`;
    }
    function worksPage() {
      const s = state(),
        work = s.city.work;
      const current = work
        ? `<section class="hq-work-banner"><span class="hq-icon">${icon('pot')}</span><div><p class="hq-overline">МАСТЕРСКАЯ ЗАНЯТА</p><h3>${esc(cityApi.projects.find((p) => p.id === work.id)?.name || 'Стройка')}</h3><p>До завершения: ${time(work.until - s.seconds)} · содержание штаба: ${cityApi.upkeep(s)} энергии каждые 12 игровых секунд</p></div></section>`
        : `<p class="hq-note">Выберите доступный проект. Готовое здание сразу откроет свой эффект.</p>`;
      const reserve = `<section class="hq-reserve"><div><b>Запас энергии для деления</b><span>Колония тратит энергию только выше выбранного резерва.</span></div><div class="hq-reserve-options">${[0, 12, 24].map((amount) => `<button type="button" data-action="reserve" data-id="${amount}" data-number class="${s.city.reserve === amount ? 'is-active' : ''}" aria-pressed="${s.city.reserve === amount}">${amount}</button>`).join('')}</div></section>`;
      return `<div class="hq-page"><div class="hq-page-head"><div><p class="hq-overline">ГОРОДСКИЕ ПРОЕКТЫ</p><h2>Стройки</h2><p>Ёмкость поселения: ${cityApi.housing(s)} колоний · запас энергии: ${cityApi.capacity(s)}</p></div><span class="hq-stamp">${s.city.built.length}/${cityApi.projects.length}</span></div>${current}${reserve}<div class="hq-grid hq-project-grid">${cityApi.projects.map((project) => projectCard(project, s)).join('')}</div></div>`;
    }

    let activeChapter = 0;
    function effectLine(effect) {
      return resources(effect);
    }
    function storyPage() {
      const s = state(),
        c = s.city,
        maxChapter = chapterIndex();
      activeChapter = Math.min(activeChapter, maxChapter);
      const chapters = cityApi.chapters.slice(0, maxChapter + 1);
      const ch = chapters[activeChapter] || chapters[maxChapter];
      let council = '';
      if (c.prompt !== null) {
        const dilemma = cityApi.dilemmas[c.prompt];
        council = `<section class="hq-council"><p class="hq-overline">СОВЕТ СОБРАЛСЯ</p><h3>${esc(dilemma.title)}</h3><p>${esc(dilemma.text)}</p><div class="hq-choice-grid">${dilemma.choices
          .map(([title, effect], index) => {
            const blockers = Object.entries(effect)
              .filter(([key, value]) => value < 0)
              .flatMap(([key, value]) => {
                const have = key === 'plans' ? c.plans : s[key];
                return have < -value
                  ? [`Не хватает ${Math.ceil(-value - have)} ${labels[key] || key}`]
                  : [];
              });
            return `<button class="hq-choice" type="button" data-action="decide" data-id="${index}" data-number ${blockers.length ? 'disabled' : ''}><b>${esc(title)}</b><span>${esc(effectLine(effect))}</span>${blockers.length ? `<small>${esc(blockers.join(' · '))}</small>` : ''}</button>`;
          })
          .join(
            '',
          )}</div><button class="hq-skip" type="button" data-action="decide" data-id="-1" data-number>Пропустить совет</button></section>`;
      }
      let charter = '';
      if (maxChapter === cityApi.chapters.length - 1 && !c.charter) {
        const neighborEnd =
          c.trust >= 8
            ? 'Мира развернёт письмо, подписанное соседями; человек прочтёт его и поставит банку с табличкой «Посольство».'
            : 'Лада оставит записку на крышке; утром человек поставит у кастрюли блюдце для писем.';
        const republicEnd =
          'Дозорные передадут ритм независимой республики; человек увидит флаги на полках и закроет дверцу.';
        charter = `<section class="hq-charter"><p class="hq-overline">ПОСЛЕДНЯЯ ЗАПИСЬ · УСТАВ ГОРОДА</p><h3>Какой будет жизнь за дверцей?</h3><div class="hq-choice-grid"><button class="hq-choice" type="button" data-action="charter" data-id="neighbors"><b>Соседство с человеком</b><span>${esc(neighborEnd)}</span><small>Доверие сейчас: ${c.trust}/8</small></button><button class="hq-choice" type="button" data-action="charter" data-id="republic"><b>Независимая республика</b><span>${esc(republicEnd)}</span></button></div></section>`;
      } else if (c.charter) {
        charter = `<section class="hq-charter is-final"><p class="hq-overline">УСТАВ ПОДПИСАН</p><h3>${c.charter === 'neighbors' ? 'Соседство с человеком' : 'Независимая республика'}</h3><p>${esc(cityApi.ending(s))}</p></section>`;
      }
      return `<div class="hq-page hq-story-page"><div class="hq-page-head"><div><p class="hq-overline">ДНЕВНИК ЛАДЫ</p><h2>История поселений</h2><p>Записи открываются по мере строительства города.</p></div></div><div class="hq-story-layout"><nav class="hq-chapter-list" aria-label="Открытые записи">${chapters.map((item, index) => `<button type="button" data-tab-chapter="${index}" class="${index === activeChapter ? 'is-active' : ''}" aria-current="${index === activeChapter ? 'page' : 'false'}"><span>0${index + 1}</span><b>${esc(item.title)}</b><small>${esc(item.place)}</small></button>`).join('')}</nav><article class="hq-diary"><p class="hq-overline">${esc(ch.place)} · ДЕНЬ ${ch.at + 1}</p><h3>${esc(ch.title)}</h3><p class="hq-diary-text">${esc(ch.text)}</p>${root.SoupGuides.speech(ch.who, ch.testimony)}${c.chapterRead >= activeChapter ? '<span class="hq-read-stamp">ПРОЧИТАНО</span>' : ''}</article></div>${council}${charter}</div>`;
    }
    function render() {
      dialog.querySelector('[data-resources]').innerHTML = currentResources();
      dialog.querySelectorAll('[data-tab]').forEach((button) => {
        const selected = button.dataset.tab === active;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
      });
      const scrollTop = content.scrollTop;
      const focusKey = document.activeElement?.dataset?.action;
      const focusId = document.activeElement?.dataset?.id;
      const focusChapter = document.activeElement?.dataset?.tabChapter;
      content.innerHTML =
        active === 'routes' ? routesPage() : active === 'works' ? worksPage() : storyPage();
      content.scrollTop = scrollTop;
      bindActions();
      if (focusKey)
        [...content.querySelectorAll('[data-action]')]
          .find(
            (node) =>
              node.dataset.action === focusKey && (focusId === undefined || node.dataset.id === focusId),
          )
          ?.focus({ preventScroll: true });
      else if (focusChapter !== undefined)
        content
          .querySelector(`[data-tab-chapter="${Number(focusChapter)}"]`)
          ?.focus({ preventScroll: true });
    }
    dialog.querySelectorAll('[data-tab]').forEach((button) =>
      button.addEventListener('click', () => {
        active = button.dataset.tab;
        if (active === 'story') {
          activeChapter = chapterIndex();
          perform('read');
        } else render();
        content.scrollTop = 0;
      }),
    );
    dialog.querySelector('.hq-back').addEventListener('click', () => dialog.close());
    dialog.querySelector('.hq-x').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        const tabs = [...dialog.querySelectorAll('[data-tab]')];
        const index = tabs.indexOf(document.activeElement);
        if (index < 0) return;
        event.preventDefault();
        tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length].focus();
      }
    });
    const refresh = () => render();
    dialog.addEventListener(
      'close',
      () => {
        clearTimeout(toastTimer);
        root.removeEventListener('soup:refresh', refresh);
        dialog.remove();
      },
      { once: true },
    );
    dialog.showModal();
    if (active === 'story') perform('read');
    else render();
    root.addEventListener('soup:refresh', refresh);
    return dialog;
  }

  root.openHeadquarters = openHeadquarters;
})(globalThis);
