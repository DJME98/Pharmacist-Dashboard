// Conversion tables. `equiv` values within a table are doses treated as equivalent.
// `step` is the practical dosing increment used to round results.
// `alt` lists values from other sources that differ, on the same scale as `equiv`.
const UNREVIEWED = { status: 'unverified', by: null, date: null };

// Short names used when showing conflicting values. Each maps to a reference id.
export const SOURCES = {
  ashton: { label: 'Ashton', ref: 'ashton2007' },
  nhs: { label: 'NHS SPS', ref: 'nhsBenzo' },
  liu: { label: 'Liu 2013', ref: 'liu2013' },
  abda: { label: 'ABDA', ref: null },
  potency: { label: 'Acid-suppression potency', ref: 'grahamTansel2018' },
  brater: { label: 'Brater 1998', ref: 'brater1998' },
  cdc: { label: 'CDC 2022 MME factor', ref: 'cdc2022' },
  heiskanen: { label: 'Heiskanen and Kalso 1997', ref: 'heiskanen1997' },
  bruera96: { label: 'Bruera 1996', ref: 'bruera1996' },
  dinges: { label: 'Dinges 2022 (IV PCA trials)', ref: 'dinges2022' },
};

// `equi` is the dose equivalent to morphine 10 mg IV (oral morphine 30 mg). `cdcFactor` is the CDC 2022 MME factor.
// Oral values: CDC 2022 factors (oral morphine 30 mg ÷ factor), with the primary studies behind them where they exist.
// IV values: Dinges 2022 network meta-analysis of randomized IV PCA trials (potency relative to IV morphine).
export const OPIOIDS = [
  { id: 'morphine-po', name: 'Morphine, oral', unit: 'mg', equi: 30, cdcFactor: 1, step: 7.5, basis: 'Oral to IV about 3:1 (Kalso and Vainio 1990: oral 0.31 times as potent)' },
  { id: 'morphine-iv', name: 'Morphine, IV', unit: 'mg', equi: 10, step: 1, basis: 'Reference' },
  { id: 'hydromorphone-po', name: 'Hydromorphone, oral', unit: 'mg', equi: 6, cdcFactor: 5, step: 1, basis: 'Morphine to hydromorphone about 5:1 (Lawlor 1997, Bruera 1996); CDC factor 5', alt: [{ v: 8.4, src: 'bruera96', note: 'switching hydromorphone to morphine, 1:3.6' }] },
  { id: 'hydromorphone-iv', name: 'Hydromorphone, IV', unit: 'mg', equi: 1.7, step: 0.2, basis: '6 times IV morphine (Dinges 2022)' },
  { id: 'oxycodone-po', name: 'Oxycodone, oral', unit: 'mg', equi: 20, cdcFactor: 1.5, step: 2.5, basis: 'Morphine to oxycodone 1.5:1 (Heiskanen and Kalso 1997; Bruera 1998); CDC factor 1.5', alt: [{ v: 22.5, src: 'heiskanen', note: '1.33:1 when oxycodone followed morphine' }] },
  { id: 'hydrocodone-po', name: 'Hydrocodone, oral', unit: 'mg', equi: 30, cdcFactor: 1, step: 2.5, basis: 'CDC factor 1' },
  { id: 'oxymorphone-po', name: 'Oxymorphone, oral', unit: 'mg', equi: 10, cdcFactor: 3, step: 2.5, basis: 'CDC factor 3' },
  { id: 'oxymorphone-iv', name: 'Oxymorphone, IV', unit: 'mg', equi: 1.7, step: 0.1, basis: '6 times IV morphine (Dinges 2022)' },
  { id: 'fentanyl-iv', name: 'Fentanyl, IV', unit: 'mcg', equi: 170, step: 12.5, basis: '58 times IV morphine (Dinges 2022). The authors note short-acting opioids look less potent in PCA trials because they are re-dosed more often.' },
  { id: 'codeine-po', name: 'Codeine, oral', unit: 'mg', equi: 200, cdcFactor: 0.15, step: 15, basis: 'CDC factor 0.15' },
  { id: 'meperidine-iv', name: 'Meperidine, IV', unit: 'mg', equi: 83, step: 12.5, basis: '0.12 times IV morphine (Dinges 2022)' },
  { id: 'tapentadol-po', name: 'Tapentadol, oral', unit: 'mg', equi: 75, cdcFactor: 0.4, step: 50, basis: 'CDC factor 0.4' },
  { id: 'tramadol-po', name: 'Tramadol, oral', unit: 'mg', equi: 150, cdcFactor: 0.2, step: 25, basis: 'CDC factor 0.2' },
  { id: 'methadone-po', name: 'Methadone, oral', unit: 'mg', cdcFactor: 4.7, noConvert: 'methadone' },
  { id: 'fentanyl-td', name: 'Fentanyl, transdermal', unit: 'mcg/h', cdcFactor: 2.4, noConvert: 'patch' },
];

// Mixed agonist-antagonists: listed in the table only. Switching from a full agonist can precipitate withdrawal.
export const OPIOID_TABLE_ONLY = [
  { name: 'Buprenorphine, IV', unit: 'mg', equi: 0.27, src: 'dinges' },
  { name: 'Butorphanol, IV', unit: 'mg', equi: 2.2, src: 'dinges' },
  { name: 'Nalbuphine, IV', unit: 'mg', equi: 14, src: 'dinges' },
];

