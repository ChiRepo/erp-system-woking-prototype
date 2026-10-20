/**
 * @fileoverview PUBLIC PlacementsPage Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { Link } from 'react-router-dom';
import { 
  Award, TrendingUp, Building2, Users, CheckCircle2, 
  ArrowRight, Briefcase, GraduationCap, Star 
} from 'lucide-react';

const RECRUITERS = [
  { name: 'Tata Consultancy Services', category: 'IT Services & Digital', tier: 'TCS Digital / Ninja' },
  { name: 'Persistent Systems', category: 'Software Products', tier: 'Marquee Recruiter' },
  { name: 'Infosys Limited', category: 'Enterprise Technology', tier: 'Power Programmer / SE' },
  { name: 'Cognizant', category: 'Digital Solutions', tier: 'GenC Next / Elevate' },
  { name: 'KPIT Technologies', category: 'Automotive Software', tier: 'Embedded & AUTOSAR' },
  { name: 'Zensar Technologies', category: 'Cloud & AI', tier: 'Digital Specialist' },
  { name: 'L&T Technology Services', category: 'Engineering R&D', tier: 'Core & Embedded' },
  { name: 'Capgemini', category: 'Consulting & Tech', tier: 'Senior Analyst' },
  { name: 'Hexaware Technologies', category: 'Cloud Infrastructure', tier: 'Pega & Full Stack' },
  { name: 'Wipro Technologies', category: 'Enterprise Services', tier: 'Turbo / Elite' },
  { name: 'PTC Software', category: 'IoT & CAD Solutions', tier: 'Product Development' },
  { name: 'Tech Mahindra', category: 'Telecom & AI', tier: 'Associate Software Eng.' },
];

const STUDENT_OFFERS = [
  {
    name: 'Aarav Kulkarni',
    dept: 'B.Tech CSE (Batch 2025)',
    company: 'Persistent Systems',
    role: 'Lead Software Engineer',
    package: '₹ 14.5 LPA'
  },
  {
    name: 'Ananya Sharma',
    dept: 'B.Tech AI & DS (Batch 2025)',
    company: 'TCS Digital',
    role: 'Digital Specialist Engineer',
    package: '₹ 9.0 LPA'
  },
  {
    name: 'Rohan Verma',
    dept: 'B.Tech E&TC (Batch 2025)',
    company: 'KPIT Technologies',
    role: 'Automotive Embedded Engineer',
    package: '₹ 7.5 LPA'
  },
  {
    name: 'Tanvi Deshpande',
    dept: 'B.Tech IT (Batch 2025)',
    company: 'Zensar Technologies',
    role: 'Cloud DevOps Associate',
    package: '₹ 8.0 LPA'
  }
];

export default function PlacementsPage() {
  return (
    <div className="w-full">

      {/* Header Banner */}
      <section className="border-b border-border bg-surface py-10 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-bg text-xs font-semibold text-muted">
              <TrendingUp className="w-3.5 h-3.5 text-text" /> Training &amp; Placement Cell · Pune
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-text leading-tight">
              Placement Records &amp; Corporate Relations
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted leading-relaxed">
              KRC Institute of Technology maintains robust recruitment relationships with top IT, automotive, 
              fintech, and engineering organizations across Pune, Mumbai, Bangalore, and Hyderabad.
            </p>
          </div>
        </div>
      </section>

      {/* Key Stats Bar */}
      <section className="border-b border-border py-8 sm:py-12 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-text">94.2%</div>
              <div className="text-xs font-semibold text-muted mt-1 uppercase tracking-wider">Placement Rate</div>
              <p className="text-[11px] text-muted mt-1">Across all eligible final year engineering graduates</p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-surface text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">₹ 18.5 LPA</div>
              <div className="text-xs font-semibold text-muted mt-1 uppercase tracking-wider">Highest Package</div>
              <p className="text-[11px] text-muted mt-1">Product Engineering &amp; System Software Roles</p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-surface text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-text">₹ 6.2 LPA</div>
              <div className="text-xs font-semibold text-muted mt-1 uppercase tracking-wider">Average Package</div>
              <p className="text-[11px] text-muted mt-1">Consistent year-on-year growth</p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-surface text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-text">140+</div>
              <div className="text-xs font-semibold text-muted mt-1 uppercase tracking-wider">Recruiting Partners</div>
              <p className="text-[11px] text-muted mt-1">MNCs, Indian IT giants &amp; tech product firms</p>
            </div>
          </div>
        </div>
      </section>

      {/* Major Recruiters Grid */}
      <section className="border-b border-border py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Our Major Recruiting Partners</h2>
            <p className="text-xs sm:text-sm text-muted">Leading technology employers hiring KRC Institute of Technology engineering graduates.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {RECRUITERS.map((comp, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-border bg-bg space-y-1 hover:border-text/40 transition-colors">
                <div className="text-xs font-bold text-text truncate">{comp.name}</div>
                <div className="text-[11px] text-muted">{comp.category}</div>
                <div className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-muted mt-1">
                  {comp.tier}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* T&P Training Continuum */}
      <section className="border-b border-border py-16 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">4-Stage Employability Training Continuum</h2>
              <p className="text-xs sm:text-sm text-muted">A structured progression ensuring every student is placement-ready well before campus drives begin.</p>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-border bg-surface flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-text text-bg flex items-center justify-center font-bold text-sm shrink-0">1</div>
                <div>
                  <h3 className="font-bold text-sm text-text">Semester 3–4: Quantitative Aptitude &amp; Verbal Ability</h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Foundational logic training, arithmetic reasoning, corporate business communication, and professional email etiquette.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-border bg-surface flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-text text-bg flex items-center justify-center font-bold text-sm shrink-0">2</div>
                <div>
                  <h3 className="font-bold text-sm text-text">Semester 5: Data Structures &amp; Coding Bootcamps</h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Intensive daily coding sessions covering arrays, linked lists, trees, dynamic programming, and SQL schema design.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-border bg-surface flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-text text-bg flex items-center justify-center font-bold text-sm shrink-0">3</div>
                <div>
                  <h3 className="font-bold text-sm text-text">Semester 6: Company-Specific Mock Tests &amp; System Design</h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Simulation of TCS NQT, Persistent Technical Assessments, and Cognizant AMCAT tests under realistic timed conditions.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-border bg-surface flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-text text-bg flex items-center justify-center font-bold text-sm shrink-0">4</div>
                <div>
                  <h3 className="font-bold text-sm text-text">Semester 7: On-Campus Placement Drives &amp; Mock Technical Interviews</h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    One-on-one technical mock interviews conducted by industry alumni, HR round preparations, and campus interview scheduling.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Success Stories */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Recent Placement Highlights</h2>
            <p className="text-xs sm:text-sm text-muted">A few selections from our graduating cohort.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STUDENT_OFFERS.map((offer, idx) => (
              <div key={idx} className="p-5 rounded-xl border border-border bg-bg space-y-2">
                <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-xs text-text">
                  {offer.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="font-bold text-sm text-text">{offer.name}</h3>
                <p className="text-[11px] text-muted">{offer.dept}</p>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-text">{offer.company}</p>
                  <p className="text-[11px] text-muted">{offer.role}</p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">{offer.package}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Hidden Copyright Notice - Visible in codebase, hidden in UI/UX */}
      <footer className="sr-only" aria-hidden="true">
        <p>Copyright &copy; 2026 Chinmay Chaudhari. All Rights Reserved. (MIT License)</p>
      </footer>
    </div>
  );
}
