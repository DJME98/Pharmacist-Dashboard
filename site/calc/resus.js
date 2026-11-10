// Pure helpers for resuscitation doses. Data lives in data/resus.js.

// Broselow-Luten color zones, kg. Upper bound exclusive so zones meet without gaps.
export const BROSELOW = [
  { id: 'grey', name: 'Grey', range: '3 to 5 kg', lo: 3, hi: 6, mid: 4 },
  { id: 'pink', name: 'Pink', range: '6 to 7 kg', lo: 6, hi: 8, mid: 6.5 },
  { id: 'red', name: 'Red', range: '8 to 9 kg', lo: 8, hi: 10, mid: 8.5 },
  { id: 'purple', name: 'Purple', range: '10 to 11 kg', lo: 10, hi: 12, mid: 10.5 },
  { id: 'yellow', name: 'Yellow', range: '12 to 14 kg', lo: 12, hi: 15, mid: 13 },
  { id: 'white', name: 'White', range: '15 to 18 kg', lo: 15, hi: 19, mid: 16.5 },
  { id: 'blue', name: 'Blue', range: '19 to 23 kg', lo: 19, hi: 24, mid: 21 },
  { id: 'orange', name: 'Orange', range: '24 to 29 kg', lo: 24, hi: 30, mid: 26.5 },
  { id: 'green', name: 'Green', range: '30 to 36 kg', lo: 30, hi: 37, mid: 33 },
];

export const broselowZone = (kg) => (kg === null || kg === undefined ? null : BROSELOW.find((z) => kg >= z.lo && kg < z.hi) ?? null);

export const WEIGHT_LIMITS = { acls: [20, 400], pals: [0.3, 200], care: [0.3, 400] };

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
