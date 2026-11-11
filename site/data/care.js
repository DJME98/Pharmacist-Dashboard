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
    id: 'anaphylaxis', name: 'Anaphylaxis', review: UNREVIEWED, refs: ['golden2023', 'neffyLabel', 'rcuk2021'],
    intro: 'Give IM epinephrine first. Antihistamines and steroids do not replace it.',
    doses: [
      { id: 'epi-im', name: 'Epinephrine 1 mg/mL', route: 'IM, mid-outer thigh', lines: [
        { label: 'Weight-based', perKg: 0.01, unit: 'mg', max: 0.5 },
        { label: 'Children and teenagers, maximum', text: '0.3 mg' },
        { label: 'Adults, maximum', text: '0.5 mg' },
      ], note: 'Autoinjectors (FDA): 0.1 mg at 7.5 to 15 kg, 0.15 mg at 15 to 30 kg, 0.3 mg at 30 kg or more. The practice parameter supports switching to 0.3 mg at 25 kg.' },
      { id: 'epi-in', name: 'Epinephrine nasal spray (neffy)', route: 'One spray in one nostril', lines: [{ label: '30 kg or more', text: '2 mg' }, { label: '15 to under 30 kg', text: '1 mg' }, { label: 'Repeat', text: 'Same nostril, starting 5 min after the first dose' }] },
      { id: 'epi-infusion', name: 'Epinephrine infusion, refractory anaphylaxis', route: 'IV, 1 mg in 100 mL NS (10 mcg/mL)', lines: [{ label: 'Start, low', perKg: 0.5, unit: 'mL/h' }, { label: 'Start, high', perKg: 1, unit: 'mL/h' }, { label: 'Then', text: 'Titrate to response' }], note: 'Adults and children (Resuscitation Council UK 2021). Equals about 0.08 to 0.17 mcg/kg/min. IV boluses are not recommended outside specialist settings. In patients on beta-blockers, consider glucagon; neither guideline gives a dose.' },
    ],
  },
];

export const DRIP_ITEM = { id: 'drip', name: 'Drip rate calculator', refs: ['arithmetic'], review: UNREVIEWED };
export const CARE_ITEMS = [...CARE_SECTIONS, DRIP_ITEM];
