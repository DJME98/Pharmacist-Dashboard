// Single-level Bayesian vancomycin dosing using the Goti 2018 two-compartment model.
// Time in hours, dose in mg, concentration in mg/L, clearance in L/h, volume in L.
import { adjBw, cockcroftGault, ibwDevine } from './formulas.js';

export const MODEL = {
  name: 'Goti 2018',
  cl: 4.5, v1: 58.4, v2: 38.4, q: 6.5, crclExponent: 0.8,
  cvCl: 0.398, cvV1: 0.816, cvV2: 0.571,
  addSd: 3.4, propSd: 0.227,
  ageRange: [17, 101], weightRange: [33, 255], crclCap: 150,
};

const omega2 = (cv) => Math.log(1 + cv * cv);
export const OMEGA2 = [omega2(MODEL.cvCl), omega2(MODEL.cvV1), omega2(MODEL.cvV2)];

// The model was built with SCr reset to 1 mg/dL when below 1 in patients over 60,
// and with CrCl truncated at 150 mL/min.
export function crclForModel(p, choice = 'ibw') {
  const ibw = ibwDevine(p.sex, p.heightCm);
  const weight = { ibw, actual: p.weightKg, adj: adjBw(ibw, p.weightKg) }[choice];
  const scr = p.ageY > 60 && p.scr < 1 ? 1 : p.scr;
  const raw = cockcroftGault(p.ageY, weight, scr, p.sex);
  return { crcl: Math.min(raw, MODEL.crclCap), raw, scr, weight, capped: raw > MODEL.crclCap };
}

export const typicalParams = (crcl, kg) => ({
  CL: MODEL.cl * (crcl / 120) ** MODEL.crclExponent,
  V1: MODEL.v1 * (kg / 70),
  V2: MODEL.v2 * (kg / 70),
  Q: MODEL.q,
});

export const individualParams = (tv, eta) => ({
  CL: tv.CL * Math.exp(eta[0]),
  V1: tv.V1 * Math.exp(eta[1]),
  V2: tv.V2 * Math.exp(eta[2]),
  Q: tv.Q,
});

// Exact solution of the two-compartment model over a period of constant infusion.
function advance(state, dt, rate, m) {
  if (dt <= 0) return state;
  const k10 = m.CL / m.V1;
  const k12 = m.Q / m.V1;
  const k21 = m.Q / m.V2;
  const sum = k10 + k12 + k21;
  const disc = Math.sqrt(sum * sum - 4 * k10 * k21);
  const a = (sum + disc) / 2;
  const b = (sum - disc) / 2;
  const ss1 = rate / k10;
  const ss2 = (ss1 * k12) / k21;
  const d1 = state[0] - ss1;
  const d2 = state[1] - ss2;
  const k11 = -(k10 + k12);
  const k22 = -k21;
  const ea = Math.exp(-a * dt) / (b - a);
  const eb = Math.exp(-b * dt) / (a - b);
  const out1 = ea * ((k11 + b) * d1 + k21 * d2) + eb * ((k11 + a) * d1 + k21 * d2);
  const out2 = ea * (k12 * d1 + (k22 + b) * d2) + eb * (k12 * d1 + (k22 + a) * d2);
  return [out1 + ss1, out2 + ss2];
}

// Central concentration at time t for a list of { start, mg, hours } infusions.
export function concentrationAt(m, doses, t) {
  const points = new Set([0, t]);
  for (const d of doses) {
    if (d.start < t) points.add(d.start);
    if (d.start + d.hours < t) points.add(d.start + d.hours);
  }
  const times = [...points].sort((x, y) => x - y);
  let state = [0, 0];
  for (let i = 0; i < times.length - 1; i += 1) {
    const from = times[i];
    const to = times[i + 1];
    const mid = (from + to) / 2;
    const rate = doses.reduce((sum, d) => (mid > d.start && mid < d.start + d.hours ? sum + d.mg / d.hours : sum), 0);
    state = advance(state, to - from, rate, m);
  }
  return state[0] / m.V1;
}

export function steadyState(m, mg, tau, hours) {
  let state = [0, 0];
  let peak = 0;
  let trough = 0;
  let previous = -1;
  for (let i = 0; i < 5000; i += 1) {
    state = advance(state, hours, mg / hours, m);
    peak = state[0] / m.V1;
    state = advance(state, tau - hours, 0, m);
    trough = state[0] / m.V1;
    if (Math.abs(trough - previous) < 1e-9) break;
    previous = trough;
  }
  return { auc24: (mg * (24 / tau)) / m.CL, peak, trough };
}

export function objective(eta, tv, doses, tObs, level) {
  const pred = concentrationAt(individualParams(tv, eta), doses, tObs);
  const variance = MODEL.addSd ** 2 + (MODEL.propSd * pred) ** 2;
  const prior = eta.reduce((sum, e, i) => sum + (e * e) / OMEGA2[i], 0);
  return prior + (level - pred) ** 2 / variance + Math.log(variance);
}

