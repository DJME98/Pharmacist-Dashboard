import test from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_AGENTS } from '../site/data/local.js';
import { cumulative, leanBodyWeight, maxDose, mgFrom } from '../site/calc/local.js';
import { REFERENCES } from '../site/data/references.js';

const ag = (id) => LOCAL_AGENTS.find((a) => a.id === id);
const close = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test('label maximums by weight and cap', () => {
  assert.deepEqual(maxDose(ag('lido'), 50, 40), { mg: 225, basis: '4.5 mg/kg' });
  assert.equal(maxDose(ag('lido'), 80, 40).mg, 300);
  assert.equal(maxDose(ag('lido-epi'), 60, 40).mg, 420);
  assert.equal(maxDose(ag('lido-epi'), 90, 40).mg, 500);
  assert.equal(maxDose(ag('bupi'), 60, 40).mg, 175);
  assert.equal(maxDose(ag('bupi-epi'), 60, 40).mg, 225);
  assert.equal(maxDose(ag('chloro'), 100, 40).mg, 800);
  assert.equal(maxDose(ag('chloro-epi'), 50, 40).mg, 700);
  assert.equal(maxDose(ag('mepi'), 50, 40).mg, 350);
  assert.equal(maxDose(ag('mepi'), 80, 40).mg, 400);
  assert.equal(maxDose(ag('artic'), 80, 40).mg, 560);
  assert.equal(maxDose(ag('prilo'), 60, 40).mg, 480);
  assert.equal(maxDose(ag('prilo'), 75, 40).mg, 600);
});

test('pediatric label limits', () => {
  assert.equal(maxDose(ag('bupi'), 30, 10).mg, null);
  assert.equal(maxDose(ag('ropi'), 50, 16).mg, null);
  assert.equal(maxDose(ag('mepi'), 20, 8).mg, 100);
  assert.equal(maxDose(ag('chloro-epi'), 20, 8).mg, 220);
  assert.equal(maxDose(ag('artic'), 15, 3).mg, null);
});

test('fractions of maximum add across agents', () => {
  // 70 kg adult: lidocaine plain max 300 mg; 210 mg is 70%. Bupivacaine plain max 175 mg.
  const r = cumulative([{ agent: ag('lido'), mg: 210 }], 70, 40);
  close(r.total, 0.7);
  close(r.remaining * maxDose(ag('bupi'), 70, 40).mg, 52.5);
  const r2 = cumulative([{ agent: ag('lido'), mg: 210 }, { agent: ag('bupi'), mg: 52.5 }], 70, 40);
  close(r2.total, 1);
  assert.equal(r2.remaining, 0);
});

test('concentration arithmetic and lean body weight', () => {
  assert.equal(mgFrom(1, 20), 200);
  assert.equal(mgFrom(0.25, 30), 75);
  close(leanBodyWeight(70, 175, 'M'), 9270 * 70 / (6680 + 216 * (70 / 1.75 ** 2)));
  assert.ok(leanBodyWeight(70, 165, 'F') < leanBodyWeight(70, 165, 'M'));
});

test('every agent cites a reference that exists', () => {
  for (const a of LOCAL_AGENTS) assert.ok(REFERENCES[a.ref], a.id);
});

test('local anesthetic profiles cover every agent family with class and duration', async () => {
  const { LOCAL_PROFILES, LOCAL_FLAGS } = await import('../site/data/local.js');
  assert.equal(LOCAL_PROFILES.length, 7);
  for (const p of LOCAL_PROFILES) {
    assert.ok(['amide', 'ester'].includes(p.cls), p.id);
    assert.ok(p.dur[0] <= p.dur[1] && ['short', 'mid', 'long'].includes(p.durClass), p.id);
    for (const f of p.flags) assert.ok(LOCAL_FLAGS[f], f);
  }
  assert.equal(LOCAL_PROFILES.find((p) => p.id === 'chloro').cls, 'ester');
});
