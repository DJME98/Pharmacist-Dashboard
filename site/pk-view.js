import { put } from './dom.js';
import { bmi } from './calc/formulas.js';
import {
  MODEL, TARGET, buildHistory, concentrationAt, crclForModel, fitOneLevel, individualParams,
  loadingRange, populationWarnings, regimenOptions, steadyState, typicalParams, DOSE_RULE, isAllowedDose,
} from './calc/vanco.js';
import { patientKinetics, hartfordInterval, hartfordLine, hartfordZone, HARTFORD_RANGE } from './calc/amino.js';
import { PK_ITEMS } from './data/pk.js';
import { REFERENCES } from './data/references.js';

// Dose history is held only in these objects and is never stored or sent.
const vanco = { load: '', dose: '', tau: '', hours: '1', count: '1', after: '', level: '', weightChoice: 'ibw', dialysis: false };

const num = (t) => {
  const s = String(t ?? '').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};
const round = (v, d = 0) => Number(v.toFixed(d)).toLocaleString('en-US', { maximumFractionDigits: d });

function sources(h, ids) {
  return h('details', { class: 'sources' }, h('summary', {}, 'Sources'),
    h('ol', { class: 'row-refs' }, ids.map((id) => {
      const r = REFERENCES[id];
      return h('li', {}, r.url ? h('a', { href: r.url, target: '_blank', rel: 'noopener' }, r.cite) : r.cite,
        r.note && h('span', { class: 'ref-note' }, ` ${r.note}`));
    })));
}

function item(h, id) {
  const it = PK_ITEMS.find((x) => x.id === id);
  return [sources(h, it.refs)];
}

function textField(h, state, key, label, onChange, hint) {
  const id = `pk-${key}`;
  return h('div', { class: 'field' },
    h('label', { for: id }, label),
    h('div', { class: 'control' }, h('input', {
      id, type: 'text', inputmode: 'decimal', autocomplete: 'off', value: state[key],
      oninput: (e) => { state[key] = e.target.value; onChange(); },
    })),
    hint && h('p', { class: 'hint' }, hint));
}

function selectField(h, state, key, label, options, onChange) {
  const id = `pk-${key}`;
  return h('div', { class: 'field' },
    h('label', { for: id }, label),
    h('div', { class: 'control' }, h('select', {
      id, class: 'wide', onchange: (e) => { state[key] = e.target.value; onChange(); },
    }, options.map(([v, t]) => h('option', { value: v, selected: state[key] === v }, t)))));
}

const stat = (h, label, value, unit) => h('div', { class: 'stat' },
  h('span', { class: 'stat-label' }, label), h('b', {}, value), unit && h('span', { class: 'unit' }, unit));

