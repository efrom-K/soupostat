(function (root) {
  'use strict';

  const city =
    typeof module !== 'undefined' && module.exports ? require('./campaign.js') : root.SoupCity;
  const stages = [
    { name: 'Кастрюля', pop: 4, food: 24, source: 'овощной бульон' },
    { name: 'Край кастрюли', pop: 12, food: 12, source: 'крошки на ободке' },
    { name: 'Банка огурцов', pop: 24, food: 32, source: 'огурцы и рассол' },
    { name: 'Вся полка', pop: 65, food: 54, source: 'сыр и молоко' },
    { name: 'Холодильник', pop: 150, food: 80, source: 'запасы холодильника' },
  ];
  const traits =
    typeof module !== 'undefined' && module.exports ? require('./traits.js') : root.SoupTraits;
  const byId = new Map(traits.map((node) => [node.id, node]));
  const events = [
    {
      id: 'stir',
      name: 'Суп перемешали',
      duration: 10,
      effect: '+12 мути сразу. Пока суп кружится, порция даёт ещё 3 энергии.',
    },
    {
      id: 'crumbs',
      name: 'Упали крошки',
      duration: 8,
      effect: '+6 органики сразу. Каждая порция даёт ещё 1 энергию.',
    },
    { id: 'lamp', name: 'Лампа замигала', duration: 8, effect: 'Сбор света даёт на 3 энергии меньше.' },
    {
      id: 'fog',
      name: 'Запотело стекло',
      duration: 12,
      effect: 'Каждый осмотр добавляет на 2 очка обнаружения меньше.',
    },
    {
      id: 'frost',
      name: 'Прихватило холодом',
      duration: 10,
      effect: 'При делении рождается на 2 колонии меньше.',
    },
    {
      id: 'warm',
      name: 'Тёплая полка',
      duration: 10,
      effect: 'При делении рождается на 2 колонии больше.',
    },
  ];
  const eventById = new Map(events.map((item) => [item.id, item]));
  const modes = ['auto', 'eat', 'photo', 'rest'];
  const statuses = ['playing', 'won', 'lost'];
  const clamp = (value) => Math.min(100, Math.max(0, value));
  const owns = (state, id) => state.traits.includes(id);

  function initial(seed = Math.floor(Math.random() * 0x100000000)) {
    return {
      version: 3,
      city: city.init(),
      seconds: 0,
      pop: 4,
      energy: 8,
      food: stages[0].food,
      dna: 4,
      pigment: 6,
      cloud: 0,
      suspicion: 0,
      stage: 0,
      status: 'playing',
      mode: 'auto',
      traits: [],
      seed,
      meals: 0,
      lightMeals: 0,
      manualMeals: 0,
      lastLightDay: 0,
      event: null,
      nextEvent: 5 + (seed % 4),
      lastEvent: null,
    };
  }

  function phase(state) {
    const within = state.seconds % 60;
    const day = Math.floor(state.seconds / 60) + 1;
    const light = within < 20;
    const index = (day - 1) % 3;
    return {
      day,
      light,
      left: (light ? 20 : 60) - within,
      inspection: ['Обычный', 'Беглый', 'Пристальный'][index],
      modifier: [0, -1, 1][index],
    };
  }

  function territory(pop) {
    let stage = 0;
    while (stage + 1 < stages.length && pop >= stages[stage + 1].pop) stage++;
    return stage;
  }

  function bonuses(ids) {
    const totals = {};
    for (const id of ids) {
      for (const [key, value] of Object.entries(byId.get(id).bonuses)) {
        totals[key] = (totals[key] || 0) + value;
      }
    }
    return totals;
  }

  function foodReward(state, stage) {
    return stage.food + (stage === stages[0] ? 0 : bonuses(state.traits).territoryFood || 0);
  }

  function settle(state, buff) {
    while (state.stage < Math.min(3, territory(state.pop))) {
      state.stage++;
      state.food += stages[state.stage].food + (buff.territoryFood || 0);
      state.energy += buff.territoryEnergy || 0;
      state.pop += buff.territoryBirth || 0;
      state.dna += 3 + (owns(state, 'divergence') ? 3 : 0) + (buff.territoryDNA || 0);
    }
    if (state.city.built.includes('capital')) {
      state.stage = 4;
      state.status = 'won';
      state.food += foodReward(state, stages[4]);
    }
  }

  function choose(state, mode) {
    return state.status === 'playing' && modes.includes(mode) ? { ...state, mode } : state;
  }

  function researchEnergy(node, state) {
    return 3 + node.tier * 2 - (state?.city?.built.includes('press') ? 2 : 0);
  }
  function reason(state, id) {
    const node = byId.get(id);
    if (!node) return 'Неизвестный признак.';
    if (owns(state, id)) return 'Уже изучено.';
    if (state.status !== 'playing') return 'Партия завершена.';
    const missing = node.parents.filter((parent) => !owns(state, parent));
    if (missing.length)
      return 'Сначала изучите: ' + missing.map((key) => byId.get(key).name).join(', ') + '.';
    if (state.dna < node.cost) return 'Не хватает очков эволюции: ' + (node.cost - state.dna) + '.';
    if (state.energy < researchEnergy(node, state))
      return 'Не хватает энергии: ' + (researchEnergy(node, state) - state.energy) + '.';
    return '';
  }

  function learn(state, id) {
    const blocked = reason(state, id);
    if (blocked) return { state, reason: blocked };
    const ids = [...state.traits, id];
    return {
      state: {
        ...state,
        dna: state.dna - byId.get(id).cost,
        energy: state.energy - researchEnergy(byId.get(id), state) + (bonuses(ids).learnEnergy || 0),
        traits: ids,
      },
      reason: '',
    };
  }

  // Distinct streams keep weather and drift reproducible after loading a save.
  function draw(state, stream) {
    let value = state.seed ^ Math.imul(state.seconds + stream, 0x9e3779b1);
    value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
    return (value ^ (value >>> 16)) >>> 0;
  }

  function updateEvent(s) {
    if (s.event && s.seconds >= s.event.until) s.event = null;
    if (s.seconds !== s.nextEvent) return;
    const { light, left } = phase(s);
    const pool = events.filter(({ id }) => {
      if (id === s.lastEvent) return false;
      if (id === 'lamp') return light && left >= 4;
      if (['stir', 'crumbs', 'fog'].includes(id)) return light;
      return true;
    });
    const event = pool[draw(s, 1) % pool.length];
    s.event = { id: event.id, start: s.seconds, until: s.seconds + event.duration };
    s.lastEvent = event.id;
    s.nextEvent = s.seconds + 45 + (draw(s, 2) % 31);
    if (event.id === 'stir') s.cloud = clamp(s.cloud + 12);
    if (event.id === 'crumbs') s.food += 6;
  }

  function tick(state) {
    if (state.status !== 'playing') return state;
    const s = { ...state, city: { ...state.city }, seconds: state.seconds + 1 };
    const { light, modifier, day } = phase(state);
    const effect = state.event?.id;
    const buff = bonuses(s.traits);
    const has = (id) => owns(s, id);
    const feeding = s.mode === 'eat' || (s.mode === 'auto' && !light);
    const harvesting = light && (s.mode === 'photo' || s.mode === 'auto');
    const resting = s.mode === 'rest';
    const cost = has('reserve') ? 1 : 2;

    if (s.seconds % 4 === 0) {
      const mixed = s.mode === 'auto' && has('mixotrophy') ? 3 : 0;
      if (feeding && s.food >= cost) {
        s.meals++;
        s.food -= cost;
        s.energy += 4 + (has('hetero') ? 2 : 0) + (has('catabolism') ? 3 : 0) + mixed;
        s.energy +=
          (buff.mealEnergy || 0) +
          (light ? 0 : buff.nightMealEnergy || 0) +
          (effect === 'stir' ? 3 : effect === 'crumbs' ? 1 : 0);
        if (s.food < cost) s.energy += buff.emptyBonus || 0;
        if (s.meals % 4 === 0) {
          s.dna += buff.fourthMealDNA || 0;
          s.food += buff.fourthMealFood || 0;
        }
        if (s.meals % 3 === 0) s.pop += buff.thirdMealBirth || 0;
        if (!light) {
          s.pop += buff.nightMealBirth || 0;
          s.cloud += buff.nightMealCloud || 0;
        }
        s.cloud += 3 + Number(has('hetero')) + (has('catabolism') ? 2 : 0);
      } else if (harvesting) {
        s.energy += 5 + (has('photo') ? 2 : 0) + (has('chlorophyll') ? 4 : 0) + mixed;
        s.pigment += 8 + (has('photo') ? 2 : 0) + (has('chlorophyll') ? 5 : 0);
        s.lightMeals++;
        s.energy += (buff.lightEnergy || 0) - (effect === 'lamp' ? 3 : 0);
        s.pigment += buff.lightPigment || 0;
        if (s.lastLightDay !== day) {
          s.energy += buff.firstLightEnergy || 0;
          s.dna += buff.firstLightDNA || 0;
          s.pigment += buff.firstLightPigment || 0;
          s.lastLightDay = day;
        }
        if (s.lightMeals % 3 === 0) s.pop += buff.thirdLightBirth || 0;
        if (s.lightMeals % 2 === 0) {
          s.dna += buff.secondLightDNA || 0;
          s.pigment += buff.secondLightPigment || 0;
        }
        if (has('photosystem')) s.pop++;
      }
      if (s.mode !== 'auto' && (s.meals !== state.meals || s.lightMeals !== state.lightMeals)) {
        if (++s.manualMeals % 3 === 0) s.dna += buff.thirdManualDNA || 0;
      }
    }
    if (!resting && s.seconds % 6 === 0) {
      const energyCost = (has('selection') ? 7 : 6) - (light ? 0 : buff.nightBirthDiscount || 0);
      if (s.energy >= energyCost + s.city.reserve && s.pop < city.housing(s)) {
        s.energy -= energyCost;
        s.pop +=
          3 +
          (has('selection') ? 2 : 0) +
          (has('polymorphism') ? 2 : 0) +
          (feeding && has('anabolism') ? 2 : 0) +
          (effect === 'frost' ? -2 : effect === 'warm' ? 2 : 0) +
          (s.mode === 'eat' ? buff.eatModeBirth || 0 : 0) +
          (s.mode === 'photo' && light ? buff.photoModeBirth || 0 : 0);
        if (s.suspicion < 25) s.energy += buff.calmBirthEnergy || 0;
      }
    }
    const active = !resting && (harvesting || (feeding && state.food >= cost) || s.pop > state.pop);
    if (active && s.seconds % (has('variation') ? 18 : 24) === 0) s.dna++;
    if (light !== phase(s).light) {
      if (!resting && has('drift')) s.dna += draw(s, 0) % 3;
      if (light) {
        s.energy += (has('rhythm') ? 3 : 0) + (buff.duskEnergy || 0);
        s.pigment -= buff.duskPigmentLoss || 0;
      } else {
        s.energy += buff.dawnEnergy || 0;
      }
      if (!light && !resting && has('plasticity')) s.dna += 2;
    }
    s.pigment = clamp(s.pigment - Number(!harvesting && s.seconds % 2 === 0) - Number(resting));
    s.cloud = clamp(s.cloud - Number(!feeding && s.seconds % 2 === 0) - Number(resting));
    city.advance(s);
    s.pop = Math.min(s.pop, Math.max(state.pop, city.housing(s)));
    settle(s, buff);
    s.energy = Math.min(s.energy, Math.max(state.energy, city.capacity(s)));
    s.dna = Math.min(s.dna, Math.max(state.dna, 32));
    if (s.status === 'won') {
      s.event = null;
      return s;
    }
    if (light && s.seconds % 5 === 0) {
      const visible = Math.floor(s.pigment / 12) + Math.floor(s.cloud / 12) + s.stage;
      s.suspicion = clamp(
        s.suspicion + visible + modifier - 3 - (effect === 'fog' ? 2 : 0) - (resting ? 6 : 0),
      );
    } else if (!light && (resting || s.seconds % 4 === 0)) {
      s.suspicion = clamp(s.suspicion - (resting ? 2 : 1));
    }
    if (s.suspicion === 100) {
      s.status = 'lost';
      s.event = null;
    }
    if (s.status === 'playing') updateEvent(s);
    return s;
  }

  const integer = (value, min = 0, max = Number.MAX_SAFE_INTEGER) =>
    Number.isSafeInteger(value) && value >= min && value <= max;
  const totalFood = (stage) => stages.slice(0, stage + 1).reduce((sum, item) => sum + item.food, 0);
  function restore(raw) {
    if (
      !raw ||
      typeof raw !== 'object' ||
      !integer(raw.stage, 0, 4) ||
      !integer(raw.pop, 4) ||
      !integer(raw.energy) ||
      !statuses.includes(raw.status) ||
      !integer(raw.pigment, 0, 100) ||
      !integer(raw.cloud, 0, 100) ||
      !integer(raw.suspicion, 0, 100) ||
      (raw.status === 'lost') !== (raw.suspicion === 100)
    )
      return null;
    if (raw.version === undefined) return migrate(raw);
    if (
      ![2, 3].includes(raw.version) ||
      !integer(raw.seconds) ||
      !integer(raw.seed, 0, 0xffffffff) ||
      !integer(raw.food) ||
      !['meals', 'lightMeals', 'manualMeals', 'lastLightDay'].every((k) => integer(raw[k])) ||
      !integer(raw.nextEvent, raw.seconds + Number(raw.status === 'playing')) ||
      !(raw.lastEvent === null || eventById.has(raw.lastEvent)) ||
      !(
        raw.event === null ||
        (raw.event &&
          eventById.has(raw.event.id) &&
          raw.event.id === raw.lastEvent &&
          integer(raw.event.start, 0, raw.seconds) &&
          raw.event.until === raw.event.start + eventById.get(raw.event.id).duration &&
          (raw.status !== 'playing' || raw.seconds < raw.event.until))
      ) ||
      !integer(raw.dna) ||
      !modes.includes(raw.mode) ||
      !Array.isArray(raw.traits) ||
      raw.traits.length > traits.length ||
      new Set(raw.traits).size !== raw.traits.length ||
      !raw.traits.every(
        (id) => byId.has(id) && byId.get(id).parents.every((parent) => raw.traits.includes(parent)),
      )
    )
      return null;
    // Finished v1 colonies retain the ending they already earned under the old population target.
    if (raw.version === 3 && !city.valid(raw.city)) return null;
    const expected = raw.status === 'won' ? 4 : Math.min(3, territory(raw.pop));
    if (raw.stage !== expected && !(raw.version === 2 && raw.status === 'playing' && raw.stage === 4))
      return null;
    if (raw.version === 3 && raw.city.built.includes('capital') && raw.status !== 'won') return null;
    return {
      ...raw,
      version: 3,
      stage: expected,
      traits: [...raw.traits],
      city: raw.version === 2 ? city.init() : structuredCopy(raw.city),
    };
  }
  function structuredCopy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function migrate(old) {
    if (
      !integer(old.turn, 0, Math.floor(Number.MAX_SAFE_INTEGER / 4)) ||
      !integer(old.food, 0, 24) ||
      old.food % 3 !== 0 ||
      !integer(old.eaters, 0, 3) ||
      !integer(old.lights, 0, 3) ||
      typeof old.pact !== 'boolean' ||
      !(old.eaters < 2 ? old.eatStyle === '' : ['feast', 'quiet'].includes(old.eatStyle)) ||
      !(old.lights < 2 ? old.lightStyle === '' : ['flare', 'shade'].includes(old.lightStyle))
    )
      return null;
    const s = initial(old.turn >>> 0);
    Object.assign(s, {
      seconds: old.turn * 4,
      pop: old.pop,
      food: old.food,
      energy: old.energy,
      pigment: old.pigment,
      cloud: old.cloud,
      suspicion: old.suspicion,
      status: old.status,
    });
    const ids = new Set();
    function inherit(id) {
      byId.get(id).parents.forEach(inherit);
      ids.add(id);
    }
    if (old.eaters) inherit('hetero');
    if (old.eatStyle) inherit(old.eatStyle === 'feast' ? 'catabolism' : 'reserve');
    if (old.eaters === 3) inherit('anabolism');
    if (old.lights) inherit('photo');
    if (old.lightStyle) inherit(old.lightStyle === 'flare' ? 'chlorophyll' : 'rhythm');
    if (old.lights === 3) inherit('photosystem');
    if (old.pact) inherit('variation');
    s.traits = [...ids];
    s.nextEvent = s.seconds + 5 + (s.seed % 4);
    s.stage = old.status === 'won' ? 4 : Math.min(territory(s.pop), 3);
    s.food += totalFood(s.stage) - stages[0].food;
    s.dna += s.stage * 3;
    if (s.stage === 4 && s.status === 'playing') s.status = 'won';
    return s;
  }

  const api = {
    researchEnergy,
    initial,
    phase,
    stages,
    traits,
    events,
    foodReward,
    choose,
    reason,
    learn,
    tick,
    restore,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SoupGame = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
