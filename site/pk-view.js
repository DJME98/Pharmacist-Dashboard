import { put } from './dom.js';
import { bmi } from './calc/formulas.js';
import {
  MODEL, TARGET, buildHistory, concentrationAt, crclForModel, fitOneLevel, individualParams,
  loadingRange, populationWarnings, regimenOptions, steadyState, typicalParams, DOSE_RULE, isAllowedDose,
} from './calc/vanco.js';
import { patientKinetics } from './calc/amino.js';
import { PK_ITEMS, NOMOGRAMS, NOMOGRAM_RULES, NOMOGRAM_EXCLUSIONS, NOMOGRAM_DOSES } from './data/pk.js';
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

export function renderAmino(h, mount) {
  const side = h('div', { class: 'nomo-side' });
  const main = h('div', {});
  put(mount, side, main);
  let patient = null;

  function drawSide(k) {
    if (!k) {
      put(side, h('p', { class: 'empty' }, 'Enter age, sex, height, weight, and SCr to see CrCl, dosing weight, and doses in mg.'));
      return;
    }
    put(side,
      h('div', { class: 'stats' },
        stat(h, 'CrCl (Cockcroft-Gault)', round(k.crcl, 0), 'mL/min'),
        stat(h, `Dosing weight (${k.weight.basis})`, round(k.weight.kg, 1), 'kg')),
      h('div', { class: 'scroll' }, h('table', { class: 'data' },
        h('thead', {}, h('tr', {}, ['Drug', 'mg/kg', 'Dose'].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', {}, NOMOGRAM_DOSES.flatMap((d) => d.perKg.map((pk) => h('tr', {},
          h('td', {}, d.drug), h('td', {}, `${pk}`), h('td', {}, `${round(Math.round((pk * k.weight.kg) / d.round) * d.round)} mg`))))))),
      h('p', { class: 'hint' }, 'Dosing weight: actual if under ideal, ideal up to 120% of ideal, then adjusted (ideal + 0.4 × excess). Gentamicin and tobramycin round to 10 mg, amikacin to 50 mg. The highlighted rows below match this CrCl.'));
  }

  function draw() {
    const p = patient;
    const ready = p && p.ageY !== null && p.ageY >= 18 && p.sex !== null && p.heightCm !== null && p.weightKg !== null && p.scr !== null;
    const k = ready ? patientKinetics(p, 'gent') : null;
    drawSide(k);
    put(main,
      h('p', {}, 'Extended-interval dosing by nomogram. Pick the dose, choose the interval from CrCl, draw one level, and plot it on the matching nomogram.'),
      h('p', { class: 'alert' }, NOMOGRAM_EXCLUSIONS),
      NOMOGRAMS.map((n) => h('section', { class: 'group nomo' },
        h('h2', {}, n.name),
        h('p', { class: 'basis-line' }, n.dose),
        h('div', { class: 'scroll' }, h('table', { class: 'data' },
          h('thead', {}, h('tr', {}, ['CrCl (mL/min)', 'Gentamicin or tobramycin', 'Amikacin'].map((t) => h('th', { scope: 'col' }, t)))),
          h('tbody', {}, n.rows.map((r, i) => {
            const hi = i === 0 ? Infinity : n.rows[i - 1][3];
            const match = k && k.crcl >= r[3] && k.crcl < hi;
            return h('tr', { class: match ? 'match' : '' }, h('td', {}, r[0]), h('td', {}, r[1]), h('td', {}, r[2]));
          })))),
        h('ul', { class: 'plain' }, h('li', {}, h('b', {}, 'Level: '), n.level), h('li', {}, h('b', {}, 'Plotting: '), n.plot), n.notes.map((t) => h('li', {}, t))))),
      h('section', { class: 'group' },
        h('h2', {}, 'Reading the nomogram'),
        h('ul', { class: 'plain' }, NOMOGRAM_RULES.map((t) => h('li', {}, t))),
        h('p', {}, h('a', { href: 'https://med.stanford.edu/content/dam/sm/bugsanddrugs/documents/antimicrobial-dosing-protocols/SHC-Aminoglycoside-Dosing-Guide.pdf', target: '_blank', rel: 'noopener' }, 'Open the Hartford and Urban-Craig nomogram graphs (Stanford guide, Appendix A)')),
        h('p', { class: 'hint' }, 'The graphs are linked rather than redrawn: their exact line positions are not published in a form that could be checked.'),
        ...item(h, 'ag-extended')),
    );
  }

  return (pt) => { patient = pt; draw(); };
}
