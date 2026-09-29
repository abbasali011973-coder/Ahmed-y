export interface SubjectItem {
  id: string;
  name: string;
  nameBn: string;
  ic: string;
  group: 'General' | 'Science' | 'Arts' | 'Commerce';
}

export interface ChapterItem {
  id: string;
  name: string;
  nameBn: string;
  topics: string[];
}

export interface FormulaItem {
  id: string;
  subject: string;
  expr: string;
  meaning: string;
  meaningBn: string;
  vars: string;
  when: string;
  example: string;
}

export interface NoteItem {
  id: string;
  subject: string;
  classLevel: number;
  title: string;
  titleBn: string;
  tabs: {
    summary: string;
    keyPoints: string[];
    examTips: string;
    revision: string;
  };
}

export const CLASSES = [6, 7, 8, 9, 10, 11, 12];

export const GROUPS_FOR_CLASS = (cls: number): Array<'General' | 'Science' | 'Arts' | 'Commerce'> => {
  return cls >= 9 ? ['Science', 'Commerce', 'Arts'] : ['General'];
};

export const SUBJECTS: Record<string, SubjectItem[]> = {
  General: [
    { id: 'bangla', name: 'Bangla', nameBn: 'বাংলা', ic: '📖', group: 'General' },
    { id: 'english', name: 'English', nameBn: 'ইংরেজি', ic: '🔤', group: 'General' },
    { id: 'math', name: 'General Mathematics', nameBn: 'সাধারণ গণিত', ic: '📐', group: 'General' },
    { id: 'science', name: 'General Science', nameBn: 'সাধারণ বিজ্ঞান', ic: '🔬', group: 'General' },
    { id: 'bgs', name: 'Bangladesh & Global Studies', nameBn: 'বাংলাদেশ ও বিশ্বপরিচয়', ic: '🌍', group: 'General' },
    { id: 'ict', name: 'ICT', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', ic: '💻', group: 'General' },
  ],
  Science: [
    { id: 'physics', name: 'Physics', nameBn: 'পদার্থবিজ্ঞান', ic: '⚛️', group: 'Science' },
    { id: 'chemistry', name: 'Chemistry', nameBn: 'রসায়ন', ic: '🧪', group: 'Science' },
    { id: 'biology', name: 'Biology', nameBn: 'জীববিজ্ঞান', ic: '🧬', group: 'Science' },
    { id: 'higher_math', name: 'Higher Mathematics', nameBn: 'উচ্চতর গণিত', ic: '📐', group: 'Science' },
    { id: 'ict_sci', name: 'ICT', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', ic: '💻', group: 'Science' },
  ],
  Commerce: [
    { id: 'accounting', name: 'Accounting', nameBn: 'হিসাববিজ্ঞান', ic: '🧾', group: 'Commerce' },
    { id: 'finance', name: 'Finance & Banking', nameBn: 'ফিন্যান্স ও ব্যাংকিং', ic: '🏦', group: 'Commerce' },
    { id: 'business', name: 'Business Entrepreneurship', nameBn: 'ব্যবসায় উদ্যোগ', ic: '💼', group: 'Commerce' },
    { id: 'economics_com', name: 'Economics', nameBn: 'অর্থনীতি', ic: '📈', group: 'Commerce' },
  ],
  Arts: [
    { id: 'history', name: 'History of Bangladesh', nameBn: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', ic: '🏛️', group: 'Arts' },
    { id: 'civics', name: 'Civics & Citizenship', nameBn: 'পৌরনীতি ও নাগরিকতা', ic: '⚖️', group: 'Arts' },
    { id: 'geography', name: 'Geography & Environment', nameBn: 'ভূগোল ও পরিবেশ', ic: '🗺️', group: 'Arts' },
    { id: 'economics_art', name: 'Economics', nameBn: 'অর্থনীতি', ic: '📈', group: 'Arts' },
    { id: 'logic', name: 'Logic', nameBn: 'যুক্তিবিদ্যা (একাদশ-দ্বাদশ)', ic: '🧠', group: 'Arts' },
  ],
};

export const CHAPTERS: Record<string, ChapterItem[]> = {
  Physics: [
    {
      id: 'p-1',
      name: 'Physical Quantities & Measurement',
      nameBn: 'ভৌত রাশি ও পরিমাপ',
      topics: ['Physical quantities & units', 'Vernier caliper & screw gauge', 'Measurement errors'],
    },
    {
      id: 'p-2',
      name: 'Motion',
      nameBn: 'গতি',
      topics: ['Distance & displacement', 'Speed & velocity', 'Acceleration & equations of motion', 'Freely falling bodies'],
    },
    {
      id: 'p-3',
      name: 'Force & Laws of Motion',
      nameBn: 'বল ও নিউটনের গতিসূত্র',
      topics: ['Inertia & Newton’s 1st law', 'Newton’s 2nd law (F=ma)', 'Newton’s 3rd law', 'Momentum & friction'],
    },
    {
      id: 'p-4',
      name: 'Work, Power & Energy',
      nameBn: 'কাজ, ক্ষমতা ও শক্তি',
      topics: ['Work definition & calculation', 'Kinetic & Potential energy', 'Conservation of energy', 'Efficiency'],
    },
    {
      id: 'p-5',
      name: 'Pressure & States of Matter',
      nameBn: 'পদার্থের অবস্থা ও চাপ',
      topics: ['Pressure & density', 'Pascal’s principle & hydraulics', 'Archimedes’ principle & buoyancy'],
    },
  ],
  Chemistry: [
    {
      id: 'c-1',
      name: 'Concepts of Chemistry',
      nameBn: 'রসায়নের ধারণা',
      topics: ['Scope of chemistry', 'Laboratory safety signs', 'Chemical hazards'],
    },
    {
      id: 'c-2',
      name: 'States of Matter & Diffusion',
      nameBn: 'পদার্থের অবস্থা',
      topics: ['Kinetic theory of particles', 'Diffusion & effusion (Graham’s law)', 'Melting & boiling curves'],
    },
    {
      id: 'c-3',
      name: 'Structure of Atom',
      nameBn: 'পরমাণুর গঠন',
      topics: ['Rutherford & Bohr atomic model', 'Isotopes & atomic mass calculation', 'Electronic configuration & Aufbau rule'],
    },
    {
      id: 'c-4',
      name: 'Periodic Table',
      nameBn: 'পর্যায় সারণি',
      topics: ['Periodic trends', 'Atomic radius & electronegativity', 'Ionization energy'],
    },
    {
      id: 'c-5',
      name: 'Chemical Bond & Mole Concept',
      nameBn: 'রাসায়নিক বন্ধন ও মোলের ধারণা',
      topics: ['Ionic & covalent bonds', 'Mole calculations & Avogadro number', 'Molar volume & stoichiometry'],
    },
  ],
  Biology: [
    {
      id: 'b-1',
      name: 'Lessons on Life',
      nameBn: 'জীবন পাঠ',
      topics: ['Five kingdom classification', 'Binomial nomenclature (ICZN & ICBN)', 'Scientific names of species'],
    },
    {
      id: 'b-2',
      name: 'Cells & Tissues',
      nameBn: 'জীবকোষ ও টিস্যু',
      topics: ['Plant vs animal cell structure', 'Mitochondria & plastids', 'Plant & animal tissues'],
    },
    {
      id: 'b-3',
      name: 'Cell Division',
      nameBn: 'কোষ বিভাজন',
      topics: ['Amitosis', 'Mitosis stages (Prophase to Telophase)', 'Meiosis & significance'],
    },
    {
      id: 'b-4',
      name: 'Bioenergetics',
      nameBn: 'জীবনীশক্তি',
      topics: ['ATP as energy currency', 'Photosynthesis (light & dark reaction)', 'Aerobic & anaerobic respiration'],
    },
  ],
  'Higher Mathematics': [
    {
      id: 'hm-1',
      name: 'Set and Function',
      nameBn: 'সেট ও ফাংশন',
      topics: ['Venn diagrams', 'Subsets & Cartesian product', 'One-to-one & onto functions'],
    },
    {
      id: 'hm-2',
      name: 'Algebraic Expressions',
      nameBn: 'বীজগাণিতিক রাশি',
      topics: ['Remainder theorem', 'Factor theorem', 'Partial fractions'],
    },
    {
      id: 'hm-3',
      name: 'Geometry & Vectors',
      nameBn: 'জ্যামিতি ও ভেক্টর',
      topics: ['Apollonius theorem', 'Vector addition & scalar multiplication', 'Coordinate geometry'],
    },
    {
      id: 'hm-4',
      name: 'Trigonometry',
      nameBn: 'ত্রিকোণমিতি',
      topics: ['Radian measurement (s = rθ)', 'Trigonometric ratios of associated angles', 'Identities & equations'],
    },
  ],
  'General Mathematics': [
    {
      id: 'gm-1',
      name: 'Real Numbers',
      nameBn: 'বাস্তব সংখ্যা',
      topics: ['Classification of real numbers', 'Rational vs irrational proofs', 'Recurring decimals'],
    },
    {
      id: 'gm-2',
      name: 'Sets and Functions',
      nameBn: 'সেট ও ফাংশন',
      topics: ['Set builder notation', 'Union & intersection', 'Domain & Range'],
    },
    {
      id: 'gm-3',
      name: 'Algebraic Formulae',
      nameBn: 'বীজগাণিতিক রাশি',
      topics: ['Square & cube formulas', 'Factorization', 'Value evaluation'],
    },
    {
      id: 'gm-4',
      name: 'Trigonometric Ratio',
      nameBn: 'ত্রিকোণমিতিক অনুপাত',
      topics: ['sin, cos, tan definitions', 'Angle values (0°, 30°, 45°, 60°, 90°)', 'Height and distance problems'],
    },
  ],
  Accounting: [
    {
      id: 'acc-1',
      name: 'Introduction to Accounting',
      nameBn: 'হিসাববিজ্ঞানের পরিচিতি',
      topics: ['Nature & scope', 'Internal & external users', 'Accounting information system'],
    },
    {
      id: 'acc-2',
      name: 'Transactions & Equation',
      nameBn: 'লেনদেন ও হিসাব সমীকরণ',
      topics: ['Identifying transactions', 'Assets = Liabilities + Equity proof', 'Events vs transactions'],
    },
    {
      id: 'acc-3',
      name: 'Double Entry System & Journal',
      nameBn: 'দুতরফা দাখিলা পদ্ধতি ও জাবেদা',
      topics: ['Debit and credit rules', 'Special journals', 'Cash book & sales ledger'],
    },
    {
      id: 'acc-4',
      name: 'Trial Balance & Financial Statements',
      nameBn: 'রেওয়ামিল ও আর্থিক বিবরণী',
      topics: ['Trial balance errors', 'Income statement', 'Balance sheet preparation'],
    },
  ],
  'Finance & Banking': [
    {
      id: 'fin-1',
      name: 'Time Value of Money',
      nameBn: 'অর্থের সময়মূল্য',
      topics: ['Present value & Future value', 'Compound interest formula', 'Rule of 72'],
    },
    {
      id: 'fin-2',
      name: 'Commercial & Central Banking',
      nameBn: 'বাণিজ্যিক ব্যাংক ও বাংলাদেশ ব্যাংক',
      topics: ['Functions of commercial banks', 'Credit creation', 'Central bank monetary policy'],
    },
  ],
  'General Science': [
    {
      id: 'gs-1',
      name: 'Healthy Living',
      nameBn: 'উন্নততর জীবনধারা',
      topics: ['Food nutrients & vitamins', 'BMI calculation & balanced diet', 'Addiction hazards'],
    },
    {
      id: 'gs-2',
      name: 'Water & Environment',
      nameBn: 'পানি ও পরিবেশ',
      topics: ['Water cycle', 'Water pollution & purification', 'Wetlands of Bangladesh'],
    },
  ],
};

export const FORMULAS: FormulaItem[] = [
  {
    id: 'f-1',
    subject: 'Physics',
    expr: 'F = ma',
    meaning: "Newton's Second Law of Motion",
    meaningBn: 'নিউটনের গতির দ্বিতীয় সূত্র (বল ও ত্বরণ সম্পর্ক)',
    vars: 'F = force (N), m = mass (kg), a = acceleration (m/s²)',
    when: 'Used to calculate force, mass, or acceleration when an unbalanced force acts on an object.',
    example: 'A 4 kg block pushed with acceleration 3 m/s² requires F = 4 × 3 = 12 N.',
  },
  {
    id: 'f-2',
    subject: 'Physics',
    expr: 'W = Fs cos(θ)',
    meaning: 'Work Done by a Constant Force',
    meaningBn: 'বল দ্বারা সম্পাদিত কাজ',
    vars: 'W = work (J), F = force (N), s = displacement (m), θ = angle between force and displacement',
    when: 'Calculating mechanical work when displacement occurs at an angle θ.',
    example: 'Pulling a cart with 20 N horizontally over 5 m gives W = 20 × 5 = 100 Joules.',
  },
  {
    id: 'f-3',
    subject: 'Physics',
    expr: 'E_k = ½ mv²',
    meaning: 'Kinetic Energy of a Moving Body',
    meaningBn: 'গতিশক্তি পরিমাপের সমীকরণ',
    vars: 'E_k = kinetic energy (J), m = mass (kg), v = velocity (m/s)',
    when: 'Finding energy possessed by a body due to its motion in mechanics problems.',
    example: 'A 1000 kg car moving at 20 m/s has E_k = ½ × 1000 × 20² = 200,000 J (200 kJ).',
  },
  {
    id: 'f-4',
    subject: 'Physics',
    expr: 'v² = u² + 2as',
    meaning: 'Third Equation of Uniformly Accelerated Motion',
    meaningBn: 'সমত্বরণে গতির তৃতীয় সমীকরণ',
    vars: 'v = final velocity (m/s), u = initial velocity (m/s), a = acceleration (m/s²), s = distance (m)',
    when: 'Finding velocity or distance without needing the time duration t.',
    example: 'Dropped from rest (u=0), falling 20 m with g=9.8: v² = 2 × 9.8 × 20 = 392 ➔ v ≈ 19.8 m/s.',
  },
  {
    id: 'f-5',
    subject: 'Chemistry',
    expr: 'n = w / M = N / N_A = V / 22.4',
    meaning: 'Master Mole Conversion Formula',
    meaningBn: 'মোলের সমন্বিত রূপান্তর সূত্র',
    vars: 'n = moles, w = mass (g), M = molar mass (g/mol), N = particle count, N_A = 6.022×10²³, V = gas vol at STP (L)',
    when: 'Converting between grams, particles, volume, and moles in stoichiometry questions.',
    example: '44 g of CO₂ (M = 44) = 1 mole = 6.022 × 10²³ molecules = 22.4 L at STP.',
  },
  {
    id: 'f-6',
    subject: 'Chemistry',
    expr: 'PV = nRT',
    meaning: 'Ideal Gas Law Equation',
    meaningBn: 'আদর্শ গ্যাস সমীকরণ',
    vars: 'P = pressure (atm or Pa), V = volume (L or m³), n = moles, R = 0.0821 L·atm/(mol·K) or 8.314 J/(mol·K), T = Kelvin temp',
    when: 'Relating thermodynamic state variables of any ideal or non-polar gas.',
    example: 'Determining the volume of 2 moles of gas at 1 atm and 300 K.',
  },
  {
    id: 'f-7',
    subject: 'Mathematics',
    expr: 'x = (-b ± √(b² - 4ac)) / 2a',
    meaning: 'Quadratic Equation Solution Formula (Sridhar Acharya)',
    meaningBn: 'দ্বিঘাত সমীকরণ সমাধানের শ্রীধর আচার্যের সূত্র',
    vars: 'ax² + bx + c = 0, D = b² - 4ac (discriminant)',
    when: 'Finding real or complex roots when polynomial cannot be easily factorized.',
    example: 'For x² - 5x + 6 = 0: x = (5 ± √(25 - 24))/2 = (5 ± 1)/2 ➔ x = 3 or x = 2.',
  },
  {
    id: 'f-8',
    subject: 'Mathematics',
    expr: 'sin²θ + cos²θ = 1',
    meaning: 'Fundamental Pythagorean Trigonometric Identity',
    meaningBn: 'মৌলিক ত্রিকোণমিতিক অভেদ',
    vars: 'θ = any real angle',
    when: 'Proving trigonometric identities or calculating cosθ when sinθ is given.',
    example: 'If sinθ = 3/5, cos²θ = 1 - 9/25 = 16/25 ➔ cosθ = 4/5 in the first quadrant.',
  },
  {
    id: 'f-9',
    subject: 'Mathematics',
    expr: 's = rθ',
    meaning: 'Circular Arc Length Formula',
    meaningBn: 'বৃত্তচাপের দৈর্ঘ্য নির্ণয়ের সূত্র',
    vars: 's = arc length, r = radius, θ = angle subtended at center in Radians',
    when: 'Calculating distance travelled along circular tracks in trigonometry & geometry.',
    example: 'Radius r = 7 m, central angle θ = 1.5 rad gives arc length s = 7 × 1.5 = 10.5 m.',
  },
  {
    id: 'f-10',
    subject: 'Accounting',
    expr: 'Assets = Liabilities + Owner’s Equity',
    meaning: 'The Fundamental Accounting Equation',
    meaningBn: 'মৌলিক হিসাব সমীকরণ (দুতরফা দাখিলা)',
    vars: 'A = L + (Capital + Revenue - Expenses - Drawings)',
    when: 'Checking the balance sheet equation and verifying debit/credit effects.',
    example: 'Buying machinery for ৳50,000 cash changes asset composition but keeps A = L + OE balanced.',
  },
  {
    id: 'f-11',
    subject: 'Finance',
    expr: 'FV = PV(1 + r)ⁿ',
    meaning: 'Future Value with Compound Interest',
    meaningBn: 'চক্রবৃদ্ধি সুদে অর্থের ভবিষ্যৎ মূল্য',
    vars: 'FV = future value, PV = present value, r = interest rate per period, n = number of periods',
    when: 'Calculating investment growth or loan repayment amounts over years.',
    example: 'Investing ৳10,000 at 10% compound interest for 2 years gives FV = 10000(1.10)² = ৳12,100.',
  },
  {
    id: 'f-12',
    subject: 'Biology',
    expr: '6CO₂ + 12H₂O ➔ C₆H₁₂O₆ + 6H₂O + 6O₂',
    meaning: 'Overall Photosynthesis Reaction',
    meaningBn: 'সালোকসংশ্লেষণের সামগ্রিক রাসায়নিক সমীকরণ',
    vars: 'Carbon dioxide + Water + Light (Chlorophyll) ➔ Glucose + Water + Oxygen',
    when: 'Describing how autotrophic green plants convert solar into biochemical energy.',
    example: 'Essential equation required in every Class 9-10 Biology exam question on bioenergetics.',
  },
];

export const HAND_NOTES: NoteItem[] = [
  {
    id: 'n-1',
    subject: 'Physics',
    classLevel: 9,
    title: "Newton's Laws of Motion & Momentum",
    titleBn: 'নিউটনের গতিসূত্র ও ভরবেগ',
    tabs: {
      summary: 'Sir Isaac Newton formulated three fundamental laws of motion that govern classic kinematics and dynamics: 1st Law defines inertia and force qualitatively; 2nd Law states F = ma; 3rd Law states every action has an equal and opposite reaction.',
      keyPoints: [
        'Inertia is the inherent tendency of an object to resist changes in its state of rest or motion.',
        'Mass is the quantitative measure of inertia.',
        'Linear momentum p = mv is always conserved in a closed isolated system without external force (m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂).',
        'Friction is a contact force opposing relative motion; static friction is greater than kinetic friction.',
      ],
      examTips: 'In board exams, always draw a clear free-body diagram showing force arrows. Remember that action and reaction act on two DIFFERENT bodies, so they never cancel each other out.',
      revision: 'F = ma | Momentum p = mv | Equal & opposite reaction on distinct bodies.',
    },
  },
  {
    id: 'n-2',
    subject: 'Chemistry',
    classLevel: 10,
    title: 'The Mole Concept & Stoichiometry',
    titleBn: 'মোলের ধারণা ও রাসায়নিক গণনা',
    tabs: {
      summary: 'The mole acts as the bridge connecting the micro-world of atoms and molecules to the macro-world of grams and liters. One mole of any substance contains 6.022 × 10²³ particles and occupies 22.4 liters at standard temperature and pressure (STP).',
      keyPoints: [
        'Molar mass in grams equals the relative atomic or formula mass of the substance.',
        'Number of moles n = w/M = N/N_A = V/22.4.',
        'Molarity (S) = (w × 1000) / (M × V_mL), representing moles per liter of solution.',
        'Limiting reactant is the reactant that is completely consumed first, dictating maximum product yield.',
      ],
      examTips: 'Always balance the chemical equation before doing any molar ratio calculations. State units (grams, moles, liters, mol/L) in every calculation step.',
      revision: '1 mole = molar mass (g) = 6.022×10²³ particles = 22.4 L (at STP).',
    },
  },
  {
    id: 'n-3',
    subject: 'Accounting',
    classLevel: 11,
    title: 'Double Entry System & Accounting Equation',
    titleBn: 'দুতরফা দাখিলা ও হিসাব সমীকরণ',
    tabs: {
      summary: 'The dual-aspect principle dictates that every financial transaction affects at least two accounts in opposite and equal proportions. Assets are funded either through external liabilities or owner’s internal equity.',
      keyPoints: [
        'Assets = Liabilities + Owner’s Equity (A = L + OE).',
        'Expanded: Assets = Liabilities + Capital + Revenue - Expenses - Drawings.',
        'Debit increases Assets and Expenses; Credit increases Liabilities, Capital, and Revenue.',
        'The Trial Balance proves mathematical accuracy but cannot detect errors of omission or principle.',
      ],
      examTips: 'When analyzing transactions, first ask: Which two items changed? Did assets increase or decrease? Does the accounting equation remain equal on both sides?',
      revision: 'Every Debit must have an equal Credit. Assets = Liabilities + Equity.',
    },
  },
  {
    id: 'n-4',
    subject: 'Higher Mathematics',
    classLevel: 10,
    title: 'Trigonometric Ratios & Angle Geometry',
    titleBn: 'ত্রিকোণমিতিক অনুপাত ও কোণের পরিমাপ',
    tabs: {
      summary: 'Trigonometry studies the quantitative relationships between angles and lengths of sides in triangles, extended to all four quadrants in circular coordinate systems using radian measure.',
      keyPoints: [
        '1 Radian = 180° / π ≈ 57.2958°. Arc length s = rθ when θ is in radians.',
        'All Sin Tan Cos rule determines signs across Quadrants I, II, III, and IV.',
        'Key identities: sin²θ + cos²θ = 1; sec²θ - tan²θ = 1; cosec²θ - cot²θ = 1.',
        'Compound angles: sin(A ± B) = sinA cosB ± cosA sinB.',
      ],
      examTips: 'Make sure your calculator is in DEGREE mode for degree questions and RADIAN mode for radian questions. Show intermediate algebraic steps.',
      revision: 's = rθ | sin²θ + cos²θ = 1 | Check quadrant signs carefully.',
    },
  },
];

export const FAQS = [
  {
    q: 'Is BrainyBee really free to use?',
    a: 'Yes, 100%! The core AI Teacher doubt-solving, chapter-by-chapter explanations, Hand Notes for all subjects, and the complete Laws & Formulas library are free for every student across Bangladesh. Premium is optional and unlocks timed mock tests, board-standard practice exams, and in-depth weak-topic analytics.',
  },
  {
    q: 'Which classes and curriculums are covered?',
    a: 'BrainyBee covers Class 6 through Class 12, strictly aligned with Bangladesh’s National Curriculum and Textbook Board (NCTB) syllabus across Science, Arts, Commerce, and General groups.',
  },
  {
    q: 'Can I study in Bangla, English, or mixed mode?',
    a: 'Absolutely! BrainyBee features a native language switch. You can get explanations in pure Bangla (বাংলা), pure English, or a balanced bilingual mode (বাংলা + English) which Bangladeshi students find most helpful for technical terms.',
  },
  {
    q: 'How does BrainyBee explain topics like a real teacher?',
    a: 'Unlike generic chatbots that output long unstructured text, BrainyBee breaks down every concept through an 8-pillar teacher methodology: 1) Simple explanation, 2) Academic concept, 3) Formulas with symbols, 4) Real-life Bangladeshi analogy, 5) Step-by-step working, 6) Board exam-ready answer, 7) Common mistakes to avoid, and 8) A 1-line quick revision recap.',
  },
  {
    q: 'How does the 10% first-time discount work?',
    a: 'First-time subscribers receive an immediate 10% discount on both plans: Monthly is discounted from ৳99 to ৳89.10/month, and Yearly is discounted from ৳999 to ৳899.10/year (under ৳75/month).',
  },
  {
    q: 'Which payment methods are accepted in Bangladesh?',
    a: 'BrainyBee supports all leading Bangladeshi payment methods including bKash, Nagad, and direct Bank Transfer with instant account activation.',
  },
];
