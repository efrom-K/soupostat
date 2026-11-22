(function (root) {
  'use strict';

  const costs = [8, 13, 19];
  const stages = [
    { name: 'Кастрюля', pop: 4, eaters: 0, lights: 0 },
    { name: 'Край кастрюли', pop: 12, eaters: 0, lights: 0 },
    { name: 'Банка огурцов', pop: 24, eaters: 1, lights: 0 },
    { name: 'Вся полка', pop: 40, eaters: 1, lights: 1 },
    { name: 'Холодильник', pop: 60, eaters: 2, lights: 2 }
  ];
  const fields = ['turn', 'energy', 'food', 'pop', 'pigment', 'cloud', 'suspicion', 'eaters', 'lights', 'eatStyle', 'lightStyle', 'pact', 'stage', 'status'];
  const actions = ['eat', 'photo', 'divide', 'hide', 'eaters', 'lights', 'feast', 'quiet', 'flare', 'shade', 'banquet', 'festival', 'pact'];
  const clamp = value => Math.max(0, Math.min(100, value));

  function initial() {
    return { turn: 0, energy: 8, food: 24, pop: 4, pigment: 6, cloud: 0, suspicion: 0, eaters: 0, lights: 0, eatStyle: '', lightStyle: '', pact: false, stage: 0, status: 'playing' };
  }

  function phase(state) {
    const day = Math.floor(state.turn / 6) + 1;
    const withinDay = state.turn % 6;
    const inspections = [
      { inspection: 'Обычный', modifier: 0 },
      { inspection: 'Беглый', modifier: -2 },
      { inspection: 'Пристальный', modifier: 3 }
    ];
    return { light: withinDay < 3, day, left: withinDay < 3 ? 3 - withinDay : 6 - withinDay, ...inspections[(day - 1) % inspections.length] };
  }

  function yields(state) {
    const feast = state.eatStyle === 'feast';
    const quiet = state.eatStyle === 'quiet';
    const flare = state.lightStyle === 'flare';
    const shade = state.lightStyle === 'shade';
    return {
      eatEnergy: 6 + (state.eaters > 0 ? 2 : 0) + (feast ? 3 : 0),
      eatCloud: 4 + (state.eaters > 0 ? 2 : 0) + (feast ? 4 : quiet ? -3 : 0) + (state.eaters === 3 ? 4 : 0),
      photoEnergy: 7 + (state.lights > 0 ? 3 : 0) + (flare ? 4 : shade ? -1 : 0),
      photoPigment: 11 + (state.lights > 0 ? 3 : 0) + (flare ? 6 : shade ? -6 : 0) + (state.lights === 3 ? 4 : 0),
      eatPop: state.eaters === 3 ? 2 : 0,
      photoPop: state.lights === 3 ? 2 : 0
    };
  }

  function techCost(state, id) {
    if (!state) return undefined;
    if (id === 'eaters' || id === 'lights') return state[id] === 0 ? 8 : undefined;
    if (id === 'feast' || id === 'quiet') {
      if (state.eaters === 1) return 13;
      if (state.eaters >= 2 && state.eatStyle !== id) return 5;
    }
    if (id === 'flare' || id === 'shade') {
      if (state.lights === 1) return 13;
      if (state.lights >= 2 && state.lightStyle !== id) return 5;
    }
    if (id === 'banquet' && state.eaters === 2) return 19;
    if (id === 'festival' && state.lights === 2) return 19;
    if (id === 'pact' && !state.pact && state.eaters >= 1 && state.lights >= 1) return 9;
    return undefined;
  }

  function valid(state) {
    if (!state || typeof state !== 'object' || Object.getPrototypeOf(state) !== Object.prototype || Object.keys(state).length !== fields.length || fields.some(key => !Object.prototype.hasOwnProperty.call(state, key))) return false;
    const integer = value => Number.isSafeInteger(value);
    if (!integer(state.turn) || state.turn < 0 || !integer(state.energy) || state.energy < 0 || !integer(state.food) || state.food < 0 || state.food > 24 || state.food % 3 !== 0 ||
        !integer(state.pop) || state.pop < 1 || !integer(state.pigment) || state.pigment < 0 || state.pigment > 100 ||
        !integer(state.cloud) || state.cloud < 0 || state.cloud > 100 || !integer(state.suspicion) || state.suspicion < 0 || state.suspicion > 100 ||
        !integer(state.eaters) || state.eaters < 0 || state.eaters > 3 || !integer(state.lights) || state.lights < 0 || state.lights > 3 ||
        !['', 'feast', 'quiet'].includes(state.eatStyle) || !['', 'flare', 'shade'].includes(state.lightStyle) || typeof state.pact !== 'boolean' ||
        (state.eaters < 2 && state.eatStyle !== '') || (state.eaters >= 2 && state.eatStyle === '') ||
        (state.lights < 2 && state.lightStyle !== '') || (state.lights >= 2 && state.lightStyle === '') ||
        !integer(state.stage) || state.stage < 0 || state.stage >= stages.length || !['playing', 'won', 'lost'].includes(state.status)) return false;
    if (state.pact && (state.eaters < 1 || state.lights < 1)) return false;
    let expectedStage = 0;
    for (let i = 1; i < stages.length; i++) if (state.pop >= stages[i].pop && state.eaters >= stages[i].eaters && state.lights >= stages[i].lights) expectedStage = i;
    return state.stage === expectedStage && (state.status === 'won' ? state.stage === 4 && state.suspicion < 100 : state.stage !== 4) && (state.status === 'lost' ? state.suspicion === 100 : state.suspicion < 100);
  }

  function step(state, action) {
    const fail = reason => ({ state, reason });
    if (!valid(state) || state.status !== 'playing') return fail('Сохранение недействительно или игра уже завершена.');
    if (!actions.includes(action)) return fail('Неизвестное действие.');
    const current = phase(state);
    if (action === 'photo' && !current.light) return fail('Ловить свет можно только при открытой дверце.');
    if (action === 'eat' && state.food < 3) return fail('Органика закончилась.');
    if (action === 'divide' && state.energy < 8) return fail('Не хватает энергии для деления.');
    const cost = techCost(state, action);
    if (!['eat', 'photo', 'divide', 'hide'].includes(action) && cost === undefined) return fail('Это улучшение сейчас недоступно.');
    if (action !== 'eat' && action !== 'photo' && action !== 'divide' && action !== 'hide' && state.energy < cost) return fail('Не хватает энергии для улучшения.');

    const income = yields(state);
    const next = { ...state };
    if (action === 'eat') {
      next.food -= 3;
      next.energy += income.eatEnergy;
      next.cloud = clamp(next.cloud + income.eatCloud);
      next.pop += income.eatPop;
    } else if (action === 'photo') {
      next.energy += income.photoEnergy;
      next.pigment = clamp(next.pigment + income.photoPigment);
      next.pop += income.photoPop;
    } else if (action === 'divide') {
      next.energy -= 8;
      next.pop += 4 + Math.min(state.eaters, state.lights);
    } else if (action === 'hide') {
      next.pigment = clamp(next.pigment - 8);
      next.cloud = clamp(next.cloud - 7);
    } else if (action === 'eaters' || action === 'lights') {
      next.energy -= cost;
      next[action] = 1;
    } else if (action === 'feast' || action === 'quiet') {
      next.energy -= cost;
      next.eatStyle = action;
      next.eaters = Math.max(2, next.eaters);
    } else if (action === 'flare' || action === 'shade') {
      next.energy -= cost;
      next.lightStyle = action;
      next.lights = Math.max(2, next.lights);
    } else if (action === 'banquet') {
      next.energy -= cost;
      next.eaters = 3;
    } else if (action === 'festival') {
      next.energy -= cost;
      next.lights = 3;
    } else {
      next.energy -= cost;
      next.pact = true;
    }

    if (action !== 'photo') next.pigment = clamp(next.pigment - 2);
    if (action !== 'eat') next.cloud = clamp(next.cloud - 2);

    const oldStage = state.stage;
    for (let i = 1; i < stages.length; i++) if (next.pop >= stages[i].pop && next.eaters >= stages[i].eaters && next.lights >= stages[i].lights) next.stage = i;
    next.turn++;
    if (next.stage === 4) {
      next.status = 'won';
    } else if (current.light) {
      const visibility = Math.floor(next.pigment / 7) + Math.floor(next.cloud / 6) + oldStage;
      next.suspicion = clamp(state.suspicion + visibility + current.modifier - 2 + (action === 'hide' ? -9 : 0) - (action === 'hide' && state.pact ? 4 : 0));
      if (next.suspicion >= 100) next.status = 'lost';
    } else {
      next.suspicion = clamp(state.suspicion - 3 - (action === 'hide' && state.pact ? 8 : 0));
    }
    return { state: next, reason: '' };
  }

  const api = { initial, phase, step, valid, yields, techCost, stages, costs };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SoupGame = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
