// Pure formulas. No DOM and no rounding: the interface rounds for display only.
// Units: age years, height cm unless named, weight kg, SCr mg/dL, cystatin C mg/L.
// Each formula's source is recorded in calc/registry.js and data/references.js.

export const CM_PER_IN = 2.54;
export const LB_PER_KG = 2.2046226218;
export const UMOL_PER_MGDL = 88.4;

const isFemale = (sex) => sex === 'F';
const min1 = (x) => Math.min(x, 1);
const max1 = (x) => Math.max(x, 1);

// Body size
export const bmi = (kg, cm) => kg / (cm / 100) ** 2;

export const ibwDevine = (sex, cm) =>
  (isFemale(sex) ? 45.5 : 50) + 2.3 * (cm / CM_PER_IN - 60);

export const adjBw = (ibw, actual, factor = 0.4) => ibw + factor * (actual - ibw);

export const bsaMosteller = (kg, cm) => Math.sqrt((kg * cm) / 3600);

export const bsaDuBois = (kg, cm) => 0.007184 * kg ** 0.425 * cm ** 0.725;

// Creatinine clearance
export const cockcroftGault = (age, weight, scr, sex) =>
  (((140 - age) * weight) / (72 * scr)) * (isFemale(sex) ? 0.85 : 1);

// Winter 2012: underweight actual, normal ideal, overweight or above adjusted (0.4).
export function winterWeightChoice(bmiValue) {
  if (bmiValue < 18.5) return 'actual';
  if (bmiValue < 25) return 'ibw';
  return 'adj';
}

export function salazarCorcoran(age, kg, cm, scr, sex) {
  const m = cm / 100;
  return isFemale(sex)
    ? ((146 - age) * (0.287 * kg + 9.74 * m ** 2)) / (60 * scr)
    : ((137 - age) * (0.285 * kg + 12.1 * m ** 2)) / (51 * scr);
}

// Jelliffe with V = 0.6 L/kg. Result in mL/min.
// Weight is the lesser of ideal and actual body weight (chosen by the caller).
export function jelliffe(age, weight, scrEarlier, scrLatest, days, sex) {
  const production = isFemale(sex) ? weight * (25.3 - 0.175 * age) : weight * (29.3 - 0.203 * age);
  const volumeL = 0.6 * weight;
  const scrUsed = scrLatest > scrEarlier ? scrLatest : (scrEarlier + scrLatest) / 2;
  return ((production - (volumeL * 10 * (scrLatest - scrEarlier)) / days) * 100) / (scrUsed * 1440);
}

// CKD-EPI, adults
export function ckdEpiCr2021(age, scr, sex) {
  const f = isFemale(sex);
  const k = f ? 0.7 : 0.9;
  const a = f ? -0.241 : -0.302;
  return 142 * min1(scr / k) ** a * max1(scr / k) ** -1.2 * 0.9938 ** age * (f ? 1.012 : 1);
}

export function ckdEpiCys2012(age, cys, sex) {
  return (
    133 * min1(cys / 0.8) ** -0.499 * max1(cys / 0.8) ** -1.328 * 0.996 ** age *
    (isFemale(sex) ? 0.932 : 1)
  );
}

export function ckdEpiCrCys2021(age, scr, cys, sex) {
  const f = isFemale(sex);
  const k = f ? 0.7 : 0.9;
  const a = f ? -0.219 : -0.144;
  return (
    135 * min1(scr / k) ** a * max1(scr / k) ** -0.544 *
    min1(cys / 0.8) ** -0.323 * max1(cys / 0.8) ** -0.778 *
    0.9961 ** age * (f ? 0.963 : 1)
  );
}

// EKFC, age 2 and over
function ekfcCore(ratio, age) {
  const exponent = ratio < 1 ? -0.322 : -1.132;
  return 107.3 * ratio ** exponent * (age <= 40 ? 1 : 0.99 ** (age - 40));
}

export function ekfcCreatinineQ(age, sex) {
  if (age > 25) return isFemale(sex) ? 62 : 80;
  const l = Math.log(age);
  return isFemale(sex)
    ? Math.exp(3.08 + 0.177 * age - 0.223 * l - 0.00596 * age ** 2 + 0.0000686 * age ** 3)
    : Math.exp(3.2 + 0.259 * age - 0.543 * l - 0.00763 * age ** 2 + 0.000079 * age ** 3);
}

export const ekfcCr = (age, scr, sex) =>
  ekfcCore((scr * UMOL_PER_MGDL) / ekfcCreatinineQ(age, sex), age);

export const ekfcCystatinQ = (age) => (age <= 50 ? 0.83 : 0.83 + 0.005 * (age - 50));

export const ekfcCys = (age, cys) => ekfcCore(cys / ekfcCystatinQ(age), age);

export const ekfcCombined = (age, scr, cys, sex) =>
  (ekfcCr(age, scr, sex) + ekfcCys(age, cys)) / 2;

// Children and young adults
export const neonatalGfr = (cm, scr) => (0.31 * cm) / scr;

export const bedsideSchwartz = (cm, scr) => (41.3 * (cm / 100)) / scr;

export function u25CrK(age, sex) {
  const f = isFemale(sex);
  if (age < 12) return (f ? 36.1 : 39.0) * 1.008 ** (age - 12);
  if (age < 18) return f ? 36.1 * 1.023 ** (age - 12) : 39.0 * 1.045 ** (age - 12);
  return f ? 41.4 : 50.8;
}

export function u25CysK(age, sex) {
  if (isFemale(sex)) {
    if (age < 12) return 79.9 * 1.004 ** (age - 12);
    if (age < 18) return 79.9 * 0.974 ** (age - 12);
    return 68.3;
  }
  if (age < 15) return 87.2 * 1.011 ** (age - 15);
  if (age < 18) return 87.2 * 0.96 ** (age - 15);
  return 77.1;
}

export const u25Cr = (age, cm, scr, sex) => u25CrK(age, sex) * (cm / 100 / scr);

export const u25Cys = (age, cys, sex) => u25CysK(age, sex) * (1 / cys);

export const u25CrCys = (age, cm, scr, cys, sex) =>
  (u25Cr(age, cm, scr, sex) + u25Cys(age, cys, sex)) / 2;

// Remove the 1.73 m2 indexing. Result is mL/min for this patient's body size.
export const deindex = (indexed, bsa) => (indexed * bsa) / 1.73;
