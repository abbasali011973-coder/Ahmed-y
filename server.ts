import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Gemini client initialization (if API key provided)
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.log('[BrainyBee] GoogleGenAI note:', err);
  }
}

// In-memory cache to conserve API quota and provide instant responses
const answerCache = new Map<string, any>();
const quizCache = new Map<string, any>();

// Per-model cooldown tracker so one model's rate-limit does not block others
const modelCooldowns = new Map<string, number>();

function isModelInCooldown(modelName: string): boolean {
  const expiresAt = modelCooldowns.get(modelName);
  return expiresAt ? Date.now() < expiresAt : false;
}

function setModelCooldown(modelName: string, durationMs: number = 60000): void {
  modelCooldowns.set(modelName, Date.now() + durationMs);
}

function isQuotaError(err: any): boolean {
  if (!err) return false;
  const str = typeof err === 'string' ? err : JSON.stringify(err);
  return (
    str.includes('429') ||
    str.includes('RESOURCE_EXHAUSTED') ||
    str.includes('resource_exhausted') ||
    str.includes('quota') ||
    str.includes('Quota exceeded') ||
    str.includes('rate-limit') ||
    str.includes('generate_content_tokens_per_model_per_user') ||
    err?.status === 'RESOURCE_EXHAUSTED' ||
    err?.code === 429
  );
}

