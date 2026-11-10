// Pure conversion arithmetic. Tables live in data/conversions.js.
import { formatNumber } from './resus.js';

const asRange = (v) => (Array.isArray(v) ? v : [v, v]);

// A drug's equivalent may be a single number or a [low, high] range.
export function convertDose(dose, fromEquiv, toEquiv) {
  const [fLo, fHi] = asRange(fromEquiv);
  const [tLo, tHi] = asRange(toEquiv);
  return [(dose * tLo) / fHi, (dose * tHi) / fLo];
}

export function formatRange([lo, hi], unit = 'mg') {
  const a = formatNumber(lo);
  const b = formatNumber(hi);
  return a === b ? `${a} ${unit}` : `${a} to ${b} ${unit}`;
}

// Opioid rows: [{ drug, dose }], where dose is the 24-hour total.
export function opioidSummary(rows, opioids) {
  let oralMorphine = 0;
  let mme = 0;
  let mmeComplete = true;
  const blockers = [];
  for (const row of rows) {
    const d = opioids.find((o) => o.id === row.drug);
    if (d.cdcFactor) mme += row.dose * d.cdcFactor;
    else mmeComplete = false;
    if (d.equi) oralMorphine += (row.dose * 30) / d.equi;
    else blockers.push(d);
  }
  return { oralMorphine, mme, mmeComplete, blockers };
}

export function opioidTarget(oralMorphine, target, reductionPct, dosesPerDay) {
  const calculated = (oralMorphine * target.equi) / 30;
  const daily = calculated * (1 - reductionPct / 100);
  return {
    calculated,
    daily,
    perDose: dosesPerDay ? daily / dosesPerDay : null,
    rescue: daily * 0.2,
  };
}

// Oral morphine in 24 h to a transdermal fentanyl starting strength, per label bands.
export function fentanylPatch(oralMorphine) {
  if (oralMorphine < 90) return { below: true };
  if (oralMorphine >= 1125) return { above: true };
  if (oralMorphine < 135) return { mcgPerHour: 25 };
  return { mcgPerHour: 25 * (Math.floor((oralMorphine - 135) / 90) + 2) };
}

export function statinIntensity(table, drugId, dose) {
  const drug = table.find((d) => d.id === drugId);
  const intensity = drug.doses[dose];
  const matches = table
    .filter((d) => d.id !== drugId)
    .map((d) => ({ name: d.name, doses: Object.keys(d.doses).filter((k) => d.doses[k] === intensity).map(Number) }))
    .filter((d) => d.doses.length > 0);
  return { intensity, matches };
}

// Rounds to the nearest practical increment, never below one increment.
export function roundStep(x, step) {
  if (!step || !Number.isFinite(x) || x <= 0) return x;
  return Math.max(step, Math.round(x / step + 1e-9) * step);
}

export const practical = ([lo, hi], step) => [roundStep(lo, step), roundStep(hi, step)];

// Results from other sources that list a different value for either drug.
export function altResults(dose, from, to) {
  const srcs = new Set([...(from.alt ?? []), ...(to.alt ?? [])].map((a) => a.src));
  const out = [];
  for (const src of srcs) {
    const f = from.alt?.find((a) => a.src === src)?.v ?? from.equiv;
    const t = to.alt?.find((a) => a.src === src)?.v ?? to.equiv;
    const note = [...(from.alt ?? []), ...(to.alt ?? [])].find((a) => a.src === src && a.note)?.note;
    out.push({ src, range: convertDose(dose, f, t), note });
  }
  return out;
}
