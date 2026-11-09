import { put } from './dom.js';
import { OPIOIDS, OPIOID_ITEM, RATIO_TABLES, STATINS, STATIN_ITEM, INTENSITY_LABEL, BASAL_RULES, INSULIN_ITEM, IVPO, IVPO_EXCLUSIONS, IVPO_ITEM } from './data/conversions.js';
import { REFERENCES } from './data/references.js';
import { convertDose, fentanylPatch, formatRange, opioidSummary, opioidTarget, statinIntensity } from './calc/convert.js';
import { formatNumber } from './calc/resus.js';

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
    h('p', { class: 'status' }, 'Unverified: awaiting pharmacist review'),
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
      put(out, h('ul', { class: 'results' }, drugs.filter((d) => d.id !== s.from).map((d) => h('li', { class: 'conv-row' },
        h('div', {}, h('span', {}, d.name), d.detail && h('span', { class: 'basis' }, d.detail)),
        h('b', {}, formatRange(convertDose(dose, from.equiv, d.equiv), table.unit))))));
    };
    put(body, 
      h('p', {}, table.intro),
      h('p', { class: 'alert' }, table.caution),
      h('div', { class: 'pk-grid' },
        table.methods && select('method', 'Method', s.method, table.methods.map((m) => [m.id, m.label]), (v) => { s.method = v; drawRatio(table); }),
        select('from', 'Convert from', s.from, drugs.map((d) => [d.id, d.name]), (v) => { s.from = v; calc(); }),
        input('dose', `Dose (${table.unit})`, s.dose, (v) => { s.dose = v; calc(); })),
      out,
      ...footer(table));
    calc();
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
        const r = opioidTarget(summary.oralMorphine, target, reduction, perDay && !Number.isNaN(perDay) ? perDay : null);
        parts.push(
          h('div', { class: 'pk-hero' },
            h('p', { class: 'hero-label' }, `${target.name} per 24 h after a ${reduction}% reduction`),
            h('p', { class: 'hero-value' }, formatNumber(r.daily), h('span', { class: 'unit' }, target.unit))),
          h('div', { class: 'stats' },
            h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Before reduction'), h('b', {}, formatNumber(r.calculated)), h('span', { class: 'unit' }, target.unit)),
            r.perDose !== null && h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Each scheduled dose'), h('b', {}, formatNumber(r.perDose)), h('span', { class: 'unit' }, target.unit)),
            h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Breakthrough, up to'), h('b', {}, formatNumber(r.rescue)), h('span', { class: 'unit' }, `${target.unit} q3 to 4 h PRN`))),
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
      ...footer(OPIOID_ITEM));
    drawRows();
    calc();
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
          h('p', { class: 'hero-value' }, formatRange(rule.pct.map((p) => (dose * p) / 100), 'units'))),
        rule.note && h('p', { class: 'hint' }, rule.note));
    };
    put(body, 
      h('p', { class: 'alert' }, 'Starting points only. Monitor glucose closely and use conservative doses in older adults.'),
      h('div', { class: 'pk-grid' },
        select('ins-rule', 'Conversion', state.insulinRule, BASAL_RULES.map((r) => [r.id, r.label]), (v) => { state.insulinRule = v; calc(); }),
        input('ins-dose', 'Current total daily dose (units)', state.insulinDose, (v) => { state.insulinDose = v; calc(); })),
      out,
      ...footer(INSULIN_ITEM));
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
