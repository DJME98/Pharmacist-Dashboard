// Review status and sources for the pharmacokinetic tools.
const UNREVIEWED = { status: 'unverified', by: null, date: null };

export const PK_ITEMS = [
  { id: 'vanco-bayes', name: 'Vancomycin single-level Bayesian AUC', refs: ['goti2018', 'gotiLib', 'rybak2020', 'dosemeModels'], review: UNREVIEWED },
  { id: 'vanco-load', name: 'Vancomycin loading dose', refs: ['rybak2020'], review: UNREVIEWED },
  { id: 'ag-traditional', name: 'Aminoglycoside traditional dosing', refs: ['bauerAmino', 'rxkAminoFormulas', 'stanfordAg', 'scfhsAg'], review: UNREVIEWED },
  { id: 'ag-extended', name: 'Aminoglycoside extended-interval dosing', refs: ['nicolau1995', 'urbanCraig1997', 'stanfordAg', 'stonyBrookAg', 'northwesternAg', 'unmcPk', 'bugsHartford', 'scfhsAg', 'bauerAmino'], review: UNREVIEWED },
];

// Extended-interval nomograms. `rows` are [CrCl label, gent/tobra, amikacin, low CrCl bound].
export const NOMOGRAMS = [
  {
    id: 'hartford', name: 'Hartford nomogram', dose: 'Gentamicin or tobramycin 7 mg/kg; amikacin 15 mg/kg',
    rows: [['60 or more', '7 mg/kg q24h', '15 mg/kg q24h', 60], ['40 to 59', '7 mg/kg q36h', '15 mg/kg q36h', 40], ['20 to 39', '7 mg/kg q48h', '15 mg/kg q48h', 20], ['Under 20, HD, or CRRT', 'Not recommended', 'Not recommended', 0]],
    level: 'One random level 6 to 14 h after the start of the first infusion (Nicolau 1995). Stanford draws it at 8 to 12 h.',
    plot: 'Plot gentamicin and tobramycin levels as measured. For amikacin 15 mg/kg, divide the level by 2.',
    notes: ['Designed for 7 mg/kg only; expected peak about 20 mcg/mL.', 'Stanford limits q48h to CrCl 30 to 39 and does not recommend 20 to 29.'],
  },
  {
    id: 'urban', name: 'Urban and Craig (Barnes-Jewish) nomogram', dose: 'Gentamicin or tobramycin 5 mg/kg; amikacin 15 mg/kg',
    rows: [['60 or more', '5 mg/kg q24h', '15 mg/kg q24h', 60], ['40 to 59', '5 mg/kg q36h', '15 mg/kg q36h', 40], ['20 to 39', '5 mg/kg q48h', '15 mg/kg q48h', 20], ['Under 20, HD, or CRRT', 'Not recommended', 'Not recommended', 0]],
    level: 'One level 8 to 12 h after the first dose (Stanford); Stony Brook uses 10 to 12 h after the start of the infusion.',
    plot: 'Plot gentamicin and tobramycin levels as measured. For amikacin 15 mg/kg, divide the level by 3 (Stanford).',
    notes: ['Designed for 5 mg/kg doses.', 'Amikacin 20 mg/kg: multiply the level by 0.75 and use the amikacin 15 mg/kg nomogram (Stony Brook).'],
  },
  {
    id: 'cf', name: 'Cystic fibrosis (Stanford)', dose: 'Tobramycin 10 mg/kg (or 7 mg/kg); amikacin 20 mg/kg',
    rows: [['60 or more', '10 mg/kg q24h (or 7 mg/kg)', '20 mg/kg q24h', 60], ['40 to 59', '7 to 10 mg/kg q36h', '20 mg/kg q36h', 40], ['30 to 39', '7 to 10 mg/kg q48h', '20 mg/kg q48h', 30], ['Under 30, HD, or CRRT', 'Not recommended', 'Not recommended', 0]],
    level: 'Peak 30 min after the end of the first dose and a trough 6 h before the second. With 7 mg/kg, a random level at 8 to 10 h plotted on the Hartford nomogram.',
    plot: 'Goals: tobramycin peak 20 to 30, trough under 1 mcg/mL; amikacin peak 40 to 60, trough under 4 mcg/mL.',
    notes: ['Consider 7 mg/kg with a history of kidney injury or a creatinine rise on 10 mg/kg.'],
  },
];

export const NOMOGRAM_RULES = [
  'Level in the q24h, q36h, or q48h area: use that interval. Start the next dose that many hours after the last one.',
  'Level on a dividing line: choose the longer interval.',
  'Level above the q48h area: stop extended-interval dosing and switch to traditional dosing by levels.',
  'Level below the nomogram (under 2 mcg/mL): reassess if the patient is not improving.',
  'Recheck a random level at least weekly, and sooner if kidney function changes.',
];

export const NOMOGRAM_EXCLUSIONS = 'Not for: CrCl under 20 to 30 or rapidly changing kidney function, dialysis, pregnancy, gram-positive synergy, ascites, burns over 20% BSA, or children.';

export const NOMOGRAM_DOSES = [
  { drug: 'Gentamicin or tobramycin', perKg: [5, 7], round: 10 },
  { drug: 'Tobramycin, cystic fibrosis', perKg: [10], round: 10 },
  { drug: 'Amikacin', perKg: [15, 20], round: 50 },
];
