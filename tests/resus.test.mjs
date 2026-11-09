import test from 'node:test';
import assert from 'node:assert/strict';
import { ADULT_DOSES, PEDS_DOSES, ALGORITHMS } from '../site/data/resus.js';
import { REFERENCES } from '../site/data/references.js';
import { evaluateLine, fillDoses, parseWeight, formatNumber } from '../site/calc/resus.js';

const line = (list, id, label) => {
  const d = list.find((x) => x.id === id);
  assert.ok(d, id);
  const l = d.lines.find((x) => x.label === label);
  assert.ok(l, `${id}: ${label}`);
  return l;
};
const peds = (id, label, kg) => evaluateLine(line(PEDS_DOSES, id, label), kg);
const adult = (id, label, kg) => evaluateLine(line(ADULT_DOSES, id, label), kg);

// Expected values below were worked by hand from the published dose and cap.
test('PALS epinephrine and its cap', () => {
  assert.equal(peds('p-epi', 'Dose', 20).dose, '0.2 mg');
  assert.equal(peds('p-epi', 'Volume of 0.1 mg/mL', 20).dose, '2 mL');
  assert.equal(peds('p-epi', 'Dose', 120).dose, '1 mg');
  assert.equal(peds('p-epi', 'Dose', 120).flag, 'max');
  assert.equal(peds('p-epi', 'Volume of 0.1 mg/mL', 120).dose, '10 mL');
});

test('PALS amiodarone caps first and later doses separately', () => {
  assert.equal(peds('p-amio', 'First dose', 10).dose, '50 mg');
  assert.equal(peds('p-amio', 'First dose', 70).dose, '300 mg');
  assert.equal(peds('p-amio', 'Later doses', 40).dose, '150 mg');
  assert.equal(peds('p-amio', 'Later doses', 40).flag, 'max');
});

test('PALS shocks', () => {
  assert.equal(peds('p-shock', 'First shock', 15).dose, '30 J');
  assert.equal(peds('p-shock', 'Second shock', 15).dose, '60 J');
  assert.equal(peds('p-shock', 'Later shocks', 15).dose, '60 to 150 J');
  assert.equal(peds('p-cardiovert', 'First shock', 10).dose, '5 to 10 J');
  assert.equal(peds('p-cardiovert', 'If ineffective', 10).dose, '20 J');
});

test('PALS atropine floor and ceiling', () => {
  assert.equal(peds('p-atropine', 'Dose', 3).dose, '0.1 mg');
  assert.equal(peds('p-atropine', 'Dose', 3).flag, 'min');
  assert.equal(peds('p-atropine', 'Dose', 10).dose, '0.2 mg');
  assert.equal(peds('p-atropine', 'Dose', 40).dose, '0.5 mg');
  assert.equal(peds('p-atropine', 'Dose', 40).flag, 'max');
});

test('PALS adenosine caps', () => {
  assert.equal(peds('p-adenosine', 'First dose', 10).dose, '1 mg');
  assert.equal(peds('p-adenosine', 'Second dose', 10).dose, '2 mg');
  assert.equal(peds('p-adenosine', 'First dose', 80).dose, '6 mg');
  assert.equal(peds('p-adenosine', 'Second dose', 80).dose, '12 mg');
});

test('other PALS caps and ranges', () => {
  assert.equal(peds('p-calcium', 'Dose', 10).dose, '200 mg');
  assert.equal(peds('p-calcium', 'Dose', 150).dose, '2000 mg');
  assert.equal(peds('p-calcium', 'Volume', 150).dose, '20 mL');
  assert.equal(peds('p-mag', 'Dose', 10).dose, '250 to 500 mg');
  assert.equal(peds('p-mag', 'Dose', 60).dose, '1500 to 2000 mg');
  assert.equal(peds('p-mag', 'Dose', 60).flag, 'max');
  assert.equal(peds('p-mag', 'Dose', 100).dose, '2000 mg');
  assert.equal(peds('p-epi-et', 'Dose', 40).dose, '2.5 mg');
  assert.equal(peds('p-naloxone', 'Under 20 kg and under 5 y', 10).dose, '1 mg');
  assert.equal(peds('p-glucose', 'D25W, infants and children', 10).dose, '20 to 40 mL');
  assert.equal(peds('p-epi-inf', 'Rate', 10).dose, '1 to 10 mcg/min');
});

test('adult weight-based drugs need a weight and flat drugs do not', () => {
  assert.equal(adult('a-epi', 'Dose', null).dose, '1 mg every 3 to 5 min');
  assert.equal(adult('a-epi', 'Dose', 100).dose, '1 mg every 3 to 5 min');
  assert.equal(adult('a-lido', 'First dose', null).dose, '1 to 1.5 mg/kg');
  assert.equal(adult('a-lido', 'First dose', 80).dose, '80 to 120 mg');
  assert.equal(adult('a-lido', 'Second dose', 80).dose, '40 to 60 mg');
  assert.equal(adult('a-procainamide', 'Stop at', 80).dose, '1360 mg');
  assert.equal(adult('a-dopamine', 'Rate', 80).dose, '400 to 1600 mcg/min');
  assert.equal(adult('a-diltiazem', 'Bolus over 2 min', 80).dose, '20 mg');
});

test('every non-weight-based adult drug is flat', () => {
  for (const d of ADULT_DOSES) {
    const scaled = d.lines.some((l) => l.perKg !== undefined || l.range);
    assert.equal(Boolean(d.weightBased), scaled, d.id);
  }
});

test('weight validation', () => {
  assert.equal(parseWeight('', 'pals').kg, null);
  assert.equal(parseWeight('12.5', 'pals').kg, 12.5);
  assert.ok(parseWeight('abc', 'pals').error);
  assert.ok(parseWeight('500', 'pals').error);
  assert.ok(parseWeight('50', 'pals').warning);
  assert.ok(parseWeight('5', 'acls').error);
});

test('number formatting keeps small doses readable', () => {
  assert.equal(formatNumber(0.125), '0.125');
  assert.equal(formatNumber(2.5), '2.5');
  assert.equal(formatNumber(187.5), '187.5');
});

test('every algorithm branch and dose token resolves', () => {
  for (const a of ALGORITHMS) {
    const doses = a.kind === 'acls' ? ADULT_DOSES : PEDS_DOSES;
    assert.ok(a.steps[a.start], a.id);
    for (const [id, step] of Object.entries(a.steps)) {
      for (const b of step.branches) assert.ok(a.steps[b.to], `${a.id}.${id} -> ${b.to}`);
      for (const text of step.lines) {
        for (const kg of [null, 25]) assert.doesNotMatch(fillDoses(text, doses, kg), /\{\{/);
      }
    }
  }
});

test('every dose and algorithm has known sources and a review status', () => {
  for (const item of [...ADULT_DOSES, ...PEDS_DOSES, ...ALGORITHMS]) {
    assert.ok(item.refs.length > 0, item.id);
    for (const r of item.refs) assert.ok(REFERENCES[r], `${item.id}: ${r}`);
    assert.ok(['unverified', 'verified'].includes(item.review.status), item.id);
  }
});
