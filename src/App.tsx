import React, { useState, useEffect, useRef } from 'react';
import {
  CLASSES,
  GROUPS_FOR_CLASS,
  SUBJECTS,
  CHAPTERS,
  FORMULAS,
  HAND_NOTES,
  FAQS,
  SubjectItem,
  FormulaItem,
} from './data/curriculumData';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  Search,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ArrowRight,
  HelpCircle,
  Award,
  CheckCircle2,
  ChevronDown,
  Clock,
  Mic,
  MicOff,
  Send,
  RefreshCw,
  Layers,
  FileText,
  Percent,
  X,
  ExternalLink,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  answer?: {
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
  };
  timestamp: string;
}

export default function App() {
  // Navigation & UI States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [siteLang, setSiteLang] = useState<'bn' | 'en' | 'mix'>(() => {
    try {
      const saved = localStorage.getItem('brainybee_siteLang');
      return saved ? JSON.parse(saved) : 'bn';
    } catch {
      return 'bn';
    }
  });

  // Curriculum Explorer State
  const [selectedClass, setSelectedClass] = useState<number>(9);
  const [selectedGroup, setSelectedGroup] = useState<'General' | 'Science' | 'Commerce' | 'Arts'>('Science');
  const [selectedSubject, setSelectedSubject] = useState<string>('Physics');

  // AI Teacher Chat State
  const [chatLang, setChatLang] = useState<'bn' | 'en' | 'mix'>('bn');
  const [chatClass, setChatClass] = useState<number>(9);
  const [chatSubject, setChatSubject] = useState<string>('Physics');
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Chat History
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'user',
      text: "Newton's second law সহজ করে বুঝাও।",
      timestamp: 'Just now',
    },
    {
      id: 'init-2',
      sender: 'ai',
      answer: {
        simple:
          'একটি বস্তুর উপর যত বেশি বল প্রয়োগ করা হয়, তার ত্বরণ তত বেশি হয় — আর ভর বেশি হলে একই বলে ত্বরণ কম হয়।',
        concept:
          'নিউটনের দ্বিতীয় গতিসূত্র বল, ভর ও ত্বরণের মধ্যে সম্পর্ক প্রকাশ করে। বল হলো ত্বরণের কারণ এবং এটি ভেক্টরের দিক নির্দেশ করে।',
        formula: 'F = ma (বা F = m(v - u)/t)',
        symbols: 'F = বল (নিউটন বা N), m = ভর (kg), a = ত্বরণ (m/s²)',
        example:
          'একটি খালি ভ্যানগাড়ি সহজে ঠেলা যায়, কিন্তু কয়েক বস্তা মালামাল থাকলে একই শক্তিতে ঠেললেও কম ত্বরণ পায় — কারণ ভর বেড়ে গেছে।',
        steps:
          '১) প্রশ্ন থেকে ভর (m) ও ত্বরণ (a) শনাক্ত করো  ২) আন্তর্জাতিক একক ঠিক আছে কিনা দেখো  ৩) F = ma সমীকরণে বসিয়ে সমাধান করো।',
        exam:
          'উত্তর: নিউটনের দ্বিতীয় গতিসূত্র অনুযায়ী, কোনো বস্তুর ভরবেগের পরিবর্তনের হার তার ওপর প্রযুক্ত নিট বলের সমানুপাতিক এবং বল যেদিকে ক্রিয়া করে ভরবেগের পরিবর্তনও সেদিকে ঘটে। অর্থাৎ F = ma।',
        mistakes:
          'ভর (kg) ও ওজন (N) গুলিয়ে ফেলা; ভর গ্রামে দেওয়া থাকলে কেজিতে রূপান্তর করতে ভুলে যাওয়া।',
        revision: 'মনে রাখো: বল ∝ ত্বরণ, যখন ভর স্থির থাকে (F = ma)।',
        related: 'নিউটনের ১ম সূত্র (জড়তা), ৩য় সূত্র (ক্রিয়া-প্রতিক্রিয়া), রৈখিক ভরবেগ',
        source: '📘 NCTB পাঠ্যপুস্তক · পদার্থবিজ্ঞান (শ্রেণি ৯-১০), অধ্যায় ৩',
      },
      timestamp: 'Just now',
    },
  ]);

  // Hand Notes Tab State
  const [activeNoteTab, setActiveNoteTab] = useState<Record<string, 'summary' | 'keyPoints' | 'examTips' | 'revision'>>({
    'n-1': 'summary',
    'n-2': 'summary',
    'n-3': 'summary',
    'n-4': 'summary',
  });

  // Formulas Filter & Search State
  const [formulaFilter, setFormulaFilter] = useState<string>('All');
  const [formulaSearch, setFormulaSearch] = useState<string>('');

  // Pricing & Billing Toggle State
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'bkash' | 'nagad' | 'bank'>('bkash');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Interactive Mock Test State
  const [mockTestActive, setMockTestActive] = useState(false);
  const [mockLoading, setMockLoading] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [testTimeRemaining, setTestTimeRemaining] = useState(300);

  // FAQ Open State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Save site language
  useEffect(() => {
    try {
      localStorage.setItem('brainybee_siteLang', JSON.stringify(siteLang));
    } catch (e) {
      console.warn(e);
    }
  }, [siteLang]);

  // Timer for active Mock Test
  useEffect(() => {
    let timer: any;
    if (mockTestActive && !quizFinished && testTimeRemaining > 0) {
      timer = setInterval(() => {
        setTestTimeRemaining((prev) => {
          if (prev <= 1) {
            setQuizFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mockTestActive, quizFinished, testTimeRemaining]);

  // Speech Recognition Setup
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please type your question.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = chatLang === 'en' ? 'en-US' : 'bn-BD';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // Text-to-Speech Read Aloud
  const speakText = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = chatLang === 'en' ? 'en-US' : 'bn-BD';
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Send question to AI Teacher API
  const handleAskQuestion = async (queryText?: string) => {
    const q = (queryText || chatInput).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          lang: chatLang,
          classLevel: chatClass,
          subject: chatSubject,
        }),
      });

      const data = await res.json();
      if (data && data.answer) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            answer: data.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error('Invalid format');
      }
    } catch (err) {
      console.error('Failed to ask AI teacher:', err);
      // Fallback message
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          answer: {
            simple: `"${q}" এর বিস্তারিত শিক্ষক-সুলভ ব্যাখ্যা এখানে প্রস্তুত করা হচ্ছে।`,
            concept: 'বোর্ড পরীক্ষার জন্য নির্ধারিত জাতীয় শিক্ষাক্রম অনুসারে মূল তত্ত্ব বিশ্লেষণ করা হলো।',
            formula: 'F = ma অথবা প্রযোজ্য সমীকরণ',
            symbols: 'রাশি ও এককসমূহ স্পষ্টভাবে চিহ্নিত করা হলো।',
            example: 'বাস্তব জীবনের একটি পরিচিত প্রেক্ষাপট বিবেচনা করুন।',
            steps: '১) প্রশ্ন মনোযোগ দিয়ে পড়ো  ২) সূত্র নির্বাচন করো  ৩) সমাধান সম্পন্ন করো।',
            exam: 'পরীক্ষার জন্য সম্পূর্ণ সৃজনশীল উত্তর।',
            mistakes: 'একক বা সংজ্ঞায় অসাবধানতা পরিহার করতে হবে।',
            revision: 'এক নজরে সূত্র ও মূল ধারণার সারসংক্ষেপ।',
            related: 'সংশ্লিষ্ট অধ্যায় ও পরিচ্ছেদসমূহ',
            source: '📘 NCTB সিলেবাস নির্দেশিকা',
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Copy structured response
  const copyAnswer = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Launch mock test
  const startMockTest = async (subject: string = 'Physics', classLevel: number = 9) => {
    setMockLoading(true);
    setMockTestActive(true);
    setQuizFinished(false);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setTestTimeRemaining(300);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          classLevel,
          lang: siteLang === 'en' ? 'en' : 'bn',
        }),
      });
      const data = await res.json();
      setQuizData(data);
    } catch (err) {
      console.error('Failed to load quiz:', err);
    } finally {
      setMockLoading(false);
    }
  };

  // Open Checkout Modal
  const openCheckout = (plan: 'monthly' | 'yearly') => {
    setCheckoutPlan(plan);
    setCheckoutSuccess(false);
    setPaymentModalOpen(true);
  };

  const confirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutSuccess(true);
  };

  // Filtered Formulas
  const filteredFormulas = FORMULAS.filter((f) => {
    const matchesFilter = formulaFilter === 'All' || f.subject === formulaFilter;
    const query = formulaSearch.toLowerCase();
    const matchesSearch =
      !query ||
      f.expr.toLowerCase().includes(query) ||
      f.meaning.toLowerCase().includes(query) ||
      f.meaningBn.toLowerCase().includes(query) ||
      f.subject.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-[#132039]">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e1e7f1]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <a href="#home" className="flex items-center gap-2.5 font-extrabold text-xl text-[#0e2648] tracking-tight">
            <svg className="w-9 h-9 flex-none" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="24,3 42,13.5 42,34.5 24,45 6,34.5 6,13.5" fill="#173a6b" />
              <polygon points="24,10 36,17 36,31 24,38 12,31 12,17" fill="#1c9d63" />
              <path d="M17 24 L22 29 L31 18" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-black text-2xl tracking-tight text-[#173a6b]">BrainyBee</span>
          </a>

          <nav className="hidden lg:flex items-center gap-7 text-[0.93rem] font-semibold text-[#54617a]">
            <a href="#home" className="hover:text-[#173a6b] transition-colors py-1">Home</a>
            <a href="#ai-teacher" className="hover:text-[#173a6b] transition-colors py-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#1c9d63]" />
              AI Teacher
            </a>
            <a href="#subjects" className="hover:text-[#173a6b] transition-colors py-1">Subjects</a>
            <a href="#hand-notes" className="hover:text-[#173a6b] transition-colors py-1">Hand Notes</a>
            <a href="#formulas" className="hover:text-[#173a6b] transition-colors py-1">Laws &amp; Formulas</a>
            <a href="#mock-test" className="hover:text-[#173a6b] transition-colors py-1 flex items-center gap-1.5 text-[#c98a2c]">
              <Award className="w-4 h-4" />
              Mock Tests
            </a>
            <a href="#premium" className="hover:text-[#173a6b] transition-colors py-1">Premium</a>
            <a href="#founder" className="hover:text-[#173a6b] transition-colors py-1">Founder</a>
          </nav>

          <div className="flex items-center gap-3">
            <select
              value={siteLang}
              onChange={(e) => {
                const val = e.target.value as 'bn' | 'en' | 'mix';
                setSiteLang(val);
                setChatLang(val);
              }}
              aria-label="Language"
              className="border border-[#e1e7f1] rounded-full px-3 py-1.5 text-xs font-bold bg-[#f5f8fc] text-[#0e2648] outline-none cursor-pointer hover:border-[#1c9d63] transition-colors"
            >
              <option value="bn">বাংলা (Bengali)</option>
              <option value="en">English</option>
              <option value="mix">বাংলা + English</option>
            </select>

            <button
              onClick={() => openCheckout('monthly')}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#1c9d63] hover:bg-[#147c4e] transition-all shadow-sm active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Go Premium
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#173a6b] hover:bg-[#f5f8fc]"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <div className="space-y-1 w-5"><span className="block w-5 h-0.5 bg-[#173a6b]"></span><span className="block w-5 h-0.5 bg-[#173a6b]"></span><span className="block w-5 h-0.5 bg-[#173a6b]"></span></div>}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#e1e7f1] bg-white px-6 py-4 space-y-3 font-medium text-sm">
            <a href="#home" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#0e2648]">Home</a>
            <a href="#ai-teacher" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#0e2648]">AI Teacher</a>
            <a href="#subjects" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#0e2648]">Subjects</a>
            <a href="#hand-notes" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#0e2648]">Hand Notes</a>
            <a href="#formulas" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#0e2648]">Laws &amp; Formulas</a>
            <a href="#mock-test" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#c98a2c]">Mock Tests (Exam Prep)</a>
            <a href="#premium" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#0e2648]">Premium Plans</a>
            <a href="#founder" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#0e2648]">Founder</a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openCheckout('monthly');
              }}
              className="w-full py-2.5 rounded-full text-center text-sm font-bold text-white bg-[#1c9d63]"
            >
              Go Premium (10% OFF)
            </button>
          </div>
        )}
      </header>

      <main id="home" className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#173a6b] via-[#112d54] to-[#0e2648] text-white py-16 md:py-24">
          <div className="hex-field"></div>
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10 grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wide border border-white/15">
                <span className="text-base">🇧🇩</span>
                <span>Bangladesh's AI Teacher for Class 6–12</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight leading-[1.15]">
                Your AI Teacher for <br className="hidden sm:inline" />
                <span className="text-[#34d399]">Class 6–12.</span>
              </h1>

              <p className="text-white/85 text-base sm:text-lg leading-relaxed max-w-2xl">
                Learn every subject from the Bangladesh NCTB curriculum with teacher-style explanations, smart hand notes, formulas, step-by-step examples, and mock tests — in Bangla or English.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="#ai-teacher"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm sm:text-base text-white bg-[#1c9d63] hover:bg-[#147c4e] transition-all shadow-lg active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  Ask BrainyBee Now
                </a>
                <a
                  href="#subjects"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm sm:text-base text-white border-2 border-white/40 hover:bg-white/10 transition-all active:scale-95"
                >
                  <BookOpen className="w-4 h-4" />
                  Browse Subjects Free
                </a>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/15 max-w-lg">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white">6–12</div>
                  <div className="text-xs text-white/70 font-medium">Classes Covered</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white">3 Groups</div>
                  <div className="text-xs text-white/70 font-medium">Science, Arts, Commerce</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white">বাংলা + EN</div>
                  <div className="text-xs text-white/70 font-medium">Bilingual Support</div>
                </div>
              </div>
            </div>

            {/* Live Interactive Hero Preview Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl text-[#132039] border border-white/20 transform transition-all hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#e1e7f1]">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#0e2648]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1c9d63] animate-pulse"></span>
                    BrainyBee AI Teacher Preview
                  </div>
                  <span className="text-[0.7rem] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#e6f6ee] text-[#147c4e]">
                    Live Structure
                  </span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="bg-[#eef3fa] p-3 rounded-2xl rounded-tr-none ml-auto max-w-[88%] text-[#173a6b] font-medium">
                    Newton's second law সহজ করে বুঝাও।
                  </div>

                  <div className="bg-[#e6f6ee] p-3.5 rounded-2xl rounded-tl-none mr-auto max-w-[95%] border border-[#c3edd7] space-y-1.5">
                    <div className="text-[0.7rem] font-bold text-[#147c4e] uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      1. Simple Teacher Explanation
                    </div>
                    <p className="text-xs leading-relaxed text-[#0e2648]">
                      বস্তুর উপর বল প্রয়োগ করলে তার গতি বাড়ে (ত্বরণ হয়)। বেশি ভারী বস্তুকে একই গতি দিতে বেশি বল লাগে।
                    </p>
                  </div>

                  <div className="bg-[#f5f8fc] p-3.5 rounded-2xl border border-[#e1e7f1] space-y-1.5">
                    <div className="text-[0.7rem] font-bold text-[#173a6b] uppercase tracking-wider">
                      2. Formula &amp; Symbols
                    </div>
                    <div className="font-mono font-bold text-sm sm:text-base text-[#173a6b]">
                      F = ma
                    </div>
                    <p className="text-[0.72rem] text-[#54617a]">
                      F = প্রযুক্ত বল (N), m = বস্তুর ভর (kg), a = ত্বরণ (m/s²)
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[0.7rem] text-[#8593ab]">
                      <span>📘 Source: NCTB Class 9 Physics</span>
                      <a href="#ai-teacher" className="text-[#1c9d63] font-bold hover:underline">
                        Try Full Chat →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= AI TEACHER CHAT SECTION ================= */}
        <section id="ai-teacher" className="py-16 md:py-24 bg-[#ffffff]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#147c4e] tracking-wider uppercase mb-2">
                <span className="w-2 h-2 rounded-full bg-[#1c9d63]"></span>
                One-on-One Tutoring
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0e2648] tracking-tight">
                Ask. Understand. Learn. Practice. Revise.
              </h2>
              <p className="mt-3 text-base text-[#54617a] leading-relaxed">
                Type any question from your NCTB syllabus — BrainyBee breaks it down into simple terms, formulas, examples, exam tips, and quick revision.
              </p>
            </div>

            {/* 5-Step Process Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 border border-[#e1e7f1] rounded-2xl overflow-hidden mb-10 divide-x divide-y sm:divide-y-0 divide-[#e1e7f1] bg-[#f5f8fc]">
              <div className="p-4">
                <span className="block text-[0.72rem] font-extrabold text-[#147c4e] uppercase">Step 1: Ask</span>
                <strong className="text-xs sm:text-sm text-[#0e2648]">Type any doubt or concept</strong>
              </div>
              <div className="p-4">
                <span className="block text-[0.72rem] font-extrabold text-[#147c4e] uppercase">Step 2: Understand</span>
                <strong className="text-xs sm:text-sm text-[#0e2648]">Grasp intuitive core idea</strong>
              </div>
              <div className="p-4">
                <span className="block text-[0.72rem] font-extrabold text-[#147c4e] uppercase">Step 3: Learn</span>
                <strong className="text-xs sm:text-sm text-[#0e2648]">Formulas &amp; step-by-step math</strong>
              </div>
              <div className="p-4">
                <span className="block text-[0.72rem] font-extrabold text-[#147c4e] uppercase">Step 4: Practice</span>
                <strong className="text-xs sm:text-sm text-[#0e2648]">Exam-ready CQ &amp; MCQ tips</strong>
              </div>
              <div className="p-4 col-span-2 sm:col-span-1">
                <span className="block text-[0.72rem] font-extrabold text-[#147c4e] uppercase">Step 5: Revise</span>
                <strong className="text-xs sm:text-sm text-[#0e2648]">1-line memory takeaways</strong>
              </div>
            </div>

            {/* Workspace: Chat + Sidebar */}
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Chat Card */}
              <div className="lg:col-span-8 bg-white border border-[#e1e7f1] rounded-3xl shadow-lg overflow-hidden flex flex-col">
                {/* Chat Top Bar */}
                <div className="bg-[#f5f8fc] border-b border-[#e1e7f1] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-[#0e2648]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1c9d63] animate-ping"></span>
                    BrainyBee AI Teacher
                    <span className="text-[0.68rem] px-2 py-0.5 rounded-full bg-[#e6f6ee] text-[#147c4e] font-bold">
                      Interactive Tutor
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Class Selector Pill */}
                    <select
                      value={chatClass}
                      onChange={(e) => setChatClass(Number(e.target.value))}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full border border-[#e1e7f1] bg-white text-[#173a6b]"
                      aria-label="Target Class"
                    >
                      {CLASSES.map((c) => (
                        <option key={c} value={c}>
                          Class {c}
                        </option>
                      ))}
                    </select>

                    {/* Language Switch */}
                    <div className="flex bg-white rounded-full p-0.5 border border-[#e1e7f1]">
                      <button
                        onClick={() => setChatLang('bn')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-full transition-colors ${
                          chatLang === 'bn' ? 'bg-[#173a6b] text-white' : 'text-[#54617a] hover:text-[#173a6b]'
                        }`}
                      >
                        বাংলা
                      </button>
                      <button
                        onClick={() => setChatLang('en')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-full transition-colors ${
                          chatLang === 'en' ? 'bg-[#173a6b] text-white' : 'text-[#54617a] hover:text-[#173a6b]'
                        }`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => setChatLang('mix')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-full transition-colors ${
                          chatLang === 'mix' ? 'bg-[#173a6b] text-white' : 'text-[#54617a] hover:text-[#173a6b]'
                        }`}
                      >
                        বাংলা+En
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chat Feed */}
                <div className="h-[460px] overflow-y-auto p-4 sm:p-6 space-y-5 bg-gradient-to-b from-white to-[#fcfdfe]">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.sender === 'user' ? (
                        <div className="bg-[#173a6b] text-white px-4 py-3 rounded-2xl rounded-br-sm max-w-[85%] sm:max-w-[75%] text-sm sm:text-base font-medium shadow-sm">
                          {m.text}
                          <span className="block text-[0.65rem] text-white/60 text-right mt-1 font-mono">
                            {m.timestamp}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-[#f5f8fc] border border-[#e1e7f1] rounded-2xl rounded-bl-sm p-4 sm:p-5 max-w-[94%] space-y-4 shadow-sm text-[#132039]">
                          <div className="flex items-center justify-between border-b border-[#e1e7f1] pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-[#1c9d63] text-white flex items-center justify-center text-[0.65rem] font-black">
                                🐝
                              </span>
                              <h4 className="font-extrabold text-sm sm:text-base text-[#0e2648]">
                                BrainyBee Teacher Breakdown
                              </h4>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() =>
                                  speakText(
                                    m.id,
                                    `${m.answer?.simple}. Formula: ${m.answer?.formula}. Example: ${m.answer?.example}`
                                  )
                                }
                                title="Listen to explanation (Read Aloud)"
                                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                                  speakingMsgId === m.id
                                    ? 'bg-[#1c9d63] text-white border-[#1c9d63]'
                                    : 'bg-white border-[#e1e7f1] text-[#54617a] hover:bg-[#eef3fa]'
                                }`}
                              >
                                {speakingMsgId === m.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                                <span className="hidden sm:inline">
                                  {speakingMsgId === m.id ? 'Stop' : 'Listen'}
                                </span>
                              </button>

                              <button
                                onClick={() =>
                                  copyAnswer(
                                    m.id,
                                    `BrainyBee Teacher Explanation:\n${m.answer?.simple}\nConcept: ${m.answer?.concept}\nFormula: ${m.answer?.formula}\nExample: ${m.answer?.example}`
                                  )
                                }
                                title="Copy explanation"
                                className="p-1.5 rounded-lg border border-[#e1e7f1] bg-white hover:bg-[#eef3fa] text-[#54617a]"
                              >
                                {copiedId === m.id ? (
                                  <Check className="w-3.5 h-3.5 text-[#1c9d63]" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {m.answer && (
                            <div className="space-y-3.5 text-xs sm:text-sm">
                              {/* 1. Simple Explanation */}
                              <div className="bg-[#e6f6ee]/80 p-3 rounded-xl border border-[#c3edd7]">
                                <b className="block text-[0.72rem] text-[#147c4e] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  সহজ ভাষায় ব্যাখ্যা (Simple Explanation)
                                </b>
                                <p className="text-[#0e2648] leading-relaxed">{m.answer.simple}</p>
                              </div>

                              {/* 2. Core Academic Concept */}
                              <div>
                                <b className="block text-[0.72rem] text-[#173a6b] uppercase tracking-wider mb-1">
                                  মূল তত্ত্ব ও ধারণা (Main Academic Concept)
                                </b>
                                <p className="text-[#54617a] leading-relaxed">{m.answer.concept}</p>
                              </div>

                              {/* 3. Formula & Symbols */}
                              {m.answer.formula && m.answer.formula !== 'N/A' && (
                                <div className="bg-white p-3.5 rounded-xl border border-[#e1e7f1] font-mono">
                                  <div className="text-xs font-bold text-[#173a6b] uppercase tracking-wider mb-1">
                                    সমীকরণ ও একক (Formula &amp; Units)
                                  </div>
                                  <div className="text-base sm:text-lg font-black text-[#0e2648] py-0.5">
                                    {m.answer.formula}
                                  </div>
                                  <div className="text-xs text-[#54617a] font-sans mt-1">
                                    {m.answer.symbols}
                                  </div>
                                </div>
                              )}

                              {/* 4. Real Life Example */}
                              <div>
                                <b className="block text-[0.72rem] text-[#147c4e] uppercase tracking-wider mb-1">
                                  বাস্তব জীবনের উদাহরণ (Relatable Real-Life Example)
                                </b>
                                <p className="text-[#54617a] leading-relaxed">{m.answer.example}</p>
                              </div>

                              {/* 5. Step by step */}
                              <div className="bg-[#eef3fa] p-3 rounded-xl">
                                <b className="block text-[0.72rem] text-[#173a6b] uppercase tracking-wider mb-1">
                                  ধাপভিত্তিক সমাধান (Step-by-Step Working)
                                </b>
                                <p className="text-[#0e2648] leading-relaxed">{m.answer.steps}</p>
                              </div>

                              {/* 6. Exam friendly answer */}
                              <div className="border-l-4 border-[#1c9d63] pl-3 py-1">
                                <b className="block text-[0.72rem] text-[#0e2648] uppercase tracking-wider mb-1">
                                  পরীক্ষার উপযোগী উত্তর (Exam-Ready CQ/Written Answer)
                                </b>
                                <p className="text-[#54617a] leading-relaxed">{m.answer.exam}</p>
                              </div>

                              {/* 7. Common mistakes */}
                              <div className="bg-[#fff7ed] p-3 rounded-xl border border-[#fed7aa]">
                                <b className="block text-[0.72rem] text-[#c2410c] uppercase tracking-wider mb-1">
                                  যেসব ভুল ছাত্রছাত্রীরা বেশি করে (Common Pitfalls)
                                </b>
                                <p className="text-[#7c2d12] leading-relaxed">{m.answer.mistakes}</p>
                              </div>

                              {/* 8. Quick revision */}
                              <div className="bg-[#fbf0dd] p-3 rounded-xl border border-[#f5dfb8]">
                                <b className="block text-[0.72rem] text-[#c98a2c] uppercase tracking-wider mb-1">
                                  এক লাইনে মনে রাখো (1-Line Revision Recap)
                                </b>
                                <p className="text-[#78350f] font-semibold leading-relaxed">{m.answer.revision}</p>
                              </div>

                              {/* Source tag & related */}
                              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#e1e7f1] text-[0.72rem] text-[#8593ab]">
                                <span>{m.answer.source}</span>
                                <span className="text-[#173a6b] font-medium">
                                  টপিক: {m.answer.related}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#54617a] bg-[#f5f8fc] p-3 rounded-2xl max-w-[200px]">
                      <span>BrainyBee ভাবছে</span>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1c9d63] typing-dot"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1c9d63] typing-dot"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1c9d63] typing-dot"></span>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Quick Suggestion Chips */}
                <div className="px-4 sm:px-6 py-2.5 bg-[#f5f8fc] border-t border-[#e1e7f1] flex flex-wrap gap-2">
                  <span className="text-[0.72rem] font-bold text-[#8593ab] self-center">
                    দ্রুত প্রশ্ন:
                  </span>
                  {[
                    "Newton's second law সহজ করে বুঝাও",
                    'Explain photosynthesis simply',
                    'মোল কী এবং কেন ব্যবহার হয়?',
                    'হিসাব সমীকরণ ও দুতরফা দাখিলা কী?',
                    'ত্রিকোণমিতির সূত্রাবলী বুঝিয়ে দাও',
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleAskQuestion(chip)}
                      className="text-xs px-3 py-1 rounded-full bg-white border border-[#e1e7f1] text-[#173a6b] hover:bg-[#eef3fa] transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Input Row */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskQuestion();
                  }}
                  className="p-3 sm:p-4 bg-white border-t border-[#e1e7f1] flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    title={isListening ? 'Listening... click to stop' : 'Click to speak question'}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-[#f5f8fc] hover:bg-[#eef3fa] text-[#54617a] border border-[#e1e7f1]'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your question… e.g. Work-energy theorem সহজ করে বুঝাও"
                    aria-label="Ask BrainyBee a question"
                    className="flex-1 bg-[#f5f8fc] border border-[#e1e7f1] rounded-full px-4 sm:px-5 py-2.5 text-sm outline-none focus:border-[#1c9d63] focus:bg-white transition-all font-sans"
                  />

                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isTyping}
                    aria-label="Send question"
                    className="w-10 h-10 rounded-full bg-[#1c9d63] hover:bg-[#147c4e] disabled:opacity-50 text-white flex items-center justify-center transition-all flex-none shadow-sm active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Chat Sidebar Guidance */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-[#f5f8fc] border border-[#e1e7f1] rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0e2648]">
                    <GraduationCap className="w-4 h-4 text-[#1c9d63]" />
                    How BrainyBee Answers
                  </div>
                  <p className="text-xs text-[#54617a] leading-relaxed">
                    Every answer follows our 8-pillar teacher methodology: simple summary, core theory, equation with units, everyday Bangladeshi analogy, exam CQ solution, common pitfalls, and a 1-line revision recap.
                  </p>
                </div>

                <div className="bg-[#f5f8fc] border border-[#e1e7f1] rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0e2648]">
                    <BookOpen className="w-4 h-4 text-[#173a6b]" />
                    NCTB Curriculum Alignment
                  </div>
                  <p className="text-xs text-[#54617a] leading-relaxed">
                    Calibrated specifically for Class 6–12 students across General, Science, Arts, and Commerce groups so that answers directly match your textbooks and board examination guidelines.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#fbf0dd] to-white border border-[#f5dfb8] rounded-2xl p-5 space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#78350f]">
                    <Award className="w-4 h-4 text-[#c98a2c]" />
                    Take a Practice Test Now
                  </div>
                  <p className="text-xs text-[#78350f] leading-relaxed">
                    Test your understanding with board-standard MCQs, timer, instant grading, and detailed explanations.
                  </p>
                  <button
                    onClick={() => startMockTest(chatSubject, chatClass)}
                    className="w-full mt-1 py-2 rounded-xl text-xs font-bold text-white bg-[#c98a2c] hover:bg-[#a9721f] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Award className="w-3.5 h-3.5" />
                    Launch Mock Test on {chatSubject}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CURRICULUM EXPLORER ================= */}
        <section id="subjects" className="py-16 md:py-24 bg-[#f5f8fc] border-y border-[#e1e7f1]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#147c4e] tracking-wider uppercase mb-2">
                <span className="w-2 h-2 rounded-full bg-[#1c9d63]"></span>
                Curriculum Navigator
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0e2648] tracking-tight">
                Find Any Topic in Seconds.
              </h2>
              <p className="mt-3 text-base text-[#54617a] leading-relaxed">
                Pick your class, group, and subject — BrainyBee shows chapters and topics the way your textbook does, with instant 1-click explanation.
              </p>
            </div>

            <div className="bg-white border border-[#e1e7f1] rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
              {/* Step 1: Class Selector */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-[#8593ab] mb-3">
                  ১. শ্রেণি নির্বাচন করুন (1. Select Class)
                </span>
                <div className="flex flex-wrap gap-2">
                  {CLASSES.map((cls) => (
                    <button
                      key={cls}
                      onClick={() => {
                        setSelectedClass(cls);
                        const groups = GROUPS_FOR_CLASS(cls);
                        if (!groups.includes(selectedGroup)) {
                          setSelectedGroup(groups[0]);
                        }
                      }}
                      className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                        selectedClass === cls
                          ? 'bg-[#173a6b] text-white shadow-sm'
                          : 'bg-[#f5f8fc] text-[#54617a] hover:bg-[#eef3fa]'
                      }`}
                    >
                      Class {cls} (শ্রেণি {cls})
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Group Selector */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-[#8593ab] mb-3">
                  ২. বিভাগ নির্বাচন করুন (2. Select Group)
                </span>
                <div className="flex flex-wrap gap-2">
                  {GROUPS_FOR_CLASS(selectedClass).map((g) => (
                    <button
                      key={g}
                      onClick={() => {
                        setSelectedGroup(g);
                        const subs = SUBJECTS[g] || [];
                        if (subs.length) setSelectedSubject(subs[0].name);
                      }}
                      className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                        selectedGroup === g
                          ? 'bg-[#1c9d63] text-white shadow-sm'
                          : 'bg-[#f5f8fc] text-[#54617a] hover:bg-[#eef3fa]'
                      }`}
                    >
                      {g} {g === 'General' ? '(সাধারণ)' : g === 'Science' ? '(বিজ্ঞান)' : g === 'Commerce' ? '(ব্যবসায় শিক্ষা)' : '(মানবিক)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Subject Grid */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-[#8593ab] mb-3">
                  ৩. বিষয় নির্বাচন করুন (3. Select Subject)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {(SUBJECTS[selectedGroup] || []).map((sub: SubjectItem) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubject(sub.name)}
                      className={`p-4 rounded-2xl text-left border transition-all ${
                        selectedSubject === sub.name
                          ? 'bg-[#e6f6ee] border-[#1c9d63] shadow-sm transform -translate-y-0.5'
                          : 'bg-[#f5f8fc] border-[#e1e7f1] hover:bg-[#eef3fa]'
                      }`}
                    >
                      <span className="text-2xl block mb-2">{sub.ic}</span>
                      <strong className="block text-sm font-bold text-[#0e2648]">{sub.name}</strong>
                      <span className="text-xs text-[#54617a]">{sub.nameBn}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Chapters & Topics Explorer */}
              <div className="pt-4 border-t border-[#e1e7f1]">
                <div className="flex items-center justify-between mb-4">
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#8593ab]">
                    ৪. অধ্যায় ও টপিকসমূহ (4. Chapters &amp; Key Syllabus Topics)
                  </span>
                  <span className="text-xs font-semibold text-[#1c9d63] bg-[#e6f6ee] px-3 py-1 rounded-full">
                    {selectedSubject} · Class {selectedClass}
                  </span>
                </div>

                <div className="space-y-3">
                  {(CHAPTERS[selectedSubject] || []).map((ch) => (
                    <div key={ch.id} className="border border-[#e1e7f1] rounded-2xl p-4 sm:p-5 bg-[#ffffff] space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="font-extrabold text-sm sm:text-base text-[#0e2648]">{ch.name}</h4>
                          <span className="text-xs text-[#54617a]">{ch.nameBn}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setChatSubject(selectedSubject);
                              setChatClass(selectedClass);
                              handleAskQuestion(`Explain ${ch.name} (${selectedSubject}) thoroughly for Class ${selectedClass}`);
                              window.location.hash = 'ai-teacher';
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#173a6b] bg-[#eef3fa] hover:bg-[#173a6b] hover:text-white transition-all"
                          >
                            <Sparkles className="w-3 h-3" />
                            Ask Teacher
                          </button>
                          <button
                            onClick={() => startMockTest(selectedSubject, selectedClass)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-[#c98a2c] bg-[#fbf0dd] hover:bg-[#c98a2c] hover:text-white transition-all"
                          >
                            <Award className="w-3 h-3" />
                            Quiz
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {ch.topics.map((t, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setChatSubject(selectedSubject);
                              setChatClass(selectedClass);
                              handleAskQuestion(`${t} (${selectedSubject}) সহজ করে বুঝিয়ে দাও`);
                              window.location.hash = 'ai-teacher';
                            }}
                            className="text-xs px-3 py-1.5 rounded-full bg-[#f5f8fc] border border-[#e1e7f1] text-[#54617a] hover:text-[#173a6b] hover:border-[#1c9d63] hover:bg-white transition-all flex items-center gap-1"
                          >
                            <span>{t}</span>
                            <ArrowRight className="w-3 h-3 opacity-60" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {(!CHAPTERS[selectedSubject] || CHAPTERS[selectedSubject].length === 0) && (
                    <div className="p-8 text-center text-[#8593ab] text-sm">
                      Select another subject above to view full chapter breakdown.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= WHY BRAINYBEE (FEATURES) ================= */}
        <section id="features" className="py-16 md:py-24 bg-white">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#147c4e] tracking-wider uppercase mb-2">
                <span className="w-2 h-2 rounded-full bg-[#1c9d63]"></span>
                Why BrainyBee
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0e2648] tracking-tight">
                Everything a Student Needs to Actually Understand.
              </h2>
              <p className="mt-3 text-base text-[#54617a] leading-relaxed">
                Engineered from the ground up for Bangladeshi secondary and higher secondary students, removing confusion with structure and clarity.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl border border-[#e1e7f1] bg-[#f5f8fc] space-y-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-[#e6f6ee] text-[#1c9d63] flex items-center justify-center text-xl">
                  🎓
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-[#0e2648]">
                  AI Teacher, On Demand
                </h3>
                <p className="text-xs sm:text-sm text-[#54617a] leading-relaxed">
                  Ask any doubt from your syllabus 24/7. Get structured, step-by-step teacher explanations instead of a chaotic wall of text.
                </p>
              </div>

              <div className="p-6 rounded-3xl border border-[#e1e7f1] bg-[#f5f8fc] space-y-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-[#eef3fa] text-[#173a6b] flex items-center justify-center text-xl">
                  📝
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-[#0e2648]">
                  Structured Hand Notes
                </h3>
                <p className="text-xs sm:text-sm text-[#54617a] leading-relaxed">
                  Every chapter comes with summaries, key points, formulas, and exam tips organized just like the notebook of a top board-exam scorer.
                </p>
              </div>

              <div className="p-6 rounded-3xl border border-[#e1e7f1] bg-[#f5f8fc] space-y-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-[#fbf0dd] text-[#c98a2c] flex items-center justify-center text-xl">
                  ∑
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-[#0e2648]">
                  Laws &amp; Formulas Library
                </h3>
                <p className="text-xs sm:text-sm text-[#54617a] leading-relaxed">
                  Search any academic formula across Physics, Chemistry, Math, and Accounting. See variables, when to use it, and real worked calculations.
                </p>
              </div>

              <div className="p-6 rounded-3xl border border-[#e1e7f1] bg-[#f5f8fc] space-y-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-[#e6f6ee] text-[#147c4e] flex items-center justify-center text-xl">
                  🌐
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-[#0e2648]">
                  Bangla + English Bilingual
                </h3>
                <p className="text-xs sm:text-sm text-[#54617a] leading-relaxed">
                  Switch effortlessly between বাংলা, English, or mixed mode. Perfect for students who want Bangla explanations for complex English terms.
                </p>
              </div>

              <div className="p-6 rounded-3xl border border-[#e1e7f1] bg-[#f5f8fc] space-y-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-[#eef3fa] text-[#173a6b] flex items-center justify-center text-xl">
                  📚
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-[#0e2648]">
                  Class 6 to 12 Curriculum
                </h3>
                <p className="text-xs sm:text-sm text-[#54617a] leading-relaxed">
                  Comprehensive coverage across Science, Arts, Commerce, and General groups following Bangladesh NCTB textbook guidelines.
                </p>
              </div>

              <div className="p-6 rounded-3xl border border-[#e1e7f1] bg-[#f5f8fc] space-y-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-[#fbf0dd] text-[#c98a2c] flex items-center justify-center text-xl">
                  ⏱️
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-[#0e2648]">
                  Timed Mock Tests &amp; Quizzes
                </h3>
                <p className="text-xs sm:text-sm text-[#54617a] leading-relaxed">
                  Simulate real board exam conditions with interactive MCQs, instant grading, time tracking, and teacher explanations for every answer.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= HAND NOTES SECTION ================= */}
        <section id="hand-notes" className="py-16 md:py-24 bg-[#f5f8fc] border-t border-[#e1e7f1]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#147c4e] tracking-wider uppercase mb-2">
                <span className="w-2 h-2 rounded-full bg-[#1c9d63]"></span>
                Smart Hand Notes
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0e2648] tracking-tight">
                Organized Like the Best Notes in Class.
              </h2>
              <p className="mt-3 text-base text-[#54617a] leading-relaxed">
                Structured into Summary, Key Points, Exam Tips, and Revision lines so you can revise entire chapters in 5 minutes.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {HAND_NOTES.map((note) => {
                const currentTab = activeNoteTab[note.id] || 'summary';
                return (
                  <div
                    key={note.id}
                    className="border border-[#e1e7f1] rounded-3xl bg-white shadow-sm overflow-hidden flex flex-col"
                  >
                    <div className="p-5 bg-[#f5f8fc] border-b border-[#e1e7f1] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#1c9d63] uppercase tracking-wider">
                          {note.subject} · Class {note.classLevel}
                        </span>
                        <h4 className="font-extrabold text-base text-[#0e2648] mt-0.5">{note.title}</h4>
                        <span className="text-xs text-[#54617a]">{note.titleBn}</span>
                      </div>
                      <button
                        onClick={() => {
                          setChatSubject(note.subject);
                          setChatClass(note.classLevel);
                          handleAskQuestion(`Explain ${note.title} for Class ${note.classLevel}`);
                          window.location.hash = 'ai-teacher';
                        }}
                        className="p-2 rounded-full bg-white border border-[#e1e7f1] text-[#173a6b] hover:bg-[#173a6b] hover:text-white transition-colors"
                        title="Ask AI Teacher about this note"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[#e1e7f1] px-5 pt-3 gap-2 bg-white">
                      {[
                        { id: 'summary', label: 'সারমর্ম (Summary)' },
                        { id: 'keyPoints', label: 'মূল তথ্য (Key Points)' },
                        { id: 'examTips', label: 'পরীক্ষার টিপস (Exam Tips)' },
                        { id: 'revision', label: 'রিভিশন (Quick Recap)' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() =>
                            setActiveNoteTab((prev) => ({
                              ...prev,
                              [note.id]: tab.id as any,
                            }))
                          }
                          className={`text-xs font-bold pb-2.5 px-2 border-b-2 transition-colors ${
                            currentTab === tab.id
                              ? 'border-[#173a6b] text-[#173a6b]'
                              : 'border-transparent text-[#8593ab] hover:text-[#54617a]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab Body */}
                    <div className="p-5 flex-1 text-xs sm:text-sm text-[#54617a] leading-relaxed">
                      {currentTab === 'summary' && <p>{note.tabs.summary}</p>}

                      {currentTab === 'keyPoints' && (
                        <ul className="space-y-2 list-disc list-inside">
                          {note.tabs.keyPoints.map((kp, idx) => (
                            <li key={idx} className="text-[#0e2648]">
                              {kp}
                            </li>
                          ))}
                        </ul>
                      )}

                      {currentTab === 'examTips' && (
                        <div className="bg-[#fffbeb] p-3.5 rounded-xl border border-[#fde68a] text-[#92400e]">
                          <strong>বোর্ড পরীক্ষার টিপস: </strong>
                          {note.tabs.examTips}
                        </div>
                      )}

                      {currentTab === 'revision' && (
                        <div className="bg-[#e6f6ee] p-3.5 rounded-xl border border-[#c3edd7] text-[#147c4e] font-semibold">
                          💡 <strong>১ লাইনে মনে রাখো: </strong>
                          {note.tabs.revision}
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-[#f5f8fc] border-t border-[#e1e7f1] flex items-center justify-between text-xs">
                      <button
                        onClick={() =>
                          copyAnswer(
                            note.id,
                            `BrainyBee Hand Note: ${note.title}\n${note.tabs.summary}\n${note.tabs.revision}`
                          )
                        }
                        className="text-[#173a6b] font-bold flex items-center gap-1 hover:underline"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy Note
                      </button>
                      <button
                        onClick={() => startMockTest(note.subject, note.classLevel)}
                        className="text-[#c98a2c] font-bold flex items-center gap-1 hover:underline"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Quiz on This Note →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= LAWS & FORMULAS LIBRARY ================= */}
        <section id="formulas" className="py-16 md:py-24 bg-white border-t border-[#e1e7f1]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-8">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#147c4e] tracking-wider uppercase mb-2">
                <span className="w-2 h-2 rounded-full bg-[#1c9d63]"></span>
                Formula Master
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0e2648] tracking-tight">
                Laws &amp; Formulas Library.
              </h2>
              <p className="mt-3 text-base text-[#54617a] leading-relaxed">
                Academic laws, rules, equations, and theorems — explained with parameter definitions, when to use them in problems, and worked examples.
              </p>
            </div>

            {/* Formula Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8593ab]" />
                <input
                  type="text"
                  value={formulaSearch}
                  onChange={(e) => setFormulaSearch(e.target.value)}
                  placeholder="Search formula, e.g. F = ma, mole, trigonometry, assets..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-full border border-[#e1e7f1] bg-[#f5f8fc] text-sm outline-none focus:border-[#1c9d63] focus:bg-white transition-all font-sans"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {['All', 'Physics', 'Chemistry', 'Mathematics', 'Accounting', 'Finance', 'Biology'].map((subj) => (
                  <button
                    key={subj}
                    onClick={() => setFormulaFilter(subj)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      formulaFilter === subj
                        ? 'bg-[#173a6b] text-white'
                        : 'bg-[#f5f8fc] text-[#54617a] hover:bg-[#eef3fa]'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            {/* Formula Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFormulas.map((f: FormulaItem) => (
                <div
                  key={f.id}
                  className="p-5 rounded-3xl border border-[#e1e7f1] border-l-4 border-l-[#1c9d63] bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-3.5"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-[#1c9d63] uppercase">
                      <span>{f.subject}</span>
                      <button
                        onClick={() => {
                          setChatSubject(f.subject);
                          handleAskQuestion(`Explain formula "${f.expr}" (${f.meaning}) in detail with examples`);
                          window.location.hash = 'ai-teacher';
                        }}
                        className="text-[0.7rem] px-2 py-0.5 rounded-full bg-[#e6f6ee] text-[#147c4e] font-bold hover:bg-[#1c9d63] hover:text-white transition-colors"
                      >
                        Ask Teacher
                      </button>
                    </div>

                    <div className="font-mono font-extrabold text-lg sm:text-xl text-[#0e2648] my-1.5 tracking-tight">
                      {f.expr}
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-[#173a6b] mb-1">{f.meaning}</h4>
                    <p className="text-xs text-[#54617a] mb-2">{f.meaningBn}</p>

                    <div className="space-y-1.5 text-xs text-[#54617a] pt-2 border-t border-[#e1e7f1]">
                      <div>
                        <strong className="text-[#0e2648]">রাশি ও একক: </strong>
                        {f.vars}
                      </div>
                      <div>
                        <strong className="text-[#0e2648]">কখন ব্যবহার হবে: </strong>
                        {f.when}
                      </div>
                      <div className="bg-[#f5f8fc] p-2.5 rounded-xl border border-[#e1e7f1] text-[#0e2648] font-mono text-[0.72rem]">
                        <strong>উদাহরণ: </strong>
                        {f.example}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredFormulas.length === 0 && (
              <div className="text-center py-12 text-[#8593ab] text-sm">
                No formulas matched your search. Try "F = ma", "PV = nRT", or "sin".
              </div>
            )}
          </div>
        </section>

        {/* ================= INTERACTIVE MOCK TEST / EXAM PRACTICE ================= */}
        <section id="mock-test" className="py-16 md:py-24 bg-gradient-to-b from-[#f5f8fc] to-[#ffffff] border-t border-[#e1e7f1]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#c98a2c] tracking-wider uppercase mb-2">
                <span className="w-2 h-2 rounded-full bg-[#c98a2c]"></span>
                Exam Practice Studio (Premium Feature Preview)
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0e2648] tracking-tight">
                Practice Like Exam Day.
              </h2>
              <p className="mt-3 text-base text-[#54617a] leading-relaxed">
                Experience BrainyBee’s board-standard timed mock test simulator. Test your retention, see detailed solutions, and detect weak areas instantly.
              </p>
            </div>

            {!mockTestActive ? (
              <div className="bg-white border border-[#e1e7f1] rounded-3xl p-6 sm:p-10 shadow-lg grid md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-8 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fbf0dd] text-[#c98a2c] text-xs font-extrabold uppercase tracking-wider">
                    <Award className="w-3.5 h-3.5" />
                    5-Question Board Simulation
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#0e2648]">
                    Ready to test your knowledge right now?
                  </h3>
                  <p className="text-xs sm:text-sm text-[#54617a] leading-relaxed">
                    Select your subject and launch an instant 5-minute timed mock test with instant scoring and teacher explanations for every answer.
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    {['Physics', 'Chemistry', 'Higher Mathematics', 'General Science', 'Accounting'].map((s) => (
                      <button
                        key={s}
                        onClick={() => startMockTest(s, 9)}
                        className="px-4 py-2 rounded-full text-xs font-bold border border-[#e1e7f1] bg-[#f5f8fc] hover:bg-[#173a6b] hover:text-white transition-all shadow-sm"
                      >
                        Start {s} Test
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-4 bg-[#f5f8fc] border border-[#e1e7f1] rounded-2xl p-5 text-center space-y-3">
                  <div className="text-3xl font-black text-[#173a6b]">১০০%</div>
                  <p className="text-xs text-[#54617a]">
                    পরীক্ষার নির্ভুল প্রস্তুতি ও দুর্বল টপিক চিহ্নিতকরণ
                  </p>
                  <button
                    onClick={() => startMockTest('Physics', 9)}
                    className="w-full py-3 rounded-full text-xs font-bold text-white bg-[#1c9d63] hover:bg-[#147c4e] transition-all shadow-sm"
                  >
                    Start Quick Test (Physics)
                  </button>
                </div>
              </div>
            ) : mockLoading ? (
              <div className="bg-white border border-[#e1e7f1] rounded-3xl p-12 text-center space-y-4">
                <div className="w-10 h-10 border-4 border-[#1c9d63] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <h4 className="font-bold text-base text-[#0e2648]">Generating Board Mock Test...</h4>
                <p className="text-xs text-[#54617a]">Tailoring 5 MCQ questions aligned with the NCTB curriculum</p>
              </div>
            ) : quizData ? (
              <div className="bg-white border border-[#e1e7f1] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                {/* Quiz Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#e1e7f1]">
                  <div>
                    <span className="text-xs font-bold text-[#1c9d63] uppercase tracking-wider">
                      {quizData.subject} · Class {quizData.classLevel}
                    </span>
                    <h3 className="font-black text-lg sm:text-xl text-[#0e2648]">{quizData.title}</h3>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fbf0dd] text-[#c98a2c] font-mono text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {Math.floor(testTimeRemaining / 60)}:
                        {(testTimeRemaining % 60).toString().padStart(2, '0')}
                      </span>
                    </div>

                    <button
                      onClick={() => setMockTestActive(false)}
                      className="text-xs font-bold text-[#8593ab] hover:text-[#0e2648]"
                    >
                      Exit Test
                    </button>
                  </div>
                </div>

                {!quizFinished ? (
                  /* Question Display */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between text-xs font-bold text-[#8593ab]">
                      <span>
                        প্রশ্ন {currentQuestionIndex + 1} / {quizData.questions.length}
                      </span>
                      <span>
                        উত্তর দেওয়া হয়েছে: {Object.keys(userAnswers).length} / {quizData.questions.length}
                      </span>
                    </div>

                    <div className="text-base sm:text-lg font-bold text-[#0e2648] leading-relaxed">
                      {quizData.questions[currentQuestionIndex]?.question}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {quizData.questions[currentQuestionIndex]?.options.map((opt: string, optIdx: number) => {
                        const isSelected = userAnswers[currentQuestionIndex] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => {
                              setUserAnswers((prev) => ({
                                ...prev,
                                [currentQuestionIndex]: optIdx,
                              }));
                            }}
                            className={`p-4 rounded-2xl text-left border text-xs sm:text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-[#e6f6ee] border-[#1c9d63] text-[#0e2648] shadow-sm'
                                : 'bg-[#f5f8fc] border-[#e1e7f1] text-[#54617a] hover:bg-[#eef3fa]'
                            }`}
                          >
                            <span className="inline-block w-6 h-6 rounded-full bg-white border border-[#e1e7f1] text-center font-bold text-xs mr-2 leading-6">
                              {['ক', 'খ', 'গ', 'ঘ'][optIdx] || optIdx + 1}
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#e1e7f1]">
                      <button
                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-4 py-2 rounded-full border border-[#e1e7f1] text-xs font-bold text-[#54617a] disabled:opacity-40"
                      >
                        Previous
                      </button>

                      {currentQuestionIndex < quizData.questions.length - 1 ? (
                        <button
                          onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                          className="px-6 py-2 rounded-full bg-[#173a6b] text-white text-xs font-bold hover:bg-[#0e2648] transition-colors"
                        >
                          Next Question
                        </button>
                      ) : (
                        <button
                          onClick={() => setQuizFinished(true)}
                          className="px-6 py-2 rounded-full bg-[#1c9d63] text-white text-xs font-bold hover:bg-[#147c4e] transition-colors shadow-sm"
                        >
                          Submit Test &amp; View Report
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Quiz Results & Analytics */
                  <div className="space-y-6">
                    {(() => {
                      let correctCount = 0;
                      quizData.questions.forEach((q: any, i: number) => {
                        if (userAnswers[i] === q.correctIndex) correctCount++;
                      });
                      const scorePercentage = Math.round((correctCount / quizData.questions.length) * 100);

                      return (
                        <>
                          <div className="bg-gradient-to-r from-[#e6f6ee] to-[#f5f8fc] p-6 rounded-2xl border border-[#c3edd7] text-center space-y-2">
                            <span className="text-3xl">🎉</span>
                            <h4 className="font-extrabold text-xl text-[#0e2648]">
                              টেস্ট সম্পন্ন হয়েছে! আপনার স্কোর: {scorePercentage}%
                            </h4>
                            <p className="text-xs text-[#54617a]">
                              আপনি {quizData.questions.length} টির মধ্যে {correctCount} টি প্রশ্নের সঠিক উত্তর দিয়েছেন।
                            </p>
                          </div>

                          <div className="space-y-4">
                            <h5 className="font-bold text-sm text-[#0e2648]">প্রশ্নোত্তর ও শিক্ষকের বিশ্লেষণ:</h5>
                            {quizData.questions.map((q: any, i: number) => {
                              const userAns = userAnswers[i];
                              const isCorrect = userAns === q.correctIndex;
                              return (
                                <div
                                  key={i}
                                  className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-2 ${
                                    isCorrect
                                      ? 'bg-white border-[#1c9d63]'
                                      : 'bg-[#fff7ed] border-[#fed7aa]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-bold">
                                    <span>
                                      প্রশ্ন {i + 1}: {q.question}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[0.7rem] ${
                                        isCorrect
                                          ? 'bg-[#e6f6ee] text-[#147c4e]'
                                          : 'bg-[#fee2e2] text-[#b91c1c]'
                                      }`}
                                    >
                                      {isCorrect ? '✓ সঠিক' : '✗ ভুল'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-[#54617a]">
                                    সঠিক উত্তর: <strong className="text-[#0e2648]">{q.options[q.correctIndex]}</strong>
                                  </div>
                                  <div className="bg-white/80 p-2.5 rounded-xl border border-black/5 text-[#54617a]">
                                    💡 <strong>শিক্ষকের ব্যাখ্যা: </strong>
                                    {q.explanation}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex flex-wrap gap-3 pt-4 border-t border-[#e1e7f1]">
                            <button
                              onClick={() => startMockTest(quizData.subject, quizData.classLevel)}
                              className="px-6 py-2.5 rounded-full bg-[#1c9d63] text-white text-xs font-bold hover:bg-[#147c4e] transition-colors"
                            >
                              Retake Another Test
                            </button>
                            <button
                              onClick={() => setMockTestActive(false)}
                              className="px-6 py-2.5 rounded-full border border-[#e1e7f1] text-[#54617a] text-xs font-bold hover:bg-[#f5f8fc]"
                            >
                              Done Practicing
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </section>

        {/* ================= FREE VS PREMIUM + PRICING ================= */}
        <section id="premium" className="py-16 md:py-24 bg-[#ffffff]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#147c4e] tracking-wider uppercase mb-2">
                <span className="w-2 h-2 rounded-full bg-[#1c9d63]"></span>
                Pricing Plans
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0e2648] tracking-tight">
                Learning is Free. Practice Goes Further with Premium.
              </h2>
              <p className="mt-3 text-base text-[#54617a] leading-relaxed">
                The core AI Teacher, complete hand notes, and the formula library are free for every student in Bangladesh. Premium unlocks unlimited mock tests, timed exams, and weak-topic analytics.
              </p>
            </div>

            {/* Comparison Cards */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Free Card */}
              <div className="p-8 rounded-3xl border border-[#e1e7f1] bg-[#ffffff] space-y-6 shadow-sm">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#e6f6ee] text-[#147c4e]">
                    Free Forever
                  </span>
                  <h3 className="text-xl font-extrabold text-[#0e2648] mt-3">Learn Without Limits</h3>
                  <p className="text-xs text-[#54617a] mt-1">
                    Everything you need to master your NCTB textbook topics.
                  </p>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-[#54617a]">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1c9d63] flex-none" />
                    <span>24/7 AI Teacher &amp; doubt solving</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1c9d63] flex-none" />
                    <span>Topic-by-topic structured 8-part explanations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1c9d63] flex-none" />
                    <span>Hand Notes for all subjects &amp; chapters</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1c9d63] flex-none" />
                    <span>Complete Laws &amp; Formulas library</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1c9d63] flex-none" />
                    <span>Bangla, English &amp; mixed mode support</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1c9d63] flex-none" />
                    <span>Full Class 6–12 curriculum access</span>
                  </li>
                </ul>

                <a
                  href="#ai-teacher"
                  className="block w-full text-center py-3 rounded-full border border-[#173a6b] text-[#173a6b] font-bold text-xs sm:text-sm hover:bg-[#173a6b] hover:text-white transition-all"
                >
                  Start Learning Free
                </a>
              </div>

              {/* Premium Card */}
              <div className="p-8 rounded-3xl border-2 border-[#c98a2c] bg-gradient-to-b from-[#fbf0dd] via-white to-white space-y-6 shadow-md relative">
                <div className="absolute top-6 right-6">
                  <span className="text-[0.7rem] uppercase font-black tracking-wider px-3 py-1 rounded-full bg-[#1c9d63] text-white">
                    10% OFF
                  </span>
                </div>

                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#fbf0dd] text-[#c98a2c]">
                    Premium
                  </span>
                  <h3 className="text-xl font-extrabold text-[#0e2648] mt-3">Practice Like Exam Day</h3>
                  <p className="text-xs text-[#54617a] mt-1">
                    Advanced exam prep, weak-point detection, and timed mock tests.
                  </p>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-[#54617a]">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#c98a2c] flex-none" />
                    <span>Unlimited chapter quizzes &amp; board mock tests</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#c98a2c] flex-none" />
                    <span>MCQ and written CQ practice with scoring</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#c98a2c] flex-none" />
                    <span>Timed tests with instant error breakdown</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#c98a2c] flex-none" />
                    <span>Weak-topic diagnosis &amp; personalized practice</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#c98a2c] flex-none" />
                    <span>Progress analytics across subjects</span>
                  </li>
                </ul>

                <button
                  onClick={() => openCheckout(billingPeriod)}
                  className="block w-full text-center py-3 rounded-full bg-[#c98a2c] hover:bg-[#a9721f] text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95"
                >
                  Upgrade to Premium
                </button>
              </div>
            </div>

            {/* Period Toggle & Pricing Box */}
            <div className="text-center space-y-6 max-w-xl mx-auto">
              <div className="inline-flex p-1 bg-[#f5f8fc] rounded-full border border-[#e1e7f1]">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                    billingPeriod === 'monthly'
                      ? 'bg-[#173a6b] text-white shadow-sm'
                      : 'text-[#54617a] hover:text-[#173a6b]'
                  }`}
                >
                  Monthly Plan
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                    billingPeriod === 'yearly'
                      ? 'bg-[#173a6b] text-white shadow-sm'
                      : 'text-[#54617a] hover:text-[#173a6b]'
                  }`}
                >
                  Yearly Plan (Best Value)
                </button>
              </div>

              {/* Pricing Display */}
              <div className="p-6 rounded-3xl border border-[#e1e7f1] bg-[#f5f8fc] shadow-sm space-y-3">
                <div className="inline-block bg-[#1c9d63] text-white text-[0.72rem] font-bold px-3 py-0.5 rounded-full">
                  10% OFF FIRST-TIME USERS
                </div>

                {billingPeriod === 'monthly' ? (
                  <div>
                    <h4 className="font-extrabold text-base text-[#0e2648]">Monthly Subscription</h4>
                    <div className="text-3xl font-black text-[#0e2648] my-1">
                      <span className="text-sm line-through text-[#8593ab] mr-2">৳99</span>
                      ৳89.10 <span className="text-xs font-semibold text-[#54617a]">/ month</span>
                    </div>
                    <p className="text-xs text-[#54617a]">Billed monthly. Cancel anytime with 1 click.</p>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-extrabold text-base text-[#0e2648]">Yearly Subscription</h4>
                    <div className="text-3xl font-black text-[#0e2648] my-1">
                      <span className="text-sm line-through text-[#8593ab] mr-2">৳999</span>
                      ৳899.10 <span className="text-xs font-semibold text-[#54617a]">/ year</span>
                    </div>
                    <p className="text-xs text-[#54617a]">Best value for full school year — under ৳75 per month.</p>
                  </div>
                )}

                <button
                  onClick={() => openCheckout(billingPeriod)}
                  className="w-full py-3.5 rounded-full bg-[#1c9d63] hover:bg-[#147c4e] text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="text-[0.7rem] text-[#8593ab]">
                  Supports bKash, Nagad &amp; Bank Transfer · Instant Activation
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FOUNDER SECTION ================= */}
        <section id="founder" className="py-16 md:py-24 bg-[#f5f8fc] border-t border-[#e1e7f1]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#147c4e] tracking-wider uppercase mb-2">
                <span className="w-2 h-2 rounded-full bg-[#1c9d63]"></span>
                Leadership &amp; Vision
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0e2648] tracking-tight">
                Built for Bangladeshi Students.
              </h2>
            </div>

            <div className="border border-[#e1e7f1] rounded-3xl p-8 sm:p-10 bg-white shadow-sm grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-3 flex justify-center">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-[#173a6b] to-[#2f5ea3] text-white flex items-center justify-center text-3xl sm:text-4xl font-black shadow-lg">
                  AR
                </div>
              </div>

              <div className="md:col-span-9 space-y-3 text-center md:text-left">
                <div>
                  <h3 className="text-2xl font-black text-[#0e2648]">ABD RASHID</h3>
                  <div className="text-sm font-bold text-[#1c9d63] mt-0.5">Founder, BrainyBee</div>
                </div>

                <p className="text-sm sm:text-base text-[#54617a] leading-relaxed max-w-3xl">
                  ABD RASHID is the founder of BrainyBee, a Bangladesh-focused AI learning platform created with the vision of making quality, understandable, and accessible education available to every student across Bangladesh through modern technology.
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-[#173a6b]">
                  <span className="px-3 py-1 rounded-full bg-[#eef3fa]">🇧🇩 Bangladesh NCTB Focused</span>
                  <span className="px-3 py-1 rounded-full bg-[#eef3fa]">Class 6–12 secondary &amp; college</span>
                  <span className="px-3 py-1 rounded-full bg-[#eef3fa]">Bilingual AI Pedagogy</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FAQ ACCORDION ================= */}
        <section id="faq" className="py-16 md:py-24 bg-white border-t border-[#e1e7f1]">
          <div className="max-w-[840px] mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#147c4e] tracking-wider uppercase mb-2">
                <span className="w-2 h-2 rounded-full bg-[#1c9d63]"></span>
                FAQ
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0e2648] tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-sm text-[#54617a]">
                Everything you need to know about BrainyBee’s courses, AI teacher, and plans.
              </p>
            </div>

            <div className="divide-y divide-[#e1e7f1] border-y border-[#e1e7f1]">
              {FAQS.map((f, i) => {
                const isOpen = openFaqIndex === i;
                return (
                  <div key={i} className="py-4">
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                      className="w-full text-left flex items-center justify-between gap-4 font-bold text-base sm:text-lg text-[#0e2648] hover:text-[#1c9d63] transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span>{f.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 flex-none transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#1c9d63]' : 'text-[#8593ab]'
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-xs sm:text-sm text-[#54617a] leading-relaxed pr-6">
                        {f.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= FINAL CTA ================= */}
        <section className="py-16 md:py-24 bg-[#0e2648] text-white text-center relative overflow-hidden">
          <div className="hex-field"></div>
          <div className="max-w-[800px] mx-auto px-4 sm:px-6 relative z-10 space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Learn with Your Own AI Teacher?
            </h2>
            <p className="text-white/80 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Start free today with no credit card required. Experience structured, intuitive learning built exclusively for Bangladesh students.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <a
                href="#ai-teacher"
                className="px-8 py-3.5 rounded-full font-bold text-sm sm:text-base text-white bg-[#1c9d63] hover:bg-[#147c4e] transition-all shadow-lg active:scale-95"
              >
                Ask BrainyBee a Question
              </a>
              <a
                href="#subjects"
                className="px-8 py-3.5 rounded-full font-bold text-sm sm:text-base text-white border border-white/40 hover:bg-white/10 transition-all active:scale-95"
              >
                Browse Curriculum Free
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#132039] text-white/75 py-14 border-t border-white/10 text-xs sm:text-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 sm:col-span-1 space-y-3">
            <a href="#home" className="flex items-center gap-2 font-black text-xl text-white">
              <svg className="w-7 h-7 flex-none" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="24,3 42,13.5 42,34.5 24,45 6,34.5 6,13.5" fill="#2f5ea3" />
                <polygon points="24,10 36,17 36,31 24,38 12,31 12,17" fill="#1c9d63" />
                <path d="M17 24 L22 29 L31 18" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              BrainyBee
            </a>
            <p className="text-white/60 text-xs leading-relaxed max-w-xs">
              Explain like a teacher, feel like one-on-one tutoring — for Class 6–12 students across Bangladesh.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-white uppercase text-xs tracking-wider">Explore</h5>
            <ul className="space-y-1.5 text-xs text-white/60">
              <li><a href="#ai-teacher" className="hover:text-white">AI Teacher</a></li>
              <li><a href="#subjects" className="hover:text-white">Curriculum Explorer</a></li>
              <li><a href="#hand-notes" className="hover:text-white">Hand Notes</a></li>
              <li><a href="#formulas" className="hover:text-white">Laws &amp; Formulas</a></li>
              <li><a href="#mock-test" className="hover:text-white">Mock Test Studio</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-white uppercase text-xs tracking-wider">Plans &amp; Vision</h5>
            <ul className="space-y-1.5 text-xs text-white/60">
              <li><a href="#premium" className="hover:text-white">Free Plan</a></li>
              <li><a href="#premium" className="hover:text-white">Premium (10% OFF)</a></li>
              <li><a href="#founder" className="hover:text-white">Founder: ABD RASHID</a></li>
              <li><a href="#faq" className="hover:text-white">Help &amp; FAQ</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-white uppercase text-xs tracking-wider">Curriculum</h5>
            <ul className="space-y-1.5 text-xs text-white/60">
              <li>Class 6 to Class 8 (General)</li>
              <li>Class 9 &amp; 10 (SSC Science, Commerce, Arts)</li>
              <li>Class 11 &amp; 12 (HSC College Level)</li>
              <li>Bangla &amp; English Version</li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-white/50">
          <div>© 2026 BrainyBee. Founded by ABD RASHID. All rights reserved.</div>
          <div>Made for Class 6–12 students in Bangladesh 🇧🇩</div>
        </div>
      </footer>

      {/* ================= PAYMENT CHECKOUT MODAL ================= */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#e1e7f1] relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setPaymentModalOpen(false)}
              className="absolute top-5 right-5 text-[#8593ab] hover:text-[#0e2648] p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            {!checkoutSuccess ? (
              <form onSubmit={confirmPayment} className="space-y-5">
                <div>
                  <div className="inline-block bg-[#1c9d63] text-white text-[0.68rem] font-bold px-2.5 py-0.5 rounded-full mb-1.5">
                    10% OFF FIRST-TIME USERS
                  </div>
                  <h3 className="text-xl font-extrabold text-[#0e2648]">Upgrade to BrainyBee Premium</h3>
                  <p className="text-xs text-[#54617a] mt-0.5">
                    {checkoutPlan === 'yearly'
                      ? 'Yearly Plan: ৳899.10 (10% off ৳999) · Under ৳75/month'
                      : 'Monthly Plan: ৳89.10 (10% off ৳99) · Cancel anytime'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8593ab]">
                    পেমেন্ট মেথড বেছে নিন (Select Payment Method)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('bkash')}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        selectedPaymentMethod === 'bkash'
                          ? 'border-[#d8218c] bg-[#fdf2f8] shadow-sm'
                          : 'border-[#e1e7f1] bg-[#f5f8fc] hover:bg-white'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#d8218c] text-white font-black text-xs flex items-center justify-center mx-auto mb-1">
                        bK
                      </div>
                      <span className="text-xs font-bold text-[#0e2648]">bKash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('nagad')}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        selectedPaymentMethod === 'nagad'
                          ? 'border-[#f7931e] bg-[#fffaf5] shadow-sm'
                          : 'border-[#e1e7f1] bg-[#f5f8fc] hover:bg-white'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#f7931e] text-white font-black text-xs flex items-center justify-center mx-auto mb-1">
                        N
                      </div>
                      <span className="text-xs font-bold text-[#0e2648]">Nagad</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('bank')}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        selectedPaymentMethod === 'bank'
                          ? 'border-[#173a6b] bg-[#eef3fa] shadow-sm'
                          : 'border-[#e1e7f1] bg-[#f5f8fc] hover:bg-white'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#173a6b] text-white font-black text-xs flex items-center justify-center mx-auto mb-1">
                        🏦
                      </div>
                      <span className="text-xs font-bold text-[#0e2648]">Bank</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#0e2648]">
                    {selectedPaymentMethod === 'bank' ? 'Account / Card Holder Phone' : 'মোবাইল নম্বর (Phone Number)'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    pattern="[0-9]{11}"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e1e7f1] bg-[#f5f8fc] text-sm outline-none focus:border-[#1c9d63] focus:bg-white transition-all font-mono"
                  />
                  <span className="text-[0.7rem] text-[#8593ab]">
                    Demo checkout — Enter any 11 digit number (e.g. 01712345678)
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-[#1c9d63] hover:bg-[#147c4e] text-white font-bold text-sm transition-all shadow-md active:scale-95"
                >
                  Pay {checkoutPlan === 'yearly' ? '৳899.10' : '৳89.10'} &amp; Activate
                </button>

                <p className="text-[0.7rem] text-[#8593ab] leading-relaxed text-center">
                  🔒 Secure checkout simulation. No live payment credentials are requested.
                </p>
              </form>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#e6f6ee] text-[#1c9d63] flex items-center justify-center text-2xl mx-auto">
                  ✓
                </div>
                <h3 className="text-xl font-extrabold text-[#0e2648]">
                  Premium Successfully Activated!
                </h3>
                <p className="text-xs text-[#54617a] leading-relaxed">
                  Congratulations! Your account now has full access to timed board mock tests, MCQ drills, and diagnostic analytics.
                </p>
                <div className="p-3 bg-[#f5f8fc] rounded-xl border border-[#e1e7f1] text-xs font-mono text-[#173a6b]">
                  Plan: {checkoutPlan.toUpperCase()} · Method: {selectedPaymentMethod.toUpperCase()}
                </div>
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className="w-full py-3 rounded-full bg-[#173a6b] text-white font-bold text-xs hover:bg-[#0e2648] transition-colors"
                >
                  Start Using Premium Features
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