function checkVanco(s) {
  const v = {
    load: num(s.load), dose: num(s.dose), tau: num(s.tau), hours: num(s.hours),
    count: num(s.count), after: num(s.after), level: num(s.level),
  };
  const errors = [];
  const warnings = [];
  const bad = (x, lo, hi) => x !== null && (Number.isNaN(x) || x < lo || x > hi);
  if (bad(v.load, 250, 4000)) errors.push('Loading dose must be 250 to 4000 mg.');
  if (bad(v.dose, 100, 6000)) errors.push('Maintenance dose must be 100 to 6000 mg.');
  if (bad(v.tau, 4, 96)) errors.push('Interval must be 4 to 96 hours.');
  if (bad(v.hours, 0.25, 24)) errors.push('Infusion time must be 0.25 to 24 hours.');
  if (bad(v.count, 1, 200) || (v.count !== null && !Number.isInteger(v.count))) errors.push('Doses given must be a whole number from 1 to 200.');
  if (bad(v.after, 0.1, 120)) errors.push('Hours after the last dose must be 0.1 to 120.');
  if (bad(v.level, 0.5, 200)) errors.push('Level must be 0.5 to 200 mg/L.');
  if (v.tau && v.hours && v.hours >= v.tau) errors.push('Infusion time must be shorter than the interval.');
  const offStep = [v.load, v.dose].filter((x) => x !== null && !Number.isNaN(x) && !isAllowedDose(x));
  if (offStep.length) warnings.push(`Doses are given in ${DOSE_RULE.step} mg steps from ${DOSE_RULE.min} to ${DOSE_RULE.max} mg. ${offStep.map((x) => `${x} mg`).join(' and ')} is outside that.`);
  const regimen = v.dose !== null && v.tau !== null && v.hours !== null && errors.length === 0;
  const levelEntered = v.level !== null || v.after !== null;
  const canFit = regimen && v.level !== null && v.after !== null && v.count !== null;
  if (levelEntered && !canFit && errors.length === 0) warnings.push('To use the level, enter the maintenance dose, interval, doses given, the level, and its timing.');
  if (canFit) {
    if (v.after <= v.hours) warnings.push('This level was drawn during the infusion. Check the timing.');
    else if (v.after <= v.hours + 1) warnings.push('This level was drawn within 1 hour after the infusion, during distribution, when estimates are least reliable.');
    if (v.after > v.tau) warnings.push('The level was drawn later than one interval after the last dose. Confirm no dose was given in between.');
  }
  const load = v.load ?? 0;
  const rate = v.hours ? Math.max(v.dose ?? 0, load) / (v.hours * 60) : 0;
  if (v.hours !== null && v.hours < 1 && rate > 15) warnings.push('The infusion is shorter than 60 minutes and faster than 15 mg/min. The guideline advises at least 60 minutes, or 10 to 15 mg/min.');
  return { v, errors, warnings, regimen, canFit };
}

