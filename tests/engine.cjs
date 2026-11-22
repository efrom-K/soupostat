const assert = require('node:assert/strict');
const { initial, phase, step, valid, yields, techCost, stages } = require('../game/engine.js');

function play(state, action) {
  const result = step(state, action);
  assert.equal(result.reason, '', result.reason);
  assert.notEqual(result.state, state);
  assert.equal(valid(result.state), true);
  return result.state;
}

function stateWith(overrides) {
  return { ...initial(), ...overrides };
}

assert.deepEqual(initial(), { turn: 0, energy: 8, food: 24, pop: 4, pigment: 6, cloud: 0, suspicion: 0, eaters: 0, lights: 0, eatStyle: '', lightStyle: '', pact: false, stage: 0, status: 'playing' });
assert.deepEqual(phase(initial()), { light: true, day: 1, left: 3, inspection: 'Обычный', modifier: 0 });
assert.deepEqual(phase({ ...initial(), turn: 2 }), { light: true, day: 1, left: 1, inspection: 'Обычный', modifier: 0 });
assert.deepEqual(phase({ ...initial(), turn: 3 }), { light: false, day: 1, left: 3, inspection: 'Обычный', modifier: 0 });
assert.equal(phase({ ...initial(), turn: 6 }).inspection, 'Беглый');
assert.equal(phase({ ...initial(), turn: 12 }).inspection, 'Пристальный');
assert.equal(phase({ ...initial(), turn: 18 }).inspection, 'Обычный');
assert.equal(valid({ ...initial(), extra: 1 }), false);
assert.equal(valid(stateWith({ eaters: 2 })), false);
assert.equal(step({ ...initial(), turn: 3 }, 'photo').reason, 'Ловить свет можно только при открытой дверце.');

assert.deepEqual(yields(initial()), { eatEnergy: 6, eatCloud: 4, photoEnergy: 7, photoPigment: 11, eatPop: 0, photoPop: 0 });
let eatBranch = play(stateWith({ energy: 40 }), 'eaters');
assert.equal(eatBranch.eaters, 1);
assert.equal(techCost(eatBranch, 'feast'), 13);
assert.deepEqual(yields(eatBranch), { eatEnergy: 8, eatCloud: 6, photoEnergy: 7, photoPigment: 11, eatPop: 0, photoPop: 0 });
eatBranch = play(stateWith({ ...eatBranch, energy: 40 }), 'feast');
assert.deepEqual(yields(eatBranch), { eatEnergy: 11, eatCloud: 10, photoEnergy: 7, photoPigment: 11, eatPop: 0, photoPop: 0 });
assert.equal(techCost(eatBranch, 'quiet'), 5);
eatBranch = play(stateWith({ ...eatBranch, energy: 40 }), 'quiet');
assert.equal(eatBranch.eaters, 2);
assert.deepEqual(yields(eatBranch), { eatEnergy: 8, eatCloud: 3, photoEnergy: 7, photoPigment: 11, eatPop: 0, photoPop: 0 });
assert.equal(techCost(eatBranch, 'quiet'), undefined);
assert.equal(techCost(eatBranch, 'banquet'), 19);
eatBranch = play(stateWith({ ...eatBranch, energy: 40, pop: 40, eaters: 2, lights: 1, stage: 3 }), 'banquet');
assert.equal(eatBranch.eaters, 3);
assert.deepEqual(yields(eatBranch), { eatEnergy: 8, eatCloud: 7, photoEnergy: 10, photoPigment: 14, eatPop: 2, photoPop: 0 });
assert.equal(techCost(eatBranch, 'feast'), 5);
eatBranch = play(stateWith({ ...eatBranch, energy: 40 }), 'feast');
assert.equal(eatBranch.eaters, 3);
assert.equal(techCost(eatBranch, 'feast'), undefined);
assert.deepEqual(yields(eatBranch), { eatEnergy: 11, eatCloud: 14, photoEnergy: 10, photoPigment: 14, eatPop: 2, photoPop: 0 });

