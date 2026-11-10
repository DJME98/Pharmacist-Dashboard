import { put } from './dom.js';
import { OPIOIDS, OPIOID_ITEM, OPIOID_TABLE_ONLY, SOURCES, STATIN_EQUIV, RATIO_TABLES, STATINS, STATIN_ITEM, INTENSITY_LABEL, BASAL_RULES, INSULIN_ITEM, IVPO, IVPO_EXCLUSIONS, IVPO_ITEM } from './data/conversions.js';
import { REFERENCES } from './data/references.js';
import { convertDose, fentanylPatch, formatRange, opioidSummary, opioidTarget, statinIntensity, practical, roundStep, altResults } from './calc/convert.js';
import { formatNumber } from './calc/resus.js';
import { INSULINS, INSULIN_KIND_LABEL, INSULIN_DEFAULT, INSULIN_KINETICS_ITEM } from './data/insulin.js';
import { activity } from './calc/insulin.js';

// Doses are held only in this object and are never stored or sent.
const state = {
  tab: 'opioids',
  opioidRows: [{ drug: 'oxycodone-po', dose: '' }],
  target: 'hydromorphone-po',
  reduction: '33',
  perDay: '',
  ratio: Object.fromEntries(RATIO_TABLES.map((t) => [t.id, { from: t.drugs[0].id, dose: '', method: t.methods?.[0].id }])),
  insulinRule: BASAL_RULES[0].id,
  insulinDose: '',
  statin: 'atorvastatin',
  statinDose: '40',
  insulinShow: new Set(INSULIN_DEFAULT),
  insulinHours: 24,
};

const num = (t) => {
  const s = String(t ?? '').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : NaN;
};

const TARGETS = OPIOIDS.filter((o) => !o.noConvert || o.noConvert === 'patch' || o.noConvert === 'methadone');

