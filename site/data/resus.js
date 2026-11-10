// ACLS and PALS content. Algorithms are written in this app's own words and layout.
// Set `review` to { status: 'verified', by, date } after pharmacist sign-off.
const UNREVIEWED = { status: 'unverified', by: null, date: null };

const dose = (fields) => ({ review: UNREVIEWED, ...fields });

const A = ['ahaAclsCa', 'aha25Part9'];
const AB = ['ahaAclsBrady', 'aha25Part9'];
const AT = ['ahaAclsTachy', 'ahaAclsTachyText', 'aha25Part9'];
const P = ['ahaPalsCa', 'aha25Part8'];

export const ADULT_DOSES = [
  dose({ id: 'a-epi', group: 'Cardiac arrest', name: 'Epinephrine', route: 'IV/IO push', refs: A,
    lines: [{ label: 'Dose', text: '1 mg every 3 to 5 min' }],
    note: 'Give as soon as feasible for nonshockable rhythms, and after initial defibrillation attempts fail for shockable rhythms.' }),
  dose({ id: 'a-amio', group: 'Cardiac arrest', name: 'Amiodarone', route: 'IV/IO push (bolus)', refs: A,
    lines: [{ label: 'First dose', text: '300 mg bolus' }, { label: 'Second dose', text: '150 mg' }],
    note: 'For refractory VF/pVT.' }),
  dose({ id: 'a-lido', group: 'Cardiac arrest', name: 'Lidocaine', route: 'IV/IO push', refs: [...A, 'msdResus'], weightBased: true,
    lines: [
      { label: 'First dose', range: [1, 1.5], unit: 'mg' },
      { label: 'Second dose', range: [0.5, 0.75], unit: 'mg' },
      { label: 'Total limit', perKg: 3, unit: 'mg' },
    ],
    note: 'Alternative to amiodarone for refractory VF/pVT. The 3 mg/kg limit comes from the MSD Manual, not the AHA algorithm.' }),
  dose({ id: 'a-shock', group: 'Cardiac arrest', name: 'Defibrillation', route: 'Unsynchronized shock', refs: A,
    lines: [
      { label: 'Biphasic', text: 'Device recommendation (e.g., 120 to 200 J); if unknown, maximum available' },
      { label: 'Later shocks', text: 'Equivalent; higher doses may be considered' },
      { label: 'Monophasic', text: '360 J' },
    ] }),
  dose({ id: 'a-atropine', group: 'Bradycardia', name: 'Atropine', route: 'IV push', refs: AB,
    lines: [{ label: 'Dose', text: '1 mg every 3 to 5 min' }, { label: 'Total limit', text: '3 mg' }] }),
  dose({ id: 'a-dopamine', group: 'Bradycardia', name: 'Dopamine infusion', route: 'Continuous IV infusion', refs: AB, weightBased: true,
    lines: [{ label: 'Rate', range: [5, 20], unit: 'mcg/min' }], note: 'Titrate to response and taper slowly.' }),
  dose({ id: 'a-epi-inf', group: 'Bradycardia', name: 'Epinephrine infusion', route: 'Continuous IV infusion', refs: AB,
    lines: [{ label: 'Rate', text: '2 to 10 mcg/min' }], note: 'Titrate to response.' }),
  dose({ id: 'a-adenosine', group: 'Tachycardia', name: 'Adenosine', route: 'Rapid IV push, then rapid NS flush', refs: AT,
    lines: [{ label: 'First dose', text: '6 mg' }, { label: 'Second dose', text: '12 mg if required' }],
    note: 'Regular rhythm only; for wide-QRS, regular and monomorphic only. Do not give for unstable, irregularly irregular, or polymorphic wide-complex tachycardia. 1 mg may be adequate with a central line or after heart transplant.' }),
  dose({ id: 'a-amio-vt', group: 'Tachycardia', name: 'Amiodarone (VT with a pulse)', route: 'IV infusion over 10 min, then continuous infusion', refs: AT,
    lines: [{ label: 'Load', text: '150 mg over 10 min; repeat as needed if VT recurs' }, { label: 'Maintenance', text: '1 mg/min for the first 6 h' }] }),
  dose({ id: 'a-procainamide', group: 'Tachycardia', name: 'Procainamide', route: 'IV infusion at 20 to 50 mg/min', refs: AT, weightBased: true,
    lines: [
      { label: 'Load', text: '20 to 50 mg/min' },
      { label: 'Stop at', perKg: 17, unit: 'mg' },
      { label: 'Maintenance', text: '1 to 4 mg/min' },
    ],
    note: 'Stop the load if the arrhythmia is suppressed, hypotension occurs, QRS widens by more than 50%, or the maximum is reached. Avoid with prolonged QT or CHF.' }),
  dose({ id: 'a-cardiovert', group: 'Tachycardia', name: 'Synchronized cardioversion', route: 'Synchronized shock; sedate when feasible', refs: ['aha25Part9', 'ahaAclsTachy'],
    lines: [
      { label: 'Atrial fibrillation', text: 'At least 200 J; increase if it fails' },
      { label: 'Atrial flutter', text: '200 J; increase if it fails' },
      { label: 'Other rhythms', text: 'Device recommendation; if unknown, maximum setting' },
      { label: 'Sustained polymorphic VT', text: 'Immediate unsynchronized shock at maximum setting' },
    ] }),
];

