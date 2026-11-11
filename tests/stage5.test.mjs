import test from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import * as l from '../site/calc/labs.js';
import { evaluateLine, parseWeight } from '../site/calc/resus.js';
import { CARE_SECTIONS, CARE_ITEMS } from '../site/data/care.js';
import { LAB_TOOLS, PEDS_TOOLS, SCORES, TOOL_ITEMS } from '../site/data/tools.js';
import { RATIO_TABLES, BASAL_RULES, IVPO, CONVERSION_ITEMS } from '../site/data/conversions.js';
import { convertDose } from '../site/calc/convert.js';
import { REFERENCES } from '../site/data/references.js';

const close = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} is not within ${tol} of ${b}`);
const tool = (list, id) => list.find((t) => t.id === id);
const dose = (section, id, label, kg) => {
  const d = CARE_SECTIONS.find((s) => s.id === section).doses.find((x) => x.id === id);
  assert.ok(d, id);
  const line = d.lines.find((x) => x.label === label);
  assert.ok(line, `${id}: ${label}`);
  return evaluateLine(line, kg);
};

// Expected values below were worked by hand from the published equation.
test('phenytoin', () => {
  close(l.phenytoinCorrected(8, 2, 0.2), 16);
  close(l.phenytoinCorrected(8, 2, 0.1), 26.67);
  close(l.phenytoinCorrected(8, 2, 0.275), 12.31);
});

test('corrected calcium and sodium', () => {
  close(l.correctedCalcium(8, 2), 9.6);
  close(l.correctedSodium(130, 400), 137.2);
});

test('free water deficit', () => close(l.freeWaterDeficit(70, 0.6, 160), 6));

test('anion gap and osmolality', () => {
  assert.equal(l.anionGap(140, 100, 24), 16);
  close(l.correctedAnionGap(16, 2), 21);
  close(l.calculatedOsm(140, 90, 14), 290);
  close(l.calculatedOsm(140, 90, 14, 46), 300);
});

test('Ganzoni', () => close(l.ganzoni(70, 15, 8), 1676));

test('QTc at 100 bpm', () => {
  const q = l.qtc(400, 100);
  close(q.bazett, 516.4, 0.1);
  close(q.fridericia, 474.3, 0.1);
  close(q.framingham, 461.6, 0.1);
  close(q.hodges, 470, 0.001);
});

test('QTc formulas agree at 60 bpm', () => {
  const q = l.qtc(400, 60);
  for (const v of Object.values(q)) close(v, 400, 0.001);
});

test('MELD 3.0', () => {
  const normal = { bilirubin: 1, sodium: 137, inr: 1, creatinine: 1, albumin: 3.5 };
  assert.equal(l.meld3(normal), 6);
  assert.equal(l.meld3({ ...normal, female: true }), 7);
  assert.equal(l.meld3({ bilirubin: 4, sodium: 130, inr: 2, creatinine: 2, albumin: 2.5 }), 30);
});

test('MELD 3.0 applies bounds and dialysis', () => {
  const low = { bilirubin: 0.3, sodium: 145, inr: 0.8, creatinine: 0.4, albumin: 5 };
  assert.equal(l.meld3(low), 6);
  const base = { bilirubin: 2, sodium: 135, inr: 1.5, albumin: 3 };
  assert.equal(l.meld3({ ...base, creatinine: 8 }), l.meld3({ ...base, creatinine: 3 }));
  assert.equal(l.meld3({ ...base, creatinine: 1, dialysis: true }), l.meld3({ ...base, creatinine: 3 }));
});

test('maintenance fluids', () => {
  assert.deepEqual(l.maintenanceFluids(5), { hourly: 20, daily: 500, capped: false });
  assert.deepEqual(l.maintenanceFluids(15), { hourly: 50, daily: 1250, capped: false });
  assert.deepEqual(l.maintenanceFluids(25), { hourly: 65, daily: 1600, capped: false });
  assert.equal(l.maintenanceFluids(80).hourly, 120);
  assert.equal(l.maintenanceFluids(100).capped, true);
});

test('drip rates', () => {
  close(l.dripRate({ dose: 0.1, doseUnit: 'mcg/kg/min', kg: 80, amount: 4, amountUnit: 'mg', volumeMl: 250 }), 30);
  close(l.dripRate({ dose: 0.03, doseUnit: 'units/min', amount: 20, amountUnit: 'units', volumeMl: 100 }), 9);
  close(l.dripRate({ dose: 5, doseUnit: 'mg/h', amount: 100, amountUnit: 'mg', volumeMl: 100 }), 5);
  close(l.dripRate({ dose: 1, doseUnit: 'units/kg/h', kg: 70, amount: 100, amountUnit: 'units', volumeMl: 100 }), 70);
  assert.equal(l.dripRate({ dose: 0.1, doseUnit: 'mcg/kg/min', amount: 4, amountUnit: 'mg', volumeMl: 250 }), null);
  assert.equal(l.dripRate({ dose: 1, doseUnit: 'units/min', amount: 4, amountUnit: 'mg', volumeMl: 250 }), null);
});

test('critical care doses and caps', () => {
  assert.equal(dose('status', 'lorazepam', 'Dose', 20).dose, '2 mg');
  assert.equal(dose('status', 'lorazepam', 'Dose', 80).dose, '4 mg');
  assert.equal(dose('status', 'lorazepam', 'Dose', 80).flag, 'max');
  assert.equal(dose('status', 'fospheny', 'Dose', 100).dose, '1500 mg');
  assert.equal(dose('status', 'vpa', 'Dose', 100).dose, '3000 mg');
  assert.equal(dose('status', 'lev', 'Dose', 100).dose, '4500 mg');
  assert.equal(dose('status', 'pb-urgent', 'Dose', 30).dose, '1000 mg');
  assert.equal(dose('anaphylaxis', 'epi-im', 'Weight-based', 20).dose, '0.2 mg');
  assert.equal(dose('anaphylaxis', 'epi-im', 'Weight-based', 80).dose, '0.5 mg');
});

test('tool outputs', () => {
  const phen = tool(LAB_TOOLS, 'phenytoin').compute({ level: 8, albumin: 2, renal: 'yes' });
  assert.equal(phen[0].value, '26.7');
  assert.equal(phen.length, 1);
  const phenNormal = tool(LAB_TOOLS, 'phenytoin').compute({ level: 8, albumin: 2, renal: 'no' });
  assert.equal(phenNormal[0].value, '16');
  assert.equal(phenNormal[1].value, '12.3');
});

test('score item point maximums', () => {
  const max = (id) => {
    const s = SCORES.find((x) => x.id === id);
    return s.items.reduce((sum, i) => sum + (i.options ? Math.max(...i.options.map((o) => o[0])) : i.points), 0);
  };
  assert.equal(max('chadsvasc'), 9);
  assert.equal(max('hasbled'), 9);
  assert.equal(max('childpugh'), 15);
  assert.equal(max('ciwa'), 67);
  assert.equal(max('cows'), 48);
  assert.equal(max('fourts'), 8);
});

test('score interpretations', () => {
  const s = (id) => SCORES.find((x) => x.id === id);
  assert.match(s('fourts').interp(3), /Low/);
  assert.match(s('fourts').interp(4), /Intermediate/);
  assert.match(s('fourts').interp(5), /Intermediate/);
  assert.match(s('fourts').interp(6), /High/);
  assert.match(s('childpugh').interp(6), /Class A/);
  assert.match(s('childpugh').interp(7), /Class B/);
  assert.match(s('childpugh').interp(10), /Class C/);
  assert.match(s('hasbled').interp(3), /High risk/);
  assert.match(s('hasbled').interp(2), /Below/);
  assert.match(s('cows').interp(12), /Mild/);
  assert.match(s('cows').interp(13), /Moderate/);
  assert.match(s('cows').interp(37), /Severe/);
  assert.match(s('ciwa').interp(15), /Severe/);
});

test('antipsychotic methods', () => {
  const t = RATIO_TABLES.find((x) => x.id === 'antipsychotic');
  const d = (id) => t.drugs.find((x) => x.id === id).equivs;
  assert.deepEqual(convertDose(10, d('olanzapine').ddd, d('quetiapine').ddd), [400, 400]);
  assert.deepEqual(convertDose(10, d('olanzapine').med, d('quetiapine').med), [200, 200]);
  close(convertDose(5, d('haloperidol').ddd, d('olanzapine').ddd)[0], 6.25);
});

test('insulin rules', () => {
  const rule = (id) => BASAL_RULES.find((r) => r.id === id);
  assert.deepEqual(rule('nph2-basal').pct, [80, 80]);
  assert.deepEqual(rule('u300-u100').pct, [80, 80]);
  assert.equal(rule('u300-u100').splitAbove, 80);
  assert.equal(rule('deg-basal').splitAbove, 80);
  assert.ok(rule('basal-nph').alwaysSplit);
  for (const r of BASAL_RULES) assert.ok(r.label && r.pct.length === 2, r.id);
  assert.deepEqual(rule('once-u300').pct, [100, 100]);
});

test('weight limits for critical care', () => {
  assert.equal(parseWeight('80', 'care').kg, 80);
  assert.ok(parseWeight('0.1', 'care').error);
});

test('removed sections stay out', () => {
  assert.deepEqual(CARE_SECTIONS.map((x) => x.id), ['status', 'anaphylaxis']);
  assert.deepEqual(PEDS_TOOLS.map((x) => x.id), ['mivf']);
  for (const id of ['ucsfRsi', 'nychhcPressors', 'aha2023Tox', 'gpnotebookK', 'akhDoses']) assert.equal(REFERENCES[id], undefined, id);
});

test('no anticoagulant reversal is listed', () => {
  const text = JSON.stringify(CARE_SECTIONS).toLowerCase();
  for (const word of ['protamine', 'idarucizumab', 'andexanet', 'vitamin k', 'phytonadione']) assert.ok(!text.includes(word), word);
});

test('IV to PO rows are complete', () => {
  for (const r of IVPO) assert.ok(r.drug && r.iv && r.po, r.drug);
});

test('every stage 5 item has known sources and a review status', () => {
  for (const item of [...CARE_ITEMS, ...TOOL_ITEMS, ...CONVERSION_ITEMS]) {
    assert.ok(item.refs.length > 0, item.id);
    for (const r of item.refs) assert.ok(REFERENCES[r], `${item.id}: ${r}`);
    assert.ok(['unverified', 'verified'].includes(item.review.status), item.id);
  }
});

test('views never pass empty values straight to the DOM', () => {
  const dir = new URL('../site/', import.meta.url);
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.js') && x !== 'dom.js' && x !== 'sw.js')) {
    assert.ok(!readFileSync(new URL(f, dir), 'utf8').includes('.replaceChildren('), f);
  }
});
