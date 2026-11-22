(function (root) {
  'use strict';

  const esc = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (char) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[char],
    );

  function openEvolution({ getState, buy }) {
    const traits = root.SoupTraits || [];
    const game = root.SoupGame;
    if (!traits.length || !game || typeof getState !== 'function' || typeof buy !== 'function')
      return null;

    document.getElementById('evolution-map-dialog')?.remove();
    const dialog = document.createElement('dialog');
    dialog.id = 'evolution-map-dialog';
    dialog.className = 'ev-dialog';
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'evolution.css';
    dialog.append(stylesheet);
    dialog.insertAdjacentHTML(
      'beforeend',
      `
      <section class="ev-shell" aria-label="Карта эволюции">
        <header class="ev-head"><div><p class="ev-kicker">ПОЛЕВЫЕ ЗАМЕТКИ · ХОЛОДИЛЬНИК</p><h1>Карта эволюции</h1><p class="ev-sub">Все 42 признака и их родственные связи</p></div>
          <div class="ev-tools"><span class="ev-resource" data-resource></span><button type="button" class="ev-close" aria-label="Закрыть карту">×</button></div>
        </header>
        <div class="ev-main">
          <div class="ev-map-column">
            <div class="ev-map-toolbar"><span class="ev-hint">Перетаскивайте поле · колесо или − / + меняют масштаб</span><div class="ev-zoom"><button type="button" data-zoom="out" aria-label="Уменьшить">−</button><output data-zoom-value>100%</output><button type="button" data-zoom="in" aria-label="Увеличить">+</button><button type="button" data-fit>Обзор</button></div></div>
            <div class="ev-viewport" tabindex="0" aria-label="Полотно карты. Стрелки перемещают обзор, Tab выбирает признак."><svg class="ev-map" role="group" aria-label="Связи между признаками"></svg></div>
            <div class="ev-map-foot"><div class="ev-legend"><span><i class="ev-dot ev-owned"></i>Изучено</span><span><i class="ev-dot ev-ready"></i>Доступно</span><span><i class="ev-dot ev-locked"></i>Закрыто</span></div><svg class="ev-mini" aria-label="Обзор карты"><rect class="ev-mini-bg"></rect><g class="ev-mini-content"></g><rect class="ev-mini-window"></rect></svg></div>
          </div>
          <aside class="ev-inspector" aria-live="polite"><p class="ev-inspector-kicker">ЗАПИСЬ В ЖУРНАЛЕ</p><div data-inspector></div></aside>
        </div>
      </section>`,
    );
    document.body.append(dialog);

    const viewport = dialog.querySelector('.ev-viewport');
    const map = dialog.querySelector('.ev-map');
    const inspector = dialog.querySelector('[data-inspector]');
    const resource = dialog.querySelector('[data-resource]');
    const zoomValue = dialog.querySelector('[data-zoom-value]');
    const mini = dialog.querySelector('.ev-mini');
    const miniContent = dialog.querySelector('.ev-mini-content');
    const miniWindow = dialog.querySelector('.ev-mini-window');
    const nodeById = new Map(traits.map((t) => [t.id, t]));
    const selectedIds = new Map();
    const nodeWidth = 244;
    const nodeHeight = 76;
    const gapX = 74;
    const gapY = 102;
    const maxTier = Math.max(...traits.map((t) => t.tier));
    const branchNames = [...new Set(traits.map((t) => t.branch))];
    const branchColors = ['#a94e34', '#47734d', '#58718b'];
    const sorted = [...traits].sort(
      (a, b) =>
        a.tier - b.tier ||
        branchNames.indexOf(a.branch) - branchNames.indexOf(b.branch) ||
        traits.indexOf(a) - traits.indexOf(b),
    );
    const tierCounts = new Map();
    const positions = new Map();
    sorted.forEach((t) => {
      const slot = tierCounts.get(t.tier) || 0;
      tierCounts.set(t.tier, slot + 1);
      positions.set(t.id, { x: 58 + (t.tier - 1) * (nodeWidth + gapX), y: 100 + slot * gapY });
    });
    const width = 116 + maxTier * (nodeWidth + gapX);
    const height = 150 + Math.max(...tierCounts.values()) * gapY;
    const svgNS = 'http://www.w3.org/2000/svg';
    const svgEl = (name, attrs = {}) => {
      const el = document.createElementNS(svgNS, name);
      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
      return el;
    };
    map.setAttribute('viewBox', `0 0 ${width} ${height}`);
    map.setAttribute('width', width);
    map.setAttribute('height', height);
    const defs = svgEl('defs');
    const marker = svgEl('marker', {
      id: 'ev-arrow',
      viewBox: '0 0 10 10',
      refX: '8',
      refY: '5',
      markerWidth: '5',
      markerHeight: '5',
      orient: 'auto-start-reverse',
    });
    marker.append(svgEl('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: '#a99a7d' }));
    defs.append(marker);
    map.append(defs);

    // Tier headings and branch rail notes keep the map legible while all branches share one plane.
    const background = svgEl('g', { class: 'ev-background' });
    for (let tier = 1; tier <= maxTier; tier++) {
      const x = 58 + (tier - 1) * (nodeWidth + gapX);
      background.append(
        svgEl('line', { x1: x - 20, y1: 42, x2: x - 20, y2: height - 26, class: 'ev-grid-line' }),
      );
      const label = svgEl('text', { x, y: 31, class: 'ev-tier-label' });
      label.textContent = `ЯРУС ${tier}`;
      background.append(label);
    }
    branchNames.forEach((branch, index) => {
      const label = svgEl('text', {
        x: width - 20,
        y: height - 16 - index * 22,
        class: 'ev-branch-note',
        'text-anchor': 'end',
        fill: branchColors[index],
      });
      label.textContent = `● ${branch}`;
      background.append(label);
    });
    map.append(background);

    const edges = svgEl('g', { class: 'ev-edges', 'aria-hidden': 'true' });
    traits.forEach((t) =>
      t.parents.forEach((parentId) => {
        const from = positions.get(parentId);
        const to = positions.get(t.id);
        if (!from || !to) return;
        const crossBranch = nodeById.get(parentId).branch !== t.branch;
        const path = svgEl('path', {
          d: `M ${from.x + nodeWidth} ${from.y + nodeHeight / 2} C ${from.x + nodeWidth + 38} ${from.y + nodeHeight / 2}, ${to.x - 38} ${to.y + nodeHeight / 2}, ${to.x} ${to.y + nodeHeight / 2}`,
          class: `ev-edge${crossBranch ? ' ev-edge-cross' : ''}`,
          'data-from': parentId,
          'data-to': t.id,
        });
        edges.append(path);
      }),
    );
    map.append(edges);

    const nodes = svgEl('g', { class: 'ev-nodes' });
    sorted.forEach((t) => {
      const { x, y } = positions.get(t.id);
      const branchIndex = branchNames.indexOf(t.branch);
      const g = svgEl('g', {
        class: 'ev-node',
        tabindex: '0',
        role: 'button',
        'aria-label': `${t.name}, ярус ${t.tier}, ${t.branch}`,
        'data-id': t.id,
        transform: `translate(${x} ${y})`,
      });
      g.append(
        svgEl('rect', {
          width: nodeWidth,
          height: nodeHeight,
          rx: 10,
          class: 'ev-card',
          stroke: branchColors[branchIndex],
        }),
      );
      g.append(svgEl('circle', { cx: 17, cy: 18, r: 4, class: 'ev-state-dot' }));
      const branch = svgEl('text', {
        x: 29,
        y: 21,
        class: 'ev-node-branch',
        fill: branchColors[branchIndex],
      });
      branch.textContent = t.branch;
      g.append(branch);
      const name = svgEl('text', { x: 15, y: 46, class: 'ev-node-name' });
      const words = t.name.split(/\s+/);
      const lines = [''];
      words.forEach((word) => {
        const last = lines.length - 1;
        if (lines[last] && (lines[last] + ' ' + word).length > 24) lines.push(word);
        else lines[last] = lines[last] ? lines[last] + ' ' + word : word;
      });
      lines.slice(0, 2).forEach((line, index) => {
        const span = svgEl('tspan', { x: 15, dy: index ? 17 : 0 });
        span.textContent = line;
        name.append(span);
      });
      g.append(name);
      const tier = svgEl('text', {
        x: nodeWidth - 12,
        y: 21,
        class: 'ev-node-tier',
        'text-anchor': 'end',
      });
      tier.textContent = `ЯРУС ${t.tier}`;
      g.append(tier);
      const activate = () => select(t.id);
      g.addEventListener('click', activate);
      g.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      });
      nodes.append(g);
    });
    map.append(nodes);

    let selected = traits[0]?.id;
    let zoom = 1;
    let dragging = null;
    let refreshPending = false;
    let lastStateKey = '';
    function inspectState(state, id) {
      const t = nodeById.get(id);
      const learned = state.traits.includes(id);
      const canBuy = !learned && !game.reason(state, id);
      const reason = learned ? 'Уже изучено.' : game.reason(state, id);
      const energyCost =
        typeof game.researchEnergy === 'function' ? game.researchEnergy(t, state) : null;
      return { t, learned, canBuy, reason, energyCost };
    }
    function select(id, focus = false) {
      if (!nodeById.has(id)) return;
      selected = id;
      const state = getState();
      const { t, learned, canBuy, reason, energyCost } = inspectState(state, id);
      map.querySelectorAll('.ev-node').forEach((node) => {
        const info = inspectState(state, node.dataset.id);
        node.classList.toggle('is-learned', info.learned);
        node.classList.toggle('is-ready', info.canBuy);
        node.classList.toggle('is-locked', !info.learned && !info.canBuy);
        node.classList.toggle('is-selected', node.dataset.id === id);
        node
          .querySelector('.ev-state-dot')
          .setAttribute(
            'class',
            `ev-state-dot ${info.learned ? 'ev-owned' : info.canBuy ? 'ev-ready' : 'ev-locked'}`,
          );
      });
      map
        .querySelectorAll('.ev-edge')
        .forEach((edge) =>
          edge.classList.toggle('is-lit', edge.dataset.to === id || edge.dataset.from === id),
        );
      resource.textContent = `${Math.floor(state.dna)} очк. эволюции · ${Math.floor(state.energy)} энергии`;
      const availability = learned ? 'Изучено' : canBuy ? 'Можно изучить' : reason;
      inspector.innerHTML = `<p class="ev-branch-label">${esc(t.branch)} <span>· ярус ${t.tier}</span></p><h2>${esc(t.name)}</h2><p class="ev-status ${learned ? 'is-owned' : canBuy ? 'is-ready' : ''}">${esc(availability)}</p><dl><dt>Определение</dt><dd>${esc(t.definition)}</dd><dt>Эффект</dt><dd>${esc(t.effect)}</dd></dl><div class="ev-costs"><span><small>Очки эволюции</small><b>${t.cost}</b></span><span><small>Энергия исследования</small><b>${energyCost === null ? '—' : energyCost}</b></span></div><p class="ev-price-note" ${energyCost === null ? '' : 'hidden'}>Цена в энергии пока недоступна.</p><button class="ev-buy" type="button" ${canBuy ? '' : 'disabled'}>${learned ? 'Уже изучено' : canBuy ? 'Изучить признак' : 'Недоступно'}</button>`;
      inspector.querySelector('.ev-buy').addEventListener('click', () => {
        if (!inspectState(getState(), id).canBuy) return;
        const result = buy(id);
        refresh();
        if (result?.reason) inspector.querySelector('.ev-status').textContent = result.reason;
      });
      if (focus) map.querySelector(`[data-id="${CSS.escape(id)}"]`)?.focus();
    }
    function refresh() {
      select(selected || traits[0]?.id);
      renderMini();
    }
    function stateKey() {
      const state = getState();
      return `${state.traits.join(',')}|${state.dna}|${state.energy}|${state.status}`;
    }
    function scheduleRefresh() {
      if (refreshPending) return;
      const nextKey = stateKey();
      if (nextKey === lastStateKey) return;
      lastStateKey = nextKey;
      refreshPending = true;
      requestAnimationFrame(() => {
        refreshPending = false;
        if (dialog.open) refresh();
      });
    }
    function setZoom(next, anchorX = viewport.clientWidth / 2, anchorY = viewport.clientHeight / 2) {
      const old = zoom;
      zoom = Math.max(0.45, Math.min(1.65, next));
      const ratio = zoom / old;
      const left = viewport.scrollLeft;
      const top = viewport.scrollTop;
      map.style.width = `${width * zoom}px`;
      map.style.height = `${height * zoom}px`;
      viewport.scrollLeft = (left + anchorX) * ratio - anchorX;
      viewport.scrollTop = (top + anchorY) * ratio - anchorY;
      zoomValue.value = `${Math.round(zoom * 100)}%`;
      zoomValue.textContent = `${Math.round(zoom * 100)}%`;
      renderMini();
    }
    function renderMini() {
      if (!mini.isConnected) return;
      const mw = 210,
        mh = 94;
      mini.setAttribute('viewBox', `0 0 ${mw} ${mh}`);
      mini.querySelector('.ev-mini-bg').setAttribute('width', mw);
      mini.querySelector('.ev-mini-bg').setAttribute('height', mh);
      miniContent.replaceChildren();
      const sx = mw / width,
        sy = mh / height;
      traits.forEach((t) => {
        const p = positions.get(t.id);
        miniContent.append(
          svgEl('rect', {
            x: p.x * sx,
            y: p.y * sy,
            width: Math.max(2, nodeWidth * sx),
            height: Math.max(1.5, nodeHeight * sy),
            rx: 1,
            fill: branchColors[branchNames.indexOf(t.branch)],
          }),
        );
      });
      const sxView = (viewport.scrollLeft / zoom) * sx;
      const syView = (viewport.scrollTop / zoom) * sy;
      miniWindow.setAttribute('x', sxView);
      miniWindow.setAttribute('y', syView);
      miniWindow.setAttribute('width', Math.max(8, (viewport.clientWidth / zoom) * sx));
      miniWindow.setAttribute('height', Math.max(8, (viewport.clientHeight / zoom) * sy));
    }
    dialog.querySelector('.ev-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('[data-zoom="in"]').addEventListener('click', () => setZoom(zoom * 1.15));
    dialog.querySelector('[data-zoom="out"]').addEventListener('click', () => setZoom(zoom / 1.15));
    dialog.querySelector('[data-fit]').addEventListener('click', () => {
      const fit = Math.min(viewport.clientWidth / width, viewport.clientHeight / height);
      setZoom(Math.max(0.45, Math.min(1, fit)), 0, 0);
      viewport.scrollTo(0, 0);
    });
    viewport.addEventListener('scroll', renderMini, { passive: true });
    viewport.addEventListener(
      'wheel',
      (event) => {
        if (!event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        setZoom(
          zoom * (event.deltaY < 0 ? 1.08 : 1 / 1.08),
          event.clientX - viewport.getBoundingClientRect().left,
          event.clientY - viewport.getBoundingClientRect().top,
        );
      },
      { passive: false },
    );
    viewport.addEventListener('pointerdown', (event) => {
      if (event.target.closest('.ev-node')) return;
      dragging = {
        x: event.clientX,
        y: event.clientY,
        left: viewport.scrollLeft,
        top: viewport.scrollTop,
        id: event.pointerId,
      };
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('is-dragging');
    });
    viewport.addEventListener('pointermove', (event) => {
      if (!dragging || dragging.id !== event.pointerId) return;
      viewport.scrollLeft = dragging.left - (event.clientX - dragging.x);
      viewport.scrollTop = dragging.top - (event.clientY - dragging.y);
    });
    const stopDrag = () => {
      dragging = null;
      viewport.classList.remove('is-dragging');
    };
    viewport.addEventListener('pointerup', stopDrag);
    viewport.addEventListener('pointercancel', stopDrag);
    viewport.addEventListener('keydown', (event) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault();
        const step = 72;
        viewport.scrollBy(
          event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
          event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0,
        );
      } else if (event.key === '+' || event.key === '=') setZoom(zoom * 1.15);
      else if (event.key === '-') setZoom(zoom / 1.15);
    });
    mini.addEventListener('click', (event) => {
      const rect = mini.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * width;
      const y = ((event.clientY - rect.top) / rect.height) * height;
      viewport.scrollTo(
        Math.max(0, x * zoom - viewport.clientWidth / 2),
        Math.max(0, y * zoom - viewport.clientHeight / 2),
      );
    });
    dialog.addEventListener(
      'close',
      () => {
        clearInterval(refreshTimer);
        document.removeEventListener('visibilitychange', scheduleRefresh);
        dialog.remove();
      },
      { once: true },
    );
    dialog.showModal();
    lastStateKey = stateKey();
    const refreshTimer = setInterval(scheduleRefresh, 300);
    select(selected);
    setZoom(Math.min(1, viewport.clientWidth / width));
    viewport.focus();
    document.addEventListener('visibilitychange', scheduleRefresh);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    return dialog;
  }

  root.openEvolution = openEvolution;
})(globalThis);