export const PEDS_DOSES = [
  dose({ id: 'p-epi', group: 'Cardiac arrest', name: 'Epinephrine', route: 'IV/IO push', refs: [...P, 'ahaPalsBrady'],
    lines: [
      { label: 'Dose', perKg: 0.01, unit: 'mg', max: 1 },
      { label: 'Volume of 0.1 mg/mL', perKg: 0.1, unit: 'mL', max: 10 },
      { label: 'Repeat', text: 'Every 3 to 5 min' },
    ],
    note: 'Nonshockable: first dose as early as possible. Shockable: may be reasonable after 2 defibrillation attempts.' }),
  dose({ id: 'p-epi-et', group: 'Cardiac arrest', name: 'Epinephrine, endotracheal', route: 'Endotracheal; flush with 5 mL NS, then 5 breaths', refs: ['rileyResus', 'aha25Part8'],
    lines: [
      { label: 'Dose', perKg: 0.1, unit: 'mg', max: 2.5 },
      { label: 'Volume of 1 mg/mL', perKg: 0.1, unit: 'mL', max: 2.5 },
    ],
    note: 'IV or IO is preferred. Source cites the 2015 AHA handbook. Flush with 5 mL NS and give 5 ventilations.' }),
  dose({ id: 'p-amio', group: 'Cardiac arrest', name: 'Amiodarone', route: 'IV/IO push (bolus)', refs: P,
    lines: [
      { label: 'First dose', perKg: 5, unit: 'mg', max: 300 },
      { label: 'Later doses', perKg: 5, unit: 'mg', max: 150 },
      { label: 'Limit', text: 'Up to 3 doses' },
    ],
    note: 'For refractory VF/pVT.' }),
  dose({ id: 'p-lido', group: 'Cardiac arrest', name: 'Lidocaine', route: 'IV/IO push', refs: P,
    lines: [{ label: 'Dose', perKg: 1, unit: 'mg' }], note: 'Alternative to amiodarone. The algorithm lists no maximum.' }),
  dose({ id: 'p-shock', group: 'Cardiac arrest', name: 'Defibrillation', route: 'Unsynchronized shock', refs: P,
    lines: [
      { label: 'First shock', perKg: 2, unit: 'J' },
      { label: 'Second shock', perKg: 4, unit: 'J' },
      { label: 'Later shocks', range: [4, 10], unit: 'J' },
    ],
    note: 'Never exceed 10 J/kg or the adult dose.' }),
  dose({ id: 'p-atropine', group: 'Bradycardia', name: 'Atropine', route: 'IV/IO push', refs: ['ahaPalsBrady', 'aha25Part8'],
    lines: [{ label: 'Dose', perKg: 0.02, unit: 'mg', max: 0.5, min: 0.1 }, { label: 'Repeat', text: 'May repeat once' }],
    note: 'For increased vagal tone or primary AV block.' }),
  dose({ id: 'p-adenosine', group: 'Tachycardia', name: 'Adenosine', route: 'Rapid IV/IO push, then 5 to 10 mL NS flush', refs: ['redcrossPalsTachy', 'rileyResus', 'aha25Part8'],
    lines: [
      { label: 'First dose', perKg: 0.1, unit: 'mg', max: 6 },
      { label: 'Second dose', perKg: 0.2, unit: 'mg', max: 12 },
    ] }),
  dose({ id: 'p-cardiovert', group: 'Tachycardia', name: 'Synchronized cardioversion', route: 'Synchronized shock; sedate if it does not delay care', refs: ['aha25Part8', 'redcrossPalsTachy'],
    lines: [
      { label: 'First shock', range: [0.5, 1], unit: 'J' },
      { label: 'If ineffective', perKg: 2, unit: 'J' },
    ] }),
  dose({ id: 'p-amio-vt', group: 'Tachycardia', name: 'Amiodarone (with a pulse)', route: 'IV infusion over 20 to 60 min', refs: ['msdResus', 'rileyResus', 'aha25Part8'],
    lines: [
      { label: 'Dose', perKg: 5, unit: 'mg', max: 300 },
      { label: 'Daily limit', perKg: 15, unit: 'mg' },
    ],
    note: 'May repeat twice. Get expert consultation before use. Use caution with other QT-prolonging drugs.' }),
  dose({ id: 'p-procainamide', group: 'Tachycardia', name: 'Procainamide', route: 'IV infusion over 30 to 60 min', refs: ['msdResus', 'rileyResus', 'jefferyPalsTachy', 'aha25Part8'],
    lines: [{ label: 'Dose', perKg: 15, unit: 'mg' }],
    note: 'Not typically given together with amiodarone. Use caution with other QT-prolonging drugs.' }),
  dose({ id: 'p-calcium', group: 'Other', name: 'Calcium chloride 10%', route: 'Slow IV/IO push', refs: ['rileyResus', 'msdResus', 'aha25Part8'],
    lines: [{ label: 'Dose', perKg: 20, unit: 'mg', max: 2000 }, { label: 'Volume', perKg: 0.2, unit: 'mL', max: 20 }],
    note: 'Not routine in arrest. Reserved for special circumstances such as hypocalcemia, calcium channel blocker overdose, or hyperkalemia.' }),
  dose({ id: 'p-calcium-gluc', group: 'Other', name: 'Calcium gluconate', route: 'Slow IV/IO', refs: ['msdResus', 'aha25Part8'],
    lines: [{ label: 'Dose', perKg: 30, unit: 'mg' }], note: 'Not routine in arrest. The source lists no maximum.' }),
  dose({ id: 'p-bicarb', group: 'Other', name: 'Sodium bicarbonate', route: 'Slow IV/IO push', refs: ['rileyResus', 'msdResus', 'aha25Part8'],
    lines: [{ label: 'Dose', perKg: 1, unit: 'mEq' }],
    note: 'Not routine in arrest. Special circumstances include sodium channel blocker toxicity and hyperkalemia. Give after adequate ventilation.' }),
  dose({ id: 'p-glucose', group: 'Other', name: 'Glucose', route: 'IV/IO push', refs: ['rileyResus', 'msdResus'],
    lines: [
      { label: 'Dose', range: [0.5, 1], unit: 'g' },
      { label: 'D10W, newborns', range: [5, 10], unit: 'mL' },
      { label: 'D25W, infants and children', range: [2, 4], unit: 'mL' },
      { label: 'D50W, adolescents', range: [1, 2], unit: 'mL' },
    ],
    note: 'For documented hypoglycemia. Avoid high concentrations in infants and young children.' }),
  dose({ id: 'p-mag', group: 'Other', name: 'Magnesium sulfate', route: 'IV/IO infusion over 10 to 20 min; faster for torsades', refs: ['rileyResus', 'msdResus'],
    lines: [{ label: 'Dose', range: [25, 50], unit: 'mg', max: 2000 }], note: 'Give faster for torsades de pointes.' }),
  dose({ id: 'p-naloxone', group: 'Other', name: 'Naloxone', route: 'IV/IO push; IM or ETT if no access', refs: ['rileyResus', 'msdResus'],
    lines: [
      { label: 'Under 20 kg and under 5 y', perKg: 0.1, unit: 'mg', max: 2 },
      { label: '20 kg or more, or 5 y or older', text: '2 mg' },
      { label: 'Opioid respiratory depression from therapeutic use', range: [0.001, 0.005], unit: 'mg' },
    ],
    note: 'Titrate the low dose to effect.' }),
  dose({ id: 'p-epi-inf', group: 'Infusions', name: 'Epinephrine', route: 'Continuous IV/IO infusion', refs: ['msdResus'],
    lines: [{ label: 'Rate', range: [0.1, 1], unit: 'mcg/min' }] }),
  dose({ id: 'p-norepi', group: 'Infusions', name: 'Norepinephrine', route: 'Continuous IV/IO infusion', refs: ['msdResus'],
    lines: [{ label: 'Start', range: [0.05, 0.1], unit: 'mcg/min' }, { label: 'Limit', perKg: 2, unit: 'mcg/min' }] }),
  dose({ id: 'p-dopamine', group: 'Infusions', name: 'Dopamine', route: 'Continuous IV/IO infusion', refs: ['msdResus'],
    lines: [{ label: 'Start', range: [2, 5], unit: 'mcg/min' }, { label: 'Limit', perKg: 20, unit: 'mcg/min' }] }),
  dose({ id: 'p-dobutamine', group: 'Infusions', name: 'Dobutamine', route: 'Continuous IV/IO infusion', refs: ['msdResus'],
    lines: [{ label: 'Start', range: [2, 5], unit: 'mcg/min' }, { label: 'Limit', perKg: 20, unit: 'mcg/min' }] }),
  dose({ id: 'p-lido-inf', group: 'Infusions', name: 'Lidocaine', route: 'Continuous IV/IO infusion', refs: ['msdResus', 'rileyResus'],
    lines: [{ label: 'Rate', range: [20, 50], unit: 'mcg/min' }] }),
];