export function renderVanco(h, mount) {
  const form = h('div', { class: 'pk-form' });
  const output = h('div', { class: 'pk-output' });
  let patient = null;

  const change = () => draw();

  form.append(
    h('h2', {}, 'Dosing history'),
    h('div', { class: 'pk-grid' },
      textField(h, vanco, 'load', 'Loading dose, mg (optional)', change),
      textField(h, vanco, 'dose', 'Maintenance dose, mg', change),
      textField(h, vanco, 'tau', 'Interval, hours', change),
      textField(h, vanco, 'hours', 'Infusion time, hours', change),
      textField(h, vanco, 'count', 'Doses given so far', change, 'Include the loading dose.')),
    h('h2', {}, 'One timed level (optional)'),
    h('div', { class: 'pk-grid' },
      textField(h, vanco, 'level', 'Level, mg/L', change),
      textField(h, vanco, 'after', 'Hours from start of last dose', change)),
    h('h2', {}, 'Model settings'),
    h('div', { class: 'pk-grid' },
      selectField(h, vanco, 'weightChoice', 'Weight for CrCl', [['ibw', 'Ideal'], ['actual', 'Actual'], ['adj', 'Adjusted']], change),
      h('label', { class: 'check' }, h('input', {
        type: 'checkbox', checked: vanco.dialysis, onchange: (e) => { vanco.dialysis = e.target.checked; draw(); },
      }), h('span', {}, 'On dialysis or CRRT'))));

  put(mount, form, output);

  function dialysisNote() {
    return [
      h('h2', {}, 'Not available for dialysis or CRRT'),
      h('p', {}, 'This calculator does not model drug removal by dialysis. Guideline starting doses:'),
      h('ul', { class: 'plain' },
        h('li', {}, 'Intermittent hemodialysis load: 25 mg/kg after dialysis, or 30 to 35 mg/kg intradialytic.'),
        h('li', {}, 'Intermittent hemodialysis maintenance: 7.5 to 10 mg/kg after dialysis, or 7.5 to 15 mg/kg intradialytic, based on dialyzer permeability.'),
        h('li', {}, 'Pre-dialysis levels 15 to 20 mg/L, at least weekly. Do not draw during or within 2 hours after dialysis.'),
        h('li', {}, 'CRRT: load 20 to 25 mg/kg, then 7.5 to 10 mg/kg every 12 hours, guided by levels within 24 hours.')),
      ...item(h, 'vanco-load'),
    ];
  }

  function draw() {
    const p = patient;
    if (vanco.dialysis) { put(output, ...dialysisNote()); return; }
    if (!p || p.ageY === null || p.sex === null || p.heightCm === null || p.weightKg === null || p.scr === null) {
      put(output, h('p', { class: 'empty' }, 'Enter age, sex, height, weight, and SCr to see an estimate.'));
      return;
    }
    if (p.ageY < 18) {
      put(output, h('p', { class: 'empty' }, 'This calculator is for adults. The model has not been set up for children here.'));
      return;
    }
    const { v, errors, warnings, regimen, canFit } = checkVanco(vanco);
    const crclInfo = crclForModel(p, vanco.weightChoice);
    const tv = typicalParams(crclInfo.crcl, p.weightKg);
    let m = tv;
    let fit = null;
    let measured = null;
    if (canFit) {
      const { doses, tObs } = buildHistory({ loadMg: v.load, doseMg: v.dose, tau: v.tau, hours: v.hours, count: v.count, hoursAfterLast: v.after });
      fit = fitOneLevel(tv, doses, tObs, v.level);
      m = fit.params;
      measured = { popPred: concentrationAt(tv, doses, tObs), fitPred: fit.predicted };
    }
    const allWarnings = [...populationWarnings(p, crclInfo), ...warnings];
    if (fit && (Math.abs(m.CL / tv.CL - 1) > 0.5 || Math.abs(m.V1 / tv.V1 - 1) > 0.75)) {
      allWarnings.push('The level moved the estimate far from the population value. Confirm the dose times, level time, and level before acting on it. One level cannot separate clearance from volume well.');
    }
    if (p.prevScr !== null && Math.abs(p.scr - p.prevScr) / p.prevScr >= 0.3) {
      allWarnings.push('Creatinine is changing, so this estimate may not hold.');
    }
    const options = regimenOptions(m);
    const current = regimen ? steadyState(m, v.dose, v.tau, v.hours) : null;
    const load = loadingRange(p.weightKg, bmi(p.weightKg, p.heightCm));
    const auc = current?.auc24;

    put(output, 
      h('div', { class: 'alerts', role: 'status' },
        errors.map((e) => h('p', { class: 'alert stop' }, e)), allWarnings.map((w) => h('p', { class: 'alert' }, w))),
      h('p', { class: 'basis-line' }, fit ? 'Individualized from one level' : 'Population estimate: no level entered'),
      current && h('div', { class: 'pk-hero' },
        h('p', { class: 'hero-label' }, `${round(v.dose)} mg every ${round(v.tau, 1)} h at steady state`),
        h('p', { class: `hero-value${auc < TARGET[0] || auc > TARGET[1] ? ' off' : ''}` }, round(auc), h('span', { class: 'unit' }, 'mg·h/L AUC24')),
        h('p', {}, auc < TARGET[0] ? `Below the ${TARGET[0]} to ${TARGET[1]} target` : auc > TARGET[1] ? `Above the ${TARGET[0]} to ${TARGET[1]} target` : `Within the ${TARGET[0]} to ${TARGET[1]} target`)),
      h('div', { class: 'stats' },
        current && stat(h, 'Peak, end of infusion', round(current.peak, 1), 'mg/L'),
        current && stat(h, 'Trough', round(current.trough, 1), 'mg/L'),
        stat(h, 'Clearance', round(m.CL, 2), 'L/h'),
        stat(h, 'Central volume', round(m.V1, 1), 'L'),
        stat(h, 'Peripheral volume', round(m.V2, 1), 'L'),
        stat(h, 'CrCl used', round(crclInfo.crcl, 0), 'mL/min')),
      measured && h('p', { class: 'hint' }, `Measured ${round(v.level, 1)} mg/L. Model predicted ${round(measured.popPred, 1)} mg/L before the level and ${round(measured.fitPred, 1)} mg/L after fitting.`),
      h('section', { class: 'group' },
        h('h2', {}, `Regimens predicted to reach ${TARGET[0]} to ${TARGET[1]}`),
        options.length
          ? h('div', { class: 'scroll' }, h('table', { class: 'data' },
              h('thead', {}, h('tr', {}, ['Dose', 'Every', 'Infuse over', 'Daily', 'AUC24', 'Peak', 'Trough'].map((t) => h('th', { scope: 'col' }, t)))),
              h('tbody', {}, options.map((o) => h('tr', {},
                h('td', {}, `${round(o.mg)} mg`), h('td', {}, `${o.tau} h`), h('td', {}, `${round(o.hours, 2)} h`),
                h('td', {}, `${round(o.daily)} mg`), h('td', {}, round(o.auc24)), h('td', {}, round(o.peak, 1)), h('td', {}, round(o.trough, 1)))))))
          : h('p', {}, 'No listed regimen reaches the target. Consider a different interval or dose by level.')),
      h('section', { class: 'group' },
        h('h2', {}, 'Loading dose'),
        h('p', {}, `${round(load.mg[0], 0)} to ${round(load.mg[1], 0)} mg (${load.perKg[0]} to ${load.perKg[1]} mg/kg actual weight, rounded to ${DOSE_RULE.step} mg${load.capped ? `, capped at ${DOSE_RULE.max} mg` : ''}).`),
        h('p', { class: 'hint' }, `May be considered in critically ill patients. BMI 30 or above uses 20 to 25 mg/kg. Every dose here is limited to ${DOSE_RULE.min} to ${DOSE_RULE.max} mg in ${DOSE_RULE.step} mg steps; the guideline itself allows loading doses up to 3000 mg.`),
        ...item(h, 'vanco-load')),
      h('section', { class: 'group' },
        h('h2', {}, 'About this estimate'),
        h('p', {}, `Uses the ${MODEL.name} two-compartment model. The guideline prefers two levels; with one level the result leans on the model, so check it against the patient’s course.`),
        h('p', { class: 'hint' }, 'Weight for CrCl: the model paper’s choice was not confirmed. Ideal weight follows a commercial two-compartment description and can be changed above.'),
        ...item(h, 'vanco-bayes')),
    );
  }

  return (p) => { patient = p; draw(); };
}

