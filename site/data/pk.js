// Review status and sources for the pharmacokinetic tools.
const UNREVIEWED = { status: 'unverified', by: null, date: null };

export const PK_ITEMS = [
  { id: 'vanco-bayes', name: 'Vancomycin single-level Bayesian AUC', refs: ['goti2018', 'rybak2020'], review: UNREVIEWED },
  { id: 'vanco-load', name: 'Vancomycin loading dose', refs: ['rybak2020'], review: UNREVIEWED },
  { id: 'ag-extended', name: 'Aminoglycoside extended-interval dosing', refs: ['nicolau1995', 'cockcroft1976', 'traynor1995'], review: UNREVIEWED },
];