export const OPIOID_ITEM = {
  id: 'opioids', name: 'Opioid conversion',
  basis: 'Classic tables come from single-dose studies in opioid-naive patients after surgery or with acute pain. Studies of chronic dosing in cancer pain give different, direction-dependent ratios: hydromorphone 5:1 from morphine but 1:3.7 back (Lawlor 1997), oxycodone 1.5:1 or 1.33:1 depending on which drug came first (Heiskanen and Kalso 1997), and patch ratios of about 70 to 78:1 from oral morphine. These were small studies; no large randomized trial exists (Treillet 2018). Ratio ranges are wide and methadone potency rises with the previous opioid dose (Pereira 2001).',
  basisRefs: ['treillet2018', 'pereira2001', 'dinges2022'],
  refs: ['cdc2022', 'dinges2022', 'kalso1990', 'lawlor1997', 'bruera1996', 'heiskanen1997', 'bruera1998', 'donner1996', 'treillet2018', 'pereira2001', 'durogesicLabel'],
  review: UNREVIEWED,
};

export const RATIO_TABLES = [
  {
    table: true,
    id: 'benzo', name: 'Benzodiazepines', unit: 'mg',
    intro: 'Oral doses treated as equivalent to diazepam 10 mg (Ashton), with other sources where they differ. Grouped by half-life, including active metabolites.',
    caution: 'Response varies, especially in older adults and in liver or kidney impairment. Avoid switching to diazepam in liver impairment. When switching from a short-acting to a long-acting drug, the full effect builds over several days.',
    basis: 'No controlled study establishes these equivalences. Ashton’s table comes from clinical experience with withdrawal, and its author notes that other authors give different values. NHS SPS calls its equivalents approximate and not exact. Half-lives are from Ashton.',
    basisRefs: ['ashton2007', 'nhsBenzo'],
    groups: [
      { id: 'short', label: 'Short (half-life under 6 h)' },
      { id: 'mid', label: 'Intermediate (6 to 24 h)' },
      { id: 'long', label: 'Long (over 24 h with active metabolites)' },
    ],
    durationLabel: 'Half-life (Ashton)',
    durScale: 'log',
    drugs: [
      { id: 'diazepam', name: 'Diazepam', group: 'long', equiv: 10, step: 1, dur: [20, 200], durClass: 'long', durText: '20 to 100 h; metabolite 36 to 200 h' },
      { id: 'chlordiazepoxide', name: 'Chlordiazepoxide', group: 'long', equiv: 25, step: 5, dur: [5, 200], durClass: 'long', durText: '5 to 30 h; metabolite 36 to 200 h' },
      { id: 'clonazepam', name: 'Clonazepam', group: 'long', equiv: 0.5, step: 0.125, dur: [18, 50], durClass: 'long', durText: '18 to 50 h' },
      { id: 'clobazam', name: 'Clobazam', group: 'long', equiv: 20, step: 5, dur: [12, 60], durClass: 'long', durText: '12 to 60 h' },
      { id: 'clorazepate', name: 'Clorazepate', group: 'long', equiv: 15, step: 3.75, dur: [36, 200], durClass: 'long', durText: 'Metabolite 36 to 200 h' },
      { id: 'flurazepam', name: 'Flurazepam', group: 'long', equiv: [15, 30], step: 15, dur: [40, 250], durClass: 'long', durText: 'Metabolite 40 to 250 h' },
      { id: 'nitrazepam', name: 'Nitrazepam', group: 'long', equiv: 10, step: 2.5, dur: [15, 38], durClass: 'long', durText: '15 to 38 h', detail: 'Not marketed in the US' },
      { id: 'lorazepam', name: 'Lorazepam', group: 'mid', equiv: 1, step: 0.25, dur: [10, 20], durClass: 'mid', durText: '10 to 20 h' },
      { id: 'alprazolam', name: 'Alprazolam', group: 'mid', equiv: 0.5, step: 0.125, dur: [6, 12], durClass: 'mid', durText: '6 to 12 h' },
      { id: 'temazepam', name: 'Temazepam', group: 'mid', equiv: 20, step: 7.5, dur: [8, 22], durClass: 'mid', durText: '8 to 22 h' },
      { id: 'oxazepam', name: 'Oxazepam', group: 'mid', equiv: 20, step: 10, dur: [4, 15], durClass: 'mid', durText: '4 to 15 h', detail: 'May suit liver impairment' },
      { id: 'estazolam', name: 'Estazolam', group: 'mid', equiv: [1, 2], step: 0.5, dur: [10, 24], durClass: 'mid', durText: '10 to 24 h' },
      { id: 'triazolam', name: 'Triazolam', group: 'short', equiv: 0.5, step: 0.125, dur: [2, 2], durClass: 'short', durText: '2 h' },
      { id: 'zolpidem', name: 'Zolpidem (Z-drug)', group: 'short', equiv: 20, step: 2.5, dur: [2, 2], durClass: 'short', durText: '2 h', detail: 'NHS SPS' },
      { id: 'zaleplon', name: 'Zaleplon (Z-drug)', group: 'short', equiv: 20, step: 5, dur: [2, 2], durClass: 'short', durText: '2 h', detail: 'NHS SPS' },
      { id: 'zopiclone', name: 'Zopiclone (Z-drug)', group: 'short', equiv: 15, step: 3.75, dur: [5, 6], durClass: 'short', durText: '5 to 6 h', detail: 'Not marketed in the US' },
    ],
    refs: ['ashton2007', 'nhsBenzo'], review: UNREVIEWED,
  },
  {
    table: true,
    id: 'steroid', name: 'Steroids', unit: 'mg',
    intro: 'Systemic glucocorticoid doses treated as equivalent, based on total daily dose.',
    caution: 'Glucocorticoid (anti-inflammatory) equivalence only. Mineralocorticoid effect and duration differ, so adjust the schedule for each drug. Fludrocortisone cannot be converted this way.',
    basis: 'Relative potencies come from early laboratory and human bioassays and from suppression of the pituitary-adrenal axis in healthy volunteers, as in Meikle and Tyler (1977), who measured hydrocortisone, prednisone, and dexamethasone this way. Few clinical trials compare doses directly. Durations are biologic half-lives (Liu 2013).',
    basisRefs: ['meikle1977', 'liu2013'],
    durationLabel: 'Duration of action',
    drugs: [
      { id: 'hydrocortisone', name: 'Hydrocortisone', equiv: 20, step: 2.5, dur: [8, 12], durClass: 'short', detail: 'Mineralocorticoid 1' },
      { id: 'cortisone', name: 'Cortisone', equiv: 25, step: 12.5, dur: [8, 12], durClass: 'short', detail: 'Mineralocorticoid 0.8' },
      { id: 'prednisone', name: 'Prednisone', equiv: 5, step: 1, dur: [12, 36], durClass: 'mid', detail: 'Mineralocorticoid 0.6' },
      { id: 'prednisolone', name: 'Prednisolone', equiv: 5, step: 1, dur: [12, 36], durClass: 'mid', detail: 'Mineralocorticoid 0.6' },
      { id: 'methylprednisolone', name: 'Methylprednisolone', equiv: 4, step: 2, dur: [12, 36], durClass: 'mid' },
      { id: 'triamcinolone', name: 'Triamcinolone', equiv: 4, step: 2, dur: [12, 36], durClass: 'mid' },
      { id: 'deflazacort', name: 'Deflazacort', equiv: 6, step: 6, detail: 'ABDA only. Duration not reported in these sources' },
      { id: 'dexamethasone', name: 'Dexamethasone', equiv: 0.75, step: 0.25, dur: [36, 72], durClass: 'long' },
      { id: 'betamethasone', name: 'Betamethasone', equiv: 0.6, step: 0.1, dur: [36, 72], durClass: 'long', alt: [{ v: 0.75, src: 'abda' }] },
    ],
    refs: ['liu2013', 'abdaSteroid', 'meikle1977'], review: UNREVIEWED,
  },
  {
    table: true,
    id: 'beta', name: 'Beta blockers', unit: 'mg/day',
    intro: 'Oral daily doses aligned at the ABDA medium hypertension dose. Drugs ABDA does not list use the US label’s starting hypertension dose and are less certain.',
    caution: 'Agents differ in selectivity, vasodilation, and intrinsic activity, so effects on heart rate and blood pressure are not interchangeable. In heart failure with reduced EF, use only bisoprolol, carvedilol, or metoprolol succinate at their own target doses. Selectivity, ISA, and alpha blockade follow the drug class review (Helfand 2009, Table 1).',
    basis: 'No study measures equivalence directly. A Cochrane review of 56 placebo-controlled trials (7,812 people) found no graded blood-pressure response across the dose range: the maximum fall came at about twice the starting dose, while heart rate kept falling with higher doses (Wong 2016). So doses are matched by their place in each drug’s range, not by measured effect.',
    basisRefs: ['wong2016Beta', 'abdaBeta'],
    durationLabel: 'Elimination half-life',
    durNote: 'Half-life does not closely track how long the effect lasts.',
    propLegend: true,
    groups: [
      { id: 'sel', label: 'Cardioselective (beta-1), no other effects' },
      { id: 'other', label: 'Other effects (see notes)' },
    ],
    drugs: [
      { id: 'metoprolol', name: 'Metoprolol tartrate', group: 'sel', props: ['b1'], equiv: 100, step: 12.5, dur: [3, 7], durClass: 'short', durText: '3 to 7 h', detail: 'ABDA 50 mg BID' },
      { id: 'metoprolol-er', name: 'Metoprolol succinate ER', group: 'sel', props: ['b1'], equiv: 100, step: 12.5, dur: [3, 7], durClass: 'short', durText: '3 to 7 h; extended release', detail: 'ABDA 95 mg daily (German strength)' },
      { id: 'bisoprolol', name: 'Bisoprolol', group: 'sel', props: ['b1'], equiv: 10, step: 1.25, dur: [9, 12], durClass: 'mid', durText: '9 to 12 h', detail: 'ABDA medium dose', alt: [{ v: 5, src: 'abda', note: 'low dose' }] },
      { id: 'atenolol', name: 'Atenolol', group: 'sel', props: ['b1', 'renal'], equiv: 50, step: 12.5, dur: [6, 9], durClass: 'mid', durText: '6 to 9 h', detail: 'Cleared mainly by the kidneys; adjust for kidney function. ABDA low 25 to 50 mg, maximum 100 mg' },
      { id: 'betaxolol', name: 'Betaxolol', group: 'sel', props: ['b1'], equiv: [10, 20], step: 5, dur: [14, 22], durClass: 'long', durText: '14 to 22 h', detail: 'ABDA low to maximum dose' },
      { id: 'nebivolol', name: 'Nebivolol', group: 'other', props: ['b1', 'vaso'], equiv: 5, step: 2.5, dur: [12, 19], durClass: 'long', durText: '12 to 19 h', detail: 'Beta-1 selective at 10 mg or less; blocks beta-2 too at higher doses or in poor CYP2D6 metabolizers. The label lists vasodilation as a possible mechanism. ABDA hypertension dose' },
      { id: 'acebutolol', name: 'Acebutolol', group: 'other', props: ['b1', 'isa'], equiv: 400, step: 100, dur: [3, 4], durClass: 'short', durText: '3 to 4 h', detail: 'Beta-1 selective with intrinsic sympathomimetic (partial agonist) activity: less slowing of resting heart rate. Label start 400 mg daily; usual 400 to 800 mg daily' },
      { id: 'carvedilol', name: 'Carvedilol', group: 'other', props: ['ns', 'alpha'], equiv: 25, step: 3.125, dur: [7, 10], durClass: 'mid', durText: '7 to 10 h', detail: 'Nonselective plus alpha-1 blockade: more vasodilation and blood-pressure lowering. ABDA hypertension medium dose; 50 mg for angina', alt: [{ v: 50, src: 'abda', note: 'angina medium dose' }] },
      { id: 'labetalol', name: 'Labetalol', group: 'other', props: ['ns', 'alpha'], equiv: 200, step: 100, dur: [3, 6], durClass: 'short', durText: '3 to 6 h', detail: 'Nonselective plus alpha-1 blockade. Label start 100 mg BID; maintenance 200 to 400 mg BID' },
      { id: 'pindolol', name: 'Pindolol', group: 'other', props: ['ns', 'isa'], equiv: 15, step: 2.5, dur: [3, 4], durClass: 'short', durText: '3 to 4 h', detail: 'Nonselective with intrinsic sympathomimetic activity. ABDA 5 mg TID' },
      { id: 'propranolol', name: 'Propranolol', group: 'other', props: ['ns'], equiv: [80, 240], step: 10, dur: [3, 4], durClass: 'short', durText: '3 to 4 h', detail: 'Nonselective: also blocks beta-2, so bronchospasm risk in asthma or COPD. ABDA 40 to 80 mg BID or TID' },
      { id: 'propranolol-er', name: 'Propranolol ER', group: 'other', props: ['ns'], equiv: [80, 160], step: 20, dur: [8, 11], durClass: 'mid', durText: '8 to 11 h', detail: 'Nonselective. ABDA 80 or 160 mg daily' },
      { id: 'nadolol', name: 'Nadolol', group: 'other', props: ['ns'], equiv: 40, step: 20, dur: [10, 20], durClass: 'long', durText: '10 to 20 h', detail: 'Nonselective. Label start 40 mg daily; maintenance 40 to 80 mg, up to 240 to 320 mg' },
      { id: 'timolol', name: 'Timolol', group: 'other', props: ['ns'], equiv: 20, step: 10, dur: [4, 5], durClass: 'short', durText: '4 to 5 h', detail: 'Nonselective. Label start 10 mg BID; maintenance 20 to 40 mg daily' },
      { id: 'sotalol', name: 'Sotalol', group: 'other', props: ['ns', 'class3'], noConvert: 'Antiarrhythmic: do not swap', durText: 'See label', detail: 'Nonselective beta blocker plus Class III antiarrhythmic action (prolongs the action potential and QT). Used only for arrhythmias; do not swap for another beta blocker or convert by dose. Start or restart in a facility with continuous ECG monitoring, dose by CrCl, and stop other antiarrhythmics first (label boxed warning).' },
    ],
    refs: ['abdaBeta', 'wong2016Beta', 'derpBeta', 'labetalolLabel', 'nadololLabel', 'acebutololLabel', 'timololLabel', 'bystolicLabel', 'sotalolLabel'], review: UNREVIEWED,
  },
  {
    table: true,
    id: 'ace', name: 'ACE inhibitors', unit: 'mg/day',
    intro: 'Daily doses treated as equivalent to lisinopril 10 mg, using ABDA equivalence factors.',
    caution: 'Approximate. Consider starting lower and titrating. Recheck blood pressure, creatinine, and potassium in 1 to 2 weeks. Halve the starting dose with volume depletion, diuretics, or CrCl below 30 to 40.',
    durationLabel: 'Half-life of active form',
    durNote: 'Most give a 24 h effect, even quinapril with a 3 h half-life.',
    drugs: [
      { id: 'lisinopril', name: 'Lisinopril', equiv: 10, step: 2.5, dur: [12, 12], durClass: 'mid', durText: '12 h; effect 24 h' },
      { id: 'benazepril', name: 'Benazepril', equiv: 10, step: 5, dur: [10, 11], durClass: 'mid', durText: '10 to 11 h (benazeprilat); effect 24 h' },
      { id: 'captopril', name: 'Captopril', equiv: 50, step: 12.5, dur: [2, 2], durClass: 'short', durText: 'Under 2 h; effect dose-related', detail: 'Given BID or TID' },
      { id: 'enalapril', name: 'Enalapril', equiv: 10, step: 2.5, dur: [11, 11], durClass: 'mid', durText: '11 h (enalaprilat); effect 24 h' },
      { id: 'fosinopril', name: 'Fosinopril', equiv: 15, step: 10, dur: [12, 12], durClass: 'mid', durText: '12 h (fosinoprilat); effect 24 h' },
      { id: 'moexipril', name: 'Moexipril', equiv: 7.5, step: 7.5, dur: [12, 12], durClass: 'mid', durText: '12 h (moexiprilat); effect 24 h', detail: 'ABDA' },
      { id: 'perindopril', name: 'Perindopril erbumine', equiv: 4, step: 2, durText: 'Not reported in this source' },
      { id: 'quinapril', name: 'Quinapril', equiv: 10, step: 5, dur: [3, 3], durClass: 'short', durText: '3 h (quinaprilat); effect 24 h' },
      { id: 'ramipril', name: 'Ramipril', equiv: 2.5, step: 1.25, dur: [13, 17], durClass: 'long', durText: '13 to 17 h (ramiprilat); effect 24 h' },
      { id: 'trandolapril', name: 'Trandolapril', equiv: 1, step: 1, dur: [16, 16], durClass: 'long', durText: '16 h (trandolaprilat); effect 24 h' },
      { id: 'cilazapril', name: 'Cilazapril', equiv: 2.5, step: 0.5, durText: 'Not reported in this source', detail: 'Not marketed in the US' },
    ],
    basis: 'No head-to-head trials define these equivalences. A Cochrane review of 92 placebo-controlled trials (12,954 people, 14 ACE inhibitors) found no drug better or worse at lowering blood pressure. One quarter of the maximum dose gave 60% to 70% of the maximum effect and half gave about 90% (Heran 2008). Tables therefore match doses by their fraction of each drug’s maximum.',
    basisRefs: ['heran2008Ace', 'abdaAce'],
    refs: ['abdaAce', 'heran2008Ace', 'vaAce1997'], review: UNREVIEWED,
  },
  {
    table: true,
    id: 'arb', name: 'ARBs', unit: 'mg/day',
    intro: 'Daily antihypertensive doses treated as equivalent, from the ABDA sartan table rescaled to losartan 50 mg. Half-lives are from each drug’s US label.',
    caution: 'Estimated equivalences for hypertension. Monitor after the switch. For heart failure, use the agent’s own target dose.',
    basis: 'A Cochrane review of 46 placebo-controlled trials (13,451 people, 9 ARBs) found no ARB better or worse at lowering blood pressure; a quarter of the maximum dose gave 60% to 70% of the effect and half gave about 80% (Heran 2008). Equivalences match doses by fraction of the maximum. Blood-pressure effect lasts about 24 h for all of them despite different half-lives.',
    basisRefs: ['heran2008Arb', 'abdaArb', 'arbLabels'],
    durationLabel: 'Elimination half-life',
    drugs: [
      { id: 'losartan', name: 'Losartan', equiv: 50, step: 25, dur: [6, 9], durClass: 'mid', durText: '2 h; active metabolite 6 to 9 h', detail: 'HF target 50 to 150 mg daily' },
      { id: 'valsartan', name: 'Valsartan', equiv: 80, step: 40, dur: [6, 6], durClass: 'mid', durText: '6 h', detail: 'HF target 160 mg BID' },
      { id: 'eprosartan', name: 'Eprosartan', equiv: 300, step: 200, dur: [5, 10], durClass: 'mid', durText: '5 to 10 h (Israili 2000 group range)', detail: 'No longer marketed in the US' },
      { id: 'candesartan', name: 'Candesartan', equiv: 8, step: 4, dur: [9, 9], durClass: 'mid', durText: '9 h', detail: 'HF target 32 mg daily' },
      { id: 'azilsartan', name: 'Azilsartan', equiv: 40, step: 40, dur: [11, 11], durClass: 'long', durText: '11 h' },
      { id: 'irbesartan', name: 'Irbesartan', equiv: [75, 150], step: 75, dur: [11, 15], durClass: 'long', durText: '11 to 15 h' },
      { id: 'olmesartan', name: 'Olmesartan', equiv: [10, 20], step: 5, dur: [13, 13], durClass: 'long', durText: '13 h' },
      { id: 'telmisartan', name: 'Telmisartan', equiv: 40, step: 20, dur: [24, 24], durClass: 'long', durText: '24 h' },
    ],
    refs: ['abdaArb', 'heran2008Arb', 'arbLabels', 'israili2000'], review: UNREVIEWED,
  },
  {
    table: true,
    id: 'ppi', name: 'PPIs', unit: 'mg',
    intro: 'Standard doses treated as equivalent (ABDA): omeprazole 20 mg = pantoprazole 40 mg. Other sources are shown where they differ.',
    caution: 'Acid-suppression potency studies give quite different numbers (for example pantoprazole 40 mg ≈ omeprazole 9 mg), and formularies differ on esomeprazole and dexlansoprazole. Doubling a standard dose is no more effective for most initial GERD treatment.',
    drugs: [
      { id: 'omeprazole', name: 'Omeprazole', equiv: 20, step: 10 },
      { id: 'esomeprazole', name: 'Esomeprazole', equiv: 20, step: 20, alt: [{ v: 12.5, src: 'potency' }] },
      { id: 'lansoprazole', name: 'Lansoprazole', equiv: 30, step: 15, alt: [{ v: 22, src: 'potency' }] },
      { id: 'pantoprazole', name: 'Pantoprazole', equiv: 40, step: 20, alt: [{ v: 87, src: 'potency' }] },
      { id: 'rabeprazole', name: 'Rabeprazole', equiv: 20, step: 10, alt: [{ v: 11, src: 'potency' }] },
      { id: 'dexlansoprazole', name: 'Dexlansoprazole', equiv: 60, step: 30, detail: 'ABDA notes this equivalence comes from manufacturer studies' },
    ],
    basis: 'Standard-dose equivalence comes from the doses used in healing trials and on labels. Direct patient data come from 24-hour intragastric pH studies: Kirchheiner 2009 pooled these to estimate potency relative to omeprazole, which gives the much lower numbers shown as “Acid-suppression potency.” Healing rates at standard doses are similar, which is why formularies swap standard doses one for one.',
    basisRefs: ['kirchheiner2009', 'grahamTansel2018', 'abdaPpi'],
    refs: ['abdaPpi', 'kirchheiner2009', 'grahamTansel2018'], review: UNREVIEWED,
  },
  {
    id: 'antipsychotic', name: 'Antipsychotics', unit: 'mg/day',
    intro: 'Oral daily doses treated as equivalent. Each method gives different results, so compare more than one.',
    caution: 'Equivalent doses are often inaccurate. They do not account for acuity, medical conditions, or prior exposure, and were developed for schizophrenia. They do not predict individual response.',
    methods: [{ id: 'ddd', label: 'WHO defined daily dose' }, { id: 'med', label: 'Minimum effective dose' }, { id: 'ed95', label: 'ED95 (near-maximal effect)' }, { id: 'icsad', label: 'ICSAD-2 expert consensus' }],
    drugs: [
      { id: 'olanzapine', name: 'Olanzapine', equivs: { ddd: 10, med: 10, ed95: 10, icsad: 10 } },
      { id: 'aripiprazole', name: 'Aripiprazole', equivs: { ddd: 15, med: 13.3, ed95: 6.5, icsad: 15 } },
      { id: 'asenapine', name: 'Asenapine', equivs: { ddd: 20, med: 13.3, ed95: 6.8, icsad: 10 } },
      { id: 'brexpiprazole', name: 'Brexpiprazole', equivs: { ddd: 3, ed95: 2.2, icsad: 2 } },
      { id: 'cariprazine', name: 'Cariprazine', equivs: { ddd: 3, ed95: 3.9, icsad: 3 } },
      { id: 'chlorpromazine', name: 'Chlorpromazine', equivs: { ddd: 300 } },
      { id: 'clozapine', name: 'Clozapine', equivs: { ddd: 300, med: 400, ed95: 361.3 } },
      { id: 'fluphenazine', name: 'Fluphenazine', equivs: { ddd: 10 } },
      { id: 'haloperidol', name: 'Haloperidol', equivs: { ddd: 8, med: 5.3, ed95: 7.9, icsad: 5 } },
      { id: 'iloperidone', name: 'Iloperidone', equivs: { ddd: 18, med: 10.7, ed95: 14.6 } },
      { id: 'loxapine', name: 'Loxapine', equivs: { ddd: 100 } },
      { id: 'lumateperone', name: 'Lumateperone', equivs: { ed95: 22.2, icsad: 21 } },
      { id: 'lurasidone', name: 'Lurasidone', equivs: { ddd: 60, med: 53.3, ed95: 132.2, icsad: 60 } },
      { id: 'paliperidone', name: 'Paliperidone', equivs: { ddd: 6, med: 4, ed95: 8.1, icsad: 6 } },
      { id: 'perphenazine', name: 'Perphenazine', equivs: { ddd: 30 } },
      { id: 'quetiapine', name: 'Quetiapine', equivs: { ddd: 400, med: 200, ed95: 650.6, icsad: 375 } },
      { id: 'risperidone', name: 'Risperidone', equivs: { ddd: 5, med: 2.7, ed95: 2.5, icsad: 3 } },
      { id: 'thiothixene', name: 'Thiothixene', equivs: { ddd: 30 } },
      { id: 'ziprasidone', name: 'Ziprasidone', equivs: { ddd: 80, med: 53.3, ed95: 189.9, icsad: 80 } },
    ],
    refs: ['aappAntipsychotic', 'whoDdd', 'leucht2014', 'leucht2020', 'gardner2010'], review: UNREVIEWED,
  },
  {
    table: true,
    id: 'loop', name: 'Loop diuretics', unit: 'mg',
    intro: 'Equivalent doses from Brater 1998: IV furosemide 40 mg, bumetanide 1 mg, and torsemide 20 mg, with oral furosemide at twice the IV dose.',
    caution: 'Oral furosemide absorption varies widely (10% to 100%); bumetanide and torsemide are 80% to 100% absorbed. Ethacrynic acid is not listed: there are no pharmacokinetic data to base an equivalence on (Brater 1998).',
    basis: 'Equivalence is based on natriuretic response in healthy volunteers and patients: IV furosemide 40 mg, bumetanide 1 mg, and torsemide 20 mg each give a near-maximal response in normal kidney function (Brater 1998). The oral furosemide figure reflects its average bioavailability of about 50%.',
    basisRefs: ['brater1998'],
    drugs: [
      { id: 'furosemide-po', name: 'Furosemide, oral', equiv: 80, step: 20 },
      { id: 'furosemide-iv', name: 'Furosemide, IV', equiv: 40, step: 10 },
      { id: 'bumetanide', name: 'Bumetanide, oral or IV', equiv: 1, step: 0.5 },
      { id: 'torsemide', name: 'Torsemide, oral or IV', equiv: 20, step: 5 },
    ],
    refs: ['brater1998'], review: UNREVIEWED,
  },
];

