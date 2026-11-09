// Critical care reference. Doses use the same line format as data/resus.js.
const UNREVIEWED = { status: 'unverified', by: null, date: null };

export const CARE_SECTIONS = [
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
