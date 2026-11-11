// Lab calculators, pediatric tools, and scoring systems.
import * as l from '../calc/labs.js';

const UNREVIEWED = { status: 'unverified', by: null, date: null };
const fix = (x, d = 1) => String(Number(x.toFixed(d)));

const YES_NO = [['no', 'No'], ['yes', 'Yes']];

export const LAB_TOOLS = [
  {
    id: 'phenytoin', name: 'Phenytoin, albumin-corrected',
    fields: [
      { key: 'level', label: 'Measured total phenytoin (mcg/mL)', min: 0.1, max: 100 },
      { key: 'albumin', label: 'Albumin (g/dL)', min: 0.5, max: 6 },
      { key: 'renal', label: 'Renal failure (CrCl below 10 to 15 mL/min, or dialysis)', options: YES_NO },
    ],
    compute: (v) => [
      { label: 'Sheiner-Tozer, 0.2 coefficient', value: fix(l.phenytoinCorrected(v.level, v.albumin, v.renal === 'yes' ? 0.1 : 0.2)), unit: 'mcg/mL' },
      ...(v.renal === 'yes' ? [] : [{ label: 'Anderson 1997, 0.275 coefficient', value: fix(l.phenytoinCorrected(v.level, v.albumin, 0.275)), unit: 'mcg/mL' }]),
    ],
    note: 'Sheiner-Tozer uses 0.2, or 0.1 in renal failure (Liponi 1984). Anderson 1997 found 0.275 more accurate in trauma and older patients with low albumin; it was not studied in renal failure. Less accurate with drugs that displace phenytoin, such as valproate. A free level is more reliable.',
    refs: ['sheinerTozer1978', 'liponi1984', 'anderson1997'], review: UNREVIEWED,
  },
  {
    id: 'calcium', name: 'Calcium, albumin-corrected',
    fields: [{ key: 'ca', label: 'Measured calcium (mg/dL)', min: 1, max: 25 }, { key: 'albumin', label: 'Albumin (g/dL)', min: 0.5, max: 6 }],
    compute: (v) => [{ label: 'Corrected calcium', value: fix(l.correctedCalcium(v.ca, v.albumin)), unit: 'mg/dL' }],
    note: 'Calculation: calcium + 0.8 × (4 − albumin), the Payne 1973 adjustment converted to mg/dL and g/dL.',
    refs: ['payne1973'], review: UNREVIEWED,
  },
  {
    id: 'sodium', name: 'Sodium, glucose-corrected',
    fields: [{ key: 'na', label: 'Measured sodium (mEq/L)', min: 90, max: 200 }, { key: 'glucose', label: 'Glucose (mg/dL)', min: 10, max: 3000 }],
    compute: (v) => [{ label: 'Corrected sodium (Hillier)', value: fix(l.correctedSodium(v.na, v.glucose)), unit: 'mEq/L' }],
    note: 'Calculation: sodium + 0.024 × (glucose − 100). Hillier 1999 measured 2.4 mEq/L per 100 mg/dL; the older Katz factor is 1.6.',
    refs: ['hillier1999'], review: UNREVIEWED,
  },
  {
    id: 'water', name: 'Free water deficit',
    fields: [
      { key: 'kg', label: 'Weight (kg)', min: 1, max: 400 },
      { key: 'na', label: 'Sodium (mEq/L)', min: 120, max: 200 },
      { key: 'fraction', label: 'Total body water fraction', options: [['0.6', 'Adult male or child, 0.6'], ['0.5', 'Adult female or older male, 0.5'], ['0.45', 'Older female, 0.45']] },
    ],
    compute: (v) => {
      const d = l.freeWaterDeficit(v.kg, Number(v.fraction), v.na);
      return [{ label: 'Free water deficit', value: fix(d, 2), unit: 'L' }];
    },
    note: 'Deficit = total body water × (Na ÷ 140 − 1). Total body water fractions: 0.6 for children and men, 0.5 for women and older men, 0.45 for older women (Adrogué and Madias 2000). A negative result means sodium is below 140.',
    refs: ['adrogue2000'], review: UNREVIEWED,
  },
  {
    id: 'gap', name: 'Anion gap',
    fields: [
      { key: 'na', label: 'Sodium (mEq/L)', min: 90, max: 200 }, { key: 'cl', label: 'Chloride (mEq/L)', min: 50, max: 160 },
      { key: 'hco3', label: 'Bicarbonate (mEq/L)', min: 1, max: 60 }, { key: 'albumin', label: 'Albumin (g/dL), optional', min: 0.5, max: 6, optional: true },
    ],
    compute: (v) => {
      const g = l.anionGap(v.na, v.cl, v.hco3);
      return [
        { label: 'Anion gap', value: fix(g), unit: 'mEq/L' },
        ...(v.albumin !== null ? [{ label: 'Albumin-corrected', value: fix(l.correctedAnionGap(g, v.albumin)), unit: 'mEq/L' }] : []),
      ];
    },
    note: 'Albumin correction: add 2.5 for each 1 g/dL that albumin is below 4 (Figge 1998). Reference ranges depend on the analyzer; use your lab’s range.',
    refs: ['emmett1977', 'figge1998', 'kraut2007'], review: UNREVIEWED,
  },
  {
    id: 'osm', name: 'Serum osmolality and osmolal gap',
    fields: [
      { key: 'na', label: 'Sodium (mEq/L)', min: 90, max: 200 }, { key: 'glucose', label: 'Glucose (mg/dL)', min: 10, max: 3000 },
      { key: 'bun', label: 'BUN (mg/dL)', min: 1, max: 300 }, { key: 'etoh', label: 'Ethanol (mg/dL), optional', min: 0, max: 1000, optional: true },
      { key: 'measured', label: 'Measured osmolality, optional', min: 150, max: 500, optional: true },
    ],
    compute: (v) => {
      const c = l.calculatedOsm(v.na, v.glucose, v.bun, v.etoh ?? 0);
      return [
        { label: 'Calculated osmolality', value: fix(c), unit: 'mOsm/kg' },
        ...(v.measured !== null ? [{ label: 'Osmolal gap', value: fix(v.measured - c), unit: 'mOsm/kg' }] : []),
      ];
    },
    note: 'Calculation: 2 × Na + glucose ÷ 18 + BUN ÷ 2.8 + ethanol ÷ 4.6 (molecular weights). Purssell 2001 measured a larger ethanol effect, ethanol ÷ 3.7. A gap over 10 is commonly treated as abnormal.',
    refs: ['smithline1976', 'purssell2001'], review: UNREVIEWED,
  },
  {
    id: 'iron', name: 'Iron deficit (Ganzoni)',
    fields: [
      { key: 'kg', label: 'Weight (kg)', min: 1, max: 400 }, { key: 'hb', label: 'Current hemoglobin (g/dL)', min: 1, max: 20 },
      { key: 'target', label: 'Target hemoglobin (g/dL)', min: 5, max: 20 }, { key: 'stores', label: 'Iron stores (mg), default 500', min: 0, max: 2000, optional: true },
    ],
    compute: (v) => [{ label: 'Total iron deficit', value: fix(l.ganzoni(v.kg, v.target, v.hb, v.stores ?? 500), 0), unit: 'mg' }],
    note: 'Calculation: weight × (target − current Hb) × 2.4 + stores. Smaller patients may need lower stores, such as 15 mg/kg under 35 kg. The source does not say which weight to use.',
    refs: ['ganzoni1970'], review: UNREVIEWED,
  },
  {
    id: 'qtc', name: 'QTc',
    fields: [{ key: 'qt', label: 'QT interval (ms)', min: 100, max: 900 }, { key: 'hr', label: 'Heart rate (bpm)', min: 20, max: 300 }],
    compute: (v) => {
      const q = l.qtc(v.qt, v.hr);
      return [
        { label: 'Bazett', value: fix(q.bazett, 0), unit: 'ms' },
        { label: 'Fridericia', value: fix(q.fridericia, 0), unit: 'ms' },
        { label: 'Framingham', value: fix(q.framingham, 0), unit: 'ms' },
        { label: 'Hodges', value: fix(q.hodges, 0), unit: 'ms' },
      ];
    },
    note: 'Bazett overcorrects at high heart rates and undercorrects at low ones. It works best between 50 and 70 bpm.',
    refs: ['bazett1920', 'fridericia1920', 'sagie1992', 'hodges1983', 'qtReview'], review: UNREVIEWED,
  },
  {
    id: 'meld', name: 'MELD 3.0',
    fields: [
      { key: 'bilirubin', label: 'Bilirubin (mg/dL)', min: 0.1, max: 80 }, { key: 'sodium', label: 'Sodium (mEq/L)', min: 90, max: 200 },
      { key: 'inr', label: 'INR', min: 0.5, max: 20 }, { key: 'creatinine', label: 'Creatinine (mg/dL)', min: 0.1, max: 30 },
      { key: 'albumin', label: 'Albumin (g/dL)', min: 0.5, max: 6 },
      { key: 'sex', label: 'Sex', options: [['M', 'Male'], ['F', 'Female']] },
      { key: 'dialysis', label: 'Two or more dialysis treatments in the past week', options: YES_NO },
    ],
    compute: (v) => [{ label: 'MELD 3.0', value: String(l.meld3({ ...v, female: v.sex === 'F', dialysis: v.dialysis === 'yes' })), unit: '' }],
    note: 'Values are bounded as published: bilirubin, creatinine, and INR at least 1; creatinine at most 3; sodium 125 to 137; albumin 1.5 to 3.5. Use a version without albumin if IV albumin was given recently.',
    refs: ['kim2021'], review: UNREVIEWED,
  },
];