// Doses and intensity per the 2018 AHA/ACC multisociety guideline (Grundy 2018).
export const STATINS = [
  { id: 'atorvastatin', name: 'Atorvastatin', doses: { 10: 'moderate', 20: 'moderate', 40: 'high', 80: 'high' } },
  { id: 'rosuvastatin', name: 'Rosuvastatin', doses: { 5: 'moderate', 10: 'moderate', 20: 'high', 40: 'high' } },
  { id: 'simvastatin', name: 'Simvastatin', doses: { 10: 'low', 20: 'moderate', 40: 'moderate' } },
  { id: 'pravastatin', name: 'Pravastatin', doses: { 10: 'low', 20: 'low', 40: 'moderate', 80: 'moderate' } },
  { id: 'lovastatin', name: 'Lovastatin', doses: { 20: 'low', 40: 'moderate' } },
  { id: 'fluvastatin', name: 'Fluvastatin (XL for 80 mg)', doses: { 20: 'low', 40: 'low', 80: 'moderate' } },
  { id: 'pitavastatin', name: 'Pitavastatin', doses: { 1: 'low', 2: 'moderate', 4: 'moderate' } },
];

// ABDA equivalent doses: each lowers LDL-C by about 30% to 40%.
export const STATIN_EQUIV = { atorvastatin: 10, rosuvastatin: 5, simvastatin: 20, pravastatin: 40, lovastatin: 40, fluvastatin: 80, pitavastatin: 2 };

