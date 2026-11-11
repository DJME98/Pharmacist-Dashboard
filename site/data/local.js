// Local anesthetic maximum doses, taken from each product's US prescribing information.
// perKg: label mg/kg limit; cap: label absolute mg limit. Either may be absent when the label gives none.
export const LOCAL_AGENTS = [
  {
    id: 'lido', name: 'Lidocaine, plain', perKg: 4.5, cap: 300, conc: [0.5, 1, 1.5, 2],
    label: 'Maximum individual dose 4.5 mg/kg, not over 300 mg total.',
    peds: 'Varies with age and weight; the label’s example is 3.3 to 4.4 mg/kg (75 to 100 mg) for a 23 kg child, and 3 mg/kg for IV regional anesthesia.',
    ref: 'lidoLabel',
  },
  {
    id: 'lido-epi', name: 'Lidocaine with epinephrine', perKg: 7, cap: 500, conc: [0.5, 1, 1.5, 2],
    label: 'Not over 7 mg/kg, and not over 500 mg total.',
    peds: 'Same label caution as plain lidocaine.',
    ref: 'lidoLabel',
  },
  {
    id: 'bupi', name: 'Bupivacaine, plain', cap: 175, day: 400, conc: [0.25, 0.5, 0.75],
    label: 'Up to 175 mg per single dose (infiltration or nerve block). Not over 400 mg in 24 h; doses may repeat every 3 h. The label gives no mg/kg limit.',
    peds: 'Not recommended under 12 years.', minAge: 12,
    ref: 'bupiLabel',
  },
  {
    id: 'bupi-epi', name: 'Bupivacaine with epinephrine', cap: 225, day: 400, conc: [0.25, 0.5, 0.75],
    label: 'Up to 225 mg per single dose. Not over 400 mg in 24 h. The label gives no mg/kg limit.',
    peds: 'Not recommended under 12 years.', minAge: 12,
    ref: 'bupiLabel',
  },
  {
    id: 'ropi', name: 'Ropivacaine', cap: 250, day: 770, conc: [0.2, 0.5, 0.75, 1],
    label: 'Maximum recommended dose 250 mg for nerve block (label section 8.1); the dosing table goes to 300 mg for brachial plexus block with caution. Up to 770 mg over 24 h is described for epidural use. No mg/kg limit.',
    peds: 'Safety and efficacy not established in children.', minAge: 18,
    ref: 'ropiLabel',
  },
  {
    id: 'mepi', name: 'Mepivacaine', perKg: 7, cap: 400, day: 1000, pedsPerKg: 5, conc: [1, 1.5, 2, 3],
    label: 'Single adult dose should not usually exceed 400 mg. 7 mg/kg (550 mg) has been given but is not recommended. Not over 1,000 mg in 24 h.',
    peds: 'Not over 5 to 6 mg/kg in children; the lower value is used here.',
    ref: 'mepiLabel',
  },
  {
    id: 'chloro', name: 'Chloroprocaine, plain', perKg: 11, cap: 800, conc: [2, 3],
    label: '11 mg/kg, not over 800 mg total.',
    peds: 'Not over 11 mg/kg; the label advises reducing the dose for children.',
    ref: 'chloroLabel',
  },
  {
    id: 'chloro-epi', name: 'Chloroprocaine with epinephrine', perKg: 14, cap: 1000, conc: [2, 3],
    label: '14 mg/kg, not over 1,000 mg total.',
    peds: 'Not over 11 mg/kg.', pedsPerKg: 11,
    ref: 'chloroLabel',
  },
  {
    id: 'artic', name: 'Articaine with epinephrine (dental)', perKg: 7, conc: [4],
    label: 'Not over 7 mg/kg (0.175 mL/kg of 4%). The label gives no absolute mg cap.',
    peds: 'Ages 4 to 16: not over 7 mg/kg. Not studied under 4 years.', minAge: 4,
    ref: 'articLabel',
  },
  {
    id: 'prilo', name: 'Prilocaine, plain (dental)', perKg: 8, cap: 600, capAboveKg: 70, conc: [4],
    label: 'Under 70 kg: not over 8 mg/kg. 70 kg or more: not over 600 mg.',
    peds: 'Under 10 years: by a pediatric dose formula; rarely more than 40 mg per procedure.',
    ref: 'priloLabel',
  },
];

