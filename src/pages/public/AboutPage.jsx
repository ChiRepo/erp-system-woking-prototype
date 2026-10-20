/**
 * @fileoverview PUBLIC AboutPage Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { Link } from 'react-router-dom';
import { 
  Building2, Award, CheckCircle2, Users, Compass, 
  MapPin, ShieldCheck, ArrowRight, BookOpen, GraduationCap 
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="w-full">

      {/* Hero Header */}
      <section className="relative border-b border-border bg-surface py-10 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-bg text-xs font-semibold text-muted">
              <Award className="w-3.5 h-3.5 text-text" /> Estd. 2008 · Pune, Maharashtra
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-text leading-tight">
              About KRC Institute of Technology
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted leading-relaxed">
              Established in 2008 under the visionary leadership of the KRC Educational Trust, 
              KRC IT has grown into one of Pune's premier engineering destinations, committed to 
              delivering rigorous technical education, hands-on engineering mastery, and societal leadership.
            </p>
          </div>
        </div>
      </section>

      {/* Main Campus Photo Showcase */}
      <section className="border-b border-border py-12 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group rounded-xl overflow-hidden border border-border bg-surface">
              <div className="h-56 overflow-hidden">
                <img 
                  src="/images/campus_main.jpg" 
                  alt="Academic Quadrangle" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-5 space-y-1">
                <h3 className="font-bold text-sm text-text">Academic Quadrangle</h3>
                <p className="text-xs text-muted">Smart multi-media lecture halls, department administrative offices, and seminar auditoriums.</p>
              </div>
            </div>

            <div className="group rounded-xl overflow-hidden border border-border bg-surface">
              <div className="h-56 overflow-hidden">
                <img 
                  src="/images/campus_grounds.jpg" 
                  alt="25-Acre Green Campus" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-5 space-y-1">
                <h3 className="font-bold text-sm text-text">25-Acre Eco-Campus</h3>
                <p className="text-xs text-muted">Nestled in the Ambegaon hills with solar microgrids, rainwater harvesting, and open study plazas.</p>
              </div>
            </div>

            <div className="group rounded-xl overflow-hidden border border-border bg-surface">
              <div className="h-56 overflow-hidden">
                <img 
                  src="/images/tech_park.jpg" 
                  alt="Innovation & Incubation Hub" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-5 space-y-1">
                <h3 className="font-bold text-sm text-text">Innovation Hub & Incubation Center</h3>
                <p className="text-xs text-muted">Dedicated student startup workspaces, prototype development bays, and patent advisory cell.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="border-b border-border py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="p-8 rounded-xl border border-border bg-bg space-y-4">
              <div className="p-2.5 bg-text text-bg rounded-lg w-fit">
                <Compass className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-text">Our Vision</h2>
              <p className="text-sm text-muted leading-relaxed">
                To evolve into a nationally acknowledged center of technical excellence, producing socially conscious, 
                innovative engineers capable of solving complex global problems and driving technological self-reliance.
              </p>
            </div>

            <div className="p-8 rounded-xl border border-border bg-bg space-y-4">
              <div className="p-2.5 bg-text text-bg rounded-lg w-fit">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-text">Our Mission</h2>
              <ul className="text-sm text-muted space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  Deliver outcome-based engineering education grounded in fundamentals and practical mastery.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  Cultivate strong industry-academia symbiosis through internships, live projects, and technology centers.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  Inculcate entrepreneurial mindset, professional ethics, and environmental stewardship in every graduate.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Statutory Approvals & Accreditations */}
      <section className="border-b border-border py-16 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Statutory Approvals & Accreditations</h2>
            <p className="text-xs sm:text-sm text-muted">KRC Institute of Technology adheres to the highest national academic quality benchmarks.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl border border-border bg-surface text-center space-y-2">
              <div className="text-2xl font-black text-text">AICTE</div>
              <div className="text-xs font-semibold text-text">All India Council for Technical Education</div>
              <p className="text-[11px] text-muted">Approved by AICTE, New Delhi for all Undergraduate & Postgraduate programs.</p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-surface text-center space-y-2">
              <div className="text-2xl font-black text-text">SPPU</div>
              <div className="text-xs font-semibold text-text">Savitribai Phule Pune University</div>
              <p className="text-[11px] text-muted">Permanently affiliated to SPPU Pune. Degrees conferred under university seal.</p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-surface text-center space-y-2">
              <div className="text-2xl font-black text-text">NAAC Grade A</div>
              <div className="text-xs font-semibold text-text">National Assessment &amp; Accreditation Council</div>
              <p className="text-[11px] text-muted">Accredited with Grade A for teaching excellence, faculty credentials, and infrastructure.</p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-surface text-center space-y-2">
              <div className="text-2xl font-black text-text">DTE EN-6285</div>
              <div className="text-xs font-semibold text-text">Govt. of Maharashtra DTE</div>
              <p className="text-[11px] text-muted">Recognized by Directorate of Technical Education, Maharashtra for CAP counseling.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership & Faculty Credentials */}
      <section className="border-b border-border py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Leadership & Administration</h2>
              <p className="text-xs sm:text-sm text-muted">Guided by experienced academic visionaries and industry veterans.</p>
            </div>

            <div className="p-8 rounded-xl border border-border bg-bg flex flex-col md:flex-row gap-6 items-center">
              <div className="w-24 h-24 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 text-2xl font-bold text-text">
                CC
              </div>
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-block px-2.5 py-0.5 rounded bg-surface border border-border text-[11px] font-semibold text-muted">
                  Message from the Principal
                </div>
                <h3 className="text-lg font-bold text-text">Dr. Chinmay Chaudhari</h3>
                <p className="text-xs font-medium text-muted">Ph.D. in Computer Engineering (IIT Bombay) · 26 Years in Higher Education</p>
                <p className="text-xs text-muted leading-relaxed">
                  "At KRC Institute of Technology, we believe practical engineering happens when students have hands-on access 
                  to developer workstations, circuit breadboards, and open-source tools from their very first semester. We do not 
                  just teach theory for semester exams; we mentor makers and developers."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Experience KRC Institute of Technology</h2>
          <p className="text-sm text-muted max-w-xl mx-auto">
            Explore our curriculum, take a virtual tour of our computing labs, or submit your admission application for the 2025–26 academic intake.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link 
              to="/academics" 
              className="px-5 py-2.5 rounded-lg bg-text text-bg text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Explore Academic Programs <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/admissions" 
              className="px-5 py-2.5 rounded-lg border border-border bg-surface text-xs font-semibold text-text hover:bg-bg transition-colors"
            >
              Admissions &amp; Cutoffs
            </Link>
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