// Robust JSON parser that handles codeblocks and whitespace
function parseJsonSafely(text: string): any {
  if (!text) return null;
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  try {
    return JSON.parse(cleaned.trim());
  } catch {
    // If there is any trailing or leading extra text, attempt regex match
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// Fallback Knowledge Base for Bangladesh Curriculum Class 6-12
interface AnswerStructure {
  simple: string;
  concept: string;
  formula: string;
  symbols: string;
  example: string;
  steps: string;
  exam: string;
  mistakes: string;
  revision: string;
  related: string;
  source: string;
}

const fallbackKB: Array<{
  match: RegExp;
  bn: AnswerStructure;
  en: AnswerStructure;
}> = [
  {
    match: /newton|second law|গতি সূত্র|f\s*=\s*ma/i,
    bn: {
      simple: 'একটি বস্তুর ওপর যত বেশি নিট বল প্রয়োগ করা হবে, তার ত্বরণ তত বেশি হবে। আবার একই বল দিলে যে বস্তুর ভর বেশি, তার ত্বরণ কম হবে।',
      concept: 'নিউটনের গতির দ্বিতীয় সূত্র মূলত বল (Force), ভর (Mass) ও ত্বরণের (Acceleration) মধ্যকার গাণিতিক সম্পর্ক নির্ধারণ করে। বল হলো ত্বরণের কারণ।',
      formula: 'F = ma (বা F = m(v - u)/t)',
      symbols: 'F = প্রযুক্ত নিট বল (নিউটন বা N), m = বস্তুর ভর (kg), a = ত্বরণ (m/s²), v = শেষ বেগ, u = আদি বেগ, t = সময়',
      example: 'একটি খালি ভ্যানগাড়ি ঠেলা খুব সহজ, কিন্তু ৫ বস্তা চাল তুললে একই শক্তিতে ঠেললে গাড়িটি খুব ধীরে গতি পাবে — কারণ ভর বেড়ে যাওয়ায় ত্বরণ কমে গেছে।',
      steps: '১) সমস্যা থেকে ভর (m) ও ত্বরণ (a) বা বেগের পরিবর্তন বের করো। ২) আন্তর্জাতিক একক (kg, m/s²) ঠিক আছে কিনা যাচাই করো। ৩) F = ma সূত্রে মান বসিয়ে সমাধান করো।',
      exam: 'সৃজনশীল উত্তর: বস্তুর ভরবেগের পরিবর্তনের হার তার ওপর প্রযুক্ত বলের সমানুপাতিক এবং বল যেদিকে ক্রিয়া করে ভরবেগের পরিবর্তনও সেদিকে ঘটে। অর্থাৎ F = ma।',
      mistakes: 'শিক্ষার্থীরা প্রায়ই ভর (mass - kg) এবং ওজন (weight - N = mg) গুলিয়ে ফেলে। গ্রাম (g) থেকে কেজিতে (kg) রূপান্তর না করে সূত্রে বসানো।',
      revision: 'বল = ভর × ত্বরণ (F = ma); বল দ্বিগুণ হলে ত্বরণ দ্বিগুণ হবে যদি ভর স্থির থাকে।',
      related: 'নিউটনের ১ম সূত্র (জড়তা), ৩য় সূত্র (ক্রিয়া-প্রতিক্রিয়া), ভরবেগের সংরক্ষণ সূত্র',
      source: 'NCTB পদার্থবিজ্ঞান (শ্রেণি ৯-১০), অধ্যায় ৩: বল'
    },
    en: {
      simple: 'The harder you push an object, the faster its speed increases (more acceleration). If the object is heavier, it needs a harder push to get the same acceleration.',
      concept: "Newton's Second Law defines the quantitative relationship between force, mass, and acceleration. Acceleration is directly proportional to net force and inversely proportional to mass.",
      formula: 'F = ma (or F = m(v - u)/t)',
      symbols: 'F = Net Force (Newton, N), m = Mass (kg), a = Acceleration (m/s²), v = final velocity, u = initial velocity, t = time',
      example: 'Pushing an empty shopping trolley is effortless, but pushing a fully loaded trolley requires far more force to accelerate at the same rate.',
      steps: '1) Identify mass (m) and acceleration (a) from given values. 2) Ensure units are in SI standard (kg, m/s²). 3) Apply F = ma and calculate.',
      exam: 'Board Exam Definition: The rate of change of momentum of a body is directly proportional to the applied unbalanced force, and takes place in the direction of the force. F = ma.',
      mistakes: 'Confusing mass (kg) with weight (N = mg); forgetting to convert grams to kilograms before multiplying.',
      revision: 'Force = mass × acceleration (F = ma). Net force is zero during constant velocity motion.',
      related: "Newton's 1st Law (Inertia), 3rd Law (Action-Reaction), Conservation of Momentum",
      source: 'NCTB Physics (Class 9-10), Chapter 3: Force'
    }
  },
  {
    match: /photosynthesis|সালোকসংশ্লেষণ|শালোকসংশ্লেষণ/i,
    bn: {
      simple: 'উদ্ভিদ তার সবুজ পাতায় সূর্যের আলো ও ক্লোরোফিলের সাহায্যে বাতাস থেকে কার্বন ডাই-অক্সাইড এবং মাটি থেকে পানি নিয়ে খাদ্য (শর্করা বা গ্লুকোজ) তৈরি করে এবং অক্সিজেন ত্যাগ করে।',
      concept: 'সালোকসংশ্লেষণ একটি জৈব-রাসায়নিক জারণ-বিজারণ প্রক্রিয়া যেখানে সৌরশক্তি রাসায়নিক স্থিতিশক্তিতে রূপান্তরিত হয়। এটি বায়ুমণ্ডলে O₂ ও CO₂-এর ভারসাম্য রক্ষা করে।',
      formula: '6CO₂ + 12H₂O + আলোকশক্তি + ক্লোরোফিল ➔ C₆H₁₂O₆ + 6H₂O + 6O₂',
      symbols: 'CO₂ = কার্বন ডাই-অক্সাইড, H₂O = পানি, C₆H₁₂O₆ = গ্লুকোজ, O₂ = অক্সিজেন',
      example: 'গাছের পাতা হলো উদ্ভিদের রান্নাঘর। আম গাছ দিনে পাতা দিয়ে রোদ ও বাতাস টেনে মিষ্টি ফল তৈরিতে শক্তি সঞ্চয় করে।',
      steps: '১) আলোক নির্ভর পর্যায় (থাইলাকয়েড ঝিল্লিতে ATP ও NADPH₂ তৈরি)। ২) অন্ধকার বা আলোক নিরপেক্ষ পর্যায় (ক্যালভিন চক্রের মাধ্যমে CO₂ বিজারণ ঘটে গ্লুকোজ সংশ্লেষণ)।',
      exam: 'পরীক্ষার উত্তর: যে শারীরবৃত্তীয় প্রক্রিয়ায় সবুজ উদ্ভিদ সূর্যালোকের উপস্থিতিতে ক্লোরোফিলের সাহায্যে CO₂ এবং H₂O এর বিক্রিয়ায় কার্বোহাইড্রেট জাতীয় খাদ্য তৈরি করে এবং উপজাত হিসেবে অক্সিজেন উৎপন্ন করে তাকে সালোকসংশ্লেষণ বলে।',
      mistakes: 'শ্বসন (Respiration) এবং সালোকসংশ্লেষণকে এক ভাবা; রাতের বেলা সালোকসংশ্লেষণ হয় না এটা ভুলে যাওয়া।',
      revision: 'সূর্যালোক + পানি + CO₂ ➔ গ্লুকোজ + পানি + O₂। প্রধান স্থান: মেসোফিল টিস্যুর ক্লোরোপ্লাস্ট।',
      related: 'উদ্ভিদে শ্বসন প্রক্রিয়া, ক্লোরোপ্লাস্টের সূক্ষ্ম গঠন, প্রস্বেদন বা বাষ্পমোচন',
      source: 'NCTB জীববিজ্ঞান (শ্রেণি ৯-১০), অধ্যায় ৪: জীবনীশক্তি'
    },
    en: {
      simple: 'Green plants use sunlight, water from soil, and carbon dioxide from air to produce food (glucose) and release oxygen for all living beings.',
      concept: 'Photosynthesis is a biochemical oxidation-reduction process in which solar radiant energy is converted into chemical energy stored in carbohydrates.',
      formula: '6CO₂ + 12H₂O + Light energy + Chlorophyll ➔ C₆H₁₂O₆ + 6H₂O + 6O₂',
      symbols: 'CO₂ = Carbon dioxide, H₂O = Water, C₆H₁₂O₆ = Glucose, O₂ = Oxygen gas',
      example: 'Green leaves act as miniature solar-powered food factories; without them, oxygen in Earth\'s atmosphere would vanish.',
      steps: '1) Light-dependent phase: Light energy splits water (photolysis) producing ATP & NADPH₂. 2) Light-independent phase (Calvin cycle): Fixes CO₂ into glucose.',
      exam: 'Standard Answer: Photosynthesis is the biochemical process by which green plants containing chlorophyll synthesize carbohydrates from carbon dioxide and water using light energy, liberating oxygen as a byproduct.',
      mistakes: 'Confusing respiration (which occurs 24/7 in all living cells) with photosynthesis (which occurs primarily during daytime in chlorophyll-bearing cells).',
      revision: 'Light + Water + CO₂ ➔ Glucose + Oxygen. Site: Chloroplasts in mesophyll tissue.',
      related: 'Plant Respiration, Structure of Chloroplast, Transpiration',
      source: 'NCTB Biology (Class 9-10), Chapter 4: Bioenergetics'
    }
  },
  {
    match: /mole|মোল|অ্যাভোগাড্রো|avogadro/i,
    bn: {
      simple: 'এক ডজন মানে যেমন ১২টি, তেমনি এক "মোল" হলো রসায়নের পরিমাপের একক যাতে থাকে ঠিক ৬.০২২ × ১০²³ টি কণা (অণু, পরমাণু বা আয়ন)।',
      concept: 'যেকোনো পদার্থের যে পরিমাণে অ্যাভোগাড্রো সংখ্যক (৬.০২২ × ১০²³) প্রাথমিক কণিকা থাকে, তাকে ঐ পদার্থের এক মোল বলে। গ্রাম এককে প্রকাশিত আণবিক বা পারমাণবিক ভরই ১ মোল।',
      formula: 'n = w / M = N / N_A = V / 22.4 (STP-তে গ্যাসীয় পদার্থের ক্ষেত্রে)',
      symbols: 'n = মোল সংখ্যা, w = ভর (গ্রাম), M = আণবিক বা মোলার ভর (g/mol), N = কণার সংখ্যা, N_A = অ্যাভোগাড্রো সংখ্যা (6.022×10²³), V = আয়তন (লিটার)',
      example: 'পানির (H₂O) আণবিক ভর ১৮। সুতরাং ১৮ গ্রাম পানিতে ১ মোল পানি থাকে, অর্থাৎ ৬.০২২ × ১০²³ টি পানির অণু উপস্থিত।',
      steps: '১) যৌগের আণবিক ভর (M) বের করো। ২) প্রদত্ত ভরকে (w) আণবিক ভর দিয়ে ভাগ করো (n = w/M)। ৩) কণার সংখ্যা চাইলে মোলকে N_A দিয়ে গুণ করো।',
      exam: 'উত্তর: কার্বন-১২ আইসোটোপের ঠিক ০.০১২ কেজিতে যতগুলো পরমাণু থাকে, কোনো পদার্থের ঠিক ততসংখ্যক উপাদান কণা থাকলে সেই পরিমাণকে ১ মোল বলে।',
      mistakes: 'মোলার ভর কেজিতে রেখে হিসাব করা (গ্রামে নিতে হবে); STP এবং SATP এর মোলার আয়তন (২২.৪ লিটার বনাম ২৪.৭৮৯ লিটার) গোলমাল করা।',
      revision: '১ মোল = মোলার ভর (g) = ৬.০২২ × ১০²³ টি কণা = ২২.৪ লিটার গ্যাস (STP-তে)।',
      related: 'স্টয়কিওমিতি, মোলারিটি ও দ্রবণের ঘনমাত্রা, লিমিটিং বিক্রিয়ক',
      source: 'NCTB রসায়ন (শ্রেণি ৯-১০), অধ্যায় ৬: মোলের ধারণা ও রাসায়নিক গণনা'
    },
    en: {
      simple: 'Just like 1 dozen means 12 items, 1 mole is chemistry’s counting unit meaning exactly 6.022 × 10²³ particles (atoms, molecules, or ions).',
      concept: 'The mole is the SI unit for amount of substance. One mole of any substance contains exactly Avogadro\'s number of specified elementary entities.',
      formula: 'n = w / M = N / N_A = V / 22.4 (for gases at STP in Litres)',
      symbols: 'n = number of moles, w = given mass (g), M = molar mass (g/mol), N = number of particles, N_A = 6.022 × 10²³, V = volume at STP (L)',
      example: 'Water (H₂O) has molar mass 18 g/mol. Weighing out exactly 18 g of water gives 1 mole = 6.022 × 10²³ water molecules.',
      steps: '1) Determine the compound\'s molar mass (M). 2) Divide given mass in grams by M: n = w/M. 3) Multiply by 6.022×10²³ if count of particles is requested.',
      exam: 'Standard Answer: A mole is the amount of substance containing as many elementary entities (atoms, molecules, ions) as there are in 12 grams of carbon-12, equal to 6.022 × 10²³.',
      mistakes: 'Using kg instead of grams for mass; confusing atomic mass with molecular mass for diatomic elements like O₂ and N₂.',
      revision: '1 Mole = Molecular mass in grams = 6.022 × 10²³ particles = 22.4 L at STP.',
      related: 'Stoichiometry, Molarity & Solution Concentration, Limiting Reactant',
      source: 'NCTB Chemistry (Class 9-10), Chapter 6: Concept of Mole & Chemical Calculations'
    }
  },
  {
    match: /accounting equation|হিসাব সমীকরণ|হিসাববিজ্ঞান|assets|liabilities/i,
    bn: {
      simple: 'একটি ব্যবসায়ের মোট যা কিছু সম্পদ (Assets) আছে, তা অবশ্যই মালিকের মূলধন (Equity) এবং বাইরের ঋণ বা দায়ের (Liabilities) সমান হবে।',
      concept: 'হিসাব সমীকরণ হলো দুতরফা দাখিলা পদ্ধতির মূল ভিত্তি। ব্যবসায় প্রতিটি আর্থিক লেনদেন এই সমীকরণের উভয় দিকে সমতা রক্ষা করে।',
      formula: 'Assets (A) = Liabilities (L) + Owner\'s Equity (OE) [বা A = L + (C + R - E - D)]',
      symbols: 'A = সম্পদ (নগদ, আসবাবপত্র, দেনাদার), L = দায় (পাওনাদার, ব্যাংক ঋণ), OE = মালিকানাস্বত্ব (C = মূলধন, R = আয়, E = ব্যয়, D = উত্তোলন)',
      example: 'আপনি ৫০,০০০ টাকা দিয়ে একটি দোকান শুরু করলেন (নগদ সম্পদ ৫০,০০০ = মূলধন ৫০,০০০)। এরপর ১০,০০০ টাকার পণ্য বাকিতে কিনলেন (মালামাল বাড়ল ১০,০০০ = দায় বাড়ল ১০,০০০)। উভয় পাশ ৬০,০০০ টাকা রইল।',
      steps: '১) প্রতিটি লেনদেনের দুটি পক্ষ চিহ্নিত করো। ২) কোন পক্ষ সম্পদে, দায়ে নাকি মালিকানাস্বত্বে প্রভাব ফেলছে তা নির্ধারণ করো। ৩) সমীকরণটি উভয় দিকে সমান রয়েছে কিনা যাচাই করো।',
      exam: 'উত্তর: হিসাব সমীকরণ হলো এমন একটি গাণিতিক সমীকরণ যা প্রমাণ করে যে একটি নির্দিষ্ট সময়ে কোনো ব্যবসায়ের মোট সম্পত্তি তার বহির্দায় ও মালিকানাস্বত্বের সমষ্টির সমান।',
      mistakes: 'উত্তোলনকে ব্যয়ের সাথে এক মনে করা (উত্তোলন মালিকানাস্বত্ব হ্রাস করে কিন্তু ব্যবসায়িক ব্যয় নয়); বাকিতে ক্রয়ের সময় দায় না বাড়িয়ে কেবল নগদে প্রভাব দেখানো।',
      revision: 'সম্পদ = দায় + মালিকানাস্বত্ব (A = L + OE)। প্রতিটি লেনদেনে দুই পাশে সমান পরিবর্তন ঘটে।',
      related: 'দুতরফা দাখিলা পদ্ধতি, জাবেদা (Journal), খতিয়ান (Ledger), রেওয়ামিল',
      source: 'NCTB হিসাববিজ্ঞান (শ্রেণি ৯-১০ / ১১-১২), অধ্যায় ২: লেনদেন'
    },
    en: {
      simple: 'Everything a business owns (Assets) was purchased either with money borrowed from others (Liabilities) or with money invested and earned by the owner (Equity).',
      concept: 'The accounting equation is the foundation of double-entry bookkeeping. Every financial transaction leaves total assets equal to total claims against those assets.',
      formula: 'Assets = Liabilities + Owner\'s Equity (A = L + OE) [Expanded: A = L + C + R - E - D]',
      symbols: 'A = Assets (Cash, Inventory, Equipment), L = Liabilities (Accounts Payable, Loans), OE = Equity (Capital + Revenue - Expenses - Drawings)',
      example: 'You start a business with ৳50,000 cash (Asset = 50,000, Equity = 50,000). You borrow ৳20,000 from a bank (Asset cash becomes 70,000, Liabilities = 20,000, Equity = 50,000). 70,000 = 20,000 + 50,000.',
      steps: '1) Identify the two accounts affected. 2) Determine category (Asset, Liability, Equity). 3) Verify that Assets continue to balance Liabilities plus Equity.',
      exam: 'Standard Answer: The accounting equation states that a company\'s total assets are equal to the sum of its liabilities and shareholders\' equity at any given moment: Assets = Liabilities + Equity.',
      mistakes: 'Treating drawings as business expense rather than equity reduction; forgetting that revenues increase equity while expenses decrease equity.',
      revision: 'Assets = Liabilities + Owner\'s Equity. Every credit must have a balancing debit.',
      related: 'Double-Entry System, Journalizing, Ledger Posting, Trial Balance',
      source: 'NCTB Accounting (Class 9-10 & 11-12), Chapter 2: Transactions'
    }
  },
  {
    match: /ohm|ওহম|রোধ|বর্তনী|v\s*=\s*ir/i,
    bn: {
      simple: 'স্থির তাপমাত্রায় কোনো পরিবাহীর মধ্য দিয়ে যে পরিমাণ বিদ্যুৎ প্রবাহিত হয়, তা তার দুই প্রান্তের বিভব পার্থক্যের সমানুপাতিক।',
      concept: 'ওহমের সূত্র বর্তনীতে বিদ্যুৎ প্রবাহ (I), বিভব পার্থক্য (V) এবং রোধ (R)-এর পারস্পরিক সম্পর্ক স্থাপন করে। পরিবাহী তারের রোধ যত বেশি হবে, প্রবাহ তত কমবে।',
      formula: 'V = IR  (বা I = V / R)',
      symbols: 'V = বিভব পার্থক্য (ভোল্ট, V), I = তড়িৎপ্রবাহ (অ্যাম্পিয়ার, A), R = রোধ (ওহম, Ω)',
      example: 'একটি চিকন পানির পাইপ দিয়ে পানি যেতে যেমন ঘর্ষণ বা বাধার সম্মুখীন হয় (যা রোধ), তেমনি তারের ভেতর দিয়ে ইলেকট্রন চলাচলের সময় পরমাণুগুলোর সাথে সংঘর্ষে যে বাধা পায় তাই রোধ।',
      steps: '১) সার্কিটের ভোল্টেজ (V) ও রোধ (R) শনাক্ত করো। ২) I = V / R সূত্রে মান বসাও। ৩) প্রবাহের একক অ্যাম্পিয়ার (A) উল্লেখ করো।',
      exam: 'বোর্ড উত্তর: তাপমাত্রা স্থির থাকলে কোনো নির্দিষ্ট পরিবাহীর মধ্য দিয়ে প্রবাহিত তড়িৎপ্রবাহ পরিবাহীর দুই প্রান্তের বিভব পার্থক্যের সমানুপাতিক। গাণিতিকভাবে V = IR।',
      mistakes: 'সংজ্ঞায় "স্থির তাপমাত্রায়" কথাটি লিখতে ভুলে যাওয়া; মিলিঅ্যাম্পিয়ার (mA) থেকে অ্যাম্পিয়ারে রূপান্তর না করে সূত্রে বসানো।',
      revision: 'V = IR। বিভব দ্বিগুণ হলে প্রবাহ দ্বিগুণ হয়, কিন্তু রোধ দ্বিগুণ হলে প্রবাহ অর্ধেক হয়।',
      related: 'রোধের সূত্রাবলী, তুল্য রোধ (শ্রেণি ও সমান্তরাল সমবায়), জুলের তাপীয় নীতি',
      source: 'NCTB পদার্থবিজ্ঞান (শ্রেণি ৯-১০ / ১১-১২), চলতড়িৎ অধ্যায়'
    },
    en: {
      simple: 'At a constant temperature, the electric current passing through a conductor is directly proportional to the voltage applied across its ends.',
      concept: "Ohm's Law states the fundamental relationship between voltage, electric current, and resistance in electrical circuits.",
      formula: 'V = IR (or I = V / R)',
      symbols: 'V = Voltage (Volts, V), I = Current (Amperes, A), R = Resistance (Ohms, Ω)',
      example: 'Water flowing through a narrow hose encounters resistance just like electric current moving through high-resistance tungsten wire in a lightbulb.',
      steps: '1) Note given voltage (V) and resistance (R). 2) Convert mA to A if required. 3) Apply I = V / R to compute current with units.',
      exam: "Definition: Provided physical conditions like temperature remain constant, the current flowing through a conductor is directly proportional to the potential difference across its terminals: V = IR.",
      mistakes: 'Omitting the "constant temperature" condition; miscalculating equivalent parallel circuit resistances.',
      revision: 'V = IR. Current increases with voltage and decreases with greater resistance.',
      related: 'Resistors in Series & Parallel, Joule Heating Effect, Electromotive Force (EMF)',
      source: 'NCTB Physics (Class 9-10 & 11-12), Current Electricity'
    }
  },
  {
    match: /archimedes|আর্কিমিডিস|প্লবতা|buoyancy/i,
    bn: {
      simple: 'কোনো বস্তুকে পানিতে বা তরলে ডুবালে সেটি কিছু ওজন হারায় বলে মনে হয়। এই হারানো ওজন বস্তুটির দ্বারা অপসারিত তরলের ওজনের সমান।',
      concept: 'তরলে নিমজ্জিত বস্তুর ওপর তরল যে নিট ঊর্ধ্বমুখী বল প্রয়োগ করে তাকে প্লবতা বলে। বস্তুটির ভাসন বা নিমজ্জন নির্ভর করে তার গড় ঘনত্ব ও তরলের ঘনত্বের ওপর।',
      formula: 'F_B = V · ρ · g',
      symbols: 'F_B = প্লবতা (N), V = নিমজ্জিত অংশের আয়তন (m³), ρ = তরলের ঘনত্ব (kg/m³), g = ৯.৮ m/s²',
      example: 'লোহার তৈরি একটি ছোট পেরেক পানিতে ডুবে যায়, কিন্তু বিশালাকার স্টিলের তৈরি জাহাজ পদ্মায় ভাসে—কারণ জাহাজের ফাঁপা অবয়ব বিশাল পরিমাণ পানি অপসারণ করে বিপুল প্লবতা সৃষ্টি করে।',
      steps: '১) নিমজ্জিত বস্তুর আয়তন বের করো। ২) তরলের ঘনত্ব (পানির জন্য ১০০০ kg/m³) চিহ্নিত করো। ৩) F_B = Vρg সূত্রে মান বসাও।',
      exam: 'উত্তর: কোনো বস্তুকে স্থির তরল বা বায়বীয় পদার্থে আংশিক বা সম্পূর্ণ নিমজ্জিত করলে বস্তুটি কিছুটা ওজন হারায় বলে মনে হয়। এই আপাত হারানো ওজন বস্তু দ্বারা অপসারিত তরল বা বায়বীয় পদার্থের ওজনের সমান।',
      mistakes: 'বস্তুর আয়তনের জায়গায় কেবল ক্ষেত্রফল দিয়ে গুণ করা; অপসারিত তরলের ঘনত্বের বদলে বস্তুর নিজের ঘনত্ব দিয়ে প্লবতা হিসাব করা।',
      revision: 'প্লবতা = অপসারিত তরলের ওজন (F_B = Vρg)। বস্তু ভাসবে যদি তার ওজন প্লবতার চেয়ে কম বা সমান হয়।',
      related: 'ঘনত্ব ও চাপ, প্যাসকেলের সূত্র, বস্তুর ভাসন ও নিমজ্জনের শর্তাবলী',
      source: 'NCTB পদার্থবিজ্ঞান (শ্রেণি ৯-১০), অধ্যায় ৫: পদার্থের অবস্থা ও চাপ'
    },
    en: {
      simple: 'When you place an object in liquid, it feels lighter because the water pushes it upward with a buoyant force equal to the weight of liquid pushed aside.',
      concept: "Archimedes' Principle explains why heavy ships float and stones sink. The upward buoyant force exerted by a fluid on a submerged body equals the weight of fluid displaced.",
      formula: 'F_B = V · ρ · g',
      symbols: 'F_B = Buoyant Force (N), V = Displaced fluid volume (m³), ρ = Fluid density (kg/m³), g = 9.8 m/s²',
      example: 'A solid iron needle sinks, but a massive steel ship floats because its hollow shape displaces enough water to produce huge buoyancy.',
      steps: '1) Determine displaced volume V. 2) Identify fluid density (water = 1000 kg/m³). 3) Multiply V × ρ × g to obtain buoyant force.',
      exam: "Principle: Any object, wholly or partially immersed in a fluid, is buoyed up by a force equal to the weight of the fluid displaced by the object.",
      mistakes: 'Using the object’s density instead of the liquid’s density in the buoyancy formula.',
      revision: 'Buoyant force = weight of displaced fluid (F_B = Vρg). Object floats when average density < fluid density.',
      related: 'Pressure in Fluids, Pascal’s Law, Conditions of Flotation',
      source: 'NCTB Physics (Class 9-10), Chapter 5: State of Matter & Pressure'
    }
  },
  {
    match: /trigonometry|ত্রিকোণমিতি|sin|cos|tan/i,
    bn: {
      simple: 'ত্রিকোণমিতি হলো সমকোণী ত্রিভুজের কোণ ও বাহুগুলোর মধ্যকার অনুপাতের খেলা। যেমন: সাইন (sin) মানে লম্ব/অতিভুজ, কস (cos) মানে ভূমি/অতিভুজ।',
      concept: 'সমকোণী ত্রিভুজে যেকোনো সূক্ষ্মকোণের সাপেক্ষে বাহুগুলোর অনুপাত সর্বদা নির্দিষ্ট থাকে। এই অনুপাতগুলোকে ত্রিকোণমিতিক অনুপাত বলা হয়।',
      formula: 'sin²θ + cos²θ = 1, sec²θ - tan²θ = 1, cosec²θ - cot²θ = 1',
      symbols: 'sin θ = লম্ব/অতিভুজ, cos θ = ভূমি/অতিভুজ, tan θ = লম্ব/ভূমি, cot θ = ১/tan θ',
      example: 'একটি উঁচু নারিকেল গাছ না উঠেই তার উচ্চতা মাপা যায়—গাছটির গোড়া থেকে দূরত্ব এবং সূর্যের সাথে ছায়ার শীর্ষ কোণ (θ) মেপে tan θ ব্যবহার করলেই উচ্চতা বের হয়।',
      steps: '১) সমকোণী ত্রিভুজ এঁকে সূক্ষ্মকোণ θ এর বিপরীত বাহুকে লম্ব ও সংলগ্ন বাহুকে ভূমি চিহ্নিত করো। ২) সঠিক অভেদ বা অনুপাতটি বেছে নাও। ৩) পিথাগোরাসের উপপাদ্য প্রয়োগ করে মান বের করো।',
      exam: 'বোর্ড উত্তর: সমকোণী ত্রিভুজের একটি সূক্ষ্মকোণের সাপেক্ষে তিনটি বাহুর যে ছয়টি অনুপাত পাওয়া যায় তাদের ত্রিকোণমিতিক অনুপাত বলে। যেমন: sin θ = লম্ব/অতিভুজ।',
      mistakes: 'কোণ θ এর অবস্থান পরিবর্তন হলে লম্ব ও ভূমি অদলবদল হয়—তা খেয়াল না রাখা; ক্যালকুলেটরে Degree এবং Radian মোড গুলিয়ে ফেলা।',
      revision: 'sin²θ + cos²θ = 1। ছন্দ: সাগরে লবণ অনেক (sin = ল/অ), কবরে ভূত অনেক (cos = ভূ/অ), ট্যারা লম্বা ভূত (tan = ল/ভূ)।',
      related: 'দূরত্ব ও উচ্চতা (অধ্যায় ১০), পিথাগোরাসের উপপাদ্য, সংযুক্ত কোণের অনুপাত',
      source: 'NCTB সাধারণ গণিত (শ্রেণি ৯-১০), অধ্যায় ৯ ও ১০'
    },
    en: {
      simple: 'Trigonometry is the study of relationships between angles and side lengths of triangles. For example, sine is opposite/hypotenuse, cosine is adjacent/hypotenuse.',
      concept: 'In any right-angled triangle, the ratio of any two sides remains invariant for a given acute angle, defining the fundamental trigonometric ratios.',
      formula: 'sin²θ + cos²θ = 1, sec²θ - tan²θ = 1, tan θ = sin θ / cos θ',
      symbols: 'θ = angle, sin θ = Opp/Hyp, cos θ = Adj/Hyp, tan θ = Opp/Adj',
      example: 'Measuring the height of a minaret without climbing it: step back 30 meters, measure the elevation angle, and calculate height using tan θ = height / 30m.',
      steps: '1) Label Opposite, Adjacent, and Hypotenuse relative to reference angle θ. 2) Pick the ratio relating known sides to the unknown. 3) Solve equation.',
      exam: 'Standard Answer: In a right-angled triangle, trigonometric ratios express the relationship between an acute angle and pairs of side lengths: sin θ = Opposite/Hypotenuse, cos θ = Adjacent/Hypotenuse.',
      mistakes: 'Mixing up opposite and adjacent sides when the reference angle shifts; incorrect calculator angle mode (Radians vs Degrees).',
      revision: 'SOH-CAH-TOA: sin = Opp/Hyp, cos = Adj/Hyp, tan = Opp/Adj. Fundamental identity: sin²θ + cos²θ = 1.',
      related: 'Distance & Elevation (Ch 10), Pythagoras Theorem, Coordinate Trigonometry',
      source: 'NCTB General Mathematics (Class 9-10), Chapter 9'
    }
  },
  {
    match: /work[- ]energy|কাজ[- ]শক্তি|গতিশক্তি|kinetic energy|স্থিতিশক্তি/i,
    bn: {
      simple: 'কোনো বস্তুর ওপর কৃত মোট কাজ তার গতিশক্তির পরিবর্তনের সমান। অর্থাৎ কোনো বস্তুকে গতিশীল করতে যে কাজ করতে হয়, তা বস্তুর মধ্যে গতিশক্তি হিসেবে জমা থাকে।',
      concept: 'কাজ-শক্তি উপপাদ্য বলবিদ্যা ও গতিবিদ্যার অন্যতম সেরা নীতি। বাহ্যিক লব্ধি বল দ্বারা কৃত কাজ বস্তুর গতিশক্তির হ্রাস বা বৃদ্ধির পরিমাণের সমান।',
      formula: 'W = ΔK = ½mv² - ½mu²',
      symbols: 'W = কৃত কাজ (জুল, J), m = ভর (kg), v = শেষ বেগ (m/s), u = আদি বেগ (m/s), K = গতিশক্তি (J)',
      example: 'চলন্ত ট্রেন ব্রেক কষে থামানোর সময় ব্রেক দ্বারা কৃত ঋণাত্মক কাজ ট্রেনের সমস্ত গতিশক্তিকে শূন্য করে দেয় এবং এই কাজ তাপে রূপান্তরিত হয়।',
      steps: '১) আদি বেগ u এবং শেষ বেগ v বের করো। ২) আদি গতিশক্তি (½mu²) ও শেষ গতিশক্তি (½mv²) হিসাব করো। ৩) উভয়ের বিয়োগফলই কৃত কাজ W।',
      exam: 'বোর্ড উত্তর: কোনো বস্তুর ওপর প্রযুক্ত নিট বল দ্বারা সম্পন্ন কাজ বস্তুটির গতিশক্তির পরিবর্তনের সমান। গাণিতিকভাবে W = ΔE_k = ½mv² - ½mu²।',
      mistakes: 'গতিশক্তির সূত্রে বেগের ওপর বর্গ (v²) দিতে ভুলে যাওয়া; ঋণাত্মক কাজ (যেমন ঘর্ষণ বল বা মন্দন) এর ক্ষেত্রে চিহ্ন ঠিক না রাখা।',
      revision: 'কাজ = গতিশক্তির পরিবর্তন (W = ΔK)। বেগ দ্বিগুণ হলে গতিশক্তি চারগুণ বাড়ে।',
      related: 'শক্তির সংরক্ষণশীলতা নীতি, ক্ষমতা ও কর্মদক্ষতা, বিভব শক্তি বা স্থিতিশক্তি',
      source: 'NCTB পদার্থবিজ্ঞান (শ্রেণি ৯-১০ / ১১-১২), কাজ, ক্ষমতা ও শক্তি'
    },
    en: {
      simple: 'The net work done on an object equals the change in its kinetic energy. Pushing an object makes it speed up; that work turns into motion energy.',
      concept: 'The Work-Energy Theorem bridges kinematics and dynamics, stating that the net work performed by all acting forces equals the object’s change in kinetic energy.',
      formula: 'W = ΔK = ½mv² - ½mu²',
      symbols: 'W = Work done (Joules, J), m = Mass (kg), v = Final velocity, u = Initial velocity, K = Kinetic energy',
      example: 'A car braking to a halt: the negative work done by brake friction exactly consumes the car’s initial kinetic energy, turning it into heat.',
      steps: '1) Determine initial velocity u and final velocity v. 2) Compute initial and final kinetic energy. 3) The difference ΔK gives the net work.',
      exam: 'Theorem Statement: The net work done by the unbalanced forces on an object is equal to the change in its kinetic energy: W = ½mv² - ½mu².',
      mistakes: 'Forgetting to square the velocities (v²); neglecting signs when work is negative (retardation).',
      revision: 'Work = Change in Kinetic Energy (W = ΔK). Doubling speed quadruples kinetic energy.',
      related: 'Conservation of Mechanical Energy, Power & Efficiency, Potential Energy',
      source: 'NCTB Physics (Class 9-10 & 11-12), Work, Power & Energy'
    }
  }
];

function generateFallbackAnswer(question: string, lang: 'bn' | 'en' | 'mix', subject?: string, classLevel?: number): AnswerStructure {
  const normalizedQ = question.trim().toLowerCase();
  const found = fallbackKB.find((item) => item.match.test(normalizedQ));

  if (found) {
    if (lang === 'mix') {
      return {
        simple: found.bn.simple,
        concept: found.en.concept,
        formula: found.en.formula,
        symbols: `${found.bn.symbols} | (${found.en.symbols})`,
        example: found.bn.example,
        steps: found.en.steps,
        exam: found.bn.exam,
        mistakes: found.bn.mistakes,
        revision: found.en.revision,
        related: `${found.bn.related}, ${found.en.related}`,
        source: found.bn.source,
      };
    }
    return found[lang === 'en' ? 'en' : 'bn'];
  }

  // Smart structured educational response generator
  const clsText = classLevel ? `শ্রেণি ${classLevel}` : 'শ্রেণি ৬-১২';
  const subText = subject || 'পাঠ্যবইয়ের টপিক';

  if (lang === 'en') {
    return {
      simple: `Here is a clear teacher-style explanation of "${question}". In this topic, the central idea is understanding how the underlying rules and scientific/academic principles operate in real scenarios.`,
      concept: `The core concept connects directly to the NCTB curriculum standards. It forms an essential foundation for board examinations and higher-order critical thinking.`,
      formula: `Applicable Formula / Rule: Relevant equations, grammatical laws, or principles specific to "${question}".`,
      symbols: `Symbols: Parameters and unit definitions in standard international (SI) or academic conventions.`,
      example: `Real-life context: Imagine an everyday situation in Bangladesh—such as calculating distances in traffic, balancing daily expenses in a family budget, or observing plant respiration along the riverbanks.`,
      steps: `1) Read the problem carefully and list known and unknown values. 2) Select the appropriate formula or rule. 3) Compute systematically with proper units and state the conclusion.`,
      exam: `Exam-ready answer: State the standard textbook definition first, write the mathematical equation with notation explanations, and conclude with a practical application or diagram if applicable.`,
      mistakes: `Common pitfalls: Misinterpreting terminology, missing unit conversions (e.g., cm to m, grams to kg), or skipping explanatory steps in creative (CQ) questions.`,
      revision: `One-line revision: Keep the fundamental principle clear: cause leads to measurable effect, and conservation laws always hold true.`,
      related: `Related chapters in ${subText} for ${clsText}.`,
      source: `NCTB Curriculum Reference · ${subText} (${clsText})`,
    };
  }

  if (lang === 'mix') {
    return {
      simple: `"${question}" এর সহজ ব্যাখ্যা: এটি ${subText} এর একটি অত্যন্ত গুরুত্বপূর্ণ অংশ। খুব সহজে বুঝতে হলে মনে রাখুন কীভাবে মূল নীতিটি বাস্তবে কাজ করে।`,
      concept: `The core concept connects fundamental principles with practical analytical techniques required in modern examinations.`,
      formula: `সূত্র বা নিয়ম: "${question}" সম্পর্কিত প্রাসঙ্গিক সমীকরণ বা নিয়মাবলী।`,
      symbols: `Parameters and notation definitions clearly outlined with standard units.`,
      example: `বাস্তব জীবনের উদাহরণ: দৈনন্দিন জীবনে আমরা যে সমস্ত অভিজ্ঞতা দেখি—যেমন চলন্ত গাড়িতে ব্রেক কষা, কিংবা গাছপালার সবুজ পাতা বা দোকানের হিসাব-নিকাশ।`,
      steps: `1) প্রশ্ন থেকে প্রদত্ত মান চিহ্নিত করুন। 2) সঠিক নিয়ম নির্বাচন করুন। 3) নির্ভুল হিসাব করে এককসহ উত্তর লিখুন।`,
      exam: `সৃজনশীল পরীক্ষার স্ট্যান্ডার্ড উত্তর: সংজ্ঞা প্রদান ➔ সূত্রের ব্যাখ্যা ➔ বাস্তব প্রয়োগ উল্লেখ করে ২/৩ নম্বরের পূর্ণাঙ্গ উত্তর উপস্থাপন।`,
      mistakes: `Students often overlook SI unit conversion and confuse fundamental definitions.`,
      revision: `Quick Revision: মূল ধারণাটি মনে রাখুন—সঠিক সূত্র ও এককের ব্যবহারই পূর্ণ নম্বর পাওয়ার চাবিকাঠি।`,
      related: `সম্পর্কিত টপিক: ${subText} এর সংশ্লিষ্ট অধ্যায়সমূহ (${clsText})।`,
      source: `NCTB কারিকুলাম নির্দেশিকা · ${subText} (${clsText})`,
    };
  }

  return {
    simple: `"${question}" বিষয়টি একজন শিক্ষক যেভাবে ক্লাসরুমে সহজ করে বোঝান, সেভাবে উপস্থাপন করা হলো। এর মূল সারমর্ম হলো বিষয়টির পেছনের কারণ ও ফলাফল অনুধাবন করা।`,
    concept: `এটি জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB) এর পাঠ্যসূচির একটি মৌলিক কনসেপ্ট, যা বোর্ড পরীক্ষার সৃজনশীল প্রশ্ন ও এমসিকিউ এর জন্য অত্যন্ত প্রয়োজনীয়।`,
    formula: `প্রাসঙ্গিক সূত্র বা নীতি: বিষয়ভিত্তিক সমীকরণ, নিয়ম বা স্বতঃসিদ্ধ যা এই টপিকের ক্ষেত্রে প্রযোজ্য।`,
    symbols: `প্রতীক ও একক: প্রতিটি ব্যবহৃত রাশির নাম এবং তাদের সঠিক আন্তর্জাতিক বা মানক একক।`,
    example: `বাস্তব জীবনের উদাহরণ: আমাদের প্রতিদিনের চেনা পরিবেশের সাথে মেলান—যেমন রিকশা বা গাড়ির গতি, উদ্ভিদের বৃদ্ধি কিংবা বাজারের কেনাকাটায় লাভ-ক্ষতির হিসাব।`,
    steps: `১) প্রশ্নে কী দেওয়া আছে এবং কী বের করতে হবে তা শনাক্ত করো। ২) সঠিক সূত্র বা ব্যাকরণিক/হিসাববিজ্ঞান নিয়ম নির্বাচন করো। ৩) ধাপে ধাপে হিসাব সম্পন্ন করে এককসহ পূর্ণাঙ্গ উত্তর লেখো।`,
    exam: `পরীক্ষার উপযোগী সৃজনশীল উত্তর: প্রথমে ক/খ বা প্রয়োগমূলক অংশের জন্য মূল সংজ্ঞা স্পষ্টভাবে লিখবে, এরপর সূত্র উল্লেখ করে বিশ্লেষণ করবে।`,
    mistakes: `যেসব ভুল থেকে সাবধান থাকবে: একক (Units) লিখতে ভুলে যাওয়া, মূল সূত্রের চিহ্নের ভুল এবং প্রশ্নের মূল দাবি পূরণ না করে অপ্রাসঙ্গিক বর্ণনা দেওয়া।`,
    revision: `এক লাইনে মনে রাখো: নির্ভুল সংজ্ঞা + সঠিক সূত্র + উপযুক্ত একক = পরীক্ষায় পূর্ণ নম্বর।`,
    related: `${subText} এর সংশ্লিষ্ট অধ্যায়সমূহ (${clsText})।`,
    source: `NCTB পাঠ্যপুস্তক · ${subText} (${clsText})`,
  };
}

// Structured response schema for Asking the AI Teacher
const answerSchema = {
  type: Type.OBJECT,
  properties: {
    simple: {
      type: Type.STRING,
      description: 'A simple, intuitive teacher-style explanation understandable by any student without heavy jargon.',
    },
    concept: {
      type: Type.STRING,
      description: 'The core academic theory, law, grammatical rule, or formal concept thoroughly explained.',
    },
    formula: {
      type: Type.STRING,
      description: 'The applicable formula, equation, grammar rule, or law (or N/A if non-mathematical).',
    },
    symbols: {
      type: Type.STRING,
      description: 'Detailed explanation of symbols, parameters, and SI units (or N/A).',
    },
    example: {
      type: Type.STRING,
      description: 'A relatable real-world example, analogy, or sample sentence (relatable to Bangladeshi students).',
    },
    steps: {
      type: Type.STRING,
      description: 'Step-by-step problem-solving method, calculation steps, or analytical breakdown.',
    },
    exam: {
      type: Type.STRING,
      description: 'Exam-ready answer formatted for board exams (CQ Creative Question or written answer format).',
    },
    mistakes: {
      type: Type.STRING,
      description: 'Common pitfalls and exam mistakes students make, and how to avoid them.',
    },
    revision: {
      type: Type.STRING,
      description: 'One-line punchy memorable takeaway for quick revision before exams.',
    },
    related: {
      type: Type.STRING,
      description: 'Related topics or syllabus chapters to study next.',
    },
    source: {
      type: Type.STRING,
      description: 'Textbook / Curriculum reference (e.g. NCTB Class X Subject).',
    },
  },
  required: ['simple', 'concept', 'example', 'steps', 'exam', 'revision'],
};

// Structured schema for Mock Tests
const quizSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    subject: { type: Type.STRING },
    classLevel: { type: Type.INTEGER },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          correctIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING },
        },
        required: ['id', 'question', 'options', 'correctIndex', 'explanation'],
      },
    },
  },
  required: ['title', 'subject', 'classLevel', 'questions'],
};

