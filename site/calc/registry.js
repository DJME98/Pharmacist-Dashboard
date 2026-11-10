// Every calculation shown in the app. Each entry names its formula, limits, and sources.
// A pharmacist signs off by changing `review` for an entry (see README).
import * as f from './formulas.js';

const UNREVIEWED = { status: 'unverified', by: null, date: null };

const MLMIN = 'mL/min';
const INDEXED = 'mL/min/1.73 m²';

const has = (p, keys) => keys.filter((k) => p[k] === null || p[k] === undefined);

const adult = (p) => p.ageY !== null && p.ageY >= 18;
const between = (lo, hi) => (p) => p.ageY !== null && p.ageY >= lo && p.ageY <= hi;

const ibwOf = (p) => f.ibwDevine(p.sex, p.heightCm);
const bmiOf = (p) => f.bmi(p.weightKg, p.heightCm);

const CG_FORMULA = '(140 − age) × weight ÷ (72 × SCr), × 0.85 if female';
const CG_REFS = ['cg1976', 'winter2012', 'mdcalcCg'];
const CKID_NOTE = 'Published for ages 1 to 25. Enzymatic creatinine and nephelometric, IFCC-standardized cystatin C are recommended.';

function cgEntry(id, name, chooseWeight, extra = {}) {
  return {
    id,
    page: 'renal',
    group: 'Creatinine clearance',
    name,
    unit: MLMIN,
    kind: 'crcl',
    decimals: 0,
    needs: ['ageY', 'sex', 'scr', 'weightKg', 'heightCm'],
    applies: (p) => adult(p),
    compute(p) {
      const w = chooseWeight(p);
      return { value: f.cockcroftGault(p.ageY, w, p.scr, p.sex), used: `Weight used: ${w.toFixed(1)} kg` };
    },
    formula: () => CG_FORMULA,
    note: 'Serum creatinine is not rounded up, because Winter 2012 found rounding low values did not improve accuracy.',
    refs: CG_REFS,
    suggested: (p) => f.winterWeightChoice(bmiOf(p)) === extra.choice,
    review: UNREVIEWED,
    ...extra,
  };
}

