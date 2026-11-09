// Conversion tables. `equiv` values within a table are doses treated as equivalent.
// Set `review` to { status: 'verified', by, date } after pharmacist sign-off.
const UNREVIEWED = { status: 'unverified', by: null, date: null };

// `equi` is the dose equivalent to morphine 10 mg parenteral. `cdcFactor` is the MME factor.
// Oxymorphone, tapentadol, and tramadol `equi` values come from CDC factors (morphine oral 30 mg / factor).
export const OPIOIDS = [
  { id: 'morphine-po', name: 'Morphine, oral', unit: 'mg', equi: 30, cdcFactor: 1 },
  { id: 'morphine-iv', name: 'Morphine, IV', unit: 'mg', equi: 10 },
  { id: 'hydromorphone-po', name: 'Hydromorphone, oral', unit: 'mg', equi: 7.5, cdcFactor: 5 },
  { id: 'hydromorphone-iv', name: 'Hydromorphone, IV', unit: 'mg', equi: 1.5 },
  { id: 'oxycodone-po', name: 'Oxycodone, oral', unit: 'mg', equi: 20, cdcFactor: 1.5 },
  { id: 'hydrocodone-po', name: 'Hydrocodone, oral', unit: 'mg', equi: 30, cdcFactor: 1 },
  { id: 'fentanyl-iv', name: 'Fentanyl, IV', unit: 'mcg', equi: 100 },
  { id: 'codeine-po', name: 'Codeine, oral', unit: 'mg', equi: 200, cdcFactor: 0.15 },
  { id: 'meperidine-iv', name: 'Meperidine, IV', unit: 'mg', equi: 75 },
  { id: 'meperidine-po', name: 'Meperidine, oral', unit: 'mg', equi: 300 },
  { id: 'oxymorphone-po', name: 'Oxymorphone, oral', unit: 'mg', equi: 10, cdcFactor: 3 },
  { id: 'tapentadol-po', name: 'Tapentadol, oral', unit: 'mg', equi: 75, cdcFactor: 0.4 },
  { id: 'tramadol-po', name: 'Tramadol, oral', unit: 'mg', equi: 150, cdcFactor: 0.2 },
  { id: 'methadone-po', name: 'Methadone, oral', unit: 'mg', cdcFactor: 4.7, noConvert: 'methadone' },
  { id: 'fentanyl-td', name: 'Fentanyl, transdermal', unit: 'mcg/h', cdcFactor: 2.4, noConvert: 'patch' },
];

export const OPIOID_ITEM = {
  id: 'opioids', name: 'Opioid conversion',
  refs: ['ahrqOpioid', 'iowaOpioid', 'torontoOpioid', 'cdc2022', 'aafpCdc', 'durogesicLabel'],
  review: UNREVIEWED,
};