const ZONE_TEXT = {
  q24: 'q24h: give 7 mg/kg every 24 h.',
  q36: 'q36h: give 7 mg/kg every 36 h.',
  q48: 'q48h: give 7 mg/kg every 48 h.',
  above: 'Above the q48h zone: stop once-daily dosing and dose by serial levels.',
  below: 'Below the nomogram (under 2 mcg/mL): q24h, and reassess the dose if the patient is not improving.',
  outside: 'The nomogram only covers levels drawn 6 to 14 h after the start of the infusion.',
};

function hartfordChart(h, point) {
  const W = 640; const H = 440;
  const pad = { l: 56, r: 18, t: 16, b: 52 };
  const [t0, t1] = HARTFORD_RANGE.t; const [c0, c1] = HARTFORD_RANGE.c;
  const x = (t) => pad.l + ((t - t0) / (t1 - t0)) * (W - pad.l - pad.r);
  const y = (c) => H - pad.b - ((c - c0) / (c1 - c0)) * (H - pad.t - pad.b);
  const ns = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, ...kids) => {
    const n = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    kids.forEach((k) => n.append(k));
    return n;
  };
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'nomo-chart', role: 'img', 'aria-label': 'Hartford nomogram: concentration against hours after the start of the infusion, with q24h, q36h, and q48h zones' });
  const clipId = 'nomo-clip';
  svg.append(el('defs', {}, el('clipPath', { id: clipId }, el('rect', { x: x(t0), y: y(c1), width: x(t1) - x(t0), height: y(c0) - y(c1) }))));
  const poly = (lo, hi) => {
    const pts = [];
    for (const t of [6, 14]) pts.push(`${x(t)},${y(lo ? hartfordLine(lo, t) : c0)}`);
    for (const t of [14, 6]) pts.push(`${x(t)},${y(hi ? hartfordLine(hi, t) : c1)}`);
    return el('polygon', { points: pts.join(' '), class: `zone zone-${hi ?? 'top'}`, 'clip-path': `url(#${clipId})` });
  };
  svg.append(poly(null, 'q24q36'), poly('q24q36', 'q36q48'), poly('q36q48', 'q48top'), poly('q48top', null));
  for (let c = c0; c <= c1; c += 1) {
    svg.append(el('line', { x1: x(t0), x2: x(t1), y1: y(c), y2: y(c), class: 'grid' }));
    svg.append(el('text', { x: x(t0) - 8, y: y(c) + 4, 'text-anchor': 'end', class: 'tick' }, String(c)));
  }
  for (let t = t0; t <= t1; t += 1) {
    svg.append(el('line', { x1: x(t), x2: x(t), y1: y(c0), y2: y(c1), class: 'grid' }));
    svg.append(el('text', { x: x(t), y: y(c0) + 20, 'text-anchor': 'middle', class: 'tick' }, String(t)));
  }
  ['q24q36', 'q36q48', 'q48top'].forEach((ln) => svg.append(el('line', { x1: x(6), y1: y(hartfordLine(ln, 6)), x2: x(14), y2: y(hartfordLine(ln, 14)), class: 'nomo-line', 'clip-path': `url(#${clipId})` })));
  svg.append(el('line', { x1: x(14), x2: x(14), y1: y(c0), y2: y(hartfordLine('q48top', 14)), class: 'nomo-line' }));
  svg.append(el('line', { x1: x(t0), x2: x(t1), y1: y(c0), y2: y(c0), class: 'axis' }));
  svg.append(el('line', { x1: x(t0), x2: x(t0), y1: y(c0), y2: y(c1), class: 'axis' }));
  const label = (t, c, s) => svg.append(el('text', { x: x(t), y: y(c), 'text-anchor': 'middle', class: 'zone-label' }, s));
  // Labels sit midway between the lines that bound each zone.
  const mid = (t, lo, hi) => ((lo ? hartfordLine(lo, t) : c0) + (hi ? hartfordLine(hi, t) : c1)) / 2 - 0.2;
  label(7.3, mid(7.3, null, 'q24q36'), 'Q24h'); label(8.2, mid(8.2, 'q24q36', 'q36q48'), 'Q36h');
  label(8.8, mid(8.8, 'q36q48', 'q48top'), 'Q48h'); label(11.4, mid(11.4, 'q48top', null), 'Stop once-daily dosing');
  svg.append(el('text', { x: (x(t0) + x(t1)) / 2, y: H - 8, 'text-anchor': 'middle', class: 'tick' }, 'Hours from start of infusion to sample draw'));
  svg.append(el('text', { x: 14, y: (y(c0) + y(c1)) / 2, 'text-anchor': 'middle', class: 'tick', transform: `rotate(-90 14 ${(y(c0) + y(c1)) / 2})` }, 'Concentration (mcg/mL)'));
  if (point) {
    const pt = Math.min(Math.max(point.t, t0), t1); const pc = Math.min(Math.max(point.c, c0), c1);
    svg.append(el('circle', { cx: x(pt), cy: y(pc), r: 7, class: 'nomo-point' }));
  }
  return svg;
}

