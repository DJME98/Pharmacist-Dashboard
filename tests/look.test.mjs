import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { BROSELOW, broselowZone } from '../site/calc/resus.js';
import { ADULT_DOSES, PEDS_DOSES, ALGORITHMS, CATEGORIES, DOSE_CATEGORY, CHARTS } from '../site/data/resus.js';
import { INSULINS } from '../site/data/insulin.js';
import { activity } from '../site/calc/insulin.js';
import { RATIO_TABLES } from '../site/data/conversions.js';
import { REFERENCES } from '../site/data/references.js';

test('Broselow zones match the published ranges', () => {
  assert.equal(broselowZone(2.9), null);
  assert.equal(broselowZone(3).id, 'grey');
  assert.equal(broselowZone(5.9).id, 'grey');
  assert.equal(broselowZone(6).id, 'pink');
  assert.equal(broselowZone(9).id, 'red');
  assert.equal(broselowZone(11).id, 'purple');
  assert.equal(broselowZone(14).id, 'yellow');
  assert.equal(broselowZone(18).id, 'white');
  assert.equal(broselowZone(23).id, 'blue');
  assert.equal(broselowZone(29).id, 'orange');
  assert.equal(broselowZone(36).id, 'green');
  assert.equal(broselowZone(37), null);
  assert.equal(broselowZone(null), null);
  for (const z of BROSELOW) assert.equal(broselowZone(z.mid).id, z.id);
});

test('every ACLS and PALS dose has a color group', () => {
  const ids = new Set(CATEGORIES.map((c) => c.id));
  for (const d of [...ADULT_DOSES, ...PEDS_DOSES]) assert.ok(ids.has(DOSE_CATEGORY[d.id]), d.id);
});

test('every algorithm has a published chart with a link', () => {
  for (const a of ALGORITHMS) assert.ok(REFERENCES[CHARTS[a.id]]?.url, a.id);
});

test('insulin curves start and end at zero and peak in the peak window', () => {
  for (const ins of INSULINS) {
    const end = (ins.duration[0] + ins.duration[1]) / 2;
    assert.equal(activity(0, ins), 0, ins.id);
    assert.equal(activity(end + 0.01, ins), 0, ins.id);
    if (ins.peak) assert.equal(activity((ins.peak[0] + ins.peak[1]) / 2, ins), 1, ins.id);
    else assert.ok(activity(end * 0.6, ins) > 0, ins.id);
    for (let t = 0; t <= 48; t += 0.25) {
      const v = activity(t, ins);
      assert.ok(v >= 0 && v <= 1, `${ins.id} at ${t}`);
    }
  }
});

test('requested conversion classes show a table', () => {
  const shown = RATIO_TABLES.filter((t) => t.table).map((t) => t.id).sort();
  assert.deepEqual(shown, ['ace', 'arb', 'benzo', 'beta', 'loop', 'ppi', 'steroid']);
});

test('no review labels remain on the site', () => {
  const dir = new URL('../site/', import.meta.url);
  const files = readdirSync(dir).filter((f) => /\.(js|html)$/.test(f));
  for (const f of files) {
    const text = readFileSync(new URL(f, dir), 'utf8');
    assert.ok(!/Unverified|awaiting pharmacist|Not yet reviewed/.test(text), f);
  }
});

test('ClinCalc and WikEM are not used as sources', () => {
  const dir = new URL('../site/', import.meta.url);
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(new URL(`${e.name}/`, d)) : [new URL(e.name, d)]));
  for (const f of walk(dir).filter((u) => /\.(js|html)$/.test(u.pathname))) {
    assert.doesNotMatch(readFileSync(f, 'utf8'), /clincalc|wikem/i, f.pathname);
  }
});

test('every benzodiazepine sits in a duration group', () => {
  const t = RATIO_TABLES.find((x) => x.id === 'benzo');
  const ids = new Set(t.groups.map((g) => g.id));
  for (const d of t.drugs) assert.ok(ids.has(d.group), d.id);
});

test('steroid and ARB rows carry durations', () => {
  for (const id of ['steroid', 'arb', 'benzo', 'beta', 'ace']) {
    const t = RATIO_TABLES.find((x) => x.id === id);
    assert.ok(t.durationLabel);
    for (const d of t.drugs.filter((x) => x.dur)) assert.ok(['short', 'mid', 'long'].includes(d.durClass) && d.dur[0] <= d.dur[1], d.id);
  }
});

test('every conversion with a basis note cites its references', () => {
  for (const t of RATIO_TABLES.filter((x) => x.basis)) for (const r of t.basisRefs) assert.ok(REFERENCES[r], r);
});

test('beta blockers are grouped and sotalol is not convertible', () => {
  const t = RATIO_TABLES.find((x) => x.id === 'beta');
  const ids = new Set(t.groups.map((g) => g.id));
  for (const d of t.drugs) assert.ok(ids.has(d.group), d.id);
  const sel = t.drugs.filter((d) => d.group === 'sel').map((d) => d.id);
  assert.deepEqual(sel.sort(), ['atenolol', 'betaxolol', 'bisoprolol', 'metoprolol', 'metoprolol-er']);
  const sotalol = t.drugs.find((d) => d.id === 'sotalol');
  assert.ok(sotalol.noConvert && !sotalol.equiv);
  for (const d of t.drugs.filter((x) => x.group === 'other')) assert.ok(d.detail && d.detail.length > 10, d.id);
});
