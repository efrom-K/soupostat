const assert = require('node:assert/strict');
const game = require('../game/engine');
const start = () => game.initial(0);
function advance(state, seconds) {
  for (let i = 0; i < seconds; i++) state = game.tick(state);
  return state;
}
const old = {
  turn: 37,
  energy: 35,
  food: 6,
  pop: 103,
  pigment: 27,
  cloud: 12,
  suspicion: 17,
  eaters: 0,
  lights: 2,
  eatStyle: '',
  lightStyle: 'shade',
  pact: false,
  stage: 1,
  status: 'playing',
};
const converted = game.restore(old);
assert.equal(converted.stage, 3);
assert.equal(converted.pop, 103);
assert.equal(converted.food, 6 + 12 + 32 + 54);
assert.ok(converted.traits.includes('rhythm'));
assert.deepEqual(game.restore(converted), converted);
assert.equal(game.restore({ ...old, food: -1 }), null);
assert.equal(game.restore({ ...old, status: 'won', pop: 64, stage: 4 }).status, 'won');
assert.equal(game.restore({ ...old, status: 'lost', suspicion: 100 }).status, 'lost');

const traits = game.traits;
assert.equal(new Set(traits.map((t) => t.id)).size, 42);
assert.deepEqual(
  ['Гетеротрофы', 'Фототрофы', 'Эволюция популяции'].map(
    (b) => traits.filter((t) => t.branch === b).length,
  ),
  [16, 16, 10],
);
let techState = { ...start(), dna: 500, energy: 500 };
for (const t of [...traits].sort((a, b) => a.tier - b.tier)) {
  assert.equal(game.reason(techState, t.id), '', t.id);
  const next = game.learn(techState, t.id).state;
  assert.equal(next.dna, techState.dna - t.cost);
  assert.equal(next.seconds, 0);
  assert.ok(game.reason(next, t.id));
  techState = next;
}
assert.deepEqual(game.restore(techState), techState);
assert.ok(game.reason(start(), 'photosystem'));
assert.equal(game.learn(start(), 'missing').state.seconds, 0);
assert.equal(game.choose(start(), 'eat').seconds, 0);
assert.equal(game.phase(advance(start(), 20)).light, false);
assert.equal(game.phase(advance(start(), 60)).light, true);
const noEvents = { ...start(), nextEvent: 10000 };
let jar = noEvents,
  previous;
while (jar.stage < 2 && jar.seconds < 240) {
  previous = jar;
  jar = game.tick(jar);
}
assert.equal(jar.stage, 2);
assert.ok(jar.pop >= 24);
assert.ok(jar.food - previous.food >= 30);
assert.equal(game.restore(jar).stage, 2);
const night = { ...noEvents, seconds: 23, mode: 'photo' };
assert.equal(game.tick(night).lightMeals, 0);
const still = advance(game.choose(noEvents, 'rest'), 24);
assert.equal(still.pop, 4);
assert.equal(still.dna, 4);
assert.equal(still.pigment, 0);

