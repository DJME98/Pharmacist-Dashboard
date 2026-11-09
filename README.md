# Pharmacist Dashboard

Dosing calculators and clinical references for pharmacists. It installs to a phone or computer and works offline. Patient values stay in the open page: they are not saved or sent anywhere.

**Status: stage 1, not clinically reviewed.** Every calculation is marked unverified until a pharmacist signs off.

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
- Aminoglycosides: traditional and extended-interval dosing

## What is in stage 4

- Conversions: opioids with cross-tolerance reduction, benzodiazepines, steroids, beta blockers, ACE inhibitors, ARBs, PPIs, antipsychotics, loop diuretics, statin intensity, basal insulin, and IV to PO

## What is in stage 5

- Critical care: status epilepticus, anaphylaxis, and drip rates
- Labs: phenytoin, calcium, sodium, free water deficit, anion gap, osmolality, iron deficit, QTc, and MELD 3.0
- Scores: CHA2DS2-VASc, HAS-BLED, Child-Pugh, CIWA-Ar, and COWS
- Pediatrics: maintenance fluids
- Anticoagulation dosing and reversal are not included yet

## Publishing

In the repository, open Settings, then Pages, and set Source to GitHub Actions. Each push to `main` then runs the tests and publishes `site/`.

## Signing off a calculation

Each entry in `site/calc/registry.js`, `site/data/resus.js`, `site/data/pk.js`, `site/data/conversions.js`, `site/data/care.js`, and `site/data/tools.js` has a `review` field. After checking an entry against its sources, replace `UNREVIEWED` with:

```js
review: { status: 'verified', by: 'Your name, PharmD', date: 'YYYY-MM-DD' },
```

## Running tests

```
python3 tests/independent_vectors.py
npm test
```

The tests use hand-worked examples and compare the app with a separate Python implementation. They catch coding errors. They cannot show that a published coefficient is clinically right, which is what the sign-off is for.

## Updating the offline copy

When any file in `site/` changes, bump `VERSION` in `site/sw.js` and add new files to its list.
