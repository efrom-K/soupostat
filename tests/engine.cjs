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
let techState = { ...start(), dna: 500 };
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
assert.equal(game.phase(advance(start(), 10)).light, false);
assert.equal(game.phase(advance(start(), 24)).light, true);
const noEvents = { ...start(), nextEvent: 10000 };
const rim = advance(noEvents, 18);
assert.equal(rim.stage, 1);
const at41 = advance(rim, 23);
const jar = game.tick(at41);
assert.equal(jar.stage, 2);
assert.equal(jar.pop, 25);
assert.equal(jar.food - at41.food, 32);
assert.equal(game.tick(jar).food, jar.food);
const night = { ...noEvents, seconds: 11, mode: 'photo' };
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
assert.equal(difference('fog', 5, 'auto', 'suspicion'), -2);
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
  for (let i = 0; i < 1200 && s.status === 'playing' && !s.traits.includes(id); i++) {
    for (const key of need) {
      if (!game.reason(s, key)) s = game.learn(s, key).state;
    }
    if (s.suspicion >= 50) s = game.choose(s, 'rest');
    else if (s.suspicion < 15) s = game.choose(s, 'auto');
    s = game.tick(s);
  }
  assert.ok(s.traits.includes(id), 'unreachable final tier in an actual campaign: ' + id);
}
let success = start(),
  defeat = start();
while (success.status === 'playing' && success.seconds < 800) {
  if (success.suspicion >= 55) success = game.choose(success, 'rest');
  else if (success.suspicion < 15) success = game.choose(success, 'auto');
  success = game.tick(success);
}
defeat = advance(defeat, 800);
assert.equal(success.status, 'won');
assert.equal(defeat.status, 'lost');
for (const s of [success, defeat]) {
  assert.deepEqual(game.restore(s), s);
  assert.equal(game.tick(s), s);
}
console.log(
  'PASS: v1 migration, autonomous capture and supplies, 42 traits and playable final tiers, six events, deterministic saves, both endings.',
);
