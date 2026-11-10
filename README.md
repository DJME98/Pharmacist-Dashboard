# Pharmacist Dashboard

Dosing calculators and clinical references for pharmacists. It installs to a phone or computer and works offline. Patient values stay in the open page: they are not saved or sent anywhere.

For reference only. Use clinical judgment, and confirm doses against current references and your institution’s protocols.

## What is in stage 1

- Body size: BMI, ideal and adjusted body weight, and BSA
- Creatinine clearance: Cockcroft-Gault with three weights, Salazar-Corcoran, and Jelliffe for changing creatinine
- eGFR: CKD-EPI creatinine, cystatin C, and combined; EKFC; bedside Schwartz; CKiD U25; and the term neonatal equation
- A searchable reference list that says how far each source was checked

## What is in stage 2

- ACLS and PALS algorithms you step through: cardiac arrest, bradycardia, tachycardia, and post-arrest care
- PALS doses and shocks calculated from weight, with caps; ACLS doses flat except weight-based drugs
- Sources and review status on every dose and algorithm

## What is in stage 3

- Vancomycin AUC: single-level Bayesian estimate using the Goti 2018 model, or a population estimate with no level
- Aminoglycosides: extended-interval nomograms (Hartford 7 mg/kg, Urban-Craig 5 mg/kg, amikacin, cystic fibrosis) with CrCl and doses beside them
- Vancomycin doses use 250 mg steps from 500 to 2000 mg

## What is in stage 4

- Conversions: opioids with cross-tolerance reduction, benzodiazepines, steroids, beta blockers, ACE inhibitors, ARBs, PPIs, antipsychotics, loop diuretics, statin intensity, basal insulin, and IV to PO

## What is in stage 5

- Critical care: status epilepticus, anaphylaxis, and drip rates
- Labs: phenytoin, calcium, sodium, free water deficit, anion gap, osmolality, iron deficit, QTc, and MELD 3.0
- Scores: CHA2DS2-VASc, HAS-BLED, Child-Pugh, 4Ts, CIWA-Ar, and COWS
- Pediatrics: maintenance fluids
- Anticoagulation dosing and reversal are not included yet

## Later additions

- ACLS and PALS: color-coded drug groups, Broselow color zones for PALS, and the published algorithm charts in a pop-up
- Conversions: equivalence tables, a statin intensity table, and insulin action times with an overlay chart
- Conversions round to practical doses and show where sources disagree; tables for opioids, benzodiazepines, and beta blockers
- Conversions say where their numbers come from (the trials, pharmacology studies, or consensus behind them); benzodiazepines are grouped by half-life; steroids and ARBs show duration bars
- ACLS and PALS: how each drug is given, shocks first in cardiac arrest, and weight ranges on the Broselow zones

## Publishing

In the repository, open Settings, then Pages, and set Source to GitHub Actions. Each push to `main` then runs the tests and publishes `site/`.

## Running tests

```
python3 tests/independent_vectors.py
npm test
```

The tests use hand-worked examples and compare the app with a separate Python implementation. They catch coding errors. They cannot show that a published coefficient is clinically right.

## Updating the offline copy

When any file in `site/` changes, bump `VERSION` in `site/sw.js` and add new files to its list.
