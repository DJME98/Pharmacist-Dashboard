// Insulin action times. Hours. `peak: null` means no pronounced peak.
// Values from Diabetes Metab J 2021 Table 1, except inhaled insulin (Afrezza label, Table 7).
export const INSULINS = [
  { id: 'fiasp', name: 'Aspart, faster (Fiasp)', kind: 'ultra', onset: [0.07, 0.07], peak: [1, 3], duration: [3, 5], text: ['4 min', '1 to 3 h', '3 to 5 h'] },
  { id: 'lyumjev', name: 'Lispro-aabc (Lyumjev)', kind: 'ultra', onset: [0.03, 0.03], peak: [1, 2], duration: [4.6, 4.6], text: ['2 min', '1 to 2 h', 'About 4.6 h'] },
  { id: 'afrezza', name: 'Inhaled insulin (Afrezza)', kind: 'inhaled', onset: [0.2, 0.2], peak: [0.58, 0.92], duration: [1.5, 4.5], text: ['About 12 min', '35 to 55 min', '1.5 to 4.5 h, dose-dependent'] },
  { id: 'lispro', name: 'Lispro (Humalog)', kind: 'rapid', onset: [0.17, 0.25], peak: [1, 2], duration: [3, 5], text: ['10 to 15 min', '1 to 2 h', '3 to 5 h'] },
  { id: 'aspart', name: 'Aspart (NovoLog)', kind: 'rapid', onset: [0.17, 0.25], peak: [1, 3], duration: [3, 5], text: ['10 to 15 min', '1 to 3 h', '3 to 5 h'] },
  { id: 'glulisine', name: 'Glulisine (Apidra)', kind: 'rapid', onset: [0.17, 0.25], peak: [1, 2], duration: [2, 4], text: ['10 to 15 min', '1 to 2 h', '2 to 4 h'] },
  { id: 'regular', name: 'Regular (Humulin R)', kind: 'short', onset: [0.5, 0.5], peak: [2, 3], duration: [6.5, 6.5], text: ['30 min', '2 to 3 h', '6.5 h'] },
  { id: 'nph', name: 'NPH (Humulin N)', kind: 'intermediate', onset: [1, 3], peak: [5, 8], duration: [18, 18], text: ['1 to 3 h', '5 to 8 h', 'About 18 h'] },
  { id: 'detemir', name: 'Detemir (Levemir)', kind: 'long', onset: [3, 4], peak: [6, 8], duration: [24, 24], text: ['3 to 4 h', '6 to 8 h', 'About 24 h'], note: 'Discontinued in the US' },
  { id: 'glargine', name: 'Glargine U-100 (Lantus)', kind: 'long', onset: [1.5, 1.5], peak: null, duration: [24, 24], text: ['1.5 h', 'No peak', 'About 24 h'] },
  { id: 'u300', name: 'Glargine U-300 (Toujeo)', kind: 'long', onset: [6, 6], peak: null, duration: [24, 36], text: ['About 6 h', 'No peak', '24 to 36 h'] },
  { id: 'degludec', name: 'Degludec (Tresiba)', kind: 'long', onset: [0.5, 1.5], peak: null, duration: [42, 42], text: ['30 to 90 min', 'No peak', 'About 42 h'] },
];

export const INSULIN_KIND_LABEL = {
  ultra: 'Ultra-rapid', inhaled: 'Rapid, inhaled', rapid: 'Rapid', short: 'Short', intermediate: 'Intermediate', long: 'Long',
};

export const INSULIN_DEFAULT = ['lispro', 'regular', 'nph', 'glargine', 'degludec'];

export const INSULIN_KINETICS_ITEM = {
  id: 'insulin-kinetics', name: 'Insulin action times', refs: ['dmjInsulin', 'afrezzaLabel'],
  review: { status: 'unverified', by: null, date: null },
};
