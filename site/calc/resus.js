// Pure helpers for resuscitation doses. Data lives in data/resus.js.

export const WEIGHT_LIMITS = { acls: [20, 400], pals: [0.3, 200] };

export function parseWeight(text, kind) {
  const t = String(text ?? '').trim();
  if (t === '') return { kg: null };
  const n = Number(t);
  const [lo, hi] = WEIGHT_LIMITS[kind];
  if (!Number.isFinite(n) || n < lo || n > hi) {
    return { kg: null, error: `Enter a weight from ${lo} to ${hi} kg.` };
  }
  const warning = kind === 'pals' && n >= 40
    ? 'At this weight, many doses reach the adult maximum. Confirm PALS is the right reference.'
    : null;
  return { kg: n, warning };
}

export function formatNumber(n) {
  const digits = n < 1 ? 3 : n < 10 ? 2 : 1;
  return String(Number(n.toFixed(digits)));
}

// "mg" becomes "mg/kg"; "mcg/min" becomes "mcg/kg/min".
function perKgUnit(unit) {
  const [top, rest] = unit.split('/');
  return rest ? `${top}/kg/${rest}` : `${top}/kg`;
}

function basisText(line) {
  const amount = line.range ? `${line.range[0]} to ${line.range[1]}` : `${line.perKg}`;
  const parts = [`${amount} ${perKgUnit(line.unit)}`];
  if (line.max !== undefined) parts.push(`max ${line.max} ${line.unit}`);
  if (line.min !== undefined) parts.push(`min ${line.min} ${line.unit}`);
  return parts.join(', ');
}

function limit(raw, line) {
  let value = raw;
  let flag = null;
  if (line.max !== undefined && value > line.max) { value = line.max; flag = 'max'; }
  if (line.min !== undefined && value < line.min) { value = line.min; flag = 'min'; }
  return { value, flag };
}

// Returns what to show for one dose line at this weight.
export function evaluateLine(line, kg) {
  if (line.text) return { dose: line.text, basis: null, flag: null };
  const basis = basisText(line);
  if (kg === null || kg === undefined) return { dose: basis, basis: null, flag: null, needsWeight: true };
  if (line.range) {
    const lo = limit(line.range[0] * kg, line);
    const hi = limit(line.range[1] * kg, line);
    const dose = lo.value === hi.value
      ? `${formatNumber(hi.value)} ${line.unit}`
      : `${formatNumber(lo.value)} to ${formatNumber(hi.value)} ${line.unit}`;
    return { dose, basis, flag: hi.flag ?? lo.flag, value: [lo.value, hi.value] };
  }
  const { value, flag } = limit(line.perKg * kg, line);
  return { dose: `${formatNumber(value)} ${line.unit}`, basis, flag, value };
}

// Replaces {{doseId:lineIndex}} in algorithm text with the dose for this weight.
export function fillDoses(text, doses, kg) {
  return text.replace(/\{\{([\w-]+):(\d+)\}\}/g, (match, id, index) => {
    const dose = doses.find((d) => d.id === id);
    const line = dose?.lines[Number(index)];
    if (!line) throw new Error(`Unknown dose reference ${match}`);
    return evaluateLine(line, kg).dose;
  });
}