export const RATIO_TABLES = [
  {
    id: 'benzo', name: 'Benzodiazepines', unit: 'mg',
    intro: 'Oral doses treated as equivalent to diazepam 10 mg.',
    caution: 'These equivalences come from clinical experience and differ from those of other authors. Response varies between patients. Do not switch to diazepam in hepatic failure.',
    drugs: [
      { id: 'diazepam', name: 'Diazepam', equiv: 10, detail: 'Half-life 20 to 100 h' },
      { id: 'lorazepam', name: 'Lorazepam', equiv: 1, detail: 'Half-life 10 to 20 h' },
      { id: 'alprazolam', name: 'Alprazolam', equiv: 0.5, detail: 'Half-life 6 to 12 h' },
      { id: 'clonazepam', name: 'Clonazepam', equiv: 0.5, detail: 'Half-life 18 to 50 h' },
      { id: 'chlordiazepoxide', name: 'Chlordiazepoxide', equiv: 25, detail: 'Half-life 5 to 30 h' },
      { id: 'clobazam', name: 'Clobazam', equiv: 20, detail: 'Half-life 12 to 60 h' },
      { id: 'clorazepate', name: 'Clorazepate', equiv: 15 },
      { id: 'estazolam', name: 'Estazolam', equiv: [1, 2], detail: 'Half-life 10 to 24 h' },
      { id: 'flurazepam', name: 'Flurazepam', equiv: [15, 30] },
      { id: 'oxazepam', name: 'Oxazepam', equiv: 20, detail: 'Half-life 4 to 15 h' },
      { id: 'temazepam', name: 'Temazepam', equiv: 20, detail: 'Half-life 8 to 22 h' },
      { id: 'triazolam', name: 'Triazolam', equiv: 0.5, detail: 'Half-life about 2 h' },
    ],
    refs: ['ashton2007', 'oregonBenzo'], review: UNREVIEWED,
  },
  {
    id: 'steroid', name: 'Steroids', unit: 'mg',
    intro: 'Systemic glucocorticoid doses treated as equivalent, based on total daily dose.',
    caution: 'Glucocorticoid equivalence only. Mineralocorticoid effect and duration differ, so adjust the schedule for each drug.',
    drugs: [
      { id: 'hydrocortisone', name: 'Hydrocortisone', equiv: 20, detail: 'Duration 8 to 12 h' },
      { id: 'cortisone', name: 'Cortisone', equiv: 25, detail: 'Duration 8 to 12 h' },
      { id: 'prednisone', name: 'Prednisone', equiv: 5, detail: 'Duration 12 to 36 h' },
      { id: 'prednisolone', name: 'Prednisolone', equiv: 5, detail: 'Duration 12 to 36 h' },
      { id: 'methylprednisolone', name: 'Methylprednisolone', equiv: 4, detail: 'Duration 12 to 36 h' },
      { id: 'triamcinolone', name: 'Triamcinolone', equiv: 4, detail: 'Duration 12 to 36 h' },
      { id: 'dexamethasone', name: 'Dexamethasone', equiv: 0.75, detail: 'Duration 36 to 72 h' },
      { id: 'betamethasone', name: 'Betamethasone', equiv: 0.6, detail: 'Duration 36 to 72 h' },
    ],
    refs: ['liu2013', 'litflSteroid'], review: UNREVIEWED,
  },
  {
    id: 'beta', name: 'Beta blockers', unit: 'mg/day',
    intro: 'Oral total daily doses listed as equivalent.',
    caution: 'Weak evidence: this list comes from a reference table that does not say how it was derived. Agents differ in selectivity and properties. In heart failure with reduced EF, use only bisoprolol, carvedilol, or metoprolol succinate at their own doses.',
    drugs: [
      { id: 'metoprolol', name: 'Metoprolol tartrate', equiv: 100, detail: 'Listed as 50 mg BID' },
      { id: 'metoprolol-er', name: 'Metoprolol ER', equiv: 100, detail: 'Listed as 100 mg daily' },
      { id: 'carvedilol', name: 'Carvedilol', equiv: 25, detail: 'Listed as 12.5 mg BID' },
      { id: 'atenolol', name: 'Atenolol', equiv: 50, detail: 'Listed as 50 mg daily' },
      { id: 'bisoprolol', name: 'Bisoprolol', equiv: 5, detail: 'Listed as 5 mg daily' },
      { id: 'propranolol', name: 'Propranolol', equiv: 80, detail: 'Listed as 40 mg BID' },
      { id: 'propranolol-er', name: 'Propranolol ER', equiv: 80, detail: 'Listed as 80 mg daily' },
      { id: 'labetalol', name: 'Labetalol', equiv: 200, detail: 'Listed as 100 mg BID' },
      { id: 'sotalol', name: 'Sotalol', equiv: 160, detail: 'Listed as 80 mg BID' },
      { id: 'nadolol', name: 'Nadolol', equiv: 80, detail: 'Listed as 80 mg daily' },
      { id: 'acebutolol', name: 'Acebutolol', equiv: 200, detail: 'Listed as 100 mg BID' },
      { id: 'pindolol', name: 'Pindolol', equiv: 10, detail: 'Listed as 5 mg BID' },
      { id: 'timolol', name: 'Timolol', equiv: 10, detail: 'Listed as 5 mg BID' },
    ],
    refs: ['wikemBeta', 'empendiumBeta'], review: UNREVIEWED,
  },
  {
    id: 'ace', name: 'ACE inhibitors', unit: 'mg',
    intro: 'Approximate daily doses treated as equivalent to lisinopril 10 mg.',
    caution: 'Approximate. Consider starting lower and titrating. Recheck blood pressure, creatinine, and electrolytes in 1 to 2 weeks. Use lower doses in renal or hepatic impairment and older age.',
    drugs: [
      { id: 'lisinopril', name: 'Lisinopril', equiv: 10 },
      { id: 'enalapril', name: 'Enalapril', equiv: [5, 10], detail: 'Sources differ: 5 to 10 mg' },
      { id: 'ramipril', name: 'Ramipril', equiv: 2.5 },
      { id: 'benazepril', name: 'Benazepril', equiv: 10 },
      { id: 'fosinopril', name: 'Fosinopril', equiv: 10 },
      { id: 'quinapril', name: 'Quinapril', equiv: 10 },
      { id: 'perindopril', name: 'Perindopril', equiv: [2, 4] },
      { id: 'cilazapril', name: 'Cilazapril', equiv: 2.5 },
    ],
    refs: ['bpacAce', 'albertaAceArb'], review: UNREVIEWED,
  },
  {
    id: 'arb', name: 'ARBs', unit: 'mg',
    intro: 'Approximate daily antihypertensive doses treated as equivalent.',
    caution: 'Estimated equivalences for hypertension. Monitor after the switch. For heart failure, use the agent’s own target dose.',
    drugs: [
      { id: 'losartan', name: 'Losartan', equiv: 50, detail: 'HF target 50 to 100 mg daily' },
      { id: 'valsartan', name: 'Valsartan', equiv: 80, detail: 'HF target 160 mg BID' },
      { id: 'candesartan', name: 'Candesartan', equiv: [8, 16], detail: 'HF target 32 mg daily' },
      { id: 'irbesartan', name: 'Irbesartan', equiv: 150 },
      { id: 'olmesartan', name: 'Olmesartan', equiv: 20 },
      { id: 'telmisartan', name: 'Telmisartan', equiv: 40 },
      { id: 'azilsartan', name: 'Azilsartan', equiv: 40 },
      { id: 'eprosartan', name: 'Eprosartan', equiv: 600 },
    ],
    refs: ['medsaskArb', 'albertaAceArb'], review: UNREVIEWED,
  },
  {
    id: 'ppi', name: 'PPIs', unit: 'mg',
    intro: 'Equivalent acid-suppressing dose based on relative potency for raising intragastric pH (omeprazole = 1).',
    caution: 'Based on acid suppression over a limited dose range. Calculated doses may not match available strengths, and your formulary interchange may differ.',
    drugs: [
      { id: 'omeprazole', name: 'Omeprazole', equiv: 20, detail: 'Potency 1.00' },
      { id: 'esomeprazole', name: 'Esomeprazole', equiv: 20 / 1.6, detail: 'Potency 1.60' },
      { id: 'rabeprazole', name: 'Rabeprazole', equiv: 20 / 1.82, detail: 'Potency 1.82' },
      { id: 'lansoprazole', name: 'Lansoprazole', equiv: 20 / 0.9, detail: 'Potency 0.90' },
      { id: 'pantoprazole', name: 'Pantoprazole', equiv: 20 / 0.23, detail: 'Potency 0.23' },
    ],
    refs: ['kirchheiner2009', 'grahamTansel2018'], review: UNREVIEWED,
  },
  {
    id: 'loop', name: 'Loop diuretics', unit: 'mg',
    intro: 'Approximate equivalent doses.',
    caution: 'Oral furosemide absorption varies widely (10% to 100%). Torsemide equivalence differs between references.',
    drugs: [
      { id: 'furosemide-po', name: 'Furosemide, oral', equiv: 40 },
      { id: 'furosemide-iv', name: 'Furosemide, IV', equiv: 20 },
      { id: 'bumetanide', name: 'Bumetanide, oral or IV', equiv: 1 },
      { id: 'torsemide', name: 'Torsemide, oral or IV', equiv: [10, 20] },
    ],
    refs: ['drugsLoop'], review: UNREVIEWED,
  },
];

