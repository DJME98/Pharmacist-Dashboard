import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as v from '../site/calc/vanco.js';
import * as a from '../site/calc/amino.js';
import { PK_ITEMS } from '../site/data/pk.js';
import { REFERENCES } from '../site/data/references.js';

const close = (actual, expected, tol = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${actual} is not within ${tol} of ${expected}`);

test('Goti typical values at the reference patient', () => {
  const tv = v.typicalParams(120, 70);
  close(tv.CL, 4.5, 1e-9); close(tv.V1, 58.4, 1e-9); close(tv.V2, 38.4, 1e-9); close(tv.Q, 6.5, 1e-9);
  close(v.typicalParams(120, 140).V1, 116.8, 1e-9);
  close(v.typicalParams(60, 70).CL, 4.5 * 0.5 ** 0.8, 1e-9);
});

test('CrCl follows the model data rules', () => {
  const base = { ageY: 70, sex: 'M', heightCm: 175, weightKg: 80, scr: 0.6 };
  const info = v.crclForModel(base, 'actual');
  assert.equal(info.scr, 1);
  close(info.crcl, (70 * 80) / 72, 1e-6);
  const young = v.crclForModel({ ...base, ageY: 25, scr: 0.5 }, 'actual');
  assert.equal(young.scr, 0.5);
  assert.equal(young.crcl, 150);
  assert.equal(young.capped, true);
});

test('AUC equals daily dose divided by clearance', () => {
  const m = v.typicalParams(80, 80);
  const ss = v.steadyState(m, 1000, 12, 1);
  close(ss.auc24, 2000 / m.CL, 1e-9);
  assert.ok(ss.peak > ss.trough);
});

test('steady state from the app matches long-run dosing', () => {
  const m = v.typicalParams(80, 80);
  const ss = v.steadyState(m, 1000, 12, 1);
  const doses = Array.from({ length: 200 }, (_, i) => ({ start: i * 12, mg: 1000, hours: 1 }));
  close(v.concentrationAt(m, doses, 199 * 12 + 1), ss.peak, 1e-3);
  close(v.concentrationAt(m, doses, 200 * 12 - 1e-6), ss.trough, 1e-3);
});

test('matches the separate numerical solver', () => {
  const rows = JSON.parse(readFileSync(new URL('./vanco_vectors.json', import.meta.url), 'utf8'));
  assert.ok(rows.length >= 6);
  for (const r of rows) {
    const tv = v.typicalParams(r.crcl, r.kg);
    const { doses, tObs } = v.buildHistory({ loadMg: r.load, doseMg: r.dose, tau: r.tau, hours: r.hours, count: r.count, hoursAfterLast: r.after });
    close(v.concentrationAt(tv, doses, tObs), r.popPred, 1e-5);
    const fit = v.fitOneLevel(tv, doses, tObs, r.level);
    close(v.objective(fit.eta, tv, doses, tObs, r.level), r.objective, 1e-4);
    close(fit.params.CL / r.cl, 1, 0.005);
    close(fit.predicted, r.fitPred, 0.05);
  }
});

test('a higher level lowers estimated clearance', () => {
  const tv = v.typicalParams(80, 80);
  const { doses, tObs } = v.buildHistory({ loadMg: null, doseMg: 1000, tau: 12, hours: 1, count: 4, hoursAfterLast: 11.5 });
  assert.ok(v.fitOneLevel(tv, doses, tObs, 25).params.CL < v.fitOneLevel(tv, doses, tObs, 8).params.CL);
});

test('a level equal to the prediction leaves parameters near the population', () => {
  const tv = v.typicalParams(80, 80);
  const { doses, tObs } = v.buildHistory({ loadMg: null, doseMg: 1000, tau: 12, hours: 1, count: 4, hoursAfterLast: 11.5 });
  close(v.fitOneLevel(tv, doses, tObs, v.concentrationAt(tv, doses, tObs)).params.CL / tv.CL, 1, 0.1);
});

test('regimen options all fall inside the target', () => {
  const options = v.regimenOptions(v.typicalParams(80, 80));
  assert.ok(options.length > 0);
  for (const o of options) assert.ok(o.auc24 >= 400 && o.auc24 <= 600);
});

test('loading dose ranges and cap', () => {
  assert.deepEqual(v.loadingRange(80, 25), { perKg: [20, 35], mg: [1600, 2800], capped: false });
  assert.deepEqual(v.loadingRange(150, 40), { perKg: [20, 25], mg: [3000, 3000], capped: true });
});

// Expected numbers were worked by hand from the published equations.
test('aminoglycoside dosing weight', () => {
  assert.deepEqual(a.dosingWeight(60, 70), { kg: 60, basis: 'actual' });
  assert.deepEqual(a.dosingWeight(80, 70), { kg: 70, basis: 'ideal' });
  assert.equal(a.dosingWeight(120, 70).basis, 'adjusted');
  close(a.dosingWeight(120, 70).kg, 90);
});

test('aminoglycoside equations', () => {
  const kel = 0.00293 * 100 + 0.014;
  close(kel, 0.307, 1e-9);
  close(a.idealInterval(kel, 8, 1, 0.5), 7.273, 0.002);
  close(a.doseForPeak(kel, 17.5, 8, 0.5, 7.273), 134.83, 0.05);
  const lv = a.expectedLevels(134.83, kel, 17.5, 0.5, 7.273);
  close(lv.peak, 8, 0.05);
  close(lv.trough, 1, 0.02);
});

test('traditional regimen rounds interval up and dose to the step', () => {
  const k = { kel: 0.307, vd: 17.5, weight: { kg: 70 } };
  const r = a.traditionalRegimen(k, 'gent', 8, 1, 0.5);
  assert.equal(r.tau, 8);
  assert.equal(r.mg % 10, 0);
  assert.ok(r.trough <= 1.05);
});

test('Hartford interval and doses', () => {
  assert.equal(a.hartfordInterval(60), 24);
  assert.equal(a.hartfordInterval(59.9), 36);
  assert.equal(a.hartfordInterval(40), 36);
  assert.equal(a.hartfordInterval(39), 48);
  assert.equal(a.hartfordInterval(19), null);
  const k = { crcl: 80, weight: { kg: 72 } };
  assert.equal(a.extendedDose(k, 'gent').mg, 500);
  assert.equal(a.extendedDose(k, 'amik').mg, 1100);
});

test('every PK tool has known sources and a review status', () => {
  for (const item of PK_ITEMS) {
    for (const r of item.refs) assert.ok(REFERENCES[r], `${item.id}: ${r}`);
    assert.ok(['unverified', 'verified'].includes(item.review.status));
  }
});
