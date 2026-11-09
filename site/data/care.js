// Critical care reference. Doses use the same line format as data/resus.js.
const UNREVIEWED = { status: 'unverified', by: null, date: null };

export const CARE_SECTIONS = [
  {
    id: 'rsi', name: 'RSI', review: UNREVIEWED, refs: ['ucsfRsi', 'vumcRsi'],
    intro: 'Adult doses. The two sources differ, so the wider published range is shown. Reduce induction doses in shock or hypovolemia.',
    doses: [
      { id: 'etomidate', name: 'Etomidate', route: 'Induction, IV', lines: [{ label: 'Dose', perKg: 0.3, unit: 'mg' }], note: 'Minimal hypotension; adrenal suppression. Vanderbilt lowers the dose in sepsis, hypovolemia, or expected pressor need.' },
      { id: 'ketamine', name: 'Ketamine', route: 'Induction, IV', lines: [{ label: 'Dose', range: [1, 2], unit: 'mg' }], note: 'Hypotension or bradycardia can occur in heart failure.' },
      { id: 'propofol', name: 'Propofol', route: 'Induction, IV', lines: [{ label: 'Dose', range: [0.5, 2], unit: 'mg' }], note: 'Dose-related hypotension, especially in older, hypovolemic, or septic patients.' },
      { id: 'roc', name: 'Rocuronium', route: 'Paralytic, IV', lines: [{ label: 'Dose', range: [0.6, 1.2], unit: 'mg' }], note: 'UCSF uses ideal body weight: enter that weight above for this drug. Long duration.' },
      { id: 'sux', name: 'Succinylcholine', route: 'Paralytic, IV', lines: [{ label: 'Dose', range: [0.6, 1.5], unit: 'mg' }], note: 'Vanderbilt uses 1.5 to 2 mg/kg. Avoid in hyperkalemia, rhabdomyolysis, burns, neuromuscular disease, ESRD, or malignant hyperthermia history.' },
      { id: 'fent', name: 'Fentanyl', route: 'Analgesia, IV push', lines: [{ label: 'Dose', text: '25 to 100 mcg' }], note: 'Paralytics provide no sedation or analgesia.' },
      { id: 'phenyl-push', name: 'Phenylephrine, push dose', route: 'IV', lines: [{ label: 'Dose', text: '100 mcg' }], note: 'Can cause reflex bradycardia. Avoid if heart rate is below 60.' },
      { id: 'ephedrine', name: 'Ephedrine', route: 'IV', lines: [{ label: 'Dose', text: '5 to 10 mg' }], note: 'Preferred with hypotension and bradycardia or low-normal heart rate.' },
    ],
  },
  {
    id: 'pressors', name: 'Vasopressors', review: UNREVIEWED, refs: ['nychhcPressors', 'cooperPressors'],
    intro: 'Adult ranges from two teaching references, which differ. Your institution’s concentrations and limits may differ.',
    doses: [
      { id: 'norepi', name: 'Norepinephrine', route: 'IV infusion', lines: [{ label: 'Rate', range: [0.05, 0.5], unit: 'mcg/min' }, { label: 'Fixed-rate range', text: '2 to 30 mcg/min' }], note: 'Cooper lists about 40 mcg/min as the usual upper amount, with no true cap.' },
      { id: 'epi', name: 'Epinephrine', route: 'IV infusion', lines: [{ label: 'Rate', range: [0.01, 0.5], unit: 'mcg/min' }, { label: 'Fixed-rate range', text: '1 to 20 mcg/min' }] },
      { id: 'phenyl', name: 'Phenylephrine', route: 'IV infusion', lines: [{ label: 'Rate', text: '20 to 200 mcg/min' }, { label: 'Bolus', text: '100 to 200 mcg every 3 to 5 min' }] },
      { id: 'vaso', name: 'Vasopressin', route: 'IV infusion', lines: [{ label: 'Rate', text: '0.03 units/min' }], note: 'Cooper lists 0.01 to 0.03 units/min.' },
      { id: 'dopa', name: 'Dopamine', route: 'IV infusion', lines: [{ label: 'Rate', range: [2.5, 20], unit: 'mcg/min' }], note: 'Effects change with dose.' },
      { id: 'dobut', name: 'Dobutamine', route: 'IV infusion', lines: [{ label: 'Rate', range: [2.5, 20], unit: 'mcg/min' }], note: 'Usual inotropic range is 5 to 10 mcg/kg/min.' },
      { id: 'milri', name: 'Milrinone', route: 'IV', lines: [{ label: 'Load over 10 min', perKg: 50, unit: 'mcg' }, { label: 'Infusion', range: [0.375, 0.75], unit: 'mcg/min' }], note: 'Adjust for renal dysfunction.' },
      { id: 'iso', name: 'Isoproterenol', route: 'IV infusion', lines: [{ label: 'Rate', text: '1 to 10 mcg/min' }] },
    ],
  },
  {
    id: 'antidotes', name: 'Antidotes', review: UNREVIEWED, refs: ['aha2023Tox', 'missouriNac', 'drugsFomepizole'],
    intro: 'Pediatric doses should not exceed adult doses. Most need repeating and titrating. Call a poison center or toxicologist: 1-800-222-1222 in the US. Anticoagulant reversal is not included yet.',
    doses: [
      { id: 'nac', name: 'Acetylcysteine (acetaminophen)', route: 'IV, 3-bag regimen', lines: [{ label: 'Bag 1, over 1 h', perKg: 150, unit: 'mg' }, { label: 'Bag 2, over 4 h', perKg: 50, unit: 'mg' }, { label: 'Bag 3, over 16 h', perKg: 100, unit: 'mg' }], note: 'Most effective within 8 h of ingestion. Institutions may use other regimens; use one consistently.' },
      { id: 'fomepizole', name: 'Fomepizole (methanol, ethylene glycol)', route: 'IV over 30 min', lines: [{ label: 'Load', perKg: 15, unit: 'mg' }, { label: 'Next 4 doses, every 12 h', perKg: 10, unit: 'mg' }, { label: 'Then every 12 h', perKg: 15, unit: 'mg' }], note: 'Dosing changes during hemodialysis: every 4 h or 1 to 1.5 mg/kg/h. Not FDA-approved in children.' },
      { id: 'atropine-tox', name: 'Atropine (organophosphates, carbamates)', route: 'IV/IO', lines: [{ label: 'Adult', text: '1 to 2 mg, doubled every 5 min' }, { label: 'Pediatric', perKg: 0.02, unit: 'mg' }, { label: 'Infusion', text: '10% to 20% of the loading dose per hour; adult max 2 mg/h' }], note: 'Titrate to drying of secretions, bronchospasm, and heart rate.' },
      { id: 'pralidoxime', name: 'Pralidoxime (organophosphates)', route: 'IV over 15 to 30 min', lines: [{ label: 'Adult', text: '2 g, or 0.6 g IM up to 3 doses' }, { label: 'Pediatric', range: [20, 50], unit: 'mg' }, { label: 'Pediatric infusion', range: [10, 20], unit: 'mg/h' }, { label: 'Adult infusion', text: '1 g/h' }] },
      { id: 'cacl', name: 'Calcium chloride (beta blocker, CCB)', route: 'IV/IO, central preferred', lines: [{ label: 'Adult', text: '2000 mg' }, { label: 'Pediatric', perKg: 20, unit: 'mg' }, { label: 'Infusion', range: [20, 40], unit: 'mg/h' }] },
      { id: 'cagluc', name: 'Calcium gluconate (beta blocker, CCB)', route: 'IV/IO', lines: [{ label: 'Adult', text: '6000 mg' }, { label: 'Pediatric', perKg: 60, unit: 'mg' }, { label: 'Infusion', range: [60, 120], unit: 'mg/h' }] },
      { id: 'glucagon', name: 'Glucagon (beta blocker, CCB)', route: 'IV/IO', lines: [{ label: 'Adult', text: '2 to 10 mg' }, { label: 'Pediatric', range: [0.05, 0.15], unit: 'mg' }, { label: 'Adult infusion', text: '1 to 15 mg/h' }], note: 'Anticipate vomiting.' },
      { id: 'hdi', name: 'High-dose insulin (beta blocker, CCB)', route: 'IV/IO, regular', lines: [{ label: 'Bolus', perKg: 1, unit: 'units' }, { label: 'Infusion', range: [1, 10], unit: 'units/h' }], note: 'Monitor glucose, potassium, and fluid status.' },
      { id: 'digifab', name: 'Digoxin immune Fab', route: 'IV/IO', lines: [{ label: 'Acute', text: '1 vial per 0.5 mg ingested' }, { label: 'Chronic', text: 'Vials = serum digoxin (ng/mL) × kg ÷ 100' }, { label: 'Critically ill, unknown dose', text: '10 to 20 vials' }, { label: 'Other cardioactive steroids', text: '30 vials' }] },
      { id: 'flumazenil', name: 'Flumazenil (benzodiazepines)', route: 'IV/IO', lines: [{ label: 'Adult', text: '0.2 mg, titrated up to 1 mg' }, { label: 'Pediatric', perKg: 0.01, unit: 'mg' }], note: 'Many contraindications.' },
      { id: 'hydroxo', name: 'Hydroxocobalamin (cyanide)', route: 'IV/IO', lines: [{ label: 'Adult', text: '5 g' }, { label: 'Pediatric', perKg: 70, unit: 'mg', max: 5000 }], note: 'Repeat doses may be needed.' },
      { id: 'nitrite', name: 'Sodium nitrite (cyanide)', route: 'IV/IO', lines: [{ label: 'Adult', text: '300 mg' }, { label: 'Pediatric', perKg: 6, unit: 'mg', max: 300 }], note: 'Watch for hypotension.' },
      { id: 'thio', name: 'Sodium thiosulfate (cyanide)', route: 'IV/IO', lines: [{ label: 'Adult', text: '12.5 g' }, { label: 'Pediatric', perKg: 250, unit: 'mg', max: 12500 }] },
      { id: 'lipid', name: 'Lipid emulsion 20% (local anesthetics)', route: 'IV/IO', lines: [{ label: 'Under 70 kg, bolus', perKg: 1.5, unit: 'mL' }, { label: 'Under 70 kg, infusion up to 30 min', perKg: 0.25, unit: 'mL/min' }, { label: '70 kg or more, bolus', text: '100 mL over 2 to 3 min' }, { label: '70 kg or more, infusion', text: '200 to 250 mL over 15 to 20 min' }] },
      { id: 'methylene', name: 'Methylene blue (methemoglobinemia)', route: 'IV/IO', lines: [{ label: 'Dose', range: [1, 2], unit: 'mg' }, { label: 'Limit', range: [5, 7], unit: 'mg' }], note: 'Repeat hourly if needed.' },
      { id: 'naloxone-tox', name: 'Naloxone (opioids)', route: 'IV/IO/IM', lines: [{ label: 'Adult', text: '0.2 to 2 mg every 2 to 3 min; or 2 to 4 mg intranasal' }, { label: 'Pediatric', perKg: 0.1, unit: 'mg', max: 2 }, { label: 'Infusion', text: 'Two-thirds of the waking dose per hour' }], note: 'Titrate to breathing and airway reflexes.' },
      { id: 'bicarb-tox', name: 'Sodium bicarbonate (sodium channel blockers)', route: 'IV/IO', lines: [{ label: 'Adult', text: '50 to 150 mEq' }, { label: 'Pediatric', range: [1, 3], unit: 'mEq' }, { label: 'Infusion of 150 mEq/L', range: [1, 3], unit: 'mL/h' }] },
    ],
  },
  {
    id: 'hyperk', name: 'Hyperkalemia', review: UNREVIEWED, refs: ['gpnotebookK', 'ukka2023'],
    intro: 'Adult doses as listed in a UK summary, with UK fluid concentrations. Check against your local protocol.',
    steps: [
      'Treat urgently for K over 6.5, or K over 6.0 with ECG changes.',
      'Protect the heart if ECG changes are present.',
      'Shift potassium into cells with insulin-glucose, with or without salbutamol.',
      'Remove potassium and treat the cause. Monitor glucose frequently after insulin.',
    ],
    doses: [
      { id: 'k-cacl', name: 'Calcium chloride 10%', route: 'IV over 5 to 10 min', lines: [{ label: 'Dose', text: '10 mL' }], note: 'Repeat if ECG changes persist at 5 min. Works in 1 to 3 min, lasts 30 to 60 min. Caution with digoxin.' },
      { id: 'k-cagluc', name: 'Calcium gluconate 10%', route: 'IV over 5 to 10 min', lines: [{ label: 'Dose', text: '30 mL' }] },
      { id: 'k-insulin', name: 'Insulin-glucose', route: 'IV', lines: [{ label: 'Dose', text: '10 units soluble insulin in 25 g glucose' }], note: 'Onset within 20 min, peak 30 to 60 min, lasts up to 6 h.' },
      { id: 'k-salb', name: 'Salbutamol (albuterol)', route: 'Nebulized', lines: [{ label: 'Dose', text: '10 to 20 mg' }], note: 'Not as monotherapy (UK Kidney Association).' },
      { id: 'k-bicarb', name: 'Sodium bicarbonate 1.26%', route: 'IV over 60 min', lines: [{ label: 'Dose', text: '500 mL (75 mmol)' }], note: 'Benefit uncertain, and routine use is controversial.' },
    ],
  },
  {
    id: 'status', name: 'Status epilepticus', review: UNREVIEWED, refs: ['enls2024'],
    intro: 'Per Emergency Neurological Life Support, version 6.0.',
    steps: [
      'Emergent: benzodiazepine now. Repeat lorazepam once after 3 to 5 min if ineffective.',
      'Urgent: after 10 to 20 min of adequate benzodiazepine, choose one second-line drug.',
      'Refractory: intubate, start a continuous infusion and continuous EEG, and continue the second-line drug.',
    ],
    doses: [
      { id: 'lorazepam', name: 'Lorazepam', route: 'Emergent, IV over 2 min', lines: [{ label: 'Dose', perKg: 0.1, unit: 'mg', max: 4 }] },
      { id: 'midaz-im', name: 'Midazolam, adult', route: 'Emergent, IM', lines: [{ label: 'Dose', text: '10 mg' }] },
      { id: 'midaz-in', name: 'Midazolam, child', route: 'Emergent, intranasal', lines: [{ label: 'Dose', perKg: 0.2, unit: 'mg', max: 10 }] },
      { id: 'diaz', name: 'Diazepam', route: 'Emergent, IV', lines: [{ label: 'Dose', perKg: 0.15, unit: 'mg', max: 10 }] },
      { id: 'fospheny', name: 'Fosphenytoin', route: 'Urgent, IV, up to 150 mg/min', lines: [{ label: 'Dose', perKg: 20, unit: 'mg', max: 1500 }], note: 'Dosed in phenytoin equivalents.' },
      { id: 'pheny', name: 'Phenytoin, adult', route: 'Urgent, IV, up to 50 mg/min', lines: [{ label: 'Dose', perKg: 20, unit: 'mg', max: 1500 }] },
      { id: 'vpa', name: 'Valproate', route: 'Urgent, IV over 10 min', lines: [{ label: 'Dose', perKg: 40, unit: 'mg', max: 3000 }] },
      { id: 'lev', name: 'Levetiracetam', route: 'Urgent, IV', lines: [{ label: 'Dose', perKg: 60, unit: 'mg', max: 4500 }] },
      { id: 'pb-urgent', name: 'Phenobarbital, child', route: 'Urgent, IV', lines: [{ label: 'Dose', perKg: 40, unit: 'mg', max: 1000 }] },
      { id: 'midaz-inf', name: 'Midazolam infusion, adult', route: 'Refractory, IV', lines: [{ label: 'Bolus, repeat every 5 min', perKg: 0.2, unit: 'mg' }, { label: 'Total load limit', perKg: 2, unit: 'mg' }, { label: 'Start', perKg: 0.1, unit: 'mg/h' }, { label: 'Maintenance', range: [0.05, 2], unit: 'mg/h' }] },
      { id: 'prop-inf', name: 'Propofol infusion, adult', route: 'Refractory, IV', lines: [{ label: 'Bolus, repeat every 3 to 5 min', range: [1, 2], unit: 'mg' }, { label: 'Total load limit', perKg: 10, unit: 'mg' }, { label: 'Start', perKg: 20, unit: 'mcg/min' }, { label: 'Maintenance', range: [30, 200], unit: 'mcg/min' }], note: 'Special consideration in children with suspected mitochondrial disorders.' },
      { id: 'midaz-inf-peds', name: 'Midazolam infusion, child', route: 'Refractory, IV', lines: [{ label: 'Bolus', range: [0.1, 0.2], unit: 'mg' }, { label: 'Start', range: [0.1, 0.2], unit: 'mg/h' }, { label: 'Up to', perKg: 1, unit: 'mg/h' }] },
      { id: 'pb-refract', name: 'Phenobarbital, child', route: 'Refractory, IV at 1 mg/kg/min', lines: [{ label: 'Dose', perKg: 20, unit: 'mg' }] },
    ],
  },
  {
    id: 'anaphylaxis', name: 'Anaphylaxis', review: UNREVIEWED, refs: ['msdAnaphylaxis', 'cmajEpi'],
    intro: 'Give IM epinephrine first. Antihistamines and steroids do not replace it.',
    doses: [
      { id: 'epi-im', name: 'Epinephrine 1 mg/mL', route: 'IM, mid-outer thigh', lines: [
        { label: 'Weight-based', perKg: 0.01, unit: 'mg', max: 0.5 },
        { label: 'Adult', text: '0.3 to 0.5 mg' },
        { label: 'Repeat', text: 'Every 5 to 15 min' },
      ], note: 'CMAJ caps prepubertal children at 0.3 mg and adolescents at 0.5 mg. Autoinjectors: 0.15 mg at 15 to 30 kg; 0.3 mg over 30 kg.' },
      { id: 'epi-in', name: 'Epinephrine, intranasal', route: 'One spray', lines: [{ label: '30 kg or more', text: '2 mg' }, { label: '15 to under 30 kg, age 4 or older', text: '1 mg' }, { label: 'Repeat', text: 'Same nostril after 5 min if needed' }] },
      { id: 'epi-infusion', name: 'Epinephrine infusion', route: 'IV, 4 mcg/mL', lines: [{ label: 'Start', perKg: 0.1, unit: 'mcg/min' }, { label: 'Titrate', perKg: 0.05, unit: 'mcg/min' }, { label: 'If weight unknown', text: '1 to 2 mcg/min, then increase by 2 to 4 mcg/min every 2 to 3 min' }], note: 'The titration step is applied every 2 to 3 min.' },
      { id: 'epi-iv', name: 'Epinephrine IV bolus, adult', route: 'IV over 1 to 2 min, 0.1 mg/mL', lines: [{ label: 'Dose', text: '0.05 to 0.1 mg (0.5 to 1 mL)' }] },
      { id: 'glucagon-ana', name: 'Glucagon (on beta blockers)', route: 'IV over 5 min', lines: [{ label: 'Adult', text: '1 to 5 mg' }, { label: 'Pediatric', range: [20, 30], unit: 'mcg' }, { label: 'Infusion', text: '5 to 15 mcg/min' }] },
    ],
  },
];

export const DRIP_ITEM = { id: 'drip', name: 'Drip rate calculator', refs: ['arithmetic'], review: UNREVIEWED };
export const CARE_ITEMS = [...CARE_SECTIONS, DRIP_ITEM];
