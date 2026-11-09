// Turns what was typed into one checked patient. Nothing here is saved anywhere.
import { CM_PER_IN, LB_PER_KG, UMOL_PER_MGDL, bmi } from './formulas.js';

export const LIMITS = {
  ageY: [0, 120],
  heightCm: [25, 272],
  weightKg: [0.2, 650],
  scr: [0.05, 30],
  cys: [0.1, 15],
  days: [0.04, 30],
};

const LABELS = {
  ageY: 'Age',
  heightCm: 'Height',
  weightKg: 'Weight',
  scr: 'SCr',
  prevScr: 'Earlier SCr',
  cys: 'Cystatin C',
  days: 'Days between',
};

export const emptyRaw = () => ({
  age: '', ageUnit: 'y', sex: '', height: '', heightUnit: 'cm', weight: '', weightUnit: 'kg',
  scr: '', scrUnit: 'mgdl', cys: '', prevScr: '', days: '',
});

function parse(text) {
  const t = String(text ?? '').trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

function ageToYears(value, unit) {
  if (value === null || Number.isNaN(value)) return value;
  if (unit === 'd') return value / 365.25;
  if (unit === 'mo') return value / 12;
  return value;
}

export function normalize(raw) {
  const errors = {};
  const warnings = [];
  const p = { sex: raw.sex || null };

  function take(key, field, value, limitKey = key) {
    if (value === null) { p[key] = null; return; }
    const [lo, hi] = LIMITS[limitKey];
    if (Number.isNaN(value)) {
      errors[field] = `${LABELS[key]} must be a number.`;
      p[key] = null;
    } else if (value < lo || value > hi) {
      errors[field] = `${LABELS[key]} is outside the accepted range. Check the value and unit.`;
      p[key] = null;
    } else {
      p[key] = value;
    }
  }

  const scrFactor = raw.scrUnit === 'umol' ? 1 / UMOL_PER_MGDL : 1;
  const convert = (v, factor) => (v === null || Number.isNaN(v) ? v : v * factor);

  const scrTyped = parse(raw.scr);
  take('ageY', 'age', ageToYears(parse(raw.age), raw.ageUnit));
  take('heightCm', 'height', convert(parse(raw.height), raw.heightUnit === 'in' ? CM_PER_IN : 1));
  take('weightKg', 'weight', convert(parse(raw.weight), raw.weightUnit === 'lb' ? 1 / LB_PER_KG : 1));
  take('scr', 'scr', convert(scrTyped, scrFactor));
  take('prevScr', 'prevScr', convert(parse(raw.prevScr), scrFactor), 'scr');
  take('cys', 'cys', parse(raw.cys));
  take('days', 'days', parse(raw.days));

  p.isAdult = p.ageY !== null && p.ageY >= 18;

  if (p.heightCm !== null && p.weightKg !== null) {
    const b = bmi(p.weightKg, p.heightCm);
    if (b < 10 || b > 80) {
      warnings.push(`BMI works out to ${b.toFixed(0)}. Check height, weight, and their units.`);
    }
  }
  if (scrTyped !== null && !Number.isNaN(scrTyped)) {
    if (raw.scrUnit === 'mgdl' && scrTyped >= 15) {
      warnings.push('SCr is 15 mg/dL or higher. Confirm the value is not in µmol/L.');
    }
    if (raw.scrUnit === 'umol' && scrTyped < 15) {
      warnings.push('SCr is below 15 µmol/L. Confirm the value is not in mg/dL.');
    }
  }
  if (p.isAdult && p.heightCm !== null && p.heightCm < 100) {
    warnings.push('Adult height is under 100 cm. Check the value and unit.');
  }
  if (p.isAdult && p.heightCm !== null && p.heightCm >= 100 && p.heightCm < 60 * CM_PER_IN) {
    warnings.push('Height is under 60 in. The Devine ideal body weight formula is least reliable here.');
  }
  if (p.isAdult && p.scr !== null && p.scr < 0.5) {
    warnings.push('SCr is low. Low muscle mass can inflate creatinine-based estimates; consider cystatin C.');
  }
  if (p.scr !== null && p.prevScr !== null && Math.abs(p.scr - p.prevScr) / p.prevScr >= 0.3) {
    warnings.push('Creatinine changed by 30% or more. Steady-state equations may mislead while it is changing.');
  }

  return { p, errors, warnings };
}
