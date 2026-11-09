import { put } from './dom.js';
import { LAB_TOOLS, PEDS_TOOLS, SCORES } from './data/tools.js';
import { CARE_SECTIONS, DRIP_ITEM } from './data/care.js';
import { REFERENCES } from './data/references.js';
import { evaluateLine, parseWeight, formatNumber } from './calc/resus.js';
import { dripRate } from './calc/labs.js';

// Entries are held only in these objects and are never stored or sent.
const values = {};
const scores = {};
const tab = { labs: LAB_TOOLS[0].id, peds: PEDS_TOOLS[0].id, scores: SCORES[0].id, care: 'rsi' };
const care = { weight: '' };
const drip = { dose: '', doseUnit: 'mcg/kg/min', kg: '', amount: '', amountUnit: 'mg', volume: '' };

function footer(h, item) {
  return [
    h('p', { class: 'status' }, 'Unverified: awaiting pharmacist review'),
    h('details', { class: 'sources' }, h('summary', {}, 'Sources'),
      h('ol', { class: 'row-refs' }, item.refs.map((id) => {
        const r = REFERENCES[id];
        return h('li', {}, r.url ? h('a', { href: r.url, target: '_blank', rel: 'noopener' }, r.cite) : r.cite,
          r.note && h('span', { class: 'ref-note' }, ` ${r.note}`));
      }))),
  ];
}

function picker(h, list, current, onpick) {
  return h('div', { class: 'algo-picker', role: 'group', 'aria-label': 'Tool' }, list.map((t) => h('button', {
    type: 'button', 'aria-pressed': String(t.id === current), onclick: () => onpick(t.id),
  }, t.name)));
}

function parseField(field, text) {
  const s = String(text ?? '').trim();
  if (s === '') return field.optional ? { value: null } : { missing: true };
  const n = Number(s);
  if (!Number.isFinite(n) || n < field.min || n > field.max) return { error: `${field.label}: enter ${field.min} to ${field.max}.` };
  return { value: n };
}

function drawTool(h, tool, body) {
  values[tool.id] ??= Object.fromEntries(tool.fields.map((f) => [f.key, f.options ? f.options[0][0] : '']));
  const v = values[tool.id];
  const out = h('div', { class: 'conv-out' });
  const calc = () => {
    const parsed = {};
    const errors = [];
    let missing = false;
    for (const f of tool.fields) {
      if (f.options) { parsed[f.key] = v[f.key]; continue; }
      const r = parseField(f, v[f.key]);
      if (r.error) errors.push(r.error);
      if (r.missing) missing = true;
      parsed[f.key] = r.value ?? null;
    }
    if (errors.length) { put(out, ...errors.map((e) => h('p', { class: 'alert stop' }, e))); return; }
    if (missing) { put(out, h('p', { class: 'empty' }, 'Fill in the required fields to see the result.')); return; }
    put(out, h('ul', { class: 'results' }, tool.compute(parsed).map((r) => h('li', { class: 'conv-row' },
      h('span', {}, r.label), h('b', {}, r.value, r.unit && h('span', { class: 'unit' }, r.unit))))));
  };
  put(body, 
    h('h2', {}, tool.name),
    h('div', { class: 'pk-grid' }, tool.fields.map((f) => {
      const id = `t-${tool.id}-${f.key}`;
      return h('div', { class: 'field' }, h('label', { for: id }, f.label), h('div', { class: 'control' },
        f.options
          ? h('select', { id, class: 'wide', onchange: (e) => { v[f.key] = e.target.value; calc(); } }, f.options.map(([o, t]) => h('option', { value: o, selected: v[f.key] === o }, t)))
          : h('input', { id, type: 'text', inputmode: 'decimal', autocomplete: 'off', value: v[f.key], oninput: (e) => { v[f.key] = e.target.value; calc(); } })));
    })),
    out,
    tool.note && h('p', { class: 'hint' }, tool.note),
    ...footer(h, tool));
  calc();
}

export function scoreTotal(score, state) {
  return score.items.reduce((sum, item) => {
    if (item.options) return sum + Number(state[item.key] ?? item.options[0][0]);
    return sum + (state[item.key] ? item.points : 0);
  }, 0);
}

function drawScore(h, score, body) {
  scores[score.id] ??= {};
  const st = scores[score.id];
  const total = h('p', { class: 'hero-value' });
  const label = h('p', {});
  const update = () => {
    const t = scoreTotal(score, st);
    total.textContent = String(t);
    label.textContent = score.interp(t);
  };
  put(body, 
    h('h2', {}, score.name),
    h('div', { class: 'pk-hero', 'aria-live': 'polite' }, total, label),
    h('div', { class: 'score-list' }, score.items.map((item) => {
      if (item.options) {
        const id = `s-${score.id}-${item.key}`;
        return h('div', { class: 'field' }, h('label', { for: id }, item.label), h('div', { class: 'control' },
          h('select', { id, class: 'wide', onchange: (e) => { st[item.key] = e.target.value; update(); } },
            item.options.map(([p, t]) => h('option', { value: p, selected: String(st[item.key] ?? item.options[0][0]) === String(p) }, t)))));
      }
      return h('label', { class: 'check-row' },
        h('input', { type: 'checkbox', checked: !!st[item.key], onchange: (e) => { st[item.key] = e.target.checked; update(); } }),
        h('span', {}, item.label), h('span', { class: 'unit' }, `+${item.points}`));
    })),
    score.note && h('p', { class: 'hint' }, score.note),
    ...footer(h, score));
  update();
}