function nelderMead(fn, start, step = 0.3) {
  const n = start.length;
  let simplex = [start.map((x) => x)];
  for (let i = 0; i < n; i += 1) {
    const point = start.map((x) => x);
    point[i] += step;
    simplex.push(point);
  }
  let values = simplex.map(fn);
  for (let iter = 0; iter < 4000; iter += 1) {
    const order = values.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
    simplex = order.map((i) => simplex[i]);
    values = order.map((i) => values[i]);
    if (values[n] - values[0] < 1e-11) break;
    const centroid = Array.from({ length: n }, (_, j) => simplex.slice(0, n).reduce((s, p) => s + p[j], 0) / n);
    const along = (t) => centroid.map((c, j) => c + t * (simplex[n][j] - c));
    const reflected = along(-1);
    const fr = fn(reflected);
    if (fr < values[0]) {
      const expanded = along(-2);
      const fe = fn(expanded);
      if (fe < fr) { simplex[n] = expanded; values[n] = fe; } else { simplex[n] = reflected; values[n] = fr; }
    } else if (fr < values[n - 1]) {
      simplex[n] = reflected; values[n] = fr;
    } else {
      const contracted = along(fr < values[n] ? -0.5 : 0.5);
      const fc = fn(contracted);
      if (fc < Math.min(fr, values[n])) {
        simplex[n] = contracted; values[n] = fc;
      } else {
        for (let i = 1; i <= n; i += 1) {
          simplex[i] = simplex[i].map((x, j) => simplex[0][j] + 0.5 * (x - simplex[0][j]));
          values[i] = fn(simplex[i]);
        }
      }
    }
  }
  return { x: simplex[0], value: values[0] };
}

// Maximum a posteriori estimate from one timed level.
export function fitOneLevel(tv, doses, tObs, level) {
  const fn = (eta) => objective(eta, tv, doses, tObs, level);
  const starts = [[0, 0, 0], [-0.6, 0, 0], [0.6, 0, 0], [0, -0.6, 0], [0, 0.6, 0]];
  let best = null;
  for (const start of starts) {
    const result = nelderMead(fn, start);
    if (!best || result.value < best.value) best = result;
  }
  return {
    eta: best.x,
    params: individualParams(tv, best.x),
    predicted: concentrationAt(individualParams(tv, best.x), doses, tObs),
  };
}

// Builds the dose history. The optional load is the first dose.
export function buildHistory({ loadMg, doseMg, tau, hours, count, hoursAfterLast }) {
  const doses = [];
  for (let i = 0; i < count; i += 1) {
    doses.push({ start: i * tau, mg: i === 0 && loadMg ? loadMg : doseMg, hours });
  }
  return { doses, tObs: (count - 1) * tau + hoursAfterLast };
}

export const TARGET = [400, 600];
const DOSES = [];
for (let mg = 500; mg <= 3000; mg += 250) DOSES.push(mg);
const INTERVALS = [8, 12, 24, 36, 48];

// Regimens predicted to land in the AUC target, closest to its midpoint first.
export function regimenOptions(m, hoursFor = (mg) => Math.max(1, mg / 1000), limit = 6) {
  const mid = (TARGET[0] + TARGET[1]) / 2;
  const options = [];
  for (const tau of INTERVALS) {
    for (const mg of DOSES) {
      const auc = (mg * (24 / tau)) / m.CL;
      if (auc >= TARGET[0] && auc <= TARGET[1]) {
        const hours = hoursFor(mg);
        if (hours < tau) options.push({ mg, tau, hours, daily: mg * (24 / tau), ...steadyState(m, mg, tau, hours) });
      }
    }
  }
  return options.sort((a, b) => Math.abs(a.auc24 - mid) - Math.abs(b.auc24 - mid)).slice(0, limit);
}

export function loadingRange(kg, bmi) {
  const [lo, hi] = bmi >= 30 ? [20, 25] : [20, 35];
  return { perKg: [lo, hi], mg: [Math.min(lo * kg, 3000), Math.min(hi * kg, 3000)], capped: hi * kg > 3000 };
}

export function populationWarnings(p, crclInfo) {
  const out = [];
  const [ageLo, ageHi] = MODEL.ageRange;
  const [wtLo, wtHi] = MODEL.weightRange;
  if (p.ageY > ageHi) out.push('Age is outside the model’s study range (17 to 101 years).');
  if (p.weightKg < wtLo || p.weightKg > wtHi) out.push('Weight is outside the model’s study range (33 to 255 kg).');
  if (crclInfo.raw < 4) out.push('CrCl is below the model’s study range (4 to 150 mL/min).');
  if (crclInfo.capped) out.push('CrCl was truncated to 150 mL/min, as in the model.');
  return out;
}
