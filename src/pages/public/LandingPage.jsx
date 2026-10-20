/**
 * @fileoverview PUBLIC LandingPage Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  GraduationCap, ArrowRight, BookOpen, Globe, Award, MapPin, 
  CheckCircle2, Sparkles, Building2, Compass, Phone, X, Check,
  ChevronLeft, ChevronRight, Cpu, Bot, ShieldCheck, Zap,
  Layers, Code2, Users, FileText, CheckCircle, Sun, Moon, ExternalLink, Play
} from 'lucide-react';

const CAROUSEL_SLIDES = [
  {
    id: 1,
    image: '/images/campus_main.jpg',
    badge: 'Academic Quadrangle',
    title: 'KRC Institute of Technology',
    subtitle: 'Estd. 2008 · Ambegaon BK, Pune. Affiliated to SPPU, Approved by AICTE New Delhi, NAAC Grade A Accredited.',
    stats: '25-Acre Eco-Campus · DTE Code: EN-6285 · SPPU Affiliated'
  },
  {
    id: 2,
    image: '/images/cs_lab.jpg',
    badge: 'Computing Infrastructure',
    title: 'Applied Computer Science & AI Workstations',
    subtitle: 'Modern Dell Precision Core i7 workstations, NVIDIA GeForce RTX 4070 GPUs, Ubuntu dual-boot, and local AI model labs.',
    stats: 'Gigabit Campus Network · RTX 4070 Workstations · Open Source Lab'
  },
  {
    id: 3,
    image: '/images/robotics_lab.jpg',
    badge: 'Hardware Makerspace',
    title: 'Robotics, IoT & Embedded Systems Makerspace',
    subtitle: 'Hands-on makerspace with Raspberry Pi 5, ESP32 boards, Rigol digital oscilloscopes, and Bambu Lab 3D printers.',
    stats: 'State Hackathon Champions · 18+ Student Patents · SIH Finalists'
  },
  {
    id: 4,
    image: '/images/library.jpg',
    badge: 'Knowledge Commons',
    title: 'Central Digital Library & Reading Commons',
    subtitle: 'Over 45,000 engineering volumes, IEEE Xplore, DELNET subscriptions, and 350-seat silent study hall.',
    stats: '45K+ Print Volumes · 350 Seating Capacity · Open till 10 PM'
  }
];

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0.2,
    scale: 1.04
  }),
  center: {
    x: '0%',
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: 'spring', stiffness: 240, damping: 28 },
      opacity: { duration: 0.6, ease: 'easeOut' },
      scale: { duration: 0.85, ease: [0.16, 1, 0.3, 1] }
    }
  },
  exit: (direction) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.96,
    transition: {
      x: { type: 'spring', stiffness: 240, damping: 28 },
      opacity: { duration: 0.45 }
    }
  })
};

const TECH_DOMAINS = [
  {
    id: 'ai',
    title: 'Applied AI & Machine Learning Lab',
    icon: Cpu,
    tag: 'Student Computing Lab',
    desc: 'Hands-on laboratory for machine learning fundamentals, OpenCV computer vision, PyTorch model training, and beginner Ollama edge inference.',
    specs: ['Dell Precision Core i7-13700 Workstations', 'NVIDIA GeForce RTX 4070 (12GB VRAM)', 'Ollama Local Model Sandbox & PyTorch'],
    facultyLead: 'Dr. Arvind Joshi (Ph.D. IIT Bombay)',
    activeProjects: 14
  },
  {
    id: 'robotics',
    title: 'Robotics & Hardware Makerspace',
    icon: Bot,
    tag: 'Hardware Makerspace',
    desc: 'Autonomous mobile robot chassis, ROS2 kinematics, sensor fusion with ultrasonic & LiDAR, and rapid mechanical enclosures.',
    specs: ['ROS2 Humble Simulation Lab', 'Raspberry Pi 5 & ESP32 Microcontrollers', 'Bambu Lab & Ender 3D Printing Farm'],
    facultyLead: 'Dr. Rajesh Sharma (Ph.D. IISc)',
    activeProjects: 19
  },
  {
    id: 'embedded',
    title: 'Embedded Systems & IoT Testbed',
    icon: Zap,
    tag: 'Circuit Prototyping',
    desc: 'Circuit design, telemetry prototyping, signal analysis, logic analyzers, and custom PCB routing for student hardware projects.',
    specs: ['Rigol 4-Channel 50MHz Oscilloscopes', 'KiCAD Schematics & PCB Isolation Router', 'Regulated DC Power & Soldering Bays'],
    facultyLead: 'Dr. Sneha Kulkarni (Ph.D. IIT Madras)',
    activeProjects: 12
  },
  {
    id: 'systems',
    title: 'Systems, Cloud & Open Source Lab',
    icon: ShieldCheck,
    tag: 'Software Lab',
    desc: 'Full-stack software engineering, Linux kernel concepts, Docker containers, database optimization, and local CI/CD pipelines.',
    specs: ['Ubuntu 24.04 LTS Dual-Boot Workstations', 'Docker & Minikube Kubernetes Sandbox', 'Local Synology NAS Code Repository'],
    facultyLead: 'Prof. Ramesh Rao (Academic Dean)',
    activeProjects: 11
  }
];

const STUDENT_PROJECTS = [
  {
    title: 'SwarmDRONE: Autonomous Agricultural Reconnaissance',
    category: 'Autonomous Systems & Vision',
    author: 'Aarav Kulkarni & Team (B.Tech CSE Sem V)',
    summary: 'A coordinated drone swarm utilizing edge YOLO-v10 inference to map crop health and soil moisture across 50 acres in real-time.',
    status: 'Field Tested at Baramati Agritech Center'
  },
  {
    title: 'CardioPulse: Low-Cost Edge ECG Diagnostic Unit',
    category: 'Biomedical AI & IoT',
    author: 'Ananya Sharma & Rohan Verma (ECE & Mech)',
    summary: 'Ultra-low-power ESP32 device predicting cardiac arrhythmias within 3 seconds using lightweight quantized neural networks.',
    status: 'Patent Filed · Winner KRC TechFest 2025'
  },
  {
    title: 'KRC-Rover: University Rover Challenge Contender',
    category: 'Robotics & Mechatronics',
    author: 'KRC Robotech Society (Inter-disciplinary)',
    summary: 'Rock-bogie suspension rover with custom robotic manipulator and spectrometer analysis for Mars-analogue terrain testing.',
    status: 'Ranked #2 Nationally in Rover Derby'
  }
];

export default function LandingPage() {
  const { user, role, signOut, switchRole } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [activeTechTab, setActiveTechTab] = useState(0);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [appliedAppId, setAppliedAppId] = useState(null);
  const [selectedDemoProject, setSelectedDemoProject] = useState(null);

  // Touch gesture support for mobile dynamic screens
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 45) {
      handleNextSlide(); // Swipe Left -> Next
    } else if (distance < -45) {
      handlePrevSlide(); // Swipe Right -> Prev
    }
  };

  const [formData, setFormData] = useState({
    fullName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    program: 'B.Tech Computer Science & Engineering (CSE)',
    entranceScore: '96.5 %ile (JEE / MHT-CET)'
  });

  const handleNextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  const handlePrevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };

  const handleSelectSlide = (idx) => {
    setDirection(idx > currentSlide ? 1 : -1);
    setCurrentSlide(idx);
  };

  // Carousel auto-advance timer
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      handleNextSlide();
    }, 5500);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleApplySubmit = (e) => {
    e.preventDefault();
    const appId = `KRCIT-2025-${Math.floor(1000 + Math.random() * 9000)}`;
    const applications = JSON.parse(localStorage.getItem('krc_applications') || '[]');
    applications.push({ ...formData, appId, submittedAt: new Date().toISOString() });
    localStorage.setItem('krc_applications', JSON.stringify(applications));
    setAppliedAppId(appId);
  };

  return (
    <div className="w-full">

      {/* Dynamic Multi-Photo Carousel Hero Section with Touch Swipe Support */}
      <section 
        id="carousel" 
        className="relative border-b border-border bg-black text-white overflow-hidden touch-pan-y"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative h-[500px] sm:h-[600px] lg:h-[660px] w-full overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 w-full h-full"
            >
              <img 
                src={CAROUSEL_SLIDES[currentSlide].image} 
                alt={CAROUSEL_SLIDES[currentSlide].title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Slide Content Layer with Refined Whitespace & Mobile Dynamic Typography */}
          <div className="relative z-10 max-w-7xl mx-auto h-full px-3.5 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 sm:pb-24">
            <motion.div 
              key={`text-${currentSlide}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
              className="max-w-3xl p-4 sm:p-7 lg:p-8 rounded-xl sm:rounded-2xl bg-black/65 backdrop-blur-md border border-white/15 shadow-2xl space-y-3 sm:space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-semibold text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{CAROUSEL_SLIDES[currentSlide].badge}</span>
              </div>

              <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {CAROUSEL_SLIDES[currentSlide].title}
              </h1>

              <p className="text-[11px] sm:text-xs md:text-sm text-gray-200 leading-relaxed max-w-2xl font-normal line-clamp-3 sm:line-clamp-none">
                {CAROUSEL_SLIDES[currentSlide].subtitle}
              </p>

              <div className="pt-1 sm:pt-2 flex flex-col min-[480px]:flex-row flex-wrap items-stretch min-[480px]:items-center gap-2 sm:gap-3">
                <Link 
                  to="/admissions"
                  className="bg-white text-black hover:bg-gray-100 border border-transparent px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 touch-manipulation"
                >
                  Apply for Admission <ArrowRight className="w-4 h-4" />
                </Link>
                <Link 
                  to="/research" 
                  className="bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/25 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 touch-manipulation"
                >
                  <Cpu className="w-4 h-4" /> Explore Labs
                </Link>
                <Link 
                  to="/login"
                  className="bg-black/50 hover:bg-black/75 backdrop-blur-md text-white border border-white/20 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all text-center touch-manipulation"
                >
                  ERP Workspace Login
                </Link>
              </div>

              <div className="pt-0.5 text-[10px] sm:text-[11px] font-mono text-gray-300 flex items-center gap-1.5 truncate">
                <span className="font-bold text-white uppercase tracking-wider shrink-0">Highlight:</span> 
                <span className="truncate">{CAROUSEL_SLIDES[currentSlide].stats}</span>
              </div>
            </motion.div>
          </div>

          {/* Carousel Navigation Arrows - Adaptive for Mobile */}
          <button 
            onClick={handlePrevSlide}
            aria-label="Previous slide"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all flex items-center justify-center shadow-lg touch-manipulation"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          <button 
            onClick={handleNextSlide}
            aria-label="Next slide"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all flex items-center justify-center shadow-lg touch-manipulation"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          {/* Dock-style Thumbnail Pill Indicators - Mobile Adaptive */}
          <div className="absolute bottom-3 sm:bottom-5 left-0 right-0 z-20 flex items-center justify-center gap-2 px-2 sm:px-4">
            <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15">
              {CAROUSEL_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => handleSelectSlide(idx)}
                  className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all touch-manipulation ${
                    currentSlide === idx 
                      ? 'bg-white text-black font-bold shadow' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>0{slide.id}</span>
                  <span className="hidden sm:inline-block">{slide.badge}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* College Highlights & Key Numbers */}
      <section className="border-b border-border bg-surface" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="px-4">
              <span className="text-xs uppercase tracking-wider text-muted font-semibold block mb-1">Legacy</span>
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">17+</h3>
              <p className="text-xs text-muted mt-1 leading-snug">Years of Technical Eminence (Estd. 2008)</p>
            </div>
            <div className="px-4 pt-4 md:pt-0">
              <span className="text-xs uppercase tracking-wider text-muted font-semibold block mb-1">Placements</span>
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">₹ 18.5 LPA</h3>
              <p className="text-xs text-muted mt-1 leading-snug">Highest Package · 94.2% Placement Rate</p>
            </div>
            <div className="px-4 pt-4 md:pt-0">
              <span className="text-xs uppercase tracking-wider text-muted font-semibold block mb-1">Innovation</span>
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">18+</h3>
              <p className="text-xs text-muted mt-1 leading-snug">Student Patents &amp; SIH Hackathons</p>
            </div>
            <div className="px-4 pt-4 md:pt-0">
              <span className="text-xs uppercase tracking-wider text-muted font-semibold block mb-1">Accreditation</span>
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">NAAC Grade A</h3>
              <p className="text-xs text-muted mt-1 leading-snug">SPPU Affiliated · Approved by AICTE</p>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Technology & Research Labs Showcase */}
      <section className="py-20 bg-bg border-b border-border" id="technology">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-xs font-semibold text-text mb-3 dark:border-white/20">
                <Cpu className="w-3.5 h-3.5 text-blue-500" />
                <span>Next-Gen Engineering Infrastructure</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text">
                Research Labs &amp; Technology Centers
              </h2>
              <p className="text-muted text-sm max-w-2xl mt-2 leading-relaxed">
                Equipping Indian engineers with specialized testbeds in machine intelligence, autonomous robotics, quantum cryptography, and semiconductor VLSI.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowApplyModal(true)}
                className="text-xs font-semibold px-4 py-2.5 rounded-lg bg-text text-bg hover:opacity-90 active:scale-95 transition-all cursor-pointer border border-transparent dark:border-white/20 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
              >
                Join KRC Research Cohort
              </button>
            </div>
          </div>

          {/* Interactive Technology Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-2.5">
              {TECH_DOMAINS.map((domain, index) => {
                const Icon = domain.icon;
                const isActive = activeTechTab === index;
                return (
                  <button
                    key={domain.id}
                    onClick={() => setActiveTechTab(index)}
                    className={`w-full text-left p-4 rounded-xl border transition-all active:scale-[0.98] cursor-pointer flex items-start gap-4 ${
                      isActive 
                        ? 'bg-surface border-text shadow-sm dark:border-white/40 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]' 
                        : 'bg-surface/50 border-border hover:bg-surface hover:border-border/80 dark:border-white/15 dark:hover:border-white/30'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg shrink-0 ${isActive ? 'bg-text text-bg' : 'bg-bg text-text border border-border dark:border-white/15'}`}>
                      <Icon className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-text">{domain.title}</span>
                      </div>
                      <span className="text-[11px] font-medium text-muted block mt-0.5">{domain.tag}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Tech Lab Detail Box */}
            <div className="lg:col-span-8 bg-surface border border-border rounded-2xl p-6 sm:p-8 flex flex-col justify-between dark:border-white/20">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted">
                      {TECH_DOMAINS[activeTechTab].tag}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-text mt-1">
                      {TECH_DOMAINS[activeTechTab].title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-bg border border-border text-xs font-mono font-semibold text-text dark:border-white/20">
                      {TECH_DOMAINS[activeTechTab].activeProjects} Active Patents &amp; Projects
                    </span>
                  </div>
                </div>

                <p className="text-sm text-text leading-relaxed">
                  {TECH_DOMAINS[activeTechTab].desc}
                </p>

                <div>
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
                    Specialized Lab Equipment &amp; Testbeds:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {TECH_DOMAINS[activeTechTab].specs.map((spec, i) => (
                      <div key={i} className="p-3 bg-bg border border-border rounded-lg text-xs font-medium text-text flex items-center gap-2 dark:border-white/15">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-bg border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs dark:border-white/20">
                  <div>
                    <span className="text-muted block text-[11px]">Lab Director &amp; Academic Lead:</span>
                    <strong className="text-text font-bold">{TECH_DOMAINS[activeTechTab].facultyLead}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowApplyModal(true)}
                      className="px-3.5 py-2 bg-text text-bg rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer border border-transparent dark:border-white/25"
                    >
                      Apply for Research Internship
                    </button>
                  </div>
                </div>
              </div>

              {/* Lab Visual Banner */}
              <div className="mt-6 pt-6 border-t border-border flex items-center justify-between text-xs text-muted">
                <span>Location: Turing Computing Block &amp; Ramanujan Innovation Wing</span>
                <span className="font-mono text-emerald-500 font-semibold flex items-center gap-1">
                  ● Lab Status: Operational (Open 8 AM – 8 PM)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link 
              to="/research" 
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-border bg-surface hover:bg-bg text-xs font-semibold text-text transition-colors"
            >
              Explore All 4 Computing Labs &amp; PC Specifications <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Live Student Projects & Innovation Showcase */}
      <section className="py-20 bg-surface border-b border-border" id="projects">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg border border-border text-xs font-semibold text-text mb-3 dark:border-white/20">
              <Bot className="w-3.5 h-3.5 text-purple-500" />
              <span>Student Research In Action</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text">
              Engineering Projects Built by KRC Students
            </h2>
            <p className="text-muted text-sm max-w-2xl mt-2 leading-relaxed">
              Real systems engineered for real-world impact across robotics, edge computing, agriculture, and healthcare.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STUDENT_PROJECTS.map((project, idx) => (
              <div 
                key={idx}
                className="bg-bg border border-border rounded-xl p-6 flex flex-col justify-between hover:border-text transition-all shadow-sm dark:border-white/20 dark:hover:border-white/45"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="px-2.5 py-0.5 rounded bg-surface border border-border text-muted font-semibold dark:border-white/15">
                      {project.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-text leading-snug">
                    {project.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {project.summary}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-border space-y-3">
                  <div className="text-[11px] text-muted">
                    <span className="font-semibold text-text">Project Lead:</span> {project.author}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{project.status}</span>
                  </div>
                  <button
                    onClick={() => setSelectedDemoProject(project)}
                    className="w-full mt-2 py-2 px-3 bg-surface hover:bg-border/40 border border-border rounded-lg text-xs font-semibold text-text flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer dark:border-white/20 dark:hover:border-white/40"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> View Project Architecture &amp; Demo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Faculties & Degree Programs */}
      <section className="py-20 bg-bg border-b border-border" id="academics">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text">
              Undergraduate &amp; Masters Degree Programs
            </h2>
            <p className="text-muted text-sm max-w-2xl mt-2 leading-relaxed">
              Curriculum aligned with IEEE/ACM guidelines, industry certifications, and AI-first engineering foundations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-border bg-surface hover:border-text transition-all flex flex-col justify-between dark:border-white/20 dark:hover:border-white/45">
              <div>
                <div className="p-2.5 bg-bg border border-border rounded-lg w-fit mb-4 dark:border-white/15">
                  <Code2 className="w-6 h-6 text-text stroke-[1.8]" />
                </div>
                <h3 className="text-base font-bold mb-1 text-text">B.Tech Computer Science &amp; Engineering</h3>
                <span className="text-[11px] font-mono text-muted block mb-3">Specializations in AI/ML, Cloud &amp; Cyber Security</span>
                <p className="text-xs text-muted leading-relaxed mb-4">
                  Comprehensive 4-year curriculum covering advanced data structures, distributed OS, compilers, deep learning, and scalable cloud systems.
                </p>
                <div className="space-y-1.5 text-xs text-text border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted">Intake:</span>
                    <span className="font-semibold">240 Seats</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Eligibility:</span>
                    <span className="font-semibold">JEE Main / MHT-CET &gt; 90 %ile</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowApplyModal(true)}
                className="mt-6 w-full py-2.5 bg-text text-bg rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer border border-transparent dark:border-white/25 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
              >
                Apply for B.Tech CSE
              </button>
            </div>

            <div className="p-6 rounded-xl border border-border bg-surface hover:border-text transition-all flex flex-col justify-between dark:border-white/20 dark:hover:border-white/45">
              <div>
                <div className="p-2.5 bg-bg border border-border rounded-lg w-fit mb-4 dark:border-white/15">
                  <Bot className="w-6 h-6 text-text stroke-[1.8]" />
                </div>
                <h3 className="text-base font-bold mb-1 text-text">B.Tech Robotics &amp; Artificial Intelligence</h3>
                <span className="text-[11px] font-mono text-muted block mb-3">Autonomous Vehicles, Mechatronics &amp; Drones</span>
                <p className="text-xs text-muted leading-relaxed mb-4">
                  Integrated hardware-software engineering program focusing on sensor fusion, ROS2, embedded microcontrollers, and computer vision.
                </p>
                <div className="space-y-1.5 text-xs text-text border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted">Intake:</span>
                    <span className="font-semibold">120 Seats</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Eligibility:</span>
                    <span className="font-semibold">JEE Main / MHT-CET &gt; 88 %ile</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowApplyModal(true)}
                className="mt-6 w-full py-2.5 bg-text text-bg rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer border border-transparent dark:border-white/25 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
              >
                Apply for B.Tech Robotics
              </button>
            </div>

            <div className="p-6 rounded-xl border border-border bg-surface hover:border-text transition-all flex flex-col justify-between dark:border-white/20 dark:hover:border-white/45">
              <div>
                <div className="p-2.5 bg-bg border border-border rounded-lg w-fit mb-4 dark:border-white/15">
                  <Cpu className="w-6 h-6 text-text stroke-[1.8]" />
                </div>
                <h3 className="text-base font-bold mb-1 text-text">B.Tech Electronics &amp; VLSI Engineering</h3>
                <span className="text-[11px] font-mono text-muted block mb-3">Semiconductor Fabrication, FPGA &amp; Embedded</span>
                <p className="text-xs text-muted leading-relaxed mb-4">
                  Hands-on training in ASIC digital design, RISC-V processor architecture, FPGA synthesis, and radio frequency communications.
                </p>
                <div className="space-y-1.5 text-xs text-text border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted">Intake:</span>
                    <span className="font-semibold">120 Seats</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Eligibility:</span>
                    <span className="font-semibold">JEE Main / MHT-CET &gt; 85 %ile</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowApplyModal(true)}
                className="mt-6 w-full py-2.5 bg-text text-bg rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer border border-transparent dark:border-white/25 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
              >
                Apply for B.Tech VLSI
              </button>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link 
              to="/academics" 
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-border bg-surface hover:bg-bg text-xs font-semibold text-text transition-colors"
            >
              View Full Syllabus, Seat Matrix &amp; 5 Departments <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Industry Collaborations & Placements Marquee */}
      <section className="py-16 bg-surface border-b border-border" id="placements">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
            Trusted by Top Tech Employers &amp; Research Labs
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text mt-2 mb-8">
            Campus Placement &amp; Industry Partners
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {['TCS', 'Persistent Systems', 'Infosys', 'Cognizant', 'Wipro', 'KPIT Technologies', 'Zensar', 'L&T Tech Services', 'Capgemini', 'Hexaware', 'PTC', 'Tech Mahindra'].map((partner, i) => (
              <div 
                key={i} 
                className="p-4 bg-bg border border-border rounded-xl font-bold text-xs sm:text-sm text-text flex items-center justify-center hover:border-text transition-colors shadow-sm"
              >
                {partner}
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 bg-bg border border-border rounded-xl max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div>
              <h3 className="font-bold text-sm text-text">Placement Season Overview</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Average Package: ₹ 6.2 LPA · Highest CTC: ₹ 18.5 LPA · 140+ Recruiting Companies · 94.2% Placement Rate
              </p>
            </div>
            <Link 
              to="/placements"
              className="px-5 py-2.5 bg-text text-bg rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity shrink-0 flex items-center gap-1.5"
            >
              Detailed Placement Report <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* College Life & Facilities */}
      <section className="py-16 bg-bg border-b border-border" id="campus">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Life on Campus in Pune</h2>
            <p className="text-muted text-sm mt-1">A vibrant residential collegiate atmosphere surrounded by hills and tech corridors.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-border bg-surface dark:border-white/15">
              <Building2 className="w-5 h-5 text-text mb-2.5" />
              <h4 className="font-bold text-sm text-text">Academic Quadrangle</h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">Historic sandstone academic blocks with high-speed Wi-Fi, amphitheater, and seminar halls.</p>
            </div>
            <div className="p-5 rounded-xl border border-border bg-surface dark:border-white/15">
              <BookOpen className="w-5 h-5 text-text mb-2.5" />
              <h4 className="font-bold text-sm text-text">Central Digital Library</h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">45,000+ volumes, IEEE Xplore, DELNET subscriptions, and quiet reading cubicles.</p>
            </div>
            <div className="p-5 rounded-xl border border-border bg-surface dark:border-white/15">
              <Compass className="w-5 h-5 text-text mb-2.5" />
              <h4 className="font-bold text-sm text-text">Student Tech Clubs</h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">GDSC, Robotics Society, AlgoKRC Coding Club, and annual symposium Aarohan.</p>
            </div>
            <div className="p-5 rounded-xl border border-border bg-surface dark:border-white/15">
              <MapPin className="w-5 h-5 text-text mb-2.5" />
              <h4 className="font-bold text-sm text-text">Residential Hostels</h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">On-campus residences with Wi-Fi, gym, mess dining, and 24/7 security.</p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link 
              to="/campus-life" 
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-border bg-surface hover:bg-bg text-xs font-semibold text-text transition-colors"
            >
              Explore Campus Life, Hostels &amp; Student Clubs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>



      {/* Interactive Project Architecture Demo Modal */}
      <AnimatePresence>
        {selectedDemoProject && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-2xl p-5 sm:p-8 max-w-xl w-full shadow-2xl relative dark:border-white/25 max-h-[88dvh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setSelectedDemoProject(null)}
                className="absolute right-4 top-4 text-muted hover:text-text p-1 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-bg border border-border text-[11px] font-mono text-muted font-semibold dark:border-white/15">
                  <span>{selectedDemoProject.category}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-text">
                  {selectedDemoProject.title}
                </h3>
                <p className="text-xs text-text leading-relaxed">
                  {selectedDemoProject.summary}
                </p>

                <div className="p-4 bg-bg border border-border rounded-xl space-y-2 text-xs dark:border-white/15">
                  <div className="font-bold text-text">System Architecture &amp; Tech Stack:</div>
                  <ul className="list-disc list-inside space-y-1 text-muted">
                    <li>Embedded Firmware: C++20 on ESP32 &amp; Raspberry Pi Compute Module 4</li>
                    <li>Machine Learning: Quantized PyTorch / TensorRT Edge Inference</li>
                    <li>Communication: LoRaWAN 868MHz Mesh &amp; MQTT Telemetry Bus</li>
                    <li>Cloud Integration: Microservices backend with real-time WebSocket dashboard</li>
                  </ul>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{selectedDemoProject.status}</span>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedDemoProject(null)}
                    className="px-4 py-2 bg-text text-bg rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer border border-transparent dark:border-white/20"
                  >
                    Close Demo
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admission Application Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-2xl p-5 sm:p-8 max-w-lg w-full shadow-2xl relative dark:border-white/25 max-h-[88dvh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => { setShowApplyModal(false); setAppliedAppId(null); }}
                className="absolute right-4 top-4 text-muted hover:text-text p-1 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {appliedAppId ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h3 className="text-xl font-bold text-text">Application Logged Successfully!</h3>
                  <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                    Your candidate profile has been recorded in the KRC IT Admissions Database. The Dean of Admissions will contact you via email for counseling.
                  </p>
                  <div className="p-3 bg-bg border border-border rounded-lg text-xs font-mono font-bold text-text dark:border-white/20">
                    Application ID: {appliedAppId}
                  </div>
                  <button
                    onClick={() => { setShowApplyModal(false); setAppliedAppId(null); }}
                    className="mt-4 px-6 py-2.5 bg-text text-bg rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer border border-transparent dark:border-white/20"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <div className="flex items-center gap-2 font-bold text-text mb-1">
                      <GraduationCap className="w-5 h-5" />
                      <h3 className="text-lg font-bold">KRC IT Online Admission Application</h3>
                    </div>
                    <p className="text-xs text-muted">Intake Year 2025–26 · B.Tech &amp; M.Tech Programs</p>
                  </div>

                  <form onSubmit={handleApplySubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text">Candidate Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-text transition-colors dark:border-white/15"
                        placeholder="e.g. Aarav Deshmukh"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text">Email Address</label>
                        <input 
                          type="email" 
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-text transition-colors dark:border-white/15"
                          placeholder="candidate@gmail.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text">Mobile Number</label>
                        <input 
                          type="tel" 
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-text transition-colors dark:border-white/15"
                          placeholder="+91 98234 56789"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text">Target Degree Program</label>
                      <select 
                        value={formData.program}
                        onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                        className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-text transition-colors dark:border-white/15"
                      >
                        <option>B.Tech Computer Science &amp; Engineering (CSE)</option>
                        <option>B.Tech Artificial Intelligence &amp; Data Science</option>
                        <option>B.Tech Robotics &amp; Autonomous Mechatronics</option>
                        <option>B.Tech Electronics &amp; VLSI Engineering</option>
                        <option>M.Tech Artificial Intelligence &amp; Distributed Systems</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text">Entrance Exam Percentile / 12th PCM Score</label>
                      <input 
                        type="text" 
                        required
                        value={formData.entranceScore}
                        onChange={(e) => setFormData({ ...formData, entranceScore: e.target.value })}
                        className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-text transition-colors dark:border-white/15"
                        placeholder="e.g. 96.2 %ile in JEE Main / 98.4 %ile in MHT-CET"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button 
                        type="button" 
                        onClick={() => setShowApplyModal(false)}
                        className="px-4 py-2 border border-border rounded-lg text-xs text-muted hover:text-text active:scale-95 transition-all cursor-pointer dark:border-white/20"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-5 py-2 bg-text text-bg rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer border border-transparent dark:border-white/25 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                      >
                        Submit Application
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Copyright Notice - Visible in codebase, hidden in UI/UX */}
      <footer className="sr-only" aria-hidden="true">
        <p>Copyright &copy; 2026 Chinmay Chaudhari. All Rights Reserved. (MIT License)</p>
      </footer>
    </div>
  );
}