export const CALCULATIONS = [
  cgEntry('cg-actual', 'Cockcroft-Gault, actual weight', (p) => p.weightKg, { choice: 'actual' }),
  cgEntry('cg-ibw', 'Cockcroft-Gault, ideal weight', ibwOf, { choice: 'ibw' }),
  cgEntry('cg-adj', 'Cockcroft-Gault, adjusted weight (0.4)',
    (p) => f.adjBw(ibwOf(p), p.weightKg),
    { choice: 'adj', applies: (p) => adult(p) && (p.weightKg === null || p.heightCm === null || p.sex === null || p.weightKg >= ibwOf(p)) }),
  {
    id: 'salazar',
    page: 'renal',
    group: 'Creatinine clearance',
    name: 'Salazar-Corcoran',
    unit: MLMIN,
    kind: 'crcl',
    decimals: 0,
    needs: ['ageY', 'sex', 'scr', 'weightKg', 'heightCm'],
    applies: (p) => adult(p) && p.weightKg !== null && p.heightCm !== null && bmiOf(p) >= 30,
    compute: (p) => ({ value: f.salazarCorcoran(p.ageY, p.weightKg, p.heightCm, p.scr, p.sex) }),
    formula: (p) => (p.sex === 'F'
      ? '(146 − age) × (0.287 × kg + 9.74 × m²) ÷ (60 × SCr)'
      : '(137 − age) × (0.285 × kg + 12.1 × m²) ÷ (51 × SCr)'),
    note: 'Developed for obese patients. Shown when BMI is 30 or above.',
    refs: ['salazar1988', 'globalrphSalazar', 'rxkOther'],
    review: UNREVIEWED,
  },
  {
    id: 'jelliffe',
    page: 'renal',
    group: 'Creatinine clearance',
    name: 'Jelliffe, changing creatinine',
    unit: MLMIN,
    kind: 'crcl',
    decimals: 0,
    needs: ['ageY', 'sex', 'scr', 'prevScr', 'days', 'heightCm', 'weightKg'],
    applies: (p) => adult(p),
    compute: (p) => {
      const w = Math.min(ibwOf(p), p.weightKg);
      const scrUsed = p.scr > p.prevScr ? p.scr : (p.prevScr + p.scr) / 2;
      return {
        value: f.jelliffe(p.ageY, w, p.prevScr, p.scr, p.days, p.sex),
        used: `Weight used: ${w.toFixed(1)} kg. SCr used in the denominator: ${scrUsed.toFixed(2)} mg/dL`,
      };
    },
    formula: (p) => `Production = weight × ${p.sex === 'F' ? '(25.3 − 0.175 × age)' : '(29.3 − 0.203 × age)'}; V = 0.6 L/kg × weight; CrCl = (Production − V × 10 × (SCr latest − SCr earlier) ÷ days) × 100 ÷ (SCr used × 1440)`,
    note: 'Uses V of 0.6 L/kg, the lesser of ideal and actual weight, latest SCr if rising, and average SCr if falling. Other published versions use different coefficients. Less accurate while renal function is improving.',
    refs: ['jelliffe2002', 'jelliffe1972', 'rxkRenal', 'gfrAkiModelling'],
    review: UNREVIEWED,
  },
  {
    id: 'ckdepi-cr',
    page: 'renal',
    group: 'eGFR, adults (CKD-EPI)',
    name: 'Creatinine (2021)',
    unit: INDEXED, kind: 'egfr', decimals: 0,
    needs: ['ageY', 'sex', 'scr'],
    applies: adult,
    compute: (p) => ({ value: f.ckdEpiCr2021(p.ageY, p.scr, p.sex) }),
    formula: (p) => `142 × min(SCr/${p.sex === 'F' ? '0.7' : '0.9'}, 1)^${p.sex === 'F' ? '−0.241' : '−0.302'} × max(SCr/${p.sex === 'F' ? '0.7' : '0.9'}, 1)^−1.200 × 0.9938^age${p.sex === 'F' ? ' × 1.012' : ''}`,
    refs: ['inker2021', 'niddkAdults', 'nkfCkdEpi'],
    review: UNREVIEWED,
  },
  {
    id: 'ckdepi-cys',
    page: 'renal',
    group: 'eGFR, adults (CKD-EPI)',
    name: 'Cystatin C (2012)',
    unit: INDEXED, kind: 'egfr', decimals: 0,
    needs: ['ageY', 'sex', 'cys'],
    applies: adult,
    compute: (p) => ({ value: f.ckdEpiCys2012(p.ageY, p.cys, p.sex) }),
    formula: (p) => `133 × min(CysC/0.8, 1)^−0.499 × max(CysC/0.8, 1)^−1.328 × 0.996^age${p.sex === 'F' ? ' × 0.932' : ''}`,
    refs: ['inker2012', 'niddkAdults'],
    review: UNREVIEWED,
  },
  {
    id: 'ckdepi-crcys',
    page: 'renal',
    group: 'eGFR, adults (CKD-EPI)',
    name: 'Creatinine and cystatin C (2021)',
    unit: INDEXED, kind: 'egfr', decimals: 0,
    needs: ['ageY', 'sex', 'scr', 'cys'],
    applies: adult,
    compute: (p) => ({ value: f.ckdEpiCrCys2021(p.ageY, p.scr, p.cys, p.sex) }),
    formula: (p) => `135 × min(SCr/${p.sex === 'F' ? '0.7' : '0.9'}, 1)^${p.sex === 'F' ? '−0.219' : '−0.144'} × max(SCr/${p.sex === 'F' ? '0.7' : '0.9'}, 1)^−0.544 × min(CysC/0.8, 1)^−0.323 × max(CysC/0.8, 1)^−0.778 × 0.9961^age${p.sex === 'F' ? ' × 0.963' : ''}`,
    note: 'KDIGO 2024 recommends the combined estimate when creatinine-based eGFR is less accurate.',
    refs: ['inker2021', 'niddkAdults', 'ckdepiCombinedQx', 'kdigo2024'],
    review: UNREVIEWED,
  },
  {
    id: 'neonatal',
    page: 'renal',
    group: 'eGFR, children and young adults',
    name: 'Term neonate (up to 4 weeks)',
    unit: INDEXED, kind: 'egfr', decimals: 0,
    needs: ['ageY', 'heightCm', 'scr'],
    applies: (p) => p.ageY !== null && p.ageY * 365.25 <= 28,
    compute: (p) => ({ value: f.neonatalGfr(p.heightCm, p.scr) }),
    formula: () => '0.31 × height (cm) ÷ SCr',
    note: 'For term-born infants only. Enzymatic, IDMS-standardized creatinine is recommended.',
    refs: ['smeets2022', 'niddkPeds'],
    review: UNREVIEWED,
  },
  {
    id: 'schwartz',
    page: 'renal',
    group: 'eGFR, children and young adults',
    name: 'Bedside Schwartz (2009)',
    unit: INDEXED, kind: 'egfr', decimals: 0,
    needs: ['ageY', 'heightCm', 'scr'],
    applies: (p) => p.ageY !== null && p.ageY >= 1 && p.ageY < 18,
    compute: (p) => ({ value: f.bedsideSchwartz(p.heightCm, p.scr) }),
    formula: () => '41.3 × height (m) ÷ SCr',
    note: 'NIDDK reserves this for quick, urgent estimates in children.',
    refs: ['schwartz2009', 'niddkPeds'],
    review: UNREVIEWED,
  },
  {
    id: 'u25-cr',
    page: 'renal',
    group: 'eGFR, children and young adults',
    name: 'CKiD U25, creatinine',
    unit: INDEXED, kind: 'egfr', decimals: 0,
    needs: ['ageY', 'sex', 'heightCm', 'scr'],
    applies: between(1, 25),
    compute: (p) => ({ value: f.u25Cr(p.ageY, p.heightCm, p.scr, p.sex), used: `K = ${f.u25CrK(p.ageY, p.sex).toFixed(2)}` }),
    formula: () => 'K × height (m) ÷ SCr; K depends on age and sex',
    note: CKID_NOTE,
    refs: ['pierce2021', 'niddkPeds'],
    review: UNREVIEWED,
  },
  {
    id: 'u25-cys',
    page: 'renal',
    group: 'eGFR, children and young adults',
    name: 'CKiD U25, cystatin C',
    unit: INDEXED, kind: 'egfr', decimals: 0,
    needs: ['ageY', 'sex', 'cys'],
    applies: between(1, 25),
    compute: (p) => ({ value: f.u25Cys(p.ageY, p.cys, p.sex), used: `K = ${f.u25CysK(p.ageY, p.sex).toFixed(2)}` }),
    formula: () => 'K ÷ CysC; K depends on age and sex',
    note: CKID_NOTE,
    refs: ['pierce2021', 'niddkPeds'],
    review: UNREVIEWED,
  },
  {
    id: 'u25-crcys',
    page: 'renal',
    group: 'eGFR, children and young adults',
    name: 'CKiD U25, creatinine and cystatin C',
    unit: INDEXED, kind: 'egfr', decimals: 0,
    needs: ['ageY', 'sex', 'heightCm', 'scr', 'cys'],
    applies: between(1, 25),
    compute: (p) => ({ value: f.u25CrCys(p.ageY, p.heightCm, p.scr, p.cys, p.sex) }),
    formula: () => '(U25 creatinine + U25 cystatin C) ÷ 2',
    note: `NIDDK prefers this average when both markers are available. ${CKID_NOTE}`,
    refs: ['pierce2021', 'niddkPeds'],
    review: UNREVIEWED,
  },
  {
    id: 'ekfc-cr',
    page: 'renal',
    group: 'eGFR, full age range (EKFC)',
    name: 'Creatinine',
    unit: INDEXED, kind: 'egfr', decimals: 0,
    needs: ['ageY', 'sex', 'scr'],
    applies: (p) => p.ageY !== null && p.ageY >= 2,
    compute: (p) => ({ value: f.ekfcCr(p.ageY, p.scr, p.sex), used: `Q = ${f.ekfcCreatinineQ(p.ageY, p.sex).toFixed(1)} µmol/L` }),
    formula: () => '107.3 × (SCr/Q)^A × (0.990^(age − 40) if age over 40); A = −0.322 if SCr/Q is below 1, otherwise −1.132',
    note: 'Uses the default Q values. Population-specific Q values exist and are not applied here.',
    refs: ['pottel2021', 'kidneyEpi', 'egfrManual', 'niddkAdults'],
    review: UNREVIEWED,
  },
  {
    id: 'ekfc-cys',
    page: 'renal',
    group: 'eGFR, full age range (EKFC)',
    name: 'Cystatin C',
    unit: INDEXED, kind: 'egfr', decimals: 0,
    needs: ['ageY', 'cys'],
    applies: (p) => p.ageY !== null && p.ageY >= 2,
    compute: (p) => ({ value: f.ekfcCys(p.ageY, p.cys), used: `Q = ${f.ekfcCystatinQ(p.ageY).toFixed(3)} mg/L` }),
    formula: () => '107.3 × (CysC/Q)^A × (0.990^(age − 40) if age over 40); Q = 0.83, plus 0.005 × (age − 50) from age 50',
    refs: ['pottel2023', 'kidneyEpi', 'egfrManual'],
    review: UNREVIEWED,
  },
  {
    id: 'ekfc-combined',
    page: 'renal',
    group: 'eGFR, full age range (EKFC)',
    name: 'Creatinine and cystatin C',
    unit: INDEXED, kind: 'egfr', decimals: 0,
    needs: ['ageY', 'sex', 'scr', 'cys'],
    applies: (p) => p.ageY !== null && p.ageY >= 2,
    compute: (p) => ({ value: f.ekfcCombined(p.ageY, p.scr, p.cys, p.sex) }),
    formula: () => '(EKFC creatinine + EKFC cystatin C) ÷ 2',
    refs: ['pottel2023', 'egfrManual'],
    review: UNREVIEWED,
  },
  {
    id: 'bmi',
    page: 'body',
    group: 'Body size',
    name: 'BMI',
    unit: 'kg/m²', kind: 'other', decimals: 1,
    needs: ['weightKg', 'heightCm'],
    applies: () => true,
    compute: (p) => ({ value: bmiOf(p) }),
    formula: () => 'weight (kg) ÷ height (m)²',
    note: 'Adult categories only apply from age 18.',
    refs: ['cdcBmi'],
    review: UNREVIEWED,
  },
  {
    id: 'ibw',
    page: 'body',
    group: 'Body size',
    name: 'Ideal body weight (Devine)',
    unit: 'kg', kind: 'other', decimals: 1,
    needs: ['ageY', 'sex', 'heightCm'],
    applies: adult,
    compute: (p) => ({ value: ibwOf(p) }),
    formula: (p) => `${p.sex === 'F' ? '45.5' : '50'} + 2.3 × (height in inches − 60)`,
    note: 'Pai 2000 traces this equation and notes its limited scientific basis.',
    refs: ['devine1974', 'pai2000'],
    review: UNREVIEWED,
  },
  {
    id: 'adjbw',
    page: 'body',
    group: 'Body size',
    name: 'Adjusted body weight (0.4)',
    unit: 'kg', kind: 'other', decimals: 1,
    needs: ['ageY', 'sex', 'heightCm', 'weightKg'],
    applies: adult,
    compute: (p) => ({ value: f.adjBw(ibwOf(p), p.weightKg) }),
    formula: () => 'IBW + 0.4 × (actual weight − IBW)',
    refs: ['winter2012', 'mdcalcCg'],
    review: UNREVIEWED,
  },
  {
    id: 'bsa-mosteller',
    page: 'body',
    group: 'Body size',
    name: 'BSA (Mosteller)',
    unit: 'm²', kind: 'other', decimals: 2,
    needs: ['weightKg', 'heightCm'],
    applies: () => true,
    compute: (p) => ({ value: f.bsaMosteller(p.weightKg, p.heightCm) }),
    formula: () => '√(weight (kg) × height (cm) ÷ 3600)',
    refs: ['mosteller1987', 'radiopaediaBsa'],
    review: UNREVIEWED,
  },
  {
    id: 'bsa-dubois',
    page: 'body',
    group: 'Body size',
    name: 'BSA (Du Bois)',
    unit: 'm²', kind: 'other', decimals: 2,
    needs: ['weightKg', 'heightCm'],
    applies: () => true,
    compute: (p) => ({ value: f.bsaDuBois(p.weightKg, p.heightCm) }),
    formula: () => '0.007184 × weight (kg)^0.425 × height (cm)^0.725',
    refs: ['dubois1916', 'bsaComparison'],
    review: UNREVIEWED,
  },
];

const NAMES = {
  ageY: 'age', sex: 'sex', scr: 'SCr', prevScr: 'earlier SCr', days: 'days between',
  cys: 'cystatin C', weightKg: 'weight', heightCm: 'height',
};

// Runs one calculation for one patient. Returns null when it does not apply.
export function evaluate(calc, p) {
  const known = p.ageY !== null;
  if (known && !calc.applies(p)) return null;
  const missing = has(p, calc.needs);
  if (missing.length) return { missing: missing.map((k) => NAMES[k]) };
  const out = calc.compute(p);
  if (!Number.isFinite(out.value) || out.value <= 0) {
    return { invalid: 'The inputs give no usable result for this method.' };
  }
  const result = { ...out };
  if (calc.kind === 'egfr' && p.isAdult && p.weightKg !== null && p.heightCm !== null) {
    result.deindexed = f.deindex(out.value, f.bsaDuBois(p.weightKg, p.heightCm));
  }
  if (calc.suggested) result.suggested = calc.suggested(p);
  return result;
}