const ADULT_CPR = 'High-quality CPR: at least 2 in (5 cm), 100 to 120/min, full recoil. Switch compressors every 2 min.';
const ADULT_AIR = 'Without an advanced airway: 30:2. With one: 1 breath every 6 s and continuous compressions. Use waveform capnography.';
const ADULT_CAUSES = 'Reversible causes: hypovolemia, hypoxia, hydrogen ion, hypo-/hyperkalemia, hypothermia, tension pneumothorax, tamponade, toxins, pulmonary thrombosis, coronary thrombosis.';

const PEDS_CPR = 'High-quality CPR: at least 1/3 of chest depth, 100 to 120/min, full recoil. Switch compressors every 2 min.';
const PEDS_AIR = 'Without an advanced airway: 15:2 with 2 rescuers before puberty; 30:2 otherwise. With one: continuous compressions, 1 breath every 2 to 3 s.';
const PEDS_CAUSES = 'Reversible causes: hypovolemia, hypoxia, hydrogen ion, hypoglycemia, hypo-/hyperkalemia, hypothermia, tension pneumothorax, tamponade, toxins, pulmonary thrombosis, coronary thrombosis.';

const SHOCKABLE = (yes, no) => [{ label: 'Shockable', to: yes }, { label: 'Not shockable', to: no }];

