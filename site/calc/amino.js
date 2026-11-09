// Aminoglycoside dosing: population estimates and extended-interval starting doses.
// Weight kg, CrCl mL/min, concentrations mcg/mL, time hours.
import { adjBw, cockcroftGault, ibwDevine } from './formulas.js';

export const DRUGS = {
  gent: { name: 'Gentamicin', vd: 0.25, extended: 7, round: 10 },
  tobra: { name: 'Tobramycin', vd: 0.25, extended: 7, round: 10 },
  amik: { name: 'Amikacin', vd: 0.3, extended: 15, round: 50 },
};

const GT_TARGETS = { life: [8, 10, 1], serious: [6, 8, 1], uti: [4, 6, 1] };
const AMIK_TARGETS = { life: [25, 30, 4], serious: [20, 25, 4], uti: [15, 20, 4] };

export const targetsFor = (drug, indication) => {
  const [lo, hi, trough] = (drug === 'amik' ? AMIK_TARGETS : GT_TARGETS)[indication];
  return { peak: (lo + hi) / 2, trough, range: [lo, hi] };
};

export function dosingWeight(actual, ibw) {
  if (actual < ibw) return { kg: actual, basis: 'actual' };
  if (actual <= 1.2 * ibw) return { kg: ibw, basis: 'ideal' };
  return { kg: adjBw(ibw, actual), basis: 'adjusted' };
}

export function patientKinetics(p, drug) {
  const ibw = ibwDevine(p.sex, p.heightCm);
  const weight = dosingWeight(p.weightKg, ibw);
  const crcl = cockcroftGault(p.ageY, weight.kg, p.scr, p.sex);
  const kel = 0.00293 * crcl + 0.014;
  return { weight, crcl, kel, vd: DRUGS[drug].vd * weight.kg, halfLife: Math.log(2) / kel };
}

export const idealInterval = (kel, peak, trough, tinf) => tinf + Math.log(peak / trough) / kel;

export const doseForPeak = (kel, vd, peak, tinf, tau) =>
  (kel * vd * peak * tinf * (1 - Math.exp(-kel * tau))) / (1 - Math.exp(-kel * tinf));

export function expectedLevels(mg, kel, vd, tinf, tau) {
  const peak = (mg / (tinf * vd * kel)) * ((1 - Math.exp(-kel * tinf)) / (1 - Math.exp(-kel * tau)));
  return { peak, trough: peak * Math.exp(-kel * (tau - tinf)) };
}

const INTERVALS = [8, 12, 24, 36, 48];

// Rounds to the next practical interval so the trough stays at or below the goal.
export function traditionalRegimen(k, drug, peak, trough, tinf) {
  const ideal = idealInterval(k.kel, peak, trough, tinf);
  const tau = INTERVALS.find((t) => t >= ideal) ?? null;
  const idealDose = doseForPeak(k.kel, k.vd, peak, tinf, ideal);
  if (tau === null) return { idealTau: ideal, idealDose, tau: null };
  const raw = doseForPeak(k.kel, k.vd, peak, tinf, tau);
  const step = DRUGS[drug].round;
  const mg = Math.round(raw / step) * step;
  return { idealTau: ideal, idealDose, tau, mg, ...expectedLevels(mg, k.kel, k.vd, tinf, tau) };
}

// Hartford starting interval. Sources differ for CrCl 20 to 39; see the page note.
export function hartfordInterval(crcl) {
  if (crcl >= 60) return 24;
  if (crcl >= 40) return 36;
  if (crcl >= 20) return 48;
  return null;
}

export function extendedDose(k, drug) {
  const d = DRUGS[drug];
  const mg = Math.round((d.extended * k.weight.kg) / d.round) * d.round;
  return { mg, perKg: d.extended, tau: hartfordInterval(k.crcl) };
}