export const PEDS_TOOLS = [
  {
    id: 'mivf', name: 'Maintenance IV fluids (4-2-1)',
    fields: [{ key: 'kg', label: 'Weight (kg)', min: 0.5, max: 150 }],
    compute: (v) => {
      const m = l.maintenanceFluids(v.kg);
      return [
        { label: 'Hourly rate', value: fix(m.hourly), unit: m.capped ? 'mL/h, at the 120 maximum' : 'mL/h' },
        { label: 'Daily volume, before hourly cap', value: fix(m.daily, 0), unit: 'mL/day' },
      ];
    },
    note: 'Holliday and Segar 1957: 100 mL/kg/day for the first 10 kg, 50 for the next 10, 20 for each kg above 20 (4-2-1 mL/kg/h). The hourly rate here stops at 120 mL/h, a common practice cap with no source in these papers. AAP 2018: isotonic fluid with appropriate KCl and dextrose from 28 days to 18 years. Replace ongoing losses separately.',
    refs: ['holliday1957', 'feld2018'], review: UNREVIEWED,
  },
];

const scale = (anchors, max = 7) => Array.from({ length: max + 1 }, (_, n) => [n, anchors[n] ? `${n}: ${anchors[n]}` : String(n)]);

export const SCORES = [
  {
    id: 'chadsvasc', name: 'CHA₂DS₂-VASc',
    items: [
      { key: 'chf', label: 'Heart failure or LV dysfunction', points: 1 },
      { key: 'htn', label: 'Hypertension', points: 1 },
      { key: 'age', label: 'Age', options: [[0, 'Under 65'], [1, '65 to 74'], [2, '75 or older']] },
      { key: 'dm', label: 'Diabetes', points: 1 },
      { key: 'stroke', label: 'Prior stroke, TIA, or thromboembolism', points: 2 },
      { key: 'vasc', label: 'Vascular disease', points: 1 },
      { key: 'female', label: 'Female sex', points: 1 },
    ],
    interp: () => 'This app does not give anticoagulation recommendations yet.',
    refs: ['lip2010'], review: UNREVIEWED,
  },
  {
    id: 'hasbled', name: 'HAS-BLED',
    items: [
      { key: 'h', label: 'Uncontrolled hypertension (systolic over 160)', points: 1 },
      { key: 'renal', label: 'Abnormal renal function', points: 1 },
      { key: 'liver', label: 'Abnormal liver function', points: 1 },
      { key: 's', label: 'Prior stroke', points: 1 },
      { key: 'b', label: 'Major bleeding or predisposition', points: 1 },
      { key: 'l', label: 'Labile INR', points: 1 },
      { key: 'e', label: 'Age over 65', points: 1 },
      { key: 'd', label: 'Antiplatelets or NSAIDs', points: 1 },
      { key: 'a', label: 'Alcohol, 8 or more drinks a week', points: 1 },
    ],
    interp: (t) => (t >= 3 ? 'High risk. Review modifiable factors and monitor closely. It does not by itself rule out anticoagulation.' : 'Below the high-risk threshold of 3.'),
    refs: ['pisters2010'], review: UNREVIEWED,
  },
  {
    id: 'childpugh', name: 'Child-Pugh',
    items: [
      { key: 'bili', label: 'Bilirubin (mg/dL)', options: [[1, 'Under 2'], [2, '2 to 3'], [3, 'Over 3']] },
      { key: 'alb', label: 'Albumin (g/dL)', options: [[1, 'Over 3.5'], [2, '2.8 to 3.5'], [3, 'Under 2.8']] },
      { key: 'inr', label: 'INR', options: [[1, 'Under 1.7'], [2, '1.7 to 2.3'], [3, 'Over 2.3']] },
      { key: 'asc', label: 'Ascites', options: [[1, 'None'], [2, 'Mild or controlled'], [3, 'Moderate to severe']] },
      { key: 'enc', label: 'Encephalopathy', options: [[1, 'None'], [2, 'Grade 1 to 2'], [3, 'Grade 3 to 4']] },
    ],
    interp: (t) => (t <= 6 ? 'Class A (5 to 6)' : t <= 9 ? 'Class B (7 to 9)' : 'Class C (10 to 15)'),
    refs: ['child1964', 'pugh1973'], review: UNREVIEWED,
  },
  {
    id: 'fourts', name: '4Ts (heparin-induced thrombocytopenia)',
    items: [
      { key: 'thromb', label: 'Thrombocytopenia', options: [[0, 'Fall under 30%, or nadir under 10'], [1, 'Fall 30% to 50%, or nadir 10 to 19'], [2, 'Fall over 50% and nadir 20 or higher']] },
      { key: 'timing', label: 'Timing of the platelet fall', options: [[0, 'Within 4 days with no recent heparin'], [1, 'Likely days 5 to 10 but unclear, after day 10, or within 1 day with heparin 30 to 100 days ago'], [2, 'Clear onset on days 5 to 10, or within 1 day with heparin in the past 30 days']] },
      { key: 'thrombosis', label: 'Thrombosis or other sequelae', options: [[0, 'None'], [1, 'Progressive or recurrent thrombosis, red skin lesions, or suspected but unproven thrombosis'], [2, 'New proven thrombosis, skin necrosis at injection sites, or acute reaction after IV heparin bolus']] },
      { key: 'other', label: 'Other causes of thrombocytopenia', options: [[0, 'Definite'], [1, 'Possible'], [2, 'None apparent']] },
    ],
    interp: (t) => (t <= 3 ? 'Low probability (0 to 3). A low score has a high negative predictive value; HIT testing is usually not needed.' : t <= 5 ? 'Intermediate probability (4 to 5). Send HIT testing and consider stopping heparin.' : 'High probability (6 to 8). Stop heparin, start a non-heparin anticoagulant, and send HIT testing.'),
    refs: ['lo2006', 'cuker2012'], review: UNREVIEWED,
  },
  {
    id: 'ciwa', name: 'CIWA-Ar',
    items: [
      { key: 'nausea', label: 'Nausea or vomiting', options: scale({ 0: 'None', 1: 'Mild nausea, no vomiting', 4: 'Intermittent nausea, dry heaves', 7: 'Constant nausea, dry heaves, vomiting' }) },
      { key: 'tremor', label: 'Tremor', options: scale({ 0: 'None', 1: 'Felt fingertip to fingertip', 4: 'Moderate, arms extended', 7: 'Severe, arms not extended' }) },
      { key: 'sweat', label: 'Paroxysmal sweats', options: scale({ 0: 'None', 1: 'Barely perceptible', 4: 'Beads on forehead', 7: 'Drenching' }) },
      { key: 'anx', label: 'Anxiety', options: scale({ 0: 'At ease', 1: 'Mildly anxious', 4: 'Moderately anxious or guarded', 7: 'Acute panic state' }) },
      { key: 'agit', label: 'Agitation', options: scale({ 0: 'Normal', 1: 'Somewhat more than normal', 4: 'Moderately fidgety', 7: 'Pacing or thrashing' }) },
      { key: 'tact', label: 'Tactile disturbances', options: scale({ 0: 'None', 1: 'Very mild', 2: 'Mild', 3: 'Moderate', 4: 'Moderately severe hallucinations', 5: 'Severe hallucinations', 6: 'Extremely severe hallucinations', 7: 'Continuous hallucinations' }) },
      { key: 'aud', label: 'Auditory disturbances', options: scale({ 0: 'None', 1: 'Very mild', 2: 'Mild', 3: 'Moderate', 4: 'Moderately severe hallucinations', 5: 'Severe hallucinations', 6: 'Extremely severe hallucinations', 7: 'Continuous hallucinations' }) },
      { key: 'vis', label: 'Visual disturbances', options: scale({ 0: 'None', 1: 'Very mild', 2: 'Mild', 3: 'Moderate', 4: 'Moderately severe hallucinations', 5: 'Severe hallucinations', 6: 'Extremely severe hallucinations', 7: 'Continuous hallucinations' }) },
      { key: 'head', label: 'Headache or fullness in head', options: scale({ 0: 'None', 1: 'Very mild', 7: 'Extremely severe' }) },
      { key: 'orient', label: 'Orientation', options: scale({ 0: 'Oriented, can do serial additions', 1: 'Cannot do additions or unsure of date', 2: 'Off date by 2 days or less', 3: 'Off date by more than 2 days', 4: 'Disoriented to place or person' }, 4) },
    ],
    interp: (t) => (t < 8 ? 'Minimal to mild. Below 10 usually needs no additional medication.' : t < 15 ? 'Moderate. Marked autonomic arousal.' : 'Severe. Risk of delirium tremens.'),
    note: 'Cut-offs vary between sources and protocols.',
    refs: ['sullivan1989', 'niaaaCiwa'], review: UNREVIEWED,
  },
  {
    id: 'cows', name: 'COWS',
    items: [
      { key: 'pulse', label: 'Resting pulse', options: [[0, '80 or below'], [1, '81 to 100'], [2, '101 to 120'], [4, 'Above 120']] },
      { key: 'gi', label: 'GI upset, past 30 min', options: [[0, 'None'], [1, 'Stomach cramps'], [2, 'Nausea or loose stool'], [3, 'Vomiting or diarrhea'], [5, 'Multiple episodes']] },
      { key: 'sweat', label: 'Sweating, past 30 min', options: [[0, 'No chills or flushing'], [1, 'Subjective chills or flushing'], [2, 'Flushed or moist face'], [3, 'Beads of sweat'], [4, 'Sweat streaming']] },
      { key: 'tremor', label: 'Tremor', options: [[0, 'None'], [1, 'Felt, not seen'], [2, 'Slight, observable'], [4, 'Gross tremor or twitching']] },
      { key: 'rest', label: 'Restlessness', options: [[0, 'Sits still'], [1, 'Difficulty, but can sit still'], [3, 'Frequent shifting'], [5, 'Cannot sit still']] },
      { key: 'yawn', label: 'Yawning', options: [[0, 'None'], [1, 'Once or twice'], [2, 'Three or more times'], [4, 'Several per minute']] },
      { key: 'pupil', label: 'Pupils', options: [[0, 'Normal or pinned'], [1, 'Possibly larger'], [2, 'Moderately dilated'], [5, 'Only iris rim visible']] },
      { key: 'anx', label: 'Anxiety or irritability', options: [[0, 'None'], [1, 'Reports increasing'], [2, 'Obviously irritable or anxious'], [4, 'Assessment difficult']] },
      { key: 'ache', label: 'Bone or joint aches', options: [[0, 'None'], [1, 'Mild discomfort'], [2, 'Severe aching'], [4, 'Rubbing joints, cannot sit still']] },
      { key: 'goose', label: 'Gooseflesh', options: [[0, 'Smooth'], [3, 'Felt or hairs standing'], [5, 'Prominent']] },
      { key: 'nose', label: 'Runny nose or tearing', options: [[0, 'None'], [1, 'Stuffy or moist eyes'], [2, 'Running or tearing'], [4, 'Constant running or streaming']] },
    ],
    interp: (t) => (t < 5 ? 'Below the mild range (5 to 12).' : t <= 12 ? 'Mild' : t <= 24 ? 'Moderate' : t <= 36 ? 'Moderately severe' : 'Severe'),
    refs: ['wesson2003', 'nidaCows'], review: UNREVIEWED,
  },
];

export const TOOL_ITEMS = [...LAB_TOOLS, ...PEDS_TOOLS, ...SCORES];
