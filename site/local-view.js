import { put } from './dom.js';
import { LOCAL_AGENTS } from './data/local.js';
import { cumulative, leanBodyWeight, maxDose, mgFrom } from './calc/local.js';
import { REFERENCES } from './data/references.js';

// Doses are held only in this object and are never stored or sent.
const state = { weightBasis: 'actual', rows: [{ agent: 'lido', pct: '1', mL: '', mg: '' }] };
const REFS = ['lidoLabel', 'bupiLabel', 'ropiLabel', 'mepiLabel', 'chloroLabel', 'articLabel', 'priloLabel', 'neal2018', 'janmahasatian2005'];

const num = (t) => {
  const s = String(t ?? '').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};
const fmt = (v, d = 0) => Number(v.toFixed(d)).toLocaleString('en-US', { maximumFractionDigits: d });
const agentById = (id) => LOCAL_AGENTS.find((a) => a.id === id);

export function renderLocal(h, mount) {
  let patient = null;
  const rowsEl = h('div', { class: 'la-rows' });
  const resultEl = h('div', { 'aria-live': 'polite' });
  const remainEl = h('div', {});

  function rowMg(r) {
    const mg = num(r.mg);
    if (mg !== null) return mg;
    const pct = num(r.pct); const mL = num(r.mL);
    if (pct === null || mL === null) return null;
    return Number.isNaN(pct) || Number.isNaN(mL) ? NaN : mgFrom(pct, mL);
  }

  function drawRows() {
    put(rowsEl, state.rows.map((r, i) => {
      const a = agentById(r.agent);
      const field = (key, label, attrs = {}) => h('div', { class: 'field' },
        h('label', { for: `la-${key}-${i}` }, label),
        h('div', { class: 'control' }, h('input', {
          id: `la-${key}-${i}`, type: 'text', inputmode: 'decimal', autocomplete: 'off', value: r[key], ...attrs,
          oninput: (e) => { r[key] = e.target.value; calc(); },
        })));
      return h('fieldset', { class: 'la-row' },
        h('legend', {}, `Dose ${i + 1}`),
        h('div', { class: 'pk-grid' },
          h('div', { class: 'field span-all' },
            h('label', { for: `la-agent-${i}` }, 'Local anesthetic'),
            h('div', { class: 'control' }, h('select', {
              id: `la-agent-${i}`, class: 'wide',
              onchange: (e) => { r.agent = e.target.value; r.pct = String(agentById(r.agent).conc[0]); drawRows(); calc(); },
            }, LOCAL_AGENTS.map((x) => h('option', { value: x.id, selected: x.id === r.agent }, x.name))))),
          field('pct', 'Concentration (%)'),
          field('mL', 'Volume (mL)'),
          field('mg', 'Or total mg given')),
        h('p', { class: 'hint' }, `Common strengths: ${a.conc.map((c) => `${c}%`).join(', ')}. 1% = 10 mg/mL.`),

        state.rows.length > 1 && h('button', { type: 'button', class: 'link-btn', onclick: () => { state.rows.splice(i, 1); drawRows(); calc(); } }, 'Remove this dose'));
    }));
  }

  function weightFor(p) {
    if (state.weightBasis === 'lean') {
      if (p.heightCm === null || p.sex === null) return null;
      return { kg: leanBodyWeight(p.weightKg, p.heightCm, p.sex), basis: 'lean body weight' };
    }
    return { kg: p.weightKg, basis: 'actual body weight' };
  }

  function calc() {
    const p = patient;
    if (!p || p.weightKg === null || !(p.weightKg > 0)) {
      put(resultEl, h('p', { class: 'empty' }, 'Enter the patient’s weight (and age) in the panel to calculate maximum doses.'));
      put(remainEl);
      return;
    }
    const w = weightFor(p);
    if (!w) { put(resultEl, h('p', { class: 'alert stop' }, 'Lean body weight needs height and sex.')); put(remainEl); return; }
    const doses = state.rows.map((r) => ({ agent: agentById(r.agent), mg: rowMg(r) }));
    if (doses.some((d) => Number.isNaN(d.mg))) { put(resultEl, h('p', { class: 'alert stop' }, 'Enter numbers only.')); put(remainEl); return; }
    const given = doses.filter((d) => d.mg !== null && d.mg > 0);
    const res = cumulative(given, w.kg, p.ageY);
    const blocked = res.rows.filter((r) => r.max.mg === null);
    const pct = res.total * 100;
    put(resultEl,
      h('div', { class: 'pk-hero' },
        h('p', { class: 'hero-label' }, 'Share of the maximum used so far'),
        h('p', { class: `hero-value${pct > 100 ? ' over' : ''}` }, `${fmt(pct, 0)}%`),
        h('div', { class: 'la-meter', role: 'img', 'aria-label': `${fmt(pct, 0)}% of the combined maximum used` },
          res.rows.map((r) => r.fraction && h('span', { class: 'la-seg', style: `width:${Math.min(100, r.fraction * 100)}%` })))),
      pct > 100 && h('p', { class: 'alert stop' }, 'Above the combined maximum. Local anesthetic toxicity is additive; watch for signs of systemic toxicity and have lipid emulsion available.'),
      blocked.map((r) => h('p', { class: 'alert stop' }, `${r.agent.name}: ${r.agent.peds}`)),
      res.rows.length > 0 && h('div', { class: 'scroll' }, h('table', { class: 'data' },
        h('thead', {}, h('tr', {}, ['Dose', 'Given', 'Maximum', 'Share'].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, res.rows.map((r) => h('tr', {},
          h('td', {}, r.agent.name),
          h('td', {}, `${fmt(r.mg, 1)} mg`),
          h('td', {}, r.max.mg ? `${fmt(r.max.mg, 0)} mg (${r.max.basis})` : 'Not for this age'),
          h('td', {}, r.fraction !== null ? `${fmt(r.fraction * 100, 0)}%` : '—')))))),
      h('p', { class: 'hint' }, `Weight used: ${fmt(w.kg, 1)} kg, ${w.basis}. Each dose counts as a share of its own drug’s maximum, and the shares add up.`));
    put(remainEl,
      h('h2', {}, 'What is left'),
      h('p', {}, `${fmt(res.remaining * 100, 0)}% of a maximum dose remains. That share of each drug’s own maximum:`),
      h('div', { class: 'scroll' }, h('table', { class: 'data' },
        h('thead', {}, h('tr', {}, ['Local anesthetic', 'Maximum', 'Remaining', 'Volume remaining'].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, LOCAL_AGENTS.map((a) => {
          const m = maxDose(a, w.kg, p.ageY);
          if (m.mg === null) return h('tr', {}, h('td', {}, a.name), h('td', { colspan: '3' }, a.peds));
          const left = m.mg * res.remaining;
          return h('tr', {}, h('td', {}, a.name), h('td', {}, `${fmt(m.mg, 0)} mg`), h('td', {}, h('b', {}, `${fmt(left, 0)} mg`)),
            h('td', { class: 'la-vols' }, a.conc.map((c) => h('span', {}, `${fmt(left / (c * 10), 1)} mL of ${c}%`))));
        })))));
  }

  put(mount,
    h('p', {}, 'Add every local anesthetic the patient has received in this window. Each dose counts as a share of that drug’s own maximum; the shares add, because local anesthetic toxicity is additive.'),
    h('div', { class: 'field' },
      h('span', { class: 'label' }, 'Weight for mg/kg limits'),
      h('div', { class: 'choices', role: 'radiogroup' }, [['actual', 'Actual'], ['lean', 'Lean body weight']].map(([v, t]) => h('label', { class: 'choice' },
        h('input', { type: 'radio', name: 'la-weight', value: v, checked: state.weightBasis === v, onchange: () => { state.weightBasis = v; calc(); } }), h('span', {}, t)))),
      h('p', { class: 'hint' }, 'The labels give limits per kg of body weight without naming which weight. The ASRA advisory recommends lean body weight for truncal blocks.')),
    rowsEl,
    h('button', { type: 'button', class: 'link-btn la-add', onclick: () => { state.rows.push({ agent: 'bupi', pct: '0.25', mL: '', mg: '' }); drawRows(); calc(); } }, 'Add another local anesthetic'),
    h('section', { class: 'group' }, h('h2', {}, 'Total'), resultEl),
    h('section', { class: 'group' }, remainEl),
    h('section', { class: 'group' },
      h('h2', {}, 'Label limits'),
      h('div', { class: 'scroll' }, h('table', { class: 'data list' },
        h('thead', {}, h('tr', {}, ['Drug', 'Adult limit', '24 h', 'Children'].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, LOCAL_AGENTS.map((a) => h('tr', {}, h('td', {}, a.name), h('td', {}, a.label), h('td', {}, a.day ? `${a.day.toLocaleString('en-US')} mg` : '—'), h('td', {}, a.peds)))))),
      h('ul', { class: 'plain' },
        h('li', {}, 'These maximums assume doses given within one dosing window. Labels allow repeat doses at set intervals (for example, bupivacaine every 3 h within 400 mg per 24 h).'),
        h('li', {}, 'Lower doses for older adults, heart failure, liver disease, low protein binding, pregnancy, and very young or frail patients (ASRA advisory, Table 3). Plasma levels depend more on the block site than on body weight.'),
        h('li', {}, 'Inject in 3 to 5 mL aliquots with a pause of 15 to 30 seconds, aspirate, and use the lowest effective dose (ASRA advisory, Table 2).'))),
    h('details', { class: 'sources' }, h('summary', {}, 'Sources'),
      h('ol', { class: 'row-refs' }, REFS.map((id) => {
        const r = REFERENCES[id];
        return h('li', {}, r.url ? h('a', { href: r.url, target: '_blank', rel: 'noopener' }, r.cite) : r.cite, r.note && h('span', { class: 'ref-note' }, ` ${r.note}`));
      }))));
  drawRows();
  calc();
  return (pt) => { patient = pt; calc(); };
}
