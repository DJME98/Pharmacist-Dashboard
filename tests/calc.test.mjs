import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import * as f from '../site/calc/formulas.js';
import { normalize, emptyRaw } from '../site/calc/patient.js';
import { CALCULATIONS, evaluate } from '../site/calc/registry.js';
import { REFERENCES } from '../site/data/references.js';

const close = (actual, expected, tol = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${actual} is not within ${tol} of ${expected}`);

// Each expected number below was worked by hand from the published formula.
test('body size', () => {
  close(f.bmi(80, 200), 20);
  close(f.ibwDevine('M', 70 * 2.54), 73);
  close(f.ibwDevine('F', 64 * 2.54), 54.7);
  close(f.adjBw(73, 100), 83.8);
  close(f.bsaMosteller(80, 180), 2);
});

test('Cockcroft-Gault', () => {
  close(f.cockcroftGault(60, 70, 1, 'M'), 77.78);
  close(f.cockcroftGault(60, 70, 1, 'F'), 66.11);
});

test('Winter weight choice follows BMI bands', () => {
  assert.equal(f.winterWeightChoice(18.4), 'actual');
  assert.equal(f.winterWeightChoice(18.5), 'ibw');
  assert.equal(f.winterWeightChoice(24.9), 'ibw');
  assert.equal(f.winterWeightChoice(25), 'adj');
});

test('CKD-EPI at the creatinine and cystatin knots', () => {
  close(f.ckdEpiCr2021(0, 0.9, 'M'), 142);
  close(f.ckdEpiCr2021(0, 0.7, 'F'), 143.704);
  close(f.ckdEpiCys2012(0, 0.8, 'M'), 133);
  close(f.ckdEpiCrCys2021(0, 0.9, 0.8, 'M'), 135);
  close(f.ckdEpiCrCys2021(0, 0.7, 0.8, 'F'), 130.005);
});

test('pediatric equations', () => {
  close(f.bedsideSchwartz(120, 0.6), 82.6);
  close(f.neonatalGfr(50, 0.5), 31);
  close(f.u25Cr(12, 150, 0.75, 'M'), 78);
  close(f.u25Cr(20, 170, 1, 'F'), 70.38);
  close(f.u25Cys(20, 1, 'M'), 77.1);
  close(f.u25CrCys(20, 100, 1, 1, 'F'), (41.4 + 68.3) / 2);
});

test('EKFC at Q', () => {
  close(f.ekfcCys(30, 0.83), 107.3);
  close(f.ekfcCr(30, 80 / 88.4, 'M'), 107.3);
  close(f.ekfcCystatinQ(60), 0.88);
});

test('Jelliffe with stable creatinine', () => {
  close(f.jelliffe(40, 70, 1, 1, 1, 'M'), 102.96);
  close(f.jelliffe(40, 70, 1, 1, 1, 'F'), 88.96);
});

test('Jelliffe with rising and falling creatinine', () => {
  close(f.jelliffe(40, 70, 1, 2, 1, 'M'), 36.9);
  close(f.jelliffe(40, 70, 3, 2, 1, 'M'), 52.85);
});

test('Jelliffe is lower when creatinine rises', () => {
  assert.ok(f.jelliffe(60, 70, 1, 2, 1, 'M') < f.jelliffe(60, 70, 1.5, 1.5, 1, 'M'));
});

test('de-indexing', () => {
  close(f.deindex(60, 1.73), 60);
  close(f.deindex(60, 2.2), 76.3);
});

const vectors = new URL('./vectors.json', import.meta.url);
test('matches the independent Python implementation', { skip: !existsSync(vectors) }, () => {
  const rows = JSON.parse(readFileSync(vectors, 'utf8'));
  assert.ok(rows.length > 500);
  for (const r of rows) close(f[r.fn](...r.args), r.expected, 1e-8);
});

const patient = (over) => normalize({ ...emptyRaw(), age: '60', sex: 'M', height: '175', weight: '80', scr: '1', ...over });

test('unit conversion', () => {
  const { p } = patient({ height: '70', heightUnit: 'in', weight: '176.37', weightUnit: 'lb', scr: '88.4', scrUnit: 'umol' });
  close(p.heightCm, 177.8);
  close(p.weightKg, 80, 0.01);
  close(p.scr, 1);
  close(normalize({ ...emptyRaw(), age: '6', ageUnit: 'mo' }).p.ageY, 0.5);
});

test('out-of-range and non-numeric values are rejected', () => {
  assert.equal(patient({ weight: '9000' }).p.weightKg, null);
  assert.ok(patient({ weight: '9000' }).errors.weight);
  assert.equal(patient({ scr: 'abc' }).p.scr, null);
  assert.ok(patient({ scr: '-1' }).errors.scr);
});

test('likely unit mistakes raise a warning', () => {
  assert.ok(patient({ scr: '20' }).warnings.some((w) => /µmol/.test(w)));
  assert.ok(patient({ scr: '1.2', scrUnit: 'umol' }).warnings.some((w) => /mg\/dL/.test(w)));
  assert.ok(patient({ weight: '800', weightUnit: 'lb', height: '60' }).warnings.some((w) => /BMI|height/i.test(w)));
});

const byId = (id) => CALCULATIONS.find((c) => c.id === id);

test('methods only appear for the ages they apply to', () => {
  const adult = patient({}).p;
  const child = patient({ age: '8', height: '125', weight: '26', scr: '0.5' }).p;
  const newborn = normalize({ ...emptyRaw(), age: '10', ageUnit: 'd', sex: 'F', height: '50', scr: '0.6' }).p;
  assert.equal(evaluate(byId('schwartz'), adult), null);
  assert.equal(evaluate(byId('cg-actual'), child), null);
  assert.equal(evaluate(byId('ckdepi-cr'), child), null);
  assert.ok(evaluate(byId('schwartz'), child).value > 0);
  assert.ok(evaluate(byId('neonatal'), newborn).value > 0);
  assert.equal(evaluate(byId('neonatal'), child), null);
});

test('missing inputs are named', () => {
  const { p } = patient({});
  assert.deepEqual(evaluate(byId('ckdepi-cys'), p).missing, ['cystatin C']);
});

test('exactly one Cockcroft-Gault weight is suggested', () => {
  for (const weight of ['45', '68', '120']) {
    const { p } = patient({ weight });
    const shown = ['cg-actual', 'cg-ibw', 'cg-adj'].map((id) => evaluate(byId(id), p)).filter(Boolean);
    assert.equal(shown.filter((r) => r.suggested).length, 1, `weight ${weight}`);
  }
});

test('every calculation has a formula, a known source, and a review status', () => {
  for (const c of CALCULATIONS) {
    assert.ok(c.refs.length > 0, c.id);
    for (const r of c.refs) assert.ok(REFERENCES[r], `${c.id}: unknown reference ${r}`);
    assert.ok(typeof c.formula === 'function', c.id);
    assert.ok(['unverified', 'verified'].includes(c.review.status), c.id);
  }
});
