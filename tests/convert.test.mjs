import test from 'node:test';
import assert from 'node:assert/strict';
import { OPIOIDS, RATIO_TABLES, STATINS, CONVERSION_ITEMS } from '../site/data/conversions.js';
import { REFERENCES } from '../site/data/references.js';
import { altResults, convertDose, fentanylPatch, formatRange, opioidSummary, opioidTarget, practical, roundStep, statinIntensity } from '../site/calc/convert.js';

const close = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} is not within ${tol} of ${b}`);
const table = (id) => RATIO_TABLES.find((t) => t.id === id);
const eq = (id, drug) => table(id).drugs.find((d) => d.id === drug).equiv;
const opioid = (id) => OPIOIDS.find((o) => o.id === id);

// Expected values below were worked by hand from the source tables.
test('single-value conversions', () => {
  assert.deepEqual(convertDose(4, eq('benzo', 'lorazepam'), eq('benzo', 'diazepam')), [40, 40]);
  assert.deepEqual(convertDose(40, eq('steroid', 'prednisone'), eq('steroid', 'methylprednisolone')), [32, 32]);
  assert.deepEqual(convertDose(100, eq('beta', 'metoprolol'), eq('beta', 'carvedilol')), [25, 25]);
  assert.deepEqual(convertDose(80, eq('loop', 'furosemide-po'), eq('loop', 'bumetanide')), [2, 2]);
  close(convertDose(6, eq('steroid', 'dexamethasone'), eq('steroid', 'hydrocortisone'))[0], 160);
});

test('range conversions widen in both directions', () => {
  assert.deepEqual(convertDose(40, eq('loop', 'furosemide-po'), eq('loop', 'torsemide')), [10, 20]);
  assert.deepEqual(convertDose(20, eq('loop', 'torsemide'), eq('loop', 'furosemide-po')), [40, 80]);
  assert.deepEqual(convertDose(10, eq('ace', 'lisinopril'), eq('ace', 'enalapril')), [10, 10]);
  assert.deepEqual(convertDose(50, eq('arb', 'losartan'), eq('arb', 'candesartan')), [8, 16]);
});

test('PPI conversions use standard-dose equivalence', () => {
  assert.deepEqual(convertDose(20, eq('ppi', 'omeprazole'), eq('ppi', 'esomeprazole')), [20, 20]);
  assert.deepEqual(convertDose(40, eq('ppi', 'pantoprazole'), eq('ppi', 'omeprazole')), [20, 20]);
  assert.deepEqual(convertDose(30, eq('ppi', 'lansoprazole'), eq('ppi', 'pantoprazole')), [40, 40]);
});

test('practical rounding goes to the nearest real step, never zero', () => {
  assert.equal(roundStep(9.2, 10), 10);
  assert.equal(roundStep(13.3, 5), 15);
  assert.equal(roundStep(0.4, 2.5), 2.5);
  assert.deepEqual(practical([6.2, 12.4], 2.5), [5, 12.5]);
});

test('conflicting sources give their own results', () => {
  const benzo = RATIO_TABLES.find((t) => t.id === 'benzo');
  const from = benzo.drugs.find((d) => d.alt?.length);
  const to = benzo.drugs.find((d) => d.id === 'diazepam');
  const alts = altResults(10, from, to);
  assert.ok(alts.length >= 1);
  for (const a of alts) assert.ok(a.src && a.range.every(Number.isFinite));
});

test('range formatting', () => {
  assert.equal(formatRange([40, 40]), '40 mg');
  assert.equal(formatRange([10, 20], 'mg/day'), '10 to 20 mg/day');
});

test('oral morphine and MME totals', () => {
  const s = opioidSummary([{ drug: 'oxycodone-po', dose: 40 }, { drug: 'morphine-po', dose: 30 }], OPIOIDS);
  close(s.oralMorphine, 90);
  close(s.mme, 90);
  assert.equal(s.blockers.length, 0);
});

test('IV opioids convert but do not count toward MME', () => {
  const s = opioidSummary([{ drug: 'morphine-iv', dose: 10 }], OPIOIDS);
  close(s.oralMorphine, 30);
  assert.equal(s.mme, 0);
  assert.equal(s.mmeComplete, false);
});

test('opioid conversion applies the reduction', () => {
  const r = opioidTarget(90, opioid('hydromorphone-po'), 33, 6);
  close(r.calculated, 22.5);
  close(r.daily, 15.075);
  close(r.perDose, 2.5125);
  close(r.rescue, 3.015);
  close(opioidTarget(30, opioid('morphine-iv'), 0, null).daily, 10);
});

test('methadone and fentanyl patch cannot be converted from', () => {
  const s = opioidSummary([{ drug: 'methadone-po', dose: 30 }, { drug: 'fentanyl-td', dose: 50 }], OPIOIDS);
  assert.equal(s.blockers.length, 2);
  close(s.mme, 30 * 4.7 + 50 * 2.4);
  assert.equal(opioid('methadone-po').equi, undefined);
  assert.equal(opioid('fentanyl-td').equi, undefined);
});

test('fentanyl patch bands from the label', () => {
  assert.equal(fentanylPatch(89).below, true);
  assert.equal(fentanylPatch(90).mcgPerHour, 25);
  assert.equal(fentanylPatch(134).mcgPerHour, 25);
  assert.equal(fentanylPatch(135).mcgPerHour, 50);
  assert.equal(fentanylPatch(224).mcgPerHour, 50);
  assert.equal(fentanylPatch(225).mcgPerHour, 75);
  assert.equal(fentanylPatch(404).mcgPerHour, 100);
  assert.equal(fentanylPatch(1035).mcgPerHour, 300);
  assert.equal(fentanylPatch(1124).mcgPerHour, 300);
  assert.equal(fentanylPatch(1125).above, true);
});

test('statin intensity groups', () => {
  const r = statinIntensity(STATINS, 'atorvastatin', '40');
  assert.equal(r.intensity, 'high');
  assert.deepEqual(r.matches, [{ name: 'Rosuvastatin', doses: [20, 40] }]);
  const m = statinIntensity(STATINS, 'simvastatin', '20');
  assert.equal(m.intensity, 'moderate');
  assert.ok(m.matches.find((x) => x.name === 'Pravastatin').doses.includes(40));
});

test('every conversion has known sources and a review status', () => {
  for (const item of CONVERSION_ITEMS) {
    assert.ok(item.refs.length > 0, item.id);
    for (const r of item.refs) assert.ok(REFERENCES[r], `${item.id}: ${r}`);
    assert.ok(['unverified', 'verified'].includes(item.review.status));
  }
});