let lightBranch = play(stateWith({ energy: 40 }), 'lights');
assert.deepEqual(yields(lightBranch), { eatEnergy: 6, eatCloud: 4, photoEnergy: 10, photoPigment: 14, eatPop: 0, photoPop: 0 });
lightBranch = play(stateWith({ ...lightBranch, energy: 40 }), 'flare');
assert.deepEqual(yields(lightBranch), { eatEnergy: 6, eatCloud: 4, photoEnergy: 14, photoPigment: 20, eatPop: 0, photoPop: 0 });
assert.equal(techCost(lightBranch, 'shade'), 5);
lightBranch = play(stateWith({ ...lightBranch, energy: 40 }), 'shade');
assert.deepEqual(yields(lightBranch), { eatEnergy: 6, eatCloud: 4, photoEnergy: 9, photoPigment: 8, eatPop: 0, photoPop: 0 });
lightBranch = play(stateWith({ ...lightBranch, energy: 40, pop: 40, eaters: 1, lights: 2, stage: 3 }), 'festival');
assert.deepEqual(yields(lightBranch), { eatEnergy: 8, eatCloud: 6, photoEnergy: 9, photoPigment: 12, eatPop: 0, photoPop: 2 });
assert.equal(techCost(lightBranch, 'flare'), 5);
lightBranch = play(stateWith({ ...lightBranch, energy: 40 }), 'flare');
assert.equal(lightBranch.lights, 3);
assert.deepEqual(yields(lightBranch), { eatEnergy: 8, eatCloud: 6, photoEnergy: 14, photoPigment: 24, eatPop: 0, photoPop: 2 });

let pact = stateWith({ energy: 30, pop: 40, eaters: 1, lights: 1, stage: 3 });
assert.equal(techCost(initial(), 'pact'), undefined);
assert.equal(techCost(pact, 'pact'), 9);
pact = play(pact, 'pact');
assert.equal(pact.pact, true);
assert.equal(techCost(pact, 'pact'), undefined);
const daytimeHide = play(stateWith({ ...pact, turn: 0, suspicion: 50, pigment: 20, cloud: 20 }), 'hide');
assert.equal(daytimeHide.suspicion, 40);
const nighttimeHide = play(stateWith({ ...pact, turn: 3, suspicion: 50, pigment: 20, cloud: 20 }), 'hide');
assert.equal(nighttimeHide.suspicion, 39);

let win = initial();
const route = ['lights', 'photo', 'photo', 'eaters', 'divide', 'eat', 'divide', 'photo', 'photo', 'feast', 'divide', 'eat', 'hide', 'divide', 'photo', 'flare', 'eat', 'divide', 'photo', 'divide', 'divide', 'eat', 'divide', 'eat', 'divide', 'divide'];
for (const action of route) {
  if (win.status !== 'playing') break;
  win = play(win, action);
}
assert.equal(win.status, 'won', `route did not win: ${JSON.stringify(win)}`);
assert.equal(stages[win.stage].name, 'Холодильник');

let finalLightWin = stateWith({ turn: 2, energy: 0, pop: 59, pigment: 100, cloud: 100, suspicion: 99, eaters: 3, lights: 2, eatStyle: 'feast', lightStyle: 'flare', stage: 3 });
assert.equal(valid(finalLightWin), true);
finalLightWin = play(finalLightWin, 'eat');
assert.equal(finalLightWin.status, 'won');
assert.equal(finalLightWin.suspicion, 99);
assert.equal(valid({ ...finalLightWin, suspicion: 100 }), false);

let loss = initial();
for (let i = 0; i < 50 && loss.status === 'playing'; i++) {
  loss = play(loss, i % 6 < 3 ? 'photo' : loss.energy >= 8 ? 'divide' : 'hide');
}
assert.equal(loss.status, 'lost');
assert.equal(loss.suspicion, 100);
console.log('engine tree, phase, win/loss, and terminal-boundary scenarios passed');