const hartford = { t: '', level: '' };

export function renderAmino(h, mount) {
  const side = h('div', { class: 'nomo-side' });
  const main = h('div', {});
  const result = h('div', { 'aria-live': 'polite' });
  const chartWrap = h('div', { class: 'scroll' });
  let patient = null;

  const redrawChart = () => {
    const t = num(hartford.t); const c = num(hartford.level);
    const ok = t !== null && c !== null && Number.isFinite(t) && Number.isFinite(c) && c > 0;
    put(chartWrap, hartfordChart(h, ok ? { t, c } : null));
    if (!ok) { put(result, (t !== null || c !== null) && !(Number.isFinite(t) && Number.isFinite(c)) ? h('p', { class: 'alert stop' }, 'Enter numbers for both the time and the level.') : h('p', { class: 'empty' }, 'Enter the time and level to plot the point.')); return; }
    const z = hartfordZone(t, c);
    put(result, h('p', { class: `basis-line zone-result zr-${z}` }, ZONE_TEXT[z]),
      h('p', { class: 'hint' }, `At ${round(t, 1)} h the lines sit at ${round(hartfordLine('q24q36', Math.min(Math.max(t, 6), 14)), 1)}, ${round(hartfordLine('q36q48', Math.min(Math.max(t, 6), 14)), 1)}, and ${round(hartfordLine('q48top', Math.min(Math.max(t, 6), 14)), 1)} mcg/mL. A level on a line takes the longer interval.`));
  };

  put(mount, side, main);
  put(main,
    h('section', { class: 'group' },
      h('h2', {}, 'Hartford nomogram: gentamicin or tobramycin 7 mg/kg'),
      h('p', {}, 'Give 7 mg/kg with the interval chosen from CrCl, draw one random level 6 to 14 h after the start of the infusion, and plot it.'),
      h('div', { class: 'pk-grid' },
        textField(h, hartford, 't', 'Hours from start of infusion to draw', redrawChart),
        textField(h, hartford, 'level', 'Level (mcg/mL)', redrawChart)),
      result,
      chartWrap,
      h('p', { class: 'hint' }, 'Redrawn from Nicolau et al. 1995, Figure 1. The three straight lines were traced from the published figure. For patients on therapy 5 days or more, the authors checked a random level on day 5 and weekly after that.'),
      h('p', { class: 'alert' }, 'The authors excluded ascites, burns over 20% of body surface area, pregnancy, end-stage kidney disease or dialysis, and enterococcal endocarditis. The nomogram is for 7 mg/kg gentamicin or tobramycin only.'),
      ...item(h, 'ag-extended')));
  redrawChart();

  function drawSide() {
    const p = patient;
    const ready = p && p.ageY !== null && p.ageY >= 18 && p.sex !== null && p.heightCm !== null && p.weightKg !== null && p.scr !== null;
    if (!ready) { put(side, h('p', { class: 'empty' }, 'Enter age, sex, height, weight, and SCr to see CrCl, the starting interval, and the 7 mg/kg dose.')); return; }
    const k = patientKinetics(p, 'gent');
    const tau = hartfordInterval(k.crcl);
    const mg = Math.round((7 * k.weight.kg) / 10) * 10;
    put(side,
      h('div', { class: 'stats' },
        stat(h, 'CrCl (Cockcroft-Gault)', round(k.crcl, 0), 'mL/min'),
        stat(h, `Dosing weight (${k.weight.basis})`, round(k.weight.kg, 1), 'kg'),
        stat(h, '7 mg/kg dose', round(mg), 'mg'),
        stat(h, 'Starting interval', tau ? `q${tau}h` : 'Serial levels', '')),
      h('p', { class: 'hint' }, 'Interval by CrCl (Nicolau 1995): 60 or more q24h, 40 to 59 q36h, 20 to 39 q48h, under 20 dose and follow serial levels. Dosing weight is actual below ideal, ideal up to 120% of ideal, then ideal + 0.4 × excess (Traynor 1995). Dose rounded to 10 mg.'));
  }

  return (pt) => { patient = pt; drawSide(); };
}
