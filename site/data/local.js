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
