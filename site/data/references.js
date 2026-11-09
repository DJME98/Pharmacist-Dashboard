// `checked` says how the content was confirmed. It is not a clinical sign-off.
// primary: read at the original publisher. secondary: formula read at the named
// secondary source, original paper not read. citation: citation confirmed only.
const ACCESSED = '2026-11-09';

export const REFERENCES = {
  inker2021: { cite: 'Inker LA, Eneanya ND, Coresh J, et al. New creatinine- and cystatin C-based equations to estimate GFR without race. N Engl J Med. 2021;385(19):1737-1749.', url: 'https://doi.org/10.1056/NEJMoa2102953', checked: 'citation' },
  inker2012: { cite: 'Inker LA, Schmid CH, Tighiouart H, et al. N Engl J Med. 2012;367(1):20-29.', url: 'https://doi.org/10.1056/NEJMoa1114248', checked: 'citation' },
  niddkAdults: { cite: 'NIDDK. Glomerular filtration rate equations: adults.', url: 'https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/adults', checked: 'primary' },
  niddkPeds: { cite: 'NIDDK. eGFR equations for children, adolescents, and young adults.', url: 'https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/children-adolescents-young-adults', checked: 'primary' },
  nkfCkdEpi: { cite: 'National Kidney Foundation. CKD-EPI creatinine equation (2021).', url: 'https://www.kidney.org/professionals/ckd-epi-creatinine-equation-2021', checked: 'primary' },
  ckdepiCombinedQx: { cite: 'QxMD. eGFR using CKD-EPI creatinine-cystatin C equation (2021).', url: 'https://calculate.qxmd.com/storage/calculators/863/eGFR-using-CKD-EPI-Cr-Cys-Eq-2021.html', checked: 'secondary' },
  kdigo2024: { cite: 'KDIGO 2024 clinical practice guideline for the evaluation and management of chronic kidney disease. Kidney Int. 2024;105(4S):S117-S314. Recommendation 1.2.2.1 and practice points 4.2.1 to 4.2.4.', url: 'https://kdigo.org/wp-content/uploads/2026/05/KDIGO-2024-CKD-Guideline-Summary-Recommendations-and-Practice-Points.pdf', checked: 'primary' },
  cg1976: { cite: 'Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976;16(1):31-41.', url: 'https://pubmed.ncbi.nlm.nih.gov/1244564/', checked: 'citation' },
  winter2012: { cite: 'Winter MA, Guhr KN, Berg GM. Impact of various body weights and serum creatinine concentrations on the bias and accuracy of the Cockcroft-Gault equation. Pharmacotherapy. 2012;32(7):604-612.', url: 'https://doi.org/10.1002/j.1875-9114.2012.01098.x', checked: 'primary', note: 'Abstract read.' },
  brown2013: { cite: 'Brown DL, Masselink AJ, Lalla CD. Functional range of creatinine clearance for renal drug dosing. Ann Pharmacother. 2013;47(7-8):1039-1044.', url: 'https://doi.org/10.1345/aph.1S176', checked: 'citation' },
  mdcalcCg: { cite: 'Updated review of creatinine clearance (Cockcroft-Gault equation). MDCalc review.', url: 'https://mdcalc.scholasticahq.com/article/154678-updated-review-of-creatinine-clearance-cockcroft-gault-equation', checked: 'secondary' },
  salazar1988: { cite: 'Salazar DE, Corcoran GB. Predicting creatinine clearance and renal drug clearance in obese patients from estimated fat-free body mass. Am J Med. 1988;84(6):1053-1060.', url: 'https://pubmed.ncbi.nlm.nih.gov/3376975/', checked: 'citation' },
  globalrphSalazar: { cite: 'GlobalRPh. Salazar-Corcoran calculator.', url: 'https://globalrph.com/medcalcs/salazar-corcoran-calc/', checked: 'secondary' },
  rxkOther: { cite: 'RxKinetics. Other CrCl methods.', url: 'https://rxkinetics.com/kin_help/hlp_other_crcl.htm', checked: 'secondary' },
  rxkRenal: { cite: 'RxKinetics. Renal function formulas.', url: 'https://rxkinetics.com/renal.html', checked: 'secondary', note: 'Prints a different Jelliffe version (0.18, 0.0377, and a 0.4 L/kg volume term).' },
  clincalcCrcl: { cite: 'ClinCalc. Creatinine clearance calculator.', url: 'https://clincalc.com/Kinetics/CrCl.aspx', checked: 'secondary', note: 'Source of the Jelliffe version used here.' },
  jelliffe2002: { cite: 'Jelliffe R. Estimation of creatinine clearance in patients with unstable renal function, without a urine specimen. Am J Nephrol. 2002;22(4):320-324.', url: 'https://doi.org/10.1159/000065221', checked: 'citation' },
  jelliffe1972: { cite: 'Jelliffe RW, Jelliffe SM. A computer program for estimation of creatinine clearance from unstable serum creatinine levels, age, sex, and weight. Math Biosci. 1972;14:17-24.', url: 'https://doi.org/10.1016/0025-5564(72)90003-X', checked: 'citation' },
  gfrAkiModelling: { cite: 'The glomerular filtration rate estimators in the pharmacokinetic modelling in acute kidney injury: an observational study. Appendix A.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7915939/', checked: 'secondary', note: 'Prints a different Jelliffe version (25.1, 0.0337, and an average-SCr correction).' },
  pierce2021: { cite: 'Pierce CB, Muñoz A, Ng DK, Warady BA, Furth SL, Schwartz GJ. Age- and sex-dependent clinical equations to estimate glomerular filtration rates in children and young adults with chronic kidney disease. Kidney Int. 2021;99(4):948-956.', url: 'https://doi.org/10.1016/j.kint.2020.10.047', checked: 'citation' },
  schwartz2009: { cite: 'Schwartz GJ, Muñoz A, Schneider MF, et al. New equations to estimate GFR in children with CKD. J Am Soc Nephrol. 2009;20:629-637.', url: 'https://doi.org/10.1681/ASN.2008030287', checked: 'citation' },
  smeets2022: { cite: 'Smeets NJL, IntHout J, van der Burgh MJP, et al. Maturation of GFR in term-born neonates: an individual participant data meta-analysis. J Am Soc Nephrol. 2022;33(7):1277-1292.', url: 'https://doi.org/10.1681/ASN.2021101326', checked: 'citation' },
  pottel2021: { cite: 'Pottel H, Björk J, Courbebaisse M, et al. Development and validation of a modified full age spectrum creatinine-based equation to estimate glomerular filtration rate. Ann Intern Med. 2021;174(2):183-191.', url: 'https://doi.org/10.7326/M20-4366', checked: 'citation' },
  pottel2023: { cite: 'Pottel H, Björk J, Rule AD, et al. Cystatin C-based equation to estimate GFR without the inclusion of race and sex. N Engl J Med. 2023;388(4):333-343.', url: 'https://doi.org/10.1056/NEJMoa2203769', checked: 'citation' },
  kidneyEpi: { cite: 'Bikbov B. kidney.epi R package, EKFC source code.', url: 'https://rdrr.io/cran/kidney.epi/src/R/egfr_ekfc.R', checked: 'secondary' },
  egfrManual: { cite: 'egfr R package manual, EKFC Q values and combined equation.', url: 'https://cran.r-universe.dev/egfr/doc/manual.html', checked: 'secondary' },
  devine1974: { cite: 'Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974;8:650-655.', url: null, checked: 'citation' },
  pai2000: { cite: 'Pai MP, Paloucek FP. The origin of the "ideal" body weight equations. Ann Pharmacother. 2000;34(9):1066-1069.', url: 'https://pubmed.ncbi.nlm.nih.gov/10981254/', checked: 'citation' },
  clincalcIbw: { cite: 'ClinCalc. Ideal body weight calculator.', url: 'https://clincalc.com/Kinetics/IdealBW.aspx', checked: 'secondary' },
  mosteller1987: { cite: 'Mosteller RD. Simplified calculation of body-surface area. N Engl J Med. 1987;317:1098.', url: 'https://doi.org/10.1056/NEJM198710223171717', checked: 'citation' },
  dubois1916: { cite: 'Du Bois D, Du Bois EF. A formula to estimate the approximate surface area if height and weight be known. Arch Intern Med. 1916;17:863-871.', url: 'https://pubmed.ncbi.nlm.nih.gov/2520314/', checked: 'citation' },
  radiopaediaBsa: { cite: 'Radiopaedia. Body surface area.', url: 'https://www.radiopaedia.org/articles/body-surface-area?lang=us', checked: 'secondary' },
  bsaComparison: { cite: 'Article comparing body surface area formulas, Table 1 (PMC4914842).', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4914842', checked: 'secondary' },
  cdcBmi: { cite: 'Centers for Disease Control and Prevention. About BMI for adults (as reproduced by Lumen Learning, LibreTexts).', url: 'https://med.libretexts.org/Courses/Lumen_Learning/Book%3A_Wellness_(Lumen)/19%3A_Body_Composition/19.03%3A_About_BMI_for_Adults', checked: 'secondary' },
  aha25Part9: { cite: 'Wigginton JG, Agarwal S, Bartos JA, et al. Part 9: advanced life support: 2025 American Heart Association guidelines for cardiopulmonary resuscitation and emergency cardiovascular care. Circulation. 2025;152(suppl 2):S538-S577.', url: 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-advanced-life-support', checked: 'primary' },
  aha25Part8: { cite: 'Lasa JJ, Dhillon GS, Duff JP, et al. Part 8: pediatric advanced life support: 2025 American Heart Association guidelines for cardiopulmonary resuscitation and emergency cardiovascular care. Circulation. 2025;152(suppl 2):S479-S537.', url: 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/pediatric-advanced-life-support', checked: 'primary' },
  ahaAclsCa: { cite: 'American Heart Association. Adult cardiac arrest algorithm, 2025.', url: 'https://cpr.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Algorithms/Algorithm-ACLS-CA-250527.pdf?sc_lang=en', checked: 'primary' },
  ahaAclsBrady: { cite: 'American Heart Association. Adult bradycardia with a pulse algorithm, 2025.', url: 'https://cpr.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Algorithms/Algorithm-ACLS-Bradycardia-250514.pdf?sc_lang=en', checked: 'primary' },
  ahaAclsTachy: { cite: 'American Heart Association. Adult tachyarrhythmia with a pulse algorithm, 2025.', url: 'https://cpr.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Algorithms/Algorithm-ACLS-Tachycardia-250514.pdf?sc_lang=en', checked: 'primary' },
  ahaAclsTachyText: { cite: 'American Heart Association. Adult tachyarrhythmia with a pulse algorithm, text description, 2025.', url: 'https://cpr.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Accessible/Algorithm-ACLS-Tachyarrhythmia-LngDscrp-250726-Ed.pdf?sc_lang=en', checked: 'primary' },
  ahaAclsPcac: { cite: 'American Heart Association. Adult post-cardiac arrest care algorithm, text description, 2025.', url: 'https://cpr.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Accessible/Algorithm-ACLS-PCAC-LngDscrp-250726-Ed.pdf?sc_lang=en', checked: 'primary' },
  ahaPalsCa: { cite: 'American Heart Association and American Academy of Pediatrics. Pediatric cardiac arrest algorithm, 2025.', url: 'https://cpr.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Algorithms/Algorithm-PALS-CA-250123.pdf?sc_lang=en', checked: 'primary' },
  ahaPalsBrady: { cite: 'American Heart Association and American Academy of Pediatrics. Pediatric bradycardia with a pulse algorithm, 2025.', url: 'https://cpr.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Algorithms/Algorithm-PALS-Bradycardia-250121.pdf?sc_lang=en', checked: 'primary' },
  ahaPalsPcac: { cite: 'American Heart Association and American Academy of Pediatrics. Pediatric post-cardiac arrest care checklist, 2025.', url: 'https://cpr.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Algorithms/Checklist-PALS-PCAC-250213.pdf?sc_lang=en', checked: 'primary' },
  redcrossPalsTachy: { cite: 'American Red Cross. PALS pediatric tachycardia with a pulse, 2025.', url: 'https://guidelines.redcross.org/wp-content/uploads/2025/12/PALS-Pediatric-Tachycardia-with-a-Pulse.pdf', checked: 'secondary', note: 'Used because the AHA 2025 pediatric tachycardia chart could not be located.' },
  jefferyPalsTachy: { cite: 'Jeffery Media Productions. Pediatric tachycardia with a pulse algorithm, 2022.', url: 'https://acls-algorithms.com/wp-content/uploads/2022/08/2020-2025-PALS-Tachycardia-with-pulse-algorithm.pdf', checked: 'secondary', note: 'Predates the 2025 guideline.' },
  msdResus: { cite: 'MSD Manual Professional Edition. Medications commonly used for resuscitation.', url: 'https://www.msdmanuals.com/professional/multimedia/table/medications-commonly-used-for-resuscitation', checked: 'secondary', note: 'Cites the 2020 pediatric consensus, before the 2025 guideline.' },
  rileyResus: { cite: 'Riley Children’s Health. Medications for pediatric resuscitation.', url: 'https://www.rileychildrens.org/medical-education/pcome/resources/medications-for-pediatric-resuscitation', checked: 'secondary', note: 'Cites the 2015 AHA handbook, before the 2025 guideline.' },
};

export const REFERENCES_ACCESSED = ACCESSED;

export const CHECK_LABELS = {
  primary: 'Read at the issuing source',
  secondary: 'Formula read at this secondary source',
  citation: 'Citation confirmed; original not read',
};