export const INTENSITY_LABEL = {
  high: 'High intensity: LDL-C lowered by 50% or more',
  moderate: 'Moderate intensity: LDL-C lowered by 30% to under 50%',
  low: 'Low intensity: LDL-C lowered by under 30%',
};

export const STATIN_ITEM = {
  id: 'statin', name: 'Statin intensity', refs: ['grundy2018', 'abdaStatin', 'law2003', 'jones2003'], review: UNREVIEWED,
  basis: 'Intensity groups and equivalents are defined by measured LDL-C lowering in patients. Law 2003 pooled 164 placebo-controlled trials to estimate the LDL-C reduction for each statin and dose. STELLAR (Jones 2003) compared rosuvastatin, atorvastatin, simvastatin, and pravastatin head to head across their doses for 6 weeks.',
  basisRefs: ['law2003', 'jones2003'],
};

export const BASAL_RULES = [
  { id: 'basal-basal', label: 'Long-acting analog to another (glargine U-100, detemir)', pct: [80, 80], src: 'ADA', note: 'ADA-approved switching guide: reduce by 20%.' },
  { id: 'deg-basal', label: 'Degludec (Tresiba) to glargine U-100 or detemir', pct: [80, 80], splitAbove: 80, src: 'ADA', note: 'ADA-approved switching guide: reduce by 20%. If the degludec dose is over 80 units, split the new insulin into two equal doses 12 h apart.' },
  { id: 'u300-u100', label: 'Glargine U-300 (Toujeo) to glargine U-100 (Lantus)', pct: [80, 80], splitAbove: 80, src: 'ADA', note: 'Reduce by 20% (Toujeo label and ADA-approved guide). Over 80 units: the Lantus SoloStar pen gives at most 80 units per injection (label), and Cardi-OH 2025 splits these doses 12 h apart. The ADA guide states the split rule only for degludec.' },
  { id: 'nph1-basal', label: 'NPH once daily to a long-acting analog', pct: [80, 80], src: 'ADA', note: 'ADA-approved guide: reduce by 20%. The glargine label allows the same dose when coming from once-daily NPH.' },
  { id: 'nph2-basal', label: 'NPH twice daily to a long-acting analog once daily', pct: [80, 80], src: 'ADA', note: 'Add up the daily NPH and give 80% once daily. The ADA-approved guide and the glargine label agree.' },
  { id: 'basal-nph', label: 'Long-acting analog to NPH', pct: [80, 80], alwaysSplit: true, src: 'ADA', note: 'ADA-approved guide: reduce by 20% and divide by meals; with two meals, give half with each.' },
  { id: 'once-u300', label: 'Once-daily basal to glargine U-300 (Toujeo)', pct: [100, 100], note: 'Toujeo label: start at the same dose; a higher dose is often needed to reach the same control. The ADA disaster guide uses an 80% start for any basal switch.' },
  { id: 'twice-u300', label: 'Twice-daily NPH or detemir to glargine U-300', pct: [80, 80], note: 'Label. Adjust no more often than every 3 to 4 days.' },
  { id: 'det-u100', label: 'Detemir to U-100 long-acting', pct: [80, 100], note: 'Same total daily dose, or 20% lower if hypoglycemia risk is high.' },
  { id: 'deg-inpt', label: 'Degludec to first-generation basal on admission, day 1', pct: [50, 50], note: 'Next day: 75% to 100% of the pre-admission dose, based on glucose. Check the timing of the last degludec dose.' },
];