export function renderTools(h, mode, mount) {
  const list = { labs: LAB_TOOLS, peds: PEDS_TOOLS, scores: SCORES }[mode];
  const title = { labs: 'Labs', peds: 'Pediatrics', scores: 'Scores' }[mode];
  const pick = h('div', {});
  const body = h('div', {});
  const draw = () => {
    put(pick, picker(h, list, tab[mode], (id) => { tab[mode] = id; draw(); }));
    const item = list.find((t) => t.id === tab[mode]);
    if (mode === 'scores') drawScore(h, item, body); else drawTool(h, item, body);
  };
  put(mount, h('h1', {}, title), pick, body);
  draw();
}

function drawDrip(h, body) {
  const out = h('div', { class: 'conv-out' });
  const calc = () => {
    const nums = ['dose', 'amount', 'volume'].map((k) => Number(drip[k]));
    if (nums.some((n) => !(n > 0))) { put(out, h('p', { class: 'empty' }, 'Enter the dose, the drug amount in the bag, and the bag volume.')); return; }
    const kg = Number(drip.kg);
    const rate = dripRate({ dose: nums[0], doseUnit: drip.doseUnit, kg: kg > 0 ? kg : null, amount: nums[1], amountUnit: drip.amountUnit, volumeMl: nums[2] });
    if (rate === null) { put(out, h('p', { class: 'alert stop' }, drip.doseUnit.includes('/kg') && !(kg > 0) ? 'Enter a weight for a per-kg dose.' : 'The dose unit and bag unit do not match. Use mg with mcg or mg doses, and units with unit doses.')); return; }
    put(out, h('div', { class: 'pk-hero' }, h('p', { class: 'hero-label' }, 'Infusion rate'), h('p', { class: 'hero-value' }, formatNumber(rate), h('span', { class: 'unit' }, 'mL/h'))));
  };
  const num = (key, label) => h('div', { class: 'field' }, h('label', { for: `dr-${key}` }, label), h('div', { class: 'control' },
    h('input', { id: `dr-${key}`, type: 'text', inputmode: 'decimal', autocomplete: 'off', value: drip[key], oninput: (e) => { drip[key] = e.target.value; calc(); } })));
  const sel = (key, label, opts) => h('div', { class: 'field' }, h('label', { for: `dr-${key}` }, label), h('div', { class: 'control' },
    h('select', { id: `dr-${key}`, class: 'wide', onchange: (e) => { drip[key] = e.target.value; calc(); } }, opts.map((o) => h('option', { value: o, selected: drip[key] === o }, o)))));
  put(body, 
    h('p', {}, 'Rate equals dose per hour divided by bag concentration. Confirm against your pump library and institutional limits.'),
    h('div', { class: 'pk-grid' },
      num('dose', 'Dose'),
      sel('doseUnit', 'Dose unit', ['mcg/kg/min', 'mcg/min', 'mg/kg/h', 'mg/h', 'units/min', 'units/kg/h', 'units/h']),
      num('kg', 'Weight (kg), if per-kg'),
      num('amount', 'Drug amount in bag'),
      sel('amountUnit', 'Bag amount unit', ['mg', 'units']),
      num('volume', 'Bag volume (mL)')),
    out,
    ...footer(h, DRIP_ITEM));
  calc();
}

export function renderCare(h, mount) {
  const pick = h('div', {});
  const weightMsg = h('p', { class: 'field-error' });
  const body = h('div', {});
  const tabs = [...CARE_SECTIONS.map((s) => ({ id: s.id, name: s.name })), { id: 'drip', name: 'Drip rates' }];

  const drawSection = (section) => {
    const { kg } = parseWeight(care.weight, 'care');
    put(body, 
      section.intro && h('p', { class: 'alert' }, section.intro),
      section.steps && h('ol', { class: 'plain' }, section.steps.map((s) => h('li', {}, s))),
      h('ul', { class: 'results' }, section.doses.map((d) => h('li', { class: 'dose' },
        h('p', { class: 'dose-name' }, d.name, d.route && h('span', { class: 'route' }, d.route)),
        h('dl', {}, d.lines.flatMap((line) => {
          const r = evaluateLine(line, kg);
          return [
            h('dt', {}, line.label),
            h('dd', {}, h('b', {}, r.dose),
              r.flag === 'max' && h('span', { class: 'capped' }, 'At maximum'),
              r.basis && h('span', { class: 'basis' }, r.basis)),
          ];
        })),
        d.note && h('p', { class: 'dose-note' }, d.note)))),
      ...footer(h, section));
  };

  const draw = () => {
    put(pick, picker(h, tabs, tab.care, (id) => { tab.care = id; draw(); }));
    if (tab.care === 'drip') drawDrip(h, body);
    else drawSection(CARE_SECTIONS.find((s) => s.id === tab.care));
  };

  put(mount, 
    h('div', { class: 'code-head' },
      h('h1', {}, 'Critical care'),
      h('div', { class: 'field kg' },
        h('label', { for: 'care-kg' }, 'Weight (kg)'),
        h('div', { class: 'control' }, h('input', {
          id: 'care-kg', type: 'text', inputmode: 'decimal', autocomplete: 'off', value: care.weight,
          oninput: (e) => { care.weight = e.target.value; const r = parseWeight(care.weight, 'care'); weightMsg.textContent = r.error ?? ''; draw(); },
        })),
        h('p', { class: 'hint' }, 'Only used for weight-based doses.'), weightMsg)),
    pick, body);
  draw();
}