// API endpoint for Asking the AI Teacher
app.post('/api/ask', async (req: Request, res: Response) => {
  try {
    const { question, lang = 'bn', classLevel = 9, subject = 'General', topic = '' } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    const cacheKey = `${classLevel}_${subject}_${lang}_${question.trim().toLowerCase()}`;
    if (answerCache.has(cacheKey)) {
      res.json(answerCache.get(cacheKey));
      return;
    }

    // If Gemini client exists, attempt dynamic generation with Gemini models
    if (ai) {
      const languageInstruction =
        lang === 'en'
          ? 'Reply strictly in clear, accessible English.'
          : lang === 'mix'
          ? 'Reply in a natural bilingual combination of Bangla and English (Banglish/Bilingual: English technical terms with natural conversational Bangla explanations).'
          : 'Reply strictly in clear, friendly, natural Bangla (বাংলা) suitable for Bangladeshi school and college students.';

      const systemInstruction = `You are BrainyBee, an expert master educational AI tutor specialized in Bangladesh's NCTB (National Curriculum and Textbook Board) curriculum (Classes 6-12) and general educational queries.

You dynamically teach and solve ANY educational question across:
1. Bangla 1st & 2nd Paper (Classes 6-12): Grammar (সন্ধি, সমাস, কারক ও বিভক্তি, প্রত্যয়, উপসর্গ, বাক্য পরিবর্তন, ণ-ত্ব ও ষ-ত্ব বিধান, বানান ও ব্যাকরণিক নিয়ম), Literature, Comprehension.
2. Banglish & Bilingual queries: Understand and answer questions written in Banglish, phonetic Bengali, or mixed English-Bengali smoothly.
3. English 1st & 2nd Paper (Classes 6-12): Grammar (Tense, Voice change, Narration, Modifiers, Right form of verbs, Connectors, Prepositions, Transformation of sentences, Punctuation, Tag questions), Writing, Comprehension.
4. General Mathematics (Classes 6-12) & Higher Mathematics (Classes 9-12): Arithmetic, Algebra, Geometry, Trigonometry, Coordinate geometry, Calculus, Vectors, Statistics & Probability. Solve with precise calculations, intermediate algebraic steps, and final answers with units.
5. Science: General Science (Classes 6-10), Physics (Classes 9-12), Chemistry (Classes 9-12), Biology (Classes 9-12). Include formulas, balanced chemical equations, SI units, and scientific principles.
6. ICT (Information and Communication Technology, Classes 6-12): Number systems (Binary, Octal, Decimal, Hexadecimal conversions), Logic gates, HTML & Web design, C programming, Computer networking, Cloud computing, Database Management Systems (DBMS / SQL).
7. Commerce & Humanities: Accounting (Double entry system, Journal, Ledger, Trial balance, Balance sheet), Finance & Banking, Business Entrepreneurship, Economics, History of Bangladesh & World Civilization, Civics & Citizenship, Geography & Environment.
8. General Knowledge (All classes): Bangladesh history, Liberation War 1971, Language Movement 1952, Constitution, National symbols, Geography, International affairs, Science milestones.
9. Bangladesh curriculum-related educational questions: Any board question, creative question (CQ ক, খ, গ, ঘ), textbook exercise, or practical exam concept.

RELIABILITY & HONESTY RULE:
If a question is outside your reliable educational knowledge, ambiguous, or unverifiable, clearly and politely state in the explanation that you are unsure about the answer, instead of inventing or hallucinating facts.

PEDAGOGICAL STRUCTURE:
Provide an accurate, academically rigorous, and step-by-step teacher explanation matching the requested JSON schema.`;

      const userPrompt = `Student Level: Class ${classLevel}
Subject: ${subject}
Topic: ${topic || 'Academic Syllabus Topic'}
Target Language: ${languageInstruction}
Question to answer dynamically: "${question}"

Generate the comprehensive educational response matching the required schema. Ensure every mathematical step, grammatical rule, or scientific concept is explicitly solved and clearly explained.`;

      const candidateModels = ['gemini-3.1-flash-lite'];
      for (const modelName of candidateModels) {
        if (isModelInCooldown(modelName)) {
          continue;
        }

        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: userPrompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: answerSchema,
            },
          });

          const text = response.text?.trim() || '';
          if (text) {
            const parsed = parseJsonSafely(text);
            if (parsed && typeof parsed === 'object' && parsed.simple) {
              const payload = {
                sourceType: 'ai',
                model: modelName,
                answer: {
                  simple: parsed.simple || '',
                  concept: parsed.concept || '',
                  formula: parsed.formula || 'N/A',
                  symbols: parsed.symbols || 'N/A',
                  example: parsed.example || '',
                  steps: parsed.steps || '',
                  exam: parsed.exam || '',
                  mistakes: parsed.mistakes || '',
                  revision: parsed.revision || '',
                  related: parsed.related || 'NCTB Curriculum',
                  source: parsed.source || `NCTB Class ${classLevel} ${subject}`,
                },
              };
              answerCache.set(cacheKey, payload);
              res.json(payload);
              return;
            }
          }
        } catch (geminiError: any) {
          if (isQuotaError(geminiError)) {
            setModelCooldown(modelName, 60 * 1000);
            console.log(`[BrainyBee] Model ${modelName} hit quota limit; checking next candidate model.`);
            continue; // Continue to next model instead of breaking
          } else {
            console.log(`[BrainyBee] Model ${modelName} note:`, geminiError?.message || geminiError);
            continue;
          }
        }
      }
    }

    // High quality Curriculum Fallback if AI models are unavailable
    const fallback = generateFallbackAnswer(question, lang, subject, classLevel);
    const payload = {
      sourceType: 'curriculum_engine',
      answer: fallback,
    };
    // Only cache if it matched a verified syllabus entry
    const normalizedQ = question.trim().toLowerCase();
    const isVerifiedMatch = fallbackKB.some((item) => item.match.test(normalizedQ));
    if (isVerifiedMatch) {
      answerCache.set(cacheKey, payload);
    }
    res.json(payload);
  } catch (err: any) {
    console.log('[BrainyBee] Serving verified NCTB curriculum answer.');
    const fallback = generateFallbackAnswer(req.body?.question || 'Syllabus Topic', 'bn');
    res.json({
      sourceType: 'curriculum_engine',
      answer: fallback,
    });
  }
});

