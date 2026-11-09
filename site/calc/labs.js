// Pure lab, ECG, liver, fluid, and drip formulas.

export const phenytoinCorrected = (measured, albumin, coefficient) =>
  measured / (coefficient * albumin + 0.1);

export const correctedCalcium = (calcium, albumin) => calcium + 0.8 * (4 - albumin);

export const correctedSodium = (sodium, glucose) => sodium + 0.024 * (glucose - 100);

export const freeWaterDeficit = (kg, fraction, sodium) => kg * fraction * (sodium / 140 - 1);

export const anionGap = (na, cl, hco3) => na - cl - hco3;

export const correctedAnionGap = (gap, albumin) => gap + 2.5 * (4 - albumin);

export const calculatedOsm = (na, glucose, bun, ethanol = 0) =>
  2 * na + glucose / 18 + bun / 2.8 + ethanol / 4.6;

export const ganzoni = (kg, targetHb, actualHb, stores = 500) =>
  kg * (targetHb - actualHb) * 2.4 + stores;

export function qtc(qtMs, hr) {
  const rr = 60 / hr;
  return {
    bazett: qtMs / Math.sqrt(rr),
    fridericia: qtMs / Math.cbrt(rr),
    framingham: qtMs + 154 * (1 - rr),
    hodges: qtMs + 1.75 * (hr - 60),
  };
}

const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);

export function meld3({ bilirubin, sodium, inr, creatinine, albumin, female, dialysis }) {
  const bili = Math.max(bilirubin, 1);
  const i = Math.max(inr, 1);
  const cr = dialysis ? 3 : clamp(creatinine, 1, 3);
  const na = clamp(sodium, 125, 137);
  const alb = clamp(albumin, 1.5, 3.5);
  const ln = Math.log;
  return Math.round(
    (female ? 1.33 : 0) + 4.56 * ln(bili) + 0.82 * (137 - na) - 0.24 * (137 - na) * ln(bili)
    + 9.09 * ln(i) + 11.14 * ln(cr) + 1.85 * (3.5 - alb) - 1.83 * (3.5 - alb) * ln(cr) + 6,
  );
}

export function maintenanceFluids(kg) {
  const hourly = 4 * Math.min(kg, 10) + 2 * Math.max(Math.min(kg, 20) - 10, 0) + Math.max(kg - 20, 0);
  const daily = 100 * Math.min(kg, 10) + 50 * Math.max(Math.min(kg, 20) - 10, 0) + 20 * Math.max(kg - 20, 0);
  return { hourly: Math.min(hourly, 120), daily, capped: hourly > 120 };
}

const DOSE_TO_MASS_PER_MIN = { 'mcg/kg/min': 1, 'mcg/min': 1 };

// Infusion rate in mL/h from a dose and a bag.
export function dripRate({ dose, doseUnit, kg, amount, amountUnit, volumeMl }) {
  const perKg = doseUnit.includes('/kg');
  if (perKg && !kg) return null;
  const weight = perKg ? kg : 1;
  const concentration = amount / volumeMl;
  let perHour;
  if (doseUnit in DOSE_TO_MASS_PER_MIN) {
    if (amountUnit !== 'mg') return null;
    perHour = (dose * weight * 60) / 1000;
  } else if (doseUnit === 'mg/h' || doseUnit === 'mg/kg/h') {
    if (amountUnit !== 'mg') return null;
    perHour = dose * weight;
  } else if (doseUnit === 'units/min') {
    if (amountUnit !== 'units') return null;
    perHour = dose * 60;
  } else if (doseUnit === 'units/h' || doseUnit === 'units/kg/h') {
    if (amountUnit !== 'units') return null;
    perHour = dose * weight;
  } else {
    return null;
  }
  return perHour / concentration;
}