// Doses and intensity per the 2018 AHA/ACC guideline, as tabulated by the MSD Manual.
export const STATINS = [
  { id: 'atorvastatin', name: 'Atorvastatin', doses: { 10: 'moderate', 20: 'moderate', 40: 'high', 80: 'high' } },
  { id: 'rosuvastatin', name: 'Rosuvastatin', doses: { 5: 'moderate', 10: 'moderate', 20: 'high', 40: 'high' } },
  { id: 'simvastatin', name: 'Simvastatin', doses: { 10: 'low', 20: 'moderate', 40: 'moderate' } },
  { id: 'pravastatin', name: 'Pravastatin', doses: { 10: 'low', 20: 'low', 40: 'moderate', 80: 'moderate' } },
  { id: 'lovastatin', name: 'Lovastatin', doses: { 20: 'low', 40: 'moderate' } },
  { id: 'fluvastatin', name: 'Fluvastatin (XL for 80 mg)', doses: { 20: 'low', 40: 'low', 80: 'moderate' } },
  { id: 'pitavastatin', name: 'Pitavastatin', doses: { 1: 'low', 2: 'moderate', 4: 'moderate' } },
];

export const INTENSITY_LABEL = {
  high: 'High intensity: LDL-C lowered by 50% or more',
  moderate: 'Moderate intensity: LDL-C lowered by 30% to under 50%',
  low: 'Low intensity: LDL-C lowered by under 30%',
};

export const STATIN_ITEM = {
  id: 'statin', name: 'Statin intensity', refs: ['grundy2018', 'msdStatin', 'ccjmStatin'], review: UNREVIEWED,
};

export const CONVERSION_ITEMS = [OPIOID_ITEM, ...RATIO_TABLES, STATIN_ITEM];