export const INSULIN_ITEM = { id: 'insulin', name: 'Basal insulin conversion', refs: ['ddrc2022', 'ddrc2018', 'toujeoLabel', 'lantusLabel', 'springerInsulin', 'cardiohInsulin'], review: UNREVIEWED };

// Oral bioavailability from Hale 2018 (Table 1) where listed; dose pairs from the US labels.
export const IVPO = [
  { drug: 'Ciprofloxacin', iv: '400 mg q12h', po: '500 mg q12h', bio: '70%', note: 'Label: equivalent exposure' },
  { drug: 'Ciprofloxacin', iv: '400 mg q8h', po: '750 mg q12h', bio: '70%', note: 'Label: equivalent exposure' },
  { drug: 'Levofloxacin', iv: '500 to 750 mg q24h', po: 'Same dose', bio: '99%' },
  { drug: 'Moxifloxacin', iv: '400 mg q24h', po: 'Same dose', bio: '90%' },
  { drug: 'Linezolid', iv: '600 mg q12h', po: 'Same dose', bio: '99%' },
  { drug: 'TMP/SMX', iv: 'By TMP mg/kg', po: 'Same TMP dose', bio: '90%' },
  { drug: 'Doxycycline', iv: '100 mg q12h', po: 'Same dose', bio: '95%' },
  { drug: 'Minocycline', iv: '100 mg q12h', po: 'Same dose', bio: '95%' },
  { drug: 'Metronidazole', iv: '500 mg q8h', po: 'Same dose', bio: '90%' },
  { drug: 'Clindamycin', iv: '600 to 900 mg q8h', po: 'Lower oral doses; check the label', bio: '90%', note: 'Oral and IV label doses differ' },
  { drug: 'Fluconazole', iv: 'Any', po: 'Same daily dose', bio: 'Not in Hale 2018', note: 'Label: the daily dose is the same orally and IV' },
];

