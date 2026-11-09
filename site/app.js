import { emptyRaw, normalize } from './calc/patient.js';
import { CALCULATIONS, evaluate } from './calc/registry.js';
import { REFERENCES, REFERENCES_ACCESSED, CHECK_LABELS } from './data/references.js';
import { RESUS_ITEMS } from './data/resus.js';
import { renderResus } from './resus-view.js';

// Patient values live only in this variable. They are never stored or sent.
const raw = emptyRaw();
const app = document.getElementById('app');
const openRows = new Set();

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c !== null && c !== undefined && c !== false) el.append(c);
  }
  return el;
}

function field({ key, label, unitKey, units, hint, mode = 'decimal' }) {
  const id = `f-${key}`;
  const input = h('input', {
    id, type: 'text', inputmode: mode, autocomplete: 'off', value: raw[key],
    'aria-describedby': `${id}-err`,
    oninput: (e) => { raw[key] = e.target.value; update(); },
  });
  const control = [input];
  if (units) {
    const select = h('select', {
      'aria-label': `${label} unit`,
      onchange: (e) => { raw[unitKey] = e.target.value; update(); },
    }, units.map(([v, t]) => h('option', { value: v, selected: raw[unitKey] === v }, t)));
    control.push(select);
  }
  return h('div', { class: 'field' },
    h('label', { for: id }, label),
    h('div', { class: 'control' }, control),
    hint && h('p', { class: 'hint' }, hint),
    h('p', { class: 'field-error', id: `${id}-err`, 'data-error': key }));
}

function sexField() {
  const option = (value, text) => h('label', { class: 'choice' },
    h('input', {
      type: 'radio', name: 'sex', value, checked: raw.sex === value,
      onchange: () => { raw.sex = value; update(); },
    }), h('span', {}, text));
  return h('fieldset', { class: 'field' },
    h('legend', {}, 'Sex used in equations'),
    h('div', { class: 'choices' }, option('M', 'Male'), option('F', 'Female')));
}

function patientPanel() {
  return h('form', { class: 'patient', 'aria-label': 'Patient details', onsubmit: (e) => e.preventDefault() },
    h('h2', {}, 'Patient'),
    field({ key: 'age', label: 'Age', unitKey: 'ageUnit', units: [['y', 'years'], ['mo', 'months'], ['d', 'days']] }),
    sexField(),
    field({ key: 'height', label: 'Height', unitKey: 'heightUnit', units: [['cm', 'cm'], ['in', 'in']] }),
    field({ key: 'weight', label: 'Weight', unitKey: 'weightUnit', units: [['kg', 'kg'], ['lb', 'lb']] }),
    field({ key: 'scr', label: 'SCr', unitKey: 'scrUnit', units: [['mgdl', 'mg/dL'], ['umol', 'µmol/L']] }),
    field({ key: 'cys', label: 'Cystatin C (mg/L)' }),
    h('h3', {}, 'If creatinine is changing'),
    field({ key: 'prevScr', label: 'Earlier SCr (same unit)' }),
    field({ key: 'days', label: 'Days between results' }),
    h('button', { type: 'button', class: 'clear', onclick: clearPatient }, 'Clear patient'));
}

function clearPatient() {
  Object.assign(raw, emptyRaw());
  openRows.clear();
  route();
}

const fmt = (value, decimals) => value.toFixed(decimals);

function refList(calc) {
  return h('ol', { class: 'row-refs' }, calc.refs.map((id) => {
    const r = REFERENCES[id];
    return h('li', {},
      r.url ? h('a', { href: r.url, target: '_blank', rel: 'noopener' }, r.cite) : r.cite,
      r.note && h('span', { class: 'ref-note' }, ` ${r.note}`));
  }));
}

function row(calc, p, res) {
  const open = openRows.has(calc.id);
  const detailId = `d-${calc.id}`;
  const done = res.value !== undefined;
  return h('li', { class: `result${res.suggested ? ' suggested' : ''}`, 'data-row': calc.id },
    h('div', { class: 'result-head' },
      h('div', { class: 'result-name' },
        h('span', {}, calc.name),
        res.suggested && h('span', { class: 'tag' }, 'Weight suggested by BMI (Winter 2012)')),
      done
        ? h('div', { class: 'result-value' },
            h('output', {}, fmt(res.value, calc.decimals)), h('span', { class: 'unit' }, calc.unit))
        : h('div', { class: 'result-need' }, res.invalid ?? `Needs ${res.missing.join(', ')}`)),
    done && res.deindexed !== undefined && h('p', { class: 'deindexed' },
      `Not indexed to body size: ${fmt(res.deindexed, 0)} mL/min (Du Bois BSA)`),
    h('button', {
      type: 'button', class: 'more', 'aria-expanded': String(open), 'aria-controls': detailId,
      onclick: () => { open ? openRows.delete(calc.id) : openRows.add(calc.id); update(); },
    }, open ? 'Hide formula and sources' : 'Show formula and sources'),
    open && h('div', { class: 'detail', id: detailId },
      p.sex || !calc.needs.includes('sex')
        ? h('p', { class: 'formula' }, calc.formula(p))
        : h('p', {}, 'Choose a sex to see the coefficients used.'),
      res.used && h('p', {}, res.used),
      calc.note && h('p', {}, calc.note),
      calc.kind === 'egfr' && p.isAdult && h('p', {}, 'KDIGO 2024 practice point 4.2.4: non-indexed eGFR may be indicated at extremes of body weight.'),
      h('p', { class: 'status' }, calc.review.status === 'verified'
        ? `Reviewed by ${calc.review.by} on ${calc.review.date}`
        : 'Unverified: awaiting pharmacist review'),
      refList(calc)));
}