const eventState = (id, seconds, mode) => ({
  ...noEvents,
  seconds,
  mode,
  energy: 40,
  pigment: 18,
  cloud: 8,
  suspicion: 40,
  event: { id, start: seconds - 1, until: seconds - 1 + game.events.find((e) => e.id === id).duration },
  lastEvent: id,
});
function difference(id, seconds, mode, key) {
  const s = eventState(id, seconds, mode);
  return game.tick(s)[key] - game.tick({ ...s, event: null })[key];
}
assert.equal(difference('stir', 3, 'eat', 'energy'), 3);
assert.equal(difference('crumbs', 3, 'eat', 'energy'), 1);
assert.equal(difference('lamp', 3, 'photo', 'energy'), -3);
assert.equal(difference('fog', 4, 'auto', 'suspicion'), -2);
assert.equal(difference('frost', 5, 'auto', 'pop'), -2);
assert.equal(difference('warm', 5, 'auto', 'pop'), 2);
const observed = new Set();
for (let seed = 0; seed < 128; seed++) {
  let s = game.initial(seed);
  const before = advance(s, s.nextEvent - 1);
  s = game.tick(before);
  observed.add(s.event.id);
  if (s.event.id === 'stir') assert.equal(s.cloud - game.tick({ ...before, nextEvent: 999 }).cloud, 12);
  if (s.event.id === 'crumbs') assert.equal(s.food - game.tick({ ...before, nextEvent: 999 }).food, 6);
  assert.deepEqual(advance(game.restore(s), 45), advance(s, 45));
  assert.equal(advance(s, s.event.until - s.seconds).event, null);
}
assert.equal(observed.size, 6);
for (const id of traits.filter((t) => t.tier === 6).map((t) => t.id)) {
  const need = new Set();
  function include(key) {
    const t = traits.find((t) => t.id === key);
    t.parents.forEach(include);
    need.add(key);
  }
  include(id);
  let s = start();
  for (let i = 0; i < 8500 && s.status === 'playing' && !s.traits.includes(id); i++) {
    for (const key of need) {
      if (!game.reason(s, key)) s = game.learn(s, key).state;
    }
    if (s.suspicion >= 50) s = game.choose(s, 'rest');
    else if (s.suspicion < 15) s = game.choose(s, 'auto');
    s = game.tick(s);
  }
  assert.ok(s.traits.includes(id), 'unreachable final tier in an actual campaign: ' + id);
}
const city = require('../game/campaign');
const deficit = game.learn({ ...start(), energy: 0 }, 'hetero');
assert.ok(deficit.reason.includes('энергии'));
assert.equal(game.restore({ ...start(), version: 2, city: undefined }).version, 3);
const protectedFunds = game.tick({ ...start(), seconds: 5, energy: 16 });
assert.equal(protectedFunds.pop, 4);
assert.equal(protectedFunds.energy, 16);
for (const choice of ['neighbors', 'republic']) {
  let s = start(),
    rest = false,
    launches = 0;
  function doOrder(action, id) {
    const res = city.order(s, action, id);
    assert.equal(res.reason, '');
    s = res.state;
  }
  while (s.status === 'playing' && s.seconds < 9000) {
    if (s.suspicion >= 55) rest = true;
    if (s.suspicion < 16) rest = false;
    s = game.choose(s, rest ? 'rest' : 'auto');
    for (const id of ['hetero', 'reserve', 'photo', 'rhythm'])
      if (!game.reason(s, id)) s = game.learn(s, id).state;
    if (s.city.voyage && s.city.voyage.until <= s.seconds) doOrder('claim');
    if (s.city.prompt !== null) {
      const opts = city.dilemmas[s.city.prompt].choices;
      const available = [0, 1]
        .sort((a, b) => (opts[b][1].plans || 0) - (opts[a][1].plans || 0))
        .find((i) => !city.order(s, 'decide', i).reason);
      doOrder('decide', available ?? -1);
    }
    if (!s.city.charter && city.chapter(s.city) >= 4) doOrder('charter', choice);
    if (!s.city.work) {
      const p = city.projects.find((p) => !city.quote(s, p.id));
      if (p) doOrder('build', p.id);
    }
    if (!s.city.voyage) {
      const route = s.food < 16 ? 'supply' : s.dna < 5 && s.city.built.length > 3 ? 'relay' : 'survey';
      if (!city.quote(s, route)) {
        doOrder('launch', route);
        launches++;
        doOrder('play');
        assert.ok(city.order(s, 'play').reason);
        doOrder('master', s.city.voyage.seed);
      }
    }
    s = game.tick(s);
    if (s.seconds % 60 === 0) assert.deepEqual(game.restore(s), s);
  }
  assert.equal(s.status, 'won');
  assert.equal(s.city.built.length, 12);
  assert.ok(s.seconds >= 3300 && s.seconds <= 7200);
  assert.ok(launches > 20);
  assert.equal(game.tick(s), s);
  console.log(choice + ': ' + s.seconds + ' simulated seconds, ' + launches + ' expeditions');
}
const lost = advance(game.choose(start(), 'photo'), 1800);
assert.equal(lost.status, 'lost');
assert.equal(game.tick(lost), lost);
console.log(
  'PASS: saves, economy, territory supplies, 42 traits, events, campaign, charter endings and discovery.',
);

{
  const vm = require('node:vm');
  const fs = require('node:fs');
  const context = vm.createContext({ SoupCity: require('../game/campaign') });
  vm.runInContext(fs.readFileSync(require.resolve('../game/guides'), 'utf8'), context);
  const { advice, routeCrew, crew } = context.SoupGuides;
  const s = start();
  assert.equal(advice(s).screen, 'clock');
  s.city.intro = true;
  s.city.chapterRead = 0;
  s.food = 3;
  assert.equal(advice(s).who, 'mira');
  s.suspicion = 70;
  assert.equal(advice(s).screen, 'rest');
  assert.equal(advice(s, 'lada').who, 'lada');
  s.suspicion = 0;
  for (const [route, who] of Object.entries(routeCrew)) {
    s.city.voyage = { id: route, until: s.seconds };
    assert.equal(advice(s).who, who);
    assert.equal(advice(s).screen, 'routes');
  }
  for (const ch of context.SoupCity.chapters) assert.ok(crew[ch.who] && ch.testimony);
  console.log('PASS: three guides, expedition returns, risk priority and chapter witnesses.');
}
