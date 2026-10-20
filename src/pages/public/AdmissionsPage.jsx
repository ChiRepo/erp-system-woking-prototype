/**
 * @fileoverview PUBLIC AdmissionsPage Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState } from 'react';
import { 
  FileText, CheckCircle2, Award, Calendar, HelpCircle, 
  ArrowRight, ShieldCheck, Check, Phone, Mail 
} from 'lucide-react';

export default function AdmissionsPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: 'Pune',
    category: 'Open / General',
    program: 'B.Tech Computer Science & Engineering (CSE)',
    entranceExam: 'MHT-CET',
    entranceScore: ''
  });

  const [submittedAppId, setSubmittedAppId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const generatedId = `KRCIT-2025-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedAppId(generatedId);
  };

  return (
    <div className="w-full">

      {/* Header Banner */}
      <section className="border-b border-border bg-surface py-10 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-bg text-xs font-semibold text-muted">
              <FileText className="w-3.5 h-3.5 text-text" /> DTE Choice Code: EN-6285 · Admissions Open 2025–26
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-text leading-tight">
              Engineering Admissions &amp; Eligibility
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted leading-relaxed">
              Admissions to all First Year and Direct Second Year B.Tech engineering seats at KRC Institute 
              of Technology are conducted transparently via the Maharashtra State CET Cell Centralized 
              Admission Process (CAP) and Institutional Quota.
            </p>
          </div>
        </div>
      </section>

      {/* Admission Flow & Application Grid */}
      <section className="border-b border-border py-10 sm:py-14 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            
            {/* Left 7 Columns: Guidelines, Process & Fees */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              
              {/* Eligibility Criteria */}
              <div className="p-4 sm:p-6 rounded-xl border border-border bg-surface space-y-4">
                <h2 className="text-lg font-bold text-text">Eligibility Criteria for First Year B.Tech</h2>
                <ul className="space-y-2.5 text-xs text-muted leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Academic Qualification:</strong> Passed 10+2 / HSC Examination with Physics and Mathematics as compulsory subjects along with Chemistry, Biotechnology, Biology, or Computer Science.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Minimum Aggregate:</strong> At least <strong>45% marks</strong> in above subjects taken together (at least <strong>40% marks</strong> in case of backward class categories belonging to Maharashtra State).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Entrance Scorecard:</strong> Obtained non-zero positive score in <strong>MHT-CET 2025</strong> or <strong>JEE (Main) 2025</strong> Paper-I.</span>
                  </li>
                </ul>
              </div>

              {/* Step-by-Step CAP Admission Process */}
              <div className="p-6 rounded-xl border border-border bg-surface space-y-4">
                <h2 className="text-lg font-bold text-text">Centralized Admission Process (CAP) Steps</h2>
                <div className="space-y-3 text-xs text-muted">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-text text-bg flex items-center justify-center font-bold text-[11px] shrink-0">1</div>
                    <div>
                      <p className="font-semibold text-text">Online Registration on CET Portal</p>
                      <p>Register online at cetcell.mahacet.org and upload required educational and domicile documents.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-text text-bg flex items-center justify-center font-bold text-[11px] shrink-0">2</div>
                    <div>
                      <p className="font-semibold text-text">Document E-Scrutiny &amp; Merit Rank</p>
                      <p>Verify documents online or at physical Facilitation Centers (FC) to obtain your State General Merit Rank.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-text text-bg flex items-center justify-center font-bold text-[11px] shrink-0">3</div>
                    <div>
                      <p className="font-semibold text-text">Option Form Filling with DTE Code 6285</p>
                      <p>Add KRC Institute of Technology (DTE Code: 6285) in your preferred branch order during CAP Option filling.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-text text-bg flex items-center justify-center font-bold text-[11px] shrink-0">4</div>
                    <div>
                      <p className="font-semibold text-text">Seat Allotment &amp; Campus Reporting</p>
                      <p>Freeze or Float your allotted seat and complete admission confirmation at the KRC IT campus counter.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Structure Table */}
              <div className="p-4 sm:p-6 rounded-xl border border-border bg-surface space-y-4">
                <h2 className="text-lg font-bold text-text">Fee Structure (Annual, Approved by FRA)</h2>
                <div className="overflow-x-auto table-responsive">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border text-muted uppercase">
                      <tr>
                        <th className="pb-2 whitespace-nowrap">Component</th>
                        <th className="pb-2 text-right whitespace-nowrap">General / Open</th>
                        <th className="pb-2 text-right whitespace-nowrap">EBC / OBC (50%)</th>
                        <th className="pb-2 text-right whitespace-nowrap">SC / ST / TFWS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-muted">
                      <tr>
                        <td className="py-2 text-text font-medium whitespace-nowrap">Tuition Fee</td>
                        <td className="py-2 text-right whitespace-nowrap">₹ 94,500</td>
                        <td className="py-2 text-right whitespace-nowrap">₹ 47,250</td>
                        <td className="py-2 text-right whitespace-nowrap">₹ 0</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-text font-medium whitespace-nowrap">Development Fee</td>
                        <td className="py-2 text-right whitespace-nowrap">₹ 12,500</td>
                        <td className="py-2 text-right whitespace-nowrap">₹ 12,500</td>
                        <td className="py-2 text-right whitespace-nowrap">₹ 0</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-text font-medium whitespace-nowrap">University / Exam Charges</td>
                        <td className="py-2 text-right whitespace-nowrap">₹ 4,000</td>
                        <td className="py-2 text-right whitespace-nowrap">₹ 4,000</td>
                        <td className="py-2 text-right whitespace-nowrap">₹ 4,000</td>
                      </tr>
                      <tr className="font-bold text-text bg-bg/50">
                        <td className="py-2 whitespace-nowrap">Total Academic Fee</td>
                        <td className="py-2 text-right whitespace-nowrap">₹ 1,11,000</td>
                        <td className="py-2 text-right whitespace-nowrap">₹ 63,750</td>
                        <td className="py-2 text-right whitespace-nowrap">₹ 4,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-muted">
                  * All Government scholarships (MAHADTE, Post-Matric, EBC, TFWS) are applicable to eligible students with family income verified certificates.
                </p>
              </div>

            </div>

            {/* Right 5 Columns: Interactive Application Form */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 p-4 sm:p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-border bg-surface space-y-6 shadow-sm">
                <div>
                  <h3 className="text-xl font-bold text-text">Direct Admission Enquiry Form</h3>
                  <p className="text-xs text-muted mt-1">Submit your details to receive provisional seat guidance, branch counseling, and cutoff updates.</p>
                </div>

                {submittedAppId ? (
                  <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                      <Check className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-text">Enquiry Submitted Successfully!</h4>
                      <p className="text-xs text-muted mt-1">Your Application / Enquiry ID is:</p>
                      <p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{submittedAppId}</p>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Our admissions counseling cell will contact you at <strong>{formData.phone || '+91 9876543210'}</strong> with 
                      merit rank cutoffs and CAP option code assistance.
                    </p>
                    <button
                      onClick={() => setSubmittedAppId(null)}
                      className="text-xs font-semibold px-4 py-2 rounded-lg border border-border hover:bg-bg text-text"
                    >
                      Submit Another Enquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-text mb-1">Full Student Name *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Aarav Kulkarni"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-bg text-text focus:outline-none focus:border-text"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text mb-1">Email Address *</label>
                        <input 
                          type="email" 
                          required
                          placeholder="aarav@gmail.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-bg text-text focus:outline-none focus:border-text"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text mb-1">Mobile (WhatsApp) *</label>
                        <input 
                          type="tel" 
                          required
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-bg text-text focus:outline-none focus:border-text"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text mb-1">Preferred Engineering Branch *</label>
                      <select 
                        value={formData.program}
                        onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-bg text-text focus:outline-none focus:border-text"
                      >
                        <option>B.Tech Computer Science &amp; Engineering (CSE)</option>
                        <option>B.Tech AI &amp; Data Science (AI &amp; DS)</option>
                        <option>B.Tech Electronics &amp; Telecommunication (E&amp;TC)</option>
                        <option>B.Tech Information Technology (IT)</option>
                        <option>B.Tech Robotics &amp; Automation</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text mb-1">Entrance Exam</label>
                        <select 
                          value={formData.entranceExam}
                          onChange={(e) => setFormData({ ...formData, entranceExam: e.target.value })}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-bg text-text focus:outline-none focus:border-text"
                        >
                          <option>MHT-CET 2025</option>
                          <option>JEE Main 2025</option>
                          <option>Direct 2nd Year Diploma</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text mb-1">Score / Percentile</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 94.8 %ile"
                          value={formData.entranceScore}
                          onChange={(e) => setFormData({ ...formData, entranceScore: e.target.value })}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-bg text-text focus:outline-none focus:border-text"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-2.5 px-4 rounded-lg bg-text text-bg text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm mt-2"
                    >
                      Submit Admission Enquiry <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[11px] text-muted pt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Zero admission registration fee · Data kept confidential</span>
                    </div>
                  </form>
                )}

                {/* Admission Helpline Contact Details */}
                <div className="pt-4 border-t border-border space-y-2 text-xs text-muted">
                  <p className="font-bold text-text">Admissions Helpdesk:</p>
                  <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> +91 (020) 2439-2008 / +91 94220 12008</p>
                  <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> admissions@krc.edu.in</p>
                  <p>In-person counseling open Monday to Saturday, 9:00 AM – 5:00 PM.</p>
                </div>
              </div>
            </div>

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