export function renderConvert(h, mount) {
  const tabs = h('div', { class: 'algo-picker', role: 'group', 'aria-label': 'Drug class' });
  const body = h('div', {});

  const footer = (item) => [
    h('details', { class: 'sources' }, h('summary', {}, 'Sources'),
      h('ol', { class: 'row-refs' }, item.refs.map((id) => {
        const r = REFERENCES[id];
        return h('li', {}, r.url ? h('a', { href: r.url, target: '_blank', rel: 'noopener' }, r.cite) : r.cite,
          r.note && h('span', { class: 'ref-note' }, ` ${r.note}`));
      }))),
  ];

  const select = (id, label, value, options, onchange) => h('div', { class: 'field' },
    h('label', { for: id }, label),
    h('div', { class: 'control' }, h('select', { id, class: 'wide', onchange: (e) => onchange(e.target.value) },
      options.map(([v, t]) => h('option', { value: v, selected: value === v }, t)))));

  const input = (id, label, value, oninput, hint) => h('div', { class: 'field' },
    h('label', { for: id }, label),
    h('div', { class: 'control' }, h('input', {
      id, type: 'text', inputmode: 'decimal', autocomplete: 'off', value, oninput: (e) => oninput(e.target.value),
    })),
    hint && h('p', { class: 'hint' }, hint));

  function drawTabs() {
    const list = [['opioids', 'Opioids'], ...RATIO_TABLES.map((t) => [t.id, t.name]), ['statin', 'Statins'], ['insulin', 'Insulin'], ['ivpo', 'IV to PO']];
    put(tabs, ...list.map(([id, name]) => h('button', {
      type: 'button', 'aria-pressed': String(state.tab === id),
      onclick: () => { state.tab = id; drawTabs(); drawBody(); },
    }, name)));
  }

  function drawRatio(table) {
    const s = state.ratio[table.id];
    const out = h('div', { class: 'conv-out' });
    const drugs = table.methods
      ? table.drugs.filter((d) => d.equivs[s.method] !== undefined).map((d) => ({ ...d, equiv: d.equivs[s.method] }))
      : table.drugs;
    if (!drugs.some((d) => d.id === s.from)) s.from = drugs[0].id;
    const calc = () => {
      const dose = num(s.dose);
      const from = drugs.find((d) => d.id === s.from);
      if (dose === null) { put(out, h('p', { class: 'empty' }, 'Enter a dose to see the equivalents.')); return; }
      if (Number.isNaN(dose)) { put(out, h('p', { class: 'alert stop' }, 'Enter a positive number.')); return; }
      put(out, h('ul', { class: 'results' }, drugs.filter((d) => d.id !== s.from).map((d) => {
        const exact = convertDose(dose, from.equiv, d.equiv);
        const alts = table.methods ? [] : altResults(dose, from, d);
        const shown = d.step ? practical(exact, d.step) : exact;
        const rounded = shown.some((v, i) => Math.abs(v - exact[i]) > 1e-6);
        return h('li', { class: `conv-row${alts.length ? ' conflict' : ''}` },
          h('div', { class: 'conv-name' }, h('span', {}, d.name),
            rounded && h('span', { class: 'basis' }, `Calculated ${formatRange(exact, table.unit)}`),
            alts.map((a) => h('span', { class: 'alt' }, `${SOURCES[a.src].label}: ${formatRange(d.step ? practical(a.range, d.step) : a.range, table.unit)}${a.note ? ` (${a.note})` : ''}`))),
          h('b', {}, formatRange(shown, table.unit)));
      })),
      h('p', { class: 'hint' }, 'Bold doses are rounded to a practical strength. Rows marked with a stripe have sources that disagree.'));
    };
    put(body, 
      h('p', {}, table.intro),
      h('p', { class: 'alert' }, table.caution),
      h('div', { class: 'pk-grid' },
        table.methods && select('method', 'Method', s.method, table.methods.map((m) => [m.id, m.label]), (v) => { s.method = v; drawRatio(table); }),
        select('from', 'Convert from', s.from, drugs.map((d) => [d.id, d.name]), (v) => { s.from = v; calc(); }),
        input('dose', `Dose (${table.unit})`, s.dose, (v) => { s.dose = v; calc(); })),
      out,
      table.table && equivalenceTable(table, drugs),
      ...footer(table));
    calc();
  }

  function equivalenceTable(table, drugs) {
    const notes = drugs.some((d) => d.detail);
    const conflicts = drugs.some((d) => d.alt);
    const fmt = (v) => formatRange(Array.isArray(v) ? v : [v, v], '').trim();
    return h('section', { class: 'group' },
      h('h2', {}, 'Equivalence table'),
      h('div', { class: 'scroll' }, h('table', { class: 'data list' },
        h('thead', {}, h('tr', {}, ['Drug', `Equivalent dose (${table.unit})`, conflicts && 'Other sources', notes && 'Notes'].filter(Boolean).map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, drugs.map((d) => h('tr', { class: d.alt ? 'conflict' : '' },
          h('td', {}, d.name),
          h('td', {}, fmt(d.equiv)),
          conflicts && h('td', {}, (d.alt ?? []).map((a) => `${SOURCES[a.src].label}: ${fmt(a.v)}${a.note ? ` (${a.note})` : ''}`).join('; ')),
          notes && h('td', {}, d.detail ?? '')))))));
  }

  function statinTable() {
    const cols = ['low', 'moderate', 'high'];
    return h('section', { class: 'group' },
      h('h2', {}, 'Statins by intensity'),
      h('div', { class: 'scroll' }, h('table', { class: 'data list' },
        h('thead', {}, h('tr', {}, ['Statin', 'Low', 'Moderate', 'High', 'ABDA equivalent'].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, STATINS.map((d) => h('tr', {}, h('td', {}, d.name), cols.map((c) => {
          const doses = Object.keys(d.doses).filter((k) => d.doses[k] === c);
          return h('td', { class: doses.length ? `int-${c}` : '' }, doses.length ? `${doses.join(', ')} mg` : '');
        }), h('td', {}, `${STATIN_EQUIV[d.id]} mg`)))))),
      h('p', { class: 'hint' }, 'Intensity groups are from the 2018 AHA/ACC guideline. The ABDA column lists doses that each lower LDL-C by about 30% to 40%; no head-to-head trials compare them directly.'),
      h('ul', { class: 'plain' }, cols.slice().reverse().map((c) => h('li', {}, INTENSITY_LABEL[c]))));
  }

  function insulinChart() {
    const W = 640;
    const H = 260;
    const pad = { l: 40, r: 14, t: 14, b: 36 };
    const hours = state.insulinHours;
    const x = (t) => pad.l + (t / hours) * (W - pad.l - pad.r);
    const y = (v) => H - pad.b - v * (H - pad.t - pad.b);
    const ns = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs, ...kids) => {
      const n = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
      kids.forEach((k) => n.append(k));
      return n;
    };
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'ins-chart', role: 'img', 'aria-label': 'Schematic insulin action curves over time' });
    const step = hours <= 12 ? 2 : hours <= 24 ? 4 : 6;
    for (let t = 0; t <= hours; t += step) {
      svg.append(el('line', { x1: x(t), x2: x(t), y1: pad.t, y2: H - pad.b, class: 'grid' }));
      svg.append(el('text', { x: x(t), y: H - pad.b + 18, 'text-anchor': 'middle', class: 'tick' }, `${t}`));
    }
    svg.append(el('line', { x1: pad.l, x2: W - pad.r, y1: H - pad.b, y2: H - pad.b, class: 'axis' }));
    svg.append(el('text', { x: (W + pad.l) / 2, y: H - 4, 'text-anchor': 'middle', class: 'tick' }, 'Hours after the dose'));
    svg.append(el('text', { x: 12, y: (H - pad.b + pad.t) / 2, 'text-anchor': 'middle', class: 'tick', transform: `rotate(-90 12 ${(H - pad.b + pad.t) / 2})` }, 'Activity'));
    INSULINS.forEach((ins, i) => {
      if (!state.insulinShow.has(ins.id)) return;
      const pts = [];
      for (let k = 0; k <= 400; k += 1) { const t = (k / 400) * hours; pts.push(`${x(t).toFixed(1)},${y(activity(t, ins)).toFixed(1)}`); }
      svg.append(el('polyline', { points: pts.join(' '), class: `curve ins-${ins.kind}`, 'stroke-dasharray': ['', '7 4', '2 3'][i % 3] }));
    });
    return svg;
  }

  function insulinKinetics() {
    const chartWrap = h('div', { class: 'scroll' });
    const redraw = () => put(chartWrap, insulinChart());
    const rangeBtns = h('div', { class: 'algo-picker', role: 'group', 'aria-label': 'Time range' });
    const drawRange = () => put(rangeBtns, [12, 24, 48].map((hrs) => h('button', {
      type: 'button', 'aria-pressed': String(state.insulinHours === hrs),
      onclick: () => { state.insulinHours = hrs; drawRange(); redraw(); },
    }, `${hrs} h`)));
    drawRange();
    redraw();
    return h('section', { class: 'group' },
      h('h2', {}, 'Insulin action times'),
      h('div', { class: 'scroll' }, h('table', { class: 'data list' },
        h('thead', {}, h('tr', {}, ['Show', 'Insulin', 'Type', 'Onset', 'Peak', 'Duration'].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, INSULINS.map((ins, i) => h('tr', {},
          h('td', {}, h('label', { class: 'show-ins' },
            h('input', { type: 'checkbox', checked: state.insulinShow.has(ins.id), 'aria-label': `Show ${ins.name} on the chart`,
              onchange: (e) => { if (e.target.checked) state.insulinShow.add(ins.id); else state.insulinShow.delete(ins.id); redraw(); } }),
            h('span', { class: 'swatch-slot', 'data-i': String(i) }))),
          h('td', {}, ins.name, ins.note && h('span', { class: 'basis' }, ins.note)),
          h('td', {}, INSULIN_KIND_LABEL[ins.kind]),
          ins.text.map((t) => h('td', {}, t))))))),
      rangeBtns,
      chartWrap,
      h('p', { class: 'hint' }, 'Schematic. Curves are drawn from the onset, peak, and duration in the table to show timing only; heights do not compare strength. Peakless insulins are drawn as flat plateaus. Action varies with dose, site, and patient.'),
      ...footer(INSULIN_KINETICS_ITEM));
  }

  function drawStatin() {
    const out = h('div', { class: 'conv-out' });
    const doseWrap = h('div', {});
    const calc = () => {
      const r = statinIntensity(STATINS, state.statin, state.statinDose);
      put(out, 
        h('p', { class: 'basis-line' }, INTENSITY_LABEL[r.intensity]),
        h('ul', { class: 'results' }, r.matches.map((m) => h('li', { class: 'conv-row' },
          h('span', {}, m.name), h('b', {}, `${m.doses.join(', ')} mg`)))));
    };
    const drawDose = () => {
      const drug = STATINS.find((d) => d.id === state.statin);
      const options = Object.keys(drug.doses);
      if (!options.includes(state.statinDose)) [state.statinDose] = options;
      put(doseWrap, select('statin-dose', 'Daily dose', state.statinDose, options.map((d) => [d, `${d} mg`]), (v) => { state.statinDose = v; calc(); }));
    };
    put(body, 
      h('p', {}, 'Statins are grouped by LDL-lowering intensity. These groups are not exact dose equivalents.'),
      h('div', { class: 'pk-grid' },
        select('statin', 'Statin', state.statin, STATINS.map((d) => [d.id, d.name]), (v) => { state.statin = v; drawDose(); calc(); }),
        doseWrap),
      out,
      statinTable(),
      ...footer(STATIN_ITEM));
    drawDose();
    calc();
  }

  function drawOpioids() {
    const rowsEl = h('div', { class: 'opioid-rows' });
    const out = h('div', { class: 'conv-out' });

    const calc = () => {
      const parsed = state.opioidRows.map((r) => ({ drug: r.drug, dose: num(r.dose) }));
      if (parsed.some((r) => Number.isNaN(r.dose))) { put(out, h('p', { class: 'alert stop' }, 'Enter positive numbers for each dose.')); return; }
      const rows = parsed.filter((r) => r.dose !== null);
      if (!rows.length) { put(out, h('p', { class: 'empty' }, 'Enter the 24-hour total for each current opioid, including breakthrough doses.')); return; }
      const summary = opioidSummary(rows, OPIOIDS);
      const target = OPIOIDS.find((o) => o.id === state.target);
      const reduction = Number(state.reduction);
      const perDay = num(state.perDay);
      const parts = [
        h('div', { class: 'stats' },
          h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, 'CDC MME per day'), h('b', {}, formatNumber(summary.mme))),
          summary.blockers.length === 0 && h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Oral morphine equivalent per day'), h('b', {}, formatNumber(summary.oralMorphine)), h('span', { class: 'unit' }, 'mg'))),
        !summary.mmeComplete && h('p', { class: 'hint' }, 'MME counts oral and transdermal opioids only. IV opioids here are not included in the MME figure.'),
      ];
      if (summary.blockers.length) {
        parts.push(h('p', { class: 'alert stop' }, `Conversion stopped: ${summary.blockers.map((b) => b.name).join(' and ')} cannot be converted with a simple ratio. Do not use a table to convert away from methadone or a fentanyl patch. Get specialist or palliative care input.`));
      } else if (target.noConvert === 'methadone') {
        parts.push(h('p', { class: 'alert stop' }, 'No simple ratio is given for methadone. The dose ratio changes with the current opioid dose, its long half-life can cause delayed respiratory depression, and large reductions are often needed. Get specialist input.'));
      } else if (target.noConvert === 'patch') {
        const p = fentanylPatch(summary.oralMorphine);
        parts.push(p.below
          ? h('p', { class: 'alert' }, 'Below the lowest band in the label table (90 mg oral morphine per day).')
          : p.above
            ? h('p', { class: 'alert' }, 'Above the highest band in the label table (1124 mg oral morphine per day).')
            : h('div', { class: 'pk-hero' }, h('p', { class: 'hero-label' }, 'Starting patch strength from the label table'), h('p', { class: 'hero-value' }, String(p.mcgPerHour), h('span', { class: 'unit' }, 'mcg/h'))));
        parts.push(h('p', { class: 'hint' }, 'From the international Durogesic label, which uses about 150:1 oral morphine to transdermal fentanyl. No extra cross-tolerance reduction is applied. Check the current US product label. Do not use this table in reverse.'));
      } else {
        const perDayN = perDay && !Number.isNaN(perDay) ? perDay : null;
        const r = opioidTarget(summary.oralMorphine, target, reduction, perDayN);
        const each = r.perDose !== null ? roundStep(r.perDose, target.step) : null;
        const daily = each !== null ? each * perDayN : roundStep(r.daily, target.step);
        const alts = (target.alt ?? []).map((a) => {
          const v = Array.isArray(a.v) ? a.v : [a.v, a.v];
          const range = v.map((x) => (summary.oralMorphine * x * (1 - reduction / 100)) / 30);
          return `${SOURCES[a.src].label}${a.note ? ` (${a.note})` : ''}: ${formatRange(range, target.unit)} per 24 h`;
        });
        parts.push(
          h('div', { class: 'pk-hero' },
            h('p', { class: 'hero-label' }, `${target.name} per 24 h after a ${reduction}% reduction, rounded to practical doses`),
            h('p', { class: 'hero-value' }, formatNumber(daily), h('span', { class: 'unit' }, target.unit))),
          h('div', { class: 'stats' },
            h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Calculated after reduction'), h('b', {}, formatNumber(r.daily)), h('span', { class: 'unit' }, target.unit)),
            h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Before reduction'), h('b', {}, formatNumber(r.calculated)), h('span', { class: 'unit' }, target.unit)),
            each !== null && h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, `Each dose, ${perDayN} times a day`), h('b', {}, formatNumber(each)), h('span', { class: 'unit' }, target.unit)),
            h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Breakthrough, up to'), h('b', {}, formatNumber(roundStep(r.rescue, target.step))), h('span', { class: 'unit' }, `${target.unit} q3 to 4 h PRN`))),
          alts.length > 0 && h('p', { class: 'alert' }, `Sources differ for ${target.name.toLowerCase()}: ${alts.join('; ')}.`),
          h('p', { class: 'hint' }, 'Estimate. Choose the most conservative ratio that fits, then titrate to response. If pain is poorly controlled, a smaller reduction or none may be appropriate. Use lower doses in older adults and in severe renal or hepatic disease.'));
      }
      put(out, ...parts.filter(Boolean));
    };

    const drawRows = () => {
      put(rowsEl, ...state.opioidRows.map((row, i) => {
        const d = OPIOIDS.find((o) => o.id === row.drug);
        return h('div', { class: 'pk-grid' },
          select(`op-drug-${i}`, `Current opioid ${state.opioidRows.length > 1 ? i + 1 : ''}`.trim(), row.drug, OPIOIDS.map((o) => [o.id, o.name]), (v) => { row.drug = v; drawRows(); calc(); }),
          input(`op-dose-${i}`, d.unit === 'mcg/h' ? 'Patch strength (mcg/h)' : `Total in 24 h (${d.unit})`, row.dose, (v) => { row.dose = v; calc(); }),
          state.opioidRows.length > 1 && h('button', { type: 'button', class: 'link-btn', onclick: () => { state.opioidRows.splice(i, 1); drawRows(); calc(); } }, 'Remove'));
      }));
    };

    put(body, 
      rowsEl,
      h('button', { type: 'button', class: 'link-btn', onclick: () => { state.opioidRows.push({ drug: 'morphine-po', dose: '' }); drawRows(); calc(); } }, 'Add another opioid'),
      h('div', { class: 'pk-grid conv-settings' },
        select('op-target', 'Convert to', state.target, TARGETS.map((o) => [o.id, o.name]), (v) => { state.target = v; calc(); }),
        select('op-red', 'Cross-tolerance reduction', state.reduction, [['0', 'None'], ['25', '25%'], ['33', '33%'], ['50', '50%']], (v) => { state.reduction = v; calc(); }),
        input('op-per', 'Doses per day (optional)', state.perDay, (v) => { state.perDay = v; calc(); })),
      out,
      opioidTable(),
      ...footer(OPIOID_ITEM));
    drawRows();
    calc();
  }

  function opioidTable() {
    const fmt = (v) => formatRange(Array.isArray(v) ? v : [v, v], '').trim();
    const rows = OPIOIDS.filter((o) => o.equi).map((o) => h('tr', { class: o.alt ? 'conflict' : '' },
      h('td', {}, o.name), h('td', {}, `${fmt(o.equi)} ${o.unit}`),
      h('td', {}, o.cdcFactor ? String(o.cdcFactor) : ''),
      h('td', {}, (o.alt ?? []).map((a) => `${SOURCES[a.src].label}: ${fmt(a.v)} ${o.unit}${a.note ? ` (${a.note})` : ''}`).join('; '))));
    const extra = OPIOID_TABLE_ONLY.map((o) => h('tr', {},
      h('td', {}, o.name), h('td', {}, `${o.equi} ${o.unit}`), h('td', {}, ''),
      h('td', {}, `${SOURCES[o.src].label}. Mixed agonist-antagonist: table only`)));
    const fixed = OPIOIDS.filter((o) => o.noConvert).map((o) => h('tr', {},
      h('td', {}, o.name), h('td', {}, 'No fixed ratio'), h('td', {}, String(o.cdcFactor)),
      h('td', {}, o.noConvert === 'methadone' ? 'Ratio depends on dose; get specialist input' : 'Use the label table, one direction only')));
    return h('section', { class: 'group' },
      h('h2', {}, 'Equianalgesic table'),
      h('p', {}, 'Doses equivalent to morphine 10 mg IV, for chronic dosing.'),
      h('div', { class: 'scroll' }, h('table', { class: 'data list' },
        h('thead', {}, h('tr', {}, ['Opioid', 'Equivalent dose', 'CDC MME factor', 'Other sources'].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, rows, fixed, extra))));
  }

  function drawInsulin() {
    const out = h('div', { class: 'conv-out' });
    const calc = () => {
      const dose = num(state.insulinDose);
      const rule = BASAL_RULES.find((r) => r.id === state.insulinRule);
      if (dose === null) { put(out, h('p', { class: 'empty' }, 'Enter the current total daily basal dose.')); return; }
      if (Number.isNaN(dose)) { put(out, h('p', { class: 'alert stop' }, 'Enter a positive number.')); return; }
      put(out, 
        h('div', { class: 'pk-hero' }, h('p', { class: 'hero-label' }, 'Starting total daily dose'),
          h('p', { class: 'hero-value' }, formatRange(practical(rule.pct.map((p) => (dose * p) / 100), 1), 'units'))),
        rule.note && h('p', { class: 'hint' }, rule.note));
    };
    put(body, 
      h('p', { class: 'alert' }, 'Starting points only. Monitor glucose closely and use conservative doses in older adults.'),
      h('div', { class: 'pk-grid' },
        select('ins-rule', 'Conversion', state.insulinRule, BASAL_RULES.map((r) => [r.id, r.label]), (v) => { state.insulinRule = v; calc(); }),
        input('ins-dose', 'Current total daily dose (units)', state.insulinDose, (v) => { state.insulinDose = v; calc(); })),
      out,
      ...footer(INSULIN_ITEM),
      insulinKinetics());
    body.querySelectorAll('.swatch-slot').forEach((slot) => {
      const i = Number(slot.dataset.i);
      const ins = INSULINS[i];
      const ns = 'http://www.w3.org/2000/svg';
      const sw = document.createElementNS(ns, 'svg');
      sw.setAttribute('viewBox', '0 0 28 10');
      sw.setAttribute('class', 'swatch');
      sw.setAttribute('aria-hidden', 'true');
      const line = document.createElementNS(ns, 'line');
      Object.entries({ x1: 1, x2: 27, y1: 5, y2: 5, class: `curve ins-${ins.kind}`, 'stroke-dasharray': ['', '7 4', '2 3'][i % 3] }).forEach(([k, v]) => line.setAttribute(k, v));
      sw.append(line);
      slot.replaceWith(sw);
    });
    calc();
  }

  function drawIvpo() {
    put(body, 
      h('p', {}, 'Antimicrobial IV to oral switches from two hospital protocols. Azoles generally need loading doses when started.'),
      h('div', { class: 'scroll' }, h('table', { class: 'data ivpo' },
        h('thead', {}, h('tr', {}, ['Drug', 'IV', 'Oral'].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, IVPO.map((r) => h('tr', {}, h('td', {}, r.drug, r.note && h('span', { class: 'basis' }, r.note)), h('td', {}, r.iv), h('td', {}, r.po)))))),
      h('h2', {}, 'Do not switch if'),
      h('ul', { class: 'plain' }, IVPO_EXCLUSIONS.map((e) => h('li', {}, e))),
      ...footer(IVPO_ITEM));
  }

  function drawBody() {
    if (state.tab === 'opioids') drawOpioids();
    else if (state.tab === 'statin') drawStatin();
    else if (state.tab === 'insulin') drawInsulin();
    else if (state.tab === 'ivpo') drawIvpo();
    else drawRatio(RATIO_TABLES.find((t) => t.id === state.tab));
  }

  put(mount, h('h1', {}, 'Conversions'), tabs, body);
  drawTabs();
  drawBody();
}