export const ALGORITHMS = [
  {
    id: 'acls-arrest', kind: 'acls', name: 'Cardiac arrest', start: 'start', refs: ['ahaAclsCa', 'aha25Part9'], review: UNREVIEWED,
    steps: {
      start: { title: 'Start resuscitation', lines: ['Start CPR, give oxygen by bag-mask, attach monitor/defibrillator.', ADULT_CPR, ADULT_AIR], ask: 'What is the rhythm?', branches: [{ label: 'VF or pulseless VT', to: 's1' }, { label: 'Asystole or PEA', to: 'n1' }] },
      s1: { title: 'Shock', lines: ['Biphasic: {{a-shock:0}}. Monophasic: {{a-shock:2}}.', 'CPR for 2 min. Get IV/IO access.'], ask: 'Rhythm check', branches: SHOCKABLE('s2', 'n2') },
      s2: { title: 'Shock, then epinephrine', lines: ['Shock. CPR for 2 min.', 'Epinephrine: {{a-epi:0}}.', 'Consider an advanced airway and capnography.'], ask: 'Rhythm check', branches: SHOCKABLE('s3', 'n2') },
      s3: { title: 'Shock, then antiarrhythmic', lines: ['Shock. CPR for 2 min.', 'Amiodarone: {{a-amio:0}}, then {{a-amio:1}}. Or lidocaine: {{a-lido:0}}, then {{a-lido:1}}.', 'Continue epinephrine every 3 to 5 min.', ADULT_CAUSES], ask: 'Rhythm check', branches: SHOCKABLE('s3', 'n2') },
      n1: { title: 'Epinephrine as soon as feasible', lines: ['Epinephrine: {{a-epi:0}}.', 'CPR for 2 min. Get IV/IO access.', 'Consider an advanced airway and capnography.'], ask: 'Rhythm check', branches: SHOCKABLE('s3', 'n2') },
      n2: { title: 'CPR and reversible causes', lines: ['CPR for 2 min. Continue epinephrine every 3 to 5 min.', ADULT_CAUSES], ask: 'Rhythm check and signs of ROSC', branches: [{ label: 'Shockable', to: 's3' }, { label: 'Not shockable, no ROSC', to: 'n2' }, { label: 'ROSC', to: 'rosc' }] },
      rosc: { title: 'ROSC', lines: ['Open the post-arrest algorithm.'], branches: [] },
    },
  },
  {
    id: 'acls-brady', kind: 'acls', name: 'Bradycardia', start: 'start', refs: ['ahaAclsBrady', 'aha25Part9'], review: UNREVIEWED,
    steps: {
      start: { title: 'Assess and support', lines: ['Heart rate typically under 50/min and clinically inappropriate.', 'Maintain airway, give oxygen, assist breathing as needed. Attach monitor.', 'Compromise: hypotension, acutely altered mental status, shock, ischemic chest discomfort, or acute heart failure.'], ask: 'Persistent bradycardia with cardiopulmonary compromise?', branches: [{ label: 'Yes', to: 'yes' }, { label: 'No', to: 'no' }] },
      no: { title: 'Observe', lines: ['Identify and treat underlying causes. Support ABCs, consider oxygen, get a 12-lead ECG.'], branches: [] },
      yes: { title: 'Atropine', lines: ['Atropine IV: {{a-atropine:0}}, total limit {{a-atropine:1}}.', 'Look for ischemia, drugs or toxins, hypoxia, and electrolyte abnormality.'], ask: 'Atropine ineffective?', branches: [{ label: 'Yes', to: 'next' }, { label: 'No', to: 'no' }] },
      next: { title: 'Escalate', lines: ['Transcutaneous pacing and/or an infusion.', 'Dopamine: {{a-dopamine:0}}.', 'Epinephrine: {{a-epi-inf:0}}.', 'Consider expert consultation and transvenous pacing.'], branches: [] },
    },
  },
  {
    id: 'acls-tachy', kind: 'acls', name: 'Tachycardia', start: 'start', refs: ['ahaAclsTachy', 'ahaAclsTachyText', 'aha25Part9'], review: UNREVIEWED,
    steps: {
      start: { title: 'Assess and support', lines: ['Rate typically 150/min or above.', 'Maintain airway, oxygen if hypoxemic, monitor rhythm, BP, and SpO2. IV access and a 12-lead ECG if available.', 'Compromise: hypotension, acutely altered mental status, shock, ischemic chest discomfort, or acute heart failure.'], ask: 'Persistent tachyarrhythmia with compromise?', branches: [{ label: 'Yes', to: 'cv' }, { label: 'No', to: 'qrs' }] },
      cv: { title: 'Synchronized cardioversion', lines: ['Sedate when feasible.', 'AF: {{a-cardiovert:0}}. Flutter: {{a-cardiovert:1}}. Others: {{a-cardiovert:2}}.', 'Regular narrow complex: consider adenosine.'], ask: 'Refractory?', branches: [{ label: 'Yes', to: 'ref' }] },
      qrs: { title: 'Check QRS width', lines: ['Wide means 0.12 s or more.'], ask: 'QRS width', branches: [{ label: 'Wide', to: 'wide' }, { label: 'Narrow', to: 'narrow' }] },
      narrow: { title: 'Narrow complex', lines: ['Vagal maneuvers and adenosine if regular.', 'Adenosine: {{a-adenosine:0}}, then {{a-adenosine:1}}.', 'Beta-blocker or calcium channel blocker.', 'Consider expert consultation.'], branches: [] },
      wide: { title: 'Wide complex', lines: ['Adenosine only if regular and monomorphic: {{a-adenosine:0}}, then {{a-adenosine:1}}.', 'Antiarrhythmic infusion, for example:', 'Procainamide: {{a-procainamide:0}}, stop at {{a-procainamide:1}}. Avoid with prolonged QT or CHF.', 'Amiodarone: {{a-amio-vt:0}}.', 'Consider expert consultation.'], ask: 'Refractory?', branches: [{ label: 'Yes', to: 'ref' }] },
      ref: { title: 'If refractory', lines: ['Look for the underlying cause.', 'Increase energy for the next cardioversion.', 'Add an antiarrhythmic.', 'Consider expert consultation.'], branches: [] },
    },
  },
  {
    id: 'acls-post', kind: 'acls', name: 'Post-arrest', start: 'start', refs: ['ahaAclsPcac', 'aha25Part9'], review: UNREVIEWED,
    steps: {
      start: { title: 'Stabilize', lines: ['Manage airway and confirm placement.', 'FiO2 100% until SpO2 or PaO2 can be measured reliably.', 'SpO2 90% to 98% (PaO2 60 to 105 mmHg).', 'PaCO2 35 to 45 mmHg.', 'MAP 65 mmHg or greater.', '12-lead ECG. Consider CT and/or ultrasound.', 'Treat causes and complications. Consider emergency coronary angiography and/or mechanical circulatory support for persistent ST elevation, cardiogenic shock, recurrent or refractory ventricular arrhythmias, or severe ischemia.', 'Assess off sedation and neuromuscular blockade, if able.'], ask: 'Follows commands?', branches: [{ label: 'Yes', to: 'yes' }, { label: 'No or unsure', to: 'no' }] },
      yes: { title: 'Ongoing critical care', lines: ['Continue critical care. Coronary angiography when appropriate.'], branches: [] },
      no: { title: 'Comatose care', lines: ['PaO2 60 to 105 mmHg. PaCO2 35 to 45 mmHg unless severe acidemia. MAP 65 mmHg or greater.', 'Avoid hypoglycemia (glucose below 70 mg/dL) and hyperglycemia. Consider antibiotics.', 'Deliberate temperature control, 32 to 37.5 °C, started as soon as possible.', 'EEG to evaluate for seizure.', 'Coronary angiography when appropriate.', 'Multimodal prognostication at 72 h or more from ROSC or after normothermia.'], branches: [] },
    },
  },
  {
    id: 'pals-arrest', kind: 'pals', name: 'Cardiac arrest', start: 'start', refs: ['ahaPalsCa', 'aha25Part8', 'wikemBroselow'], review: UNREVIEWED,
    steps: {
      start: { title: 'Start resuscitation', lines: ['Start CPR, give oxygen by bag-mask, attach monitor/defibrillator.', PEDS_CPR, PEDS_AIR], ask: 'What is the rhythm?', branches: [{ label: 'VF or pulseless VT', to: 's1' }, { label: 'Asystole or PEA', to: 'n1' }] },
      s1: { title: 'First shock', lines: ['Shock: {{p-shock:0}}.', 'CPR for 2 min. Get IV/IO access.'], ask: 'Rhythm check', branches: SHOCKABLE('s2', 'n2') },
      s2: { title: 'Second shock, then epinephrine', lines: ['Shock: {{p-shock:1}}. CPR for 2 min.', 'Epinephrine: {{p-epi:0}} ({{p-epi:1}} of 0.1 mg/mL), every 3 to 5 min.', 'Consider an advanced airway and capnography.'], ask: 'Rhythm check', branches: SHOCKABLE('s3', 'n2') },
      s3: { title: 'Later shock, then antiarrhythmic', lines: ['Shock: {{p-shock:2}}. Never exceed the adult dose.', 'CPR for 2 min.', 'Amiodarone: {{p-amio:0}}; later doses {{p-amio:1}}, up to 3 doses. Or lidocaine: {{p-lido:0}}.', 'Continue epinephrine every 3 to 5 min.', PEDS_CAUSES], ask: 'Rhythm check', branches: SHOCKABLE('s3', 'n2') },
      n1: { title: 'Epinephrine as early as possible', lines: ['Epinephrine: {{p-epi:0}} ({{p-epi:1}} of 0.1 mg/mL).', 'CPR for 2 min. Get IV/IO access.', 'Consider an advanced airway and capnography.'], ask: 'Rhythm check', branches: SHOCKABLE('s3', 'n2') },
      n2: { title: 'CPR and reversible causes', lines: ['CPR for 2 min. Continue epinephrine every 3 to 5 min.', PEDS_CAUSES], ask: 'Rhythm check and signs of ROSC', branches: [{ label: 'Shockable', to: 's3' }, { label: 'Not shockable, no ROSC', to: 'n2' }, { label: 'ROSC', to: 'rosc' }] },
      rosc: { title: 'ROSC', lines: ['Open the post-arrest checklist.'], branches: [] },
    },
  },
  {
    id: 'pals-brady', kind: 'pals', name: 'Bradycardia', start: 'start', refs: ['ahaPalsBrady', 'aha25Part8'], review: UNREVIEWED,
    steps: {
      start: { title: 'Assess and support', lines: ['Maintain airway, give oxygen, assist breathing as needed. Attach monitor and watch the pulse.', 'Compromise: acutely altered mental status, signs of shock, or hypotension.'], ask: 'Bradycardia persists with cardiopulmonary compromise?', branches: [{ label: 'Yes', to: 'yes' }, { label: 'No', to: 'no' }] },
      no: { title: 'Observe', lines: ['Identify and treat underlying causes. Support ABCs, consider oxygen and a 12-lead ECG.'], branches: [] },
      yes: { title: 'Treat', lines: ['Start CPR if heart rate is under 60.', 'Get IV/IO access.', 'Epinephrine: {{p-epi:0}} ({{p-epi:1}} of 0.1 mg/mL).', 'Atropine for increased vagal tone or primary AV block: {{p-atropine:0}}; may repeat once.', 'Treat causes: hypothermia, hypoxia, toxins or medications, raised ICP, vagal tone, heart block.', 'Consider transthoracic or transvenous pacing.', 'Check the pulse every 2 min.'], ask: 'Pulse?', branches: [{ label: 'No pulse', to: 'arrest' }, { label: 'Pulse present', to: 'yes' }] },
      arrest: { title: 'No pulse', lines: ['Go to the cardiac arrest algorithm.'], branches: [] },
    },
  },
  {
    id: 'pals-tachy', kind: 'pals', name: 'Tachycardia', start: 'start', refs: ['redcrossPalsTachy', 'aha25Part8', 'jefferyPalsTachy'], review: UNREVIEWED,
    steps: {
      start: { title: 'Assess and support', lines: ['Airway, oxygenation, ventilation. Monitor SpO2, ETCO2, rhythm, BP, and perfusion.', 'IV/IO access as indicated. 12-lead ECG if available; do not delay care.', 'Treat underlying causes.'], ask: 'QRS duration', branches: [{ label: 'Narrow (0.09 s or less)', to: 'narrow' }, { label: 'Wide (over 0.09 s)', to: 'wide' }] },
      narrow: { title: 'Narrow QRS', lines: ['Probable sinus tachycardia: normal P waves, variable R-R, usually under 220 bpm in infants and under 180 bpm in children.', 'Probable SVT: absent or abnormal P waves, little R-R variability, usually 220 bpm or more in infants and 180 bpm or more in children.'], ask: 'Which is more likely?', branches: [{ label: 'Sinus tachycardia', to: 'sinus' }, { label: 'SVT', to: 'svt' }] },
      sinus: { title: 'Sinus tachycardia', lines: ['Identify and treat the underlying cause.'], branches: [] },
      svt: { title: 'SVT', lines: ['Attempt vagal maneuvers; do not delay further care.', 'Adenosine: {{p-adenosine:0}}, then {{p-adenosine:1}}. Rapid push with a 5 to 10 mL NS flush.', 'If adenosine fails or access is not immediate, synchronized cardioversion: {{p-cardiovert:0}}, then {{p-cardiovert:1}}.', 'Get expert consultation.'], branches: [] },
      wide: { title: 'Wide QRS, probable VT', lines: ['Inadequate perfusion: hypotension, acutely altered mental status, or signs of shock.'], ask: 'Is perfusion adequate?', branches: [{ label: 'Inadequate', to: 'cv' }, { label: 'Adequate', to: 'stable' }] },
      cv: { title: 'Synchronized cardioversion', lines: ['{{p-cardiovert:0}}, then {{p-cardiovert:1}}.', 'Sedate and give analgesia if it does not delay care.', 'Get expert consultation.'], branches: [] },
      stable: { title: 'Adequate perfusion', lines: ['If regular and monomorphic, consider adenosine: {{p-adenosine:0}}, then {{p-adenosine:1}}.', 'Get expert consultation.', 'Options with expert input: amiodarone {{p-amio-vt:0}} over 20 to 60 min, or procainamide {{p-procainamide:0}} over 30 to 60 min. Not typically given together.'], branches: [] },
    },
  },
  {
    id: 'pals-post', kind: 'pals', name: 'Post-arrest', start: 'start', refs: ['ahaPalsPcac', 'aha25Part8'], review: UNREVIEWED,
    steps: {
      start: { title: 'Post-arrest checklist', lines: [
        'SpO2 94% to 98%, or the child’s normal saturation. PaCO2 appropriate to the condition; limit severe hyper- and hypocapnia.',
        'Telemetry and arterial pressure. Review hemodynamic goals daily. Use lactate and urine output to guide therapy.',
        'Fluids, with or without inotropes or vasopressors, to keep systolic and mean pressure above the 10th percentile for age and sex. Consider echocardiography. Keep electrolytes normal.',
        'Continuous core temperature. Prevent and treat fever. If comatose: 32 to 34 °C then 36 to 37.5 °C, or only 36 to 37.5 °C, for up to 5 days. Prevent shivering. Rewarming carries risk of hypotension, electrolyte abnormalities, hypoglycemia, and seizures.',
        'Continuous EEG if not at baseline and available. Treat seizures. Avoid hypoglycemia.',
        'Treat agitation and pain to a sedation score target.',
        'Use multiple prognostic modalities and wait at least 72 h. Temperature management may alter the assessment.',
      ], branches: [] },
    },
  },
];