export const IVPO_EXCLUSIONS = [
  'Not hemodynamically stable, or still septic',
  'Cannot take or absorb oral drugs: vomiting, malabsorption, ileus, swallowing problems, no working enteral route',
  'Infection where IV therapy is preferred: endocarditis, CNS infection, undrained abscess, or source not controlled',
  'Organism and susceptibilities not known, or no suitable oral agent with good bioavailability',
];

export const IVPO_ITEM = { id: 'ivpo', name: 'IV to PO conversion', refs: ['hale2018', 'harvey2023', 'ciproLabel', 'fluconazoleLabel'], review: UNREVIEWED };

// Topical corticosteroid potency (US seven-class system, vasoconstrictor assay), as tabulated by Stacey and McEleney 2021.
export const TOPICAL_TIERS = [
  { id: 't1', label: 'Super high', classes: 'Class I', limit: 'Up to 3 weeks at a time', note: 'Not on the face, groin, or skin folds, under occlusion, or in children, except rarely and briefly.', drugs: [
    ['Betamethasone dipropionate, augmented', '0.05%', 'Ointment, lotion, gel'],
    ['Clobetasol propionate', '0.05%', 'Ointment, cream, lotion, gel, foam, solution, shampoo, spray'],
    ['Fluocinonide', '0.1%', 'Cream'],
    ['Flurandrenolide', '4 mcg/cm²', 'Tape'],
    ['Halobetasol propionate', '0.05%', 'Ointment, cream'],
  ] },
  { id: 't2', label: 'High', classes: 'Class II', limit: 'Up to 12 weeks at a time', note: 'Thick skin and severe disease; short courses on thin skin only.', drugs: [
    ['Amcinonide', '0.1%', 'Ointment, cream'],
    ['Betamethasone dipropionate', '0.05%', 'Ointment'],
    ['Betamethasone dipropionate, augmented', '0.05%', 'Cream'],
    ['Desoximetasone', '0.25%', 'Ointment, cream'],
    ['Desoximetasone', '0.05%', 'Gel'],
    ['Diflorasone diacetate', '0.05%', 'Ointment'],
    ['Fluocinonide', '0.05%', 'Ointment, cream, gel, solution'],
    ['Halcinonide', '0.1%', 'Ointment, cream, solution'],
  ] },
  { id: 't3', label: 'Medium', classes: 'Classes III to V', limit: 'Up to 12 weeks at a time', note: 'Most body sites. Face, groin, and folds: 1 to 2 week courses.', drugs: [
    ['Amcinonide', '0.1%', 'Lotion'],
    ['Betamethasone dipropionate', '0.05%', 'Cream, lotion'],
    ['Betamethasone valerate', '0.12%', 'Foam'],
    ['Betamethasone valerate', '0.1%', 'Ointment, cream, lotion'],
    ['Diflorasone diacetate', '0.05%', 'Cream'],
    ['Fluocinolone acetonide', '0.025%', 'Ointment, cream'],
    ['Flurandrenolide', '0.05%', 'Ointment, cream, lotion'],
    ['Fluticasone propionate', '0.05%', 'Cream, lotion'],
    ['Fluticasone propionate', '0.005%', 'Ointment'],
    ['Hydrocortisone butyrate', '0.1%', 'Ointment, cream, lotion, solution'],
    ['Hydrocortisone valerate', '0.2%', 'Ointment, cream'],
    ['Mometasone furoate', '0.1%', 'Ointment, cream, lotion, solution'],
    ['Triamcinolone acetonide', '0.5%', 'Ointment, cream'],
    ['Triamcinolone acetonide', '0.1%', 'Ointment, cream, lotion'],
    ['Triamcinolone acetonide', '0.147 mg/g', 'Spray'],
  ] },
  { id: 't4', label: 'Low', classes: 'Classes VI and VII', limit: 'No set limit', note: 'Face, groin, folds, and children.', drugs: [
    ['Alclometasone dipropionate', '0.05%', 'Ointment, cream'],
    ['Desonide', '0.05%', 'Ointment, cream, lotion, gel, foam'],
    ['Fluocinolone acetonide', '0.01%', 'Cream, solution, oil'],
    ['Hydrocortisone', '2.5%', 'Ointment, cream, lotion, solution'],
    ['Hydrocortisone', '1%', 'Ointment, cream, lotion, spray'],
    ['Triamcinolone acetonide', '0.025%', 'Ointment, cream, lotion'],
  ] },
];

export const TOPICAL_ITEM = {
  id: 'topical', name: 'Topical steroid potency', refs: ['stacey2021', 'mckenzie1962', 'cornell1985'], review: UNREVIEWED,
  basis: 'Classes come from the vasoconstrictor (skin-blanching) assay of McKenzie and Stoughton (1962), which correlated with clinical response in psoriasis (Cornell 1985). Stacey and McEleney note that the evidence linking assay strength to effect or harm is from small, nonrandomized trials. The same molecule can sit in different classes by strength and vehicle; ointments are usually stronger than creams.',
  basisRefs: ['mckenzie1962', 'cornell1985', 'stacey2021'],
};

export const CONVERSION_ITEMS = [OPIOID_ITEM, ...RATIO_TABLES, STATIN_ITEM, INSULIN_ITEM, IVPO_ITEM, TOPICAL_ITEM];