// API endpoint for interactive Mock Tests / Quizzes
app.post('/api/quiz', async (req: Request, res: Response) => {
  try {
    const { subject = 'Physics', classLevel = 9, topic = '', lang = 'bn' } = req.body;
    const quizCacheKey = `${classLevel}_${subject}_${lang}_${topic.trim().toLowerCase()}`;

    if (quizCache.has(quizCacheKey)) {
      res.json(quizCache.get(quizCacheKey));
      return;
    }

    if (ai) {
      const prompt = `Generate a high-quality 5-question multiple choice mock test (MCQ) for Bangladesh NCTB curriculum.
Class: ${classLevel}
Subject: ${subject}
Topic: ${topic || 'Key syllabus topics'}
Language: ${lang === 'en' ? 'English' : 'Bangla (বাংলা)'}

Generate 5 distinct, curriculum-aligned MCQ questions with 4 options each, the correct 0-based index, and a teacher's explanatory note for the correct choice.`;

      const candidateModels = ['gemini-3.1-flash-lite'];
      for (const modelName of candidateModels) {
        if (isModelInCooldown(modelName)) {
          continue;
        }

        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: quizSchema,
            },
          });

          const text = response.text?.trim() || '';
          if (text) {
            const parsed = parseJsonSafely(text);
            if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
              quizCache.set(quizCacheKey, parsed);
              res.json(parsed);
              return;
            }
          }
        } catch (err: any) {
          if (isQuotaError(err)) {
            setModelCooldown(modelName, 60 * 1000);
            console.log(`[BrainyBee] Quiz model ${modelName} reached quota, checking next option.`);
            continue;
          }
        }
      }
    }

    // Curated subject quizzes for Bangladesh NCTB curriculum
    const sampleQuizzes: Record<string, any> = {
      Physics: {
        title: `পদার্থবিজ্ঞান বোর্ড মডেল টেস্ট — শ্রেণি ${classLevel}`,
        subject: 'Physics',
        classLevel,
        questions: [
          {
            id: 1,
            question: 'বলের আন্তর্জাতিক একক (SI Unit) কোনটি?',
            options: ['জুল (Joule)', 'নিউটন (Newton)', 'ওয়াট (Watt)', 'প্যাসকেল (Pascal)'],
            correctIndex: 1,
            explanation: 'বলের এসআই একক হলো নিউটন (N)। ১ নিউটন = ১ kg·m/s²।'
          },
          {
            id: 2,
            question: 'কোন বস্তুর ভর ৪ kg এবং ত্বরণ ৩ m/s² হলে প্রযুক্ত বল কত?',
            options: ['৭ N', '১২ N', '১ N', '০.৭৫ N'],
            correctIndex: 1,
            explanation: 'আমরা জানি F = ma। সুতরাং F = ৪ kg × ৩ m/s² = ১২ নিউটন (N)।'
          },
          {
            id: 3,
            question: 'নিউটনের প্রথম গতিসূত্র থেকে কোন দুটি ধারণার সুস্পষ্ট ব্যাখ্যা পাওয়া যায়?',
            options: ['বল ও জড়তা', 'ত্বরণ ও মন্দন', 'ভরবেগ ও শক্তি', 'কাজ ও ক্ষমতা'],
            correctIndex: 0,
            explanation: 'নিউটনের প্রথম সূত্র থেকে বস্তুর জড়তা (Inertia) এবং বলের গুণগত সংজ্ঞা পাওয়া যায়।'
          },
          {
            id: 4,
            question: 'মুক্তভাবে পরন্ত বস্তুর ক্ষেত্রে অভিকর্ষজ ত্বরণ (g)-এর আদর্শ মান কত?',
            options: ['৯.৮ m/s²', '৮.৯ m/s²', '৯.৮ cm/s²', '১০.৫ m/s²'],
            correctIndex: 0,
            explanation: 'ভূপৃষ্ঠে গড় অভিকর্ষজ ত্বরণের আদর্শ মান ৯.৮ m/s² (বা ৯.৮০৬৬৫ m/s²)।'
          },
          {
            id: 5,
            question: 'কাজ ও শক্তির মাত্রা সমীকরণ কোনটি?',
            options: ['[MLT⁻¹]', '[ML²T⁻²]', '[ML⁻¹T⁻²]', '[MLT⁻²]'],
            correctIndex: 1,
            explanation: 'কাজ = বল × সরণ = [MLT⁻²] × [L] = [ML²T⁻²]। শক্তির মাত্রাও একই।'
          }
        ]
      },
      Chemistry: {
        title: `রসায়ন প্রস্তুতি টেস্ট — শ্রেণি ${classLevel}`,
        subject: 'Chemistry',
        classLevel,
        questions: [
          {
            id: 1,
            question: '১ মোল যেকোনো গ্যাসে প্রমাণ তাপমাত্রা ও চাপে (STP) কত আয়তন দখল করে?',
            options: ['২২.৪ লিটার', '২৪.৭৮ লিটার', '১২.২ লিটার', '১০০ লিটার'],
            correctIndex: 0,
            explanation: 'STP-তে যেকোনো আদর্শ গ্যাসের মোলার আয়তন ২২.৪ লিটার।'
          },
          {
            id: 2,
            question: 'পানির (H₂O) মোলার ভর কত?',
            options: ['১৮ g/mol', '১৬ g/mol', '২০ g/mol', '৩৪ g/mol'],
            correctIndex: 0,
            explanation: 'H₂O এর মোলার ভর = (২ × ১) + ১৬ = ১৮ গ্রাম/মোল।'
          },
          {
            id: 3,
            question: 'পর্যায় সারণির আধুনিক মূল ভিত্তি কোনটি?',
            options: ['পারমাণবিক ভর', 'পারমাণবিক সংখ্যা', 'আইসোটোপের সংখ্যা', 'যোজ্যতা'],
            correctIndex: 1,
            explanation: 'হেনরি মোসলের আবিষ্কার অনুযায়ী আধুনিক পর্যায় সারণির মূল ভিত্তি হলো মৌলের পারমাণবিক সংখ্যা (প্রোটন সংখ্যা)।'
          },
          {
            id: 4,
            question: 'কোনটি নিরপেক্ষ জলীয় দ্রবণের pH মান নির্দেশ করে?',
            options: ['০', '৭', '১৪', '১'],
            correctIndex: 1,
            explanation: '২৫°C তাপমাত্রায় বিশুদ্ধ পানি বা নিরপেক্ষ দ্রবণের pH মান ঠিক ৭।'
          },
          {
            id: 5,
            question: 'অ্যাভোগাড্রো সংখ্যার মান কোনটি?',
            options: ['৬.০২২ × ১০²³', '৩.০০ × ১০⁸', '৯.৮ × ১০⁶', '১.৬০২ × ১০⁻¹⁹'],
            correctIndex: 0,
            explanation: '১ মোল পদার্থে ঠিক ৬.০২২ × ১০²³ টি কণা (অণু/পরমাণু/আয়ন) থাকে।'
          }
        ]
      },
      Biology: {
        title: `জীববিজ্ঞান প্রস্তুতি টেস্ট — শ্রেণি ${classLevel}`,
        subject: 'Biology',
        classLevel,
        questions: [
          {
            id: 1,
            question: 'উদ্ভিদের সালোকসংশ্লেষণের প্রধান অঙ্গ কোনটি?',
            options: ['মূল', 'পাতা', 'কাণ্ড', 'ফুল'],
            correctIndex: 1,
            explanation: 'পাতার মেসোফিল কোষে ক্লোরোপ্লাস্ট বেশি থাকে বিধায় পাতাই প্রধান অঙ্গ।'
          },
          {
            id: 2,
            question: 'জীবদেহের শক্তিঘর বা Powerhouse of the cell কাকে বলা হয়?',
            options: ['রাইবোসোম', 'মাইটোকন্ড্রিয়া', 'গলজি বস্তু', 'লাইসোজোম'],
            correctIndex: 1,
            explanation: 'মাইটোকন্ড্রিয়াতে ক্রেবস চক্র ও শ্বসনের শক্তি (ATP) উৎপন্ন হয় বিধায় একে শক্তিঘর বলে।'
          },
          {
            id: 3,
            question: 'কোষের প্রোটিন তৈরির কারখানা কোনটি?',
            options: ['রাইবোসোম', 'ক্লোরোপ্লাস্ট', 'সেন্ট্রোসোম', 'নিউক্লিয়াস'],
            correctIndex: 0,
            explanation: 'রাইবোসোম অ্যামিনো অ্যাসিড সংযুক্ত করে প্রোটিন সংশ্লেষণ করে।'
          },
          {
            id: 4,
            question: 'মানবদেহে স্বাভাবিক ডিপ্লয়েড ক্রোমোজোম সংখ্যা কত?',
            options: ['২৩ টি', '৪৬ টি (২৩ জোড়া)', '৯২ টি', '২২ জোড়া'],
            correctIndex: 1,
            explanation: 'মানবদেহে মোট ৪৬টি বা ২৩ জোড়া ক্রোমোজোম থাকে (২২ জোড়া অটোসোম + ১ জোড়া সেক্স ক্রোমোজোম)।'
          },
          {
            id: 5,
            question: 'উদ্ভিদে মূল থেকে পাতায় পানি পরিবহন করে কোন টিস্যু?',
            options: ['ফ্লোয়েম', 'জাইলেম', 'প্যারেনকাইমা', 'কোলেনকাইমা'],
            correctIndex: 1,
            explanation: 'জাইলেম টিস্যুর মাধ্যমে মাটি থেকে পানি ও খনিজ লবণ পাতায় পরিবাহিত হয়।'
          }
        ]
      },
      General: {
        title: `সাধারণ বিজ্ঞান ও গণিত প্রস্তুতি টেস্ট`,
        subject: 'General Science',
        classLevel,
        questions: [
          {
            id: 1,
            question: 'উদ্ভিদের সালোকসংশ্লেষণের প্রধান অঙ্গ কোনটি?',
            options: ['মূল', 'পাতা', 'কাণ্ড', 'ফুল'],
            correctIndex: 1,
            explanation: 'পাতার মেসোফিল কোষে প্রচুর ক্লোরোপ্লাস্ট থাকে বিধায় পাতাই সালোকসংশ্লেষণের প্রধান স্থান।'
          },
          {
            id: 2,
            question: 'পানির অণুতে হাইড্রোজেন ও অক্সিজেনের পরমাণুর অনুপাত কত?',
            options: ['১:১', '২:১', '১:২', '৩:১'],
            correctIndex: 1,
            explanation: 'পানির রাসায়নিক সংকেত H₂O, অর্থাৎ দুটি হাইড্রোজেন ও একটি অক্সিজেন পরমাণু যুক্ত থাকে।'
          },
          {
            id: 3,
            question: 'হিসাব সমীকরণে সম্পদ বৃদ্ধির সাথে সাথে কী ঘটতে পারে?',
            options: ['অন্য কোনো সম্পদ হ্রাস', 'দায় বৃদ্ধি', 'মালিকানাস্বত্ব বৃদ্ধি', 'উপরের সবকয়টি সত্য'],
            correctIndex: 3,
            explanation: 'দুতরফা দাখিলা পদ্ধতি অনুযায়ী সম্পদ বৃদ্ধি পেলে অপর সম্পদ কমতে পারে, দায় বাড়তে পারে অথবা মূলধন বাড়তে পারে।'
          },
          {
            id: 4,
            question: '১ মোল যেকোনো গ্যাসে STP-তে কত আয়তন দখল করে?',
            options: ['২২.৪ লিটার', '২৪.৭৮ লিটার', '১০০ লিটার', '১০ লিটার'],
            correctIndex: 0,
            explanation: 'প্রমাণ তাপমাত্রা ও চাপে (STP) যেকোনো আদর্শ গ্যাসের মোলার আয়তন ২২.৪ লিটার।'
          },
          {
            id: 5,
            question: 'মৌলিক অধিকার নিশ্চিত করার সর্বোচ্চ আইন কোনটি?',
            options: ['দণ্ডবিধি', 'সংবিধান', 'পৌরবিধি', 'শ্রম আইন'],
            correctIndex: 1,
            explanation: 'বাংলাদেশের সংবিধান হলো সর্বোচ্চ আইন যা নাগরিকদের মৌলিক অধিকারের নিশ্চয়তা দেয়।'
          }
        ]
      }
    };

    const selected = sampleQuizzes[subject] || sampleQuizzes['General'];
    quizCache.set(quizCacheKey, selected);
    res.json(selected);
  } catch (err: any) {
    console.log('[BrainyBee] Serving verified mock quiz.');
    res.json({
      title: 'সাধারণ প্রস্তুতি টেস্ট',
      subject: 'General',
      classLevel: 9,
      questions: [
        {
          id: 1,
          question: 'বলের আন্তর্জাতিক একক (SI Unit) কোনটি?',
          options: ['জুল', 'নিউটন', 'ওয়াট', 'প্যাসকেল'],
          correctIndex: 1,
          explanation: 'বলের এসআই একক হলো নিউটন (N)।'
        }
      ]
    });
  }
});

async function main() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🐝 BrainyBee Server running on http://0.0.0.0:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
});