// Color group for each dose, used on the dose cards and inside algorithm steps.
export const CATEGORIES = [
  { id: 'pressor', label: 'Epinephrine and vasopressors' },
  { id: 'anti', label: 'Antiarrhythmics' },
  { id: 'elec', label: 'Shocks' },
  { id: 'chol', label: 'Atropine' },
  { id: 'lytes', label: 'Electrolytes and glucose' },
  { id: 'rev', label: 'Naloxone' },
];

export const DOSE_CATEGORY = {
  'a-epi': 'pressor', 'a-dopamine': 'pressor', 'a-epi-inf': 'pressor',
  'a-amio': 'anti', 'a-lido': 'anti', 'a-adenosine': 'anti', 'a-amio-vt': 'anti', 'a-procainamide': 'anti',
  'a-shock': 'elec', 'a-cardiovert': 'elec',
  'a-atropine': 'chol',
  'p-epi': 'pressor', 'p-epi-et': 'pressor', 'p-epi-inf': 'pressor', 'p-norepi': 'pressor', 'p-dopamine': 'pressor', 'p-dobutamine': 'pressor',
  'p-amio': 'anti', 'p-lido': 'anti', 'p-adenosine': 'anti', 'p-amio-vt': 'anti', 'p-procainamide': 'anti', 'p-lido-inf': 'anti',
  'p-shock': 'elec', 'p-cardiovert': 'elec',
  'p-atropine': 'chol',
  'p-calcium': 'lytes', 'p-calcium-gluc': 'lytes', 'p-bicarb': 'lytes', 'p-glucose': 'lytes', 'p-mag': 'lytes',
  'p-naloxone': 'rev',
};

// The published chart for each algorithm, opened from AHA (or Red Cross) servers.
export const CHARTS = {
  'acls-arrest': 'ahaAclsCa', 'acls-brady': 'ahaAclsBrady', 'acls-tachy': 'ahaAclsTachy', 'acls-post': 'ahaAclsPcac',
  'pals-arrest': 'ahaPalsCa', 'pals-brady': 'ahaPalsBrady', 'pals-tachy': 'redcrossPalsTachy', 'pals-post': 'ahaPalsPcac',
};

export const RESUS_ITEMS = [...ADULT_DOSES, ...PEDS_DOSES, ...ALGORITHMS];