// How the agents differ. Class, duration, and additives from each US label; allergy data from Bhole 2012 and Koca Kalkan 2021.
// dur: hours, in the setting the label reports (ctx). Settings differ, so compare bars only roughly.
export const LOCAL_PROFILES = [
  { id: 'chloro', name: 'Chloroprocaine', cls: 'ester', dur: [1, 1], durClass: 'short', durText: 'Up to 60 min', ctx: 'label, by dose and route', flags: ['paba'],
    note: 'Broken down in plasma by pseudocholinesterase; slower in cholinesterase deficiency. Its PABA-like metabolite inhibits sulfonamides. Contraindicated with allergy to PABA-ester drugs.' },
  { id: 'artic', name: 'Articaine (with epinephrine)', cls: 'amide', dur: [1, 2], durClass: 'short', durText: '1 h infiltration, up to 2 h block', ctx: 'dental label', flags: ['sulfite'],
    note: 'An amide that is broken down mainly by plasma carboxyesterase, so it is cleared quickly.' },
  { id: 'lido', name: 'Lidocaine', cls: 'amide', dur: [1, 1.5], durClass: 'short', durText: 'Pulpal 60 to 90 min with epinephrine', ctx: 'dental label; the plain-lidocaine label gives no fixed time', flags: ['sulfite', 'paraben'],
    note: 'No cross-sensitivity reported with procainamide or with PABA-derivative (ester) allergy (label).' },
  { id: 'prilo', name: 'Prilocaine', cls: 'amide', dur: [2, 2.5], durClass: 'mid', durText: 'Soft tissue 2 to 2.5 h', ctx: 'dental label', flags: ['methb'],
    note: 'Can cause methemoglobinemia, most of all in infants under 6 months and in G6PD deficiency. No cross-sensitivity with PABA-derivative allergy (label).' },
  { id: 'mepi', name: 'Mepivacaine', cls: 'amide', dur: [2, 2.5], durClass: 'mid', durText: '2 to 2.5 h of surgery', ctx: 'label', flags: ['paraben'],
    note: 'Single-dose (MPF) vials have no methylparaben.' },
  { id: 'bupi', name: 'Bupivacaine', cls: 'amide', dur: [7, 7], durClass: 'long', durText: 'Up to 7 h', ctx: 'dental label', flags: ['sulfite', 'paraben'],
    note: 'Long acting; analgesia can persist after sensation returns (label).' },
  { id: 'ropi', name: 'Ropivacaine', cls: 'amide', dur: [3.7, 8.7], durClass: 'long', durText: '3.7 to 8.7 h axillary block; 4 h epidural', ctx: 'label clinical studies', flags: [],
    note: 'Single-dose vials without preservative.' },
];

export const LOCAL_FLAGS = {
  paba: { label: 'PABA metabolite', cls: 'flag-paba' },
  sulfite: { label: 'Sulfite in epinephrine forms', cls: 'flag-sulfite' },
  paraben: { label: 'Methylparaben in multi-dose vials', cls: 'flag-paraben' },
  methb: { label: 'Methemoglobinemia', cls: 'flag-methb' },
};

export const LOCAL_ALLERGY = [
  { head: 'True allergy is rare', text: 'IgE-mediated allergy was confirmed in 29 of 2,978 people tested across 23 case series (0.97%) (Bhole 2012). Most suspected reactions are vasovagal, anxiety, or epinephrine effects.' },
  { head: 'Esters cross-react with each other', text: 'Cross-sensitivity among ester-type local anesthetics has been reported (chloroprocaine label). Avoid other esters after an ester reaction.' },
  { head: 'Esters and amides do not', text: 'Patients allergic to PABA derivatives (procaine, tetracaine, benzocaine) have not shown cross-sensitivity to lidocaine or prilocaine (labels). An amide is usually the choice after an ester reaction.' },
  { head: 'Amides rarely cross-react', text: 'Cross-sensitivity among amides has been reported (labels). In 398 people tested, 14 reacted and 3 reacted to more than one amide (Koca Kalkan 2021). Confirm a different amide by allergist challenge.' },
  { head: 'Check the additives', text: 'Reactions can come from methylparaben in multi-dose vials or sulfite (sodium metabisulfite) in epinephrine-containing solutions, not the anesthetic itself (labels). Single-dose, preservative-free products avoid paraben.' },
];