function spread(items) {
  const values = items.map(({ res }) => res.value);
  if (values.length < 2) return null;
  const top = Math.max(150, Math.ceil(Math.max(...values) / 30) * 30);
  const pct = (v) => `${(v / top) * 100}%`;
  const ticks = [];
  for (let t = 0; t <= top; t += 30) ticks.push(t);
  const low = Math.min(...values);
  const high = Math.max(...values);
  return h('section', { class: 'spread', 'aria-label': 'Spread of estimates' },
    h('p', { class: 'spread-range' },
      h('b', {}, `${low.toFixed(0)} to ${high.toFixed(0)}`), ' across ', `${values.length} estimates`),
    h('div', { class: 'scale', role: 'img', 'aria-label': `Estimates range from ${low.toFixed(0)} to ${high.toFixed(0)}` },
      ticks.map((t) => h('span', { class: 'tick', style: `left:${pct(t)}` }, h('i', {}, String(t)))),
      items.map(({ calc, res }) => h('span', {
        class: `mark ${calc.kind}`, style: `left:${pct(res.value)}`,
        title: `${calc.name}: ${res.value.toFixed(0)} ${calc.unit}`,
      }))),
    h('p', { class: 'legend' },
      h('span', {}, h('span', { class: 'mark crcl key' }), 'CrCl, mL/min'),
      h('span', {}, h('span', { class: 'mark egfr key' }), 'eGFR, mL/min/1.73 m²')));
}

function results(page, p) {
  const calcs = CALCULATIONS.filter((c) => c.page === page);
  if (p.ageY === null) {
    return h('p', { class: 'empty' }, 'Enter the patient’s age to see the methods that apply.');
  }
  const evaluated = calcs.map((calc) => ({ calc, res: evaluate(calc, p) })).filter((x) => x.res);
  if (!evaluated.length) {
    return h('p', { class: 'empty' }, 'No method on this page applies at this age.');
  }
  const groups = new Map();
  for (const item of evaluated) {
    if (!groups.has(item.calc.group)) groups.set(item.calc.group, []);
    groups.get(item.calc.group).push(item);
  }
  const plotted = evaluated.filter(({ calc, res }) => calc.kind !== 'other' && res.value !== undefined);
  return [
    page === 'renal' ? spread(plotted) : null,
    [...groups].map(([title, items]) => h('section', { class: 'group' },
      h('h2', {}, title),
      h('ul', { class: 'results' }, items.map(({ calc, res }) => row(calc, p, res))))),
  ];
}

let resultsEl;
let alertsEl;
let currentPage = 'renal';

function update() {
  const { p, errors, warnings } = normalize(raw);
  document.querySelectorAll('[data-error]').forEach((el) => {
    const msg = errors[el.dataset.error] ?? '';
    el.textContent = msg;
    const input = document.getElementById(`f-${el.dataset.error}`);
    if (input) {
      if (msg) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
  });
  if (alertsEl) {
    alertsEl.replaceChildren(...warnings.map((w) => h('p', { class: 'alert' }, w)));
  }
  if (resultsEl) resultsEl.replaceChildren(...[results(currentPage, p)].flat(2).filter(Boolean));
}

function referencesPage() {
  const search = h('input', {
    type: 'search', placeholder: 'Search references', 'aria-label': 'Search references',
    oninput: (e) => {
      const q = e.target.value.trim().toLowerCase();
      list.querySelectorAll('li').forEach((li) => { li.hidden = q !== '' && !li.textContent.toLowerCase().includes(q); });
    },
  });
  const usedBy = (id) => [...CALCULATIONS, ...RESUS_ITEMS].filter((c) => c.refs.includes(id)).map((c) => (c.kind === 'acls' || c.kind === 'pals' ? `${c.kind.toUpperCase()} ${c.name.toLowerCase()} algorithm` : c.name));
  const entries = Object.entries(REFERENCES).sort((a, b) => a[1].cite.localeCompare(b[1].cite));
  const list = h('ul', { class: 'ref-list' }, entries.map(([id, r]) => h('li', {},
    h('p', { class: 'ref-cite' }, r.url ? h('a', { href: r.url, target: '_blank', rel: 'noopener' }, r.cite) : r.cite),
    h('p', { class: 'ref-meta' }, CHECK_LABELS[r.checked], r.note ? `. ${r.note}` : ''),
    usedBy(id).length > 0 && h('p', { class: 'ref-meta' }, `Used by: ${usedBy(id).join('; ')}`))));
  return h('div', { class: 'refs-page' },
    h('h1', {}, 'References'),
    h('p', {}, `Sources were last checked on ${REFERENCES_ACCESSED}. The label under each one says how far it was checked. None of this replaces pharmacist review.`),
    search, list);
}

function route() {
  const page = (location.hash || '#renal').slice(1);
  currentPage = ['renal', 'body', 'acls', 'pals', 'refs'].includes(page) ? page : 'renal';
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === currentPage) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  if (currentPage === 'acls' || currentPage === 'pals') {
    resultsEl = null;
    alertsEl = null;
    app.className = 'layout code';
    renderResus(h, currentPage, app);
    return;
  }
  if (currentPage === 'refs') {
    resultsEl = null;
    alertsEl = null;
    app.className = 'layout single';
    app.replaceChildren(referencesPage());
    return;
  }
  app.className = 'layout';
  alertsEl = h('div', { class: 'alerts', role: 'status' });
  resultsEl = h('div', { class: 'output' });
  app.replaceChildren(patientPanel(),
    h('div', { class: 'readout' },
      h('h1', {}, currentPage === 'renal' ? 'Kidney function' : 'Body size'),
      alertsEl, resultsEl));
  update();
}

window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.__NO_SW__) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
