/**
 * @fileoverview PUBLIC CampusLifePage Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { 
  Building2, BookOpen, Coffee, Award, Users, 
  MapPin, CheckCircle2, ShieldCheck, Heart, Sparkles 
} from 'lucide-react';

export default function CampusLifePage() {
  return (
    <div className="w-full">

      {/* Header Banner */}
      <section className="border-b border-border bg-surface py-10 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-bg text-xs font-semibold text-muted">
              <Users className="w-3.5 h-3.5 text-text" /> 25-Acre Campus · Hostels, Library &amp; Clubs
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-text leading-tight">
              Life on Campus &amp; Student Culture
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted leading-relaxed">
              At KRC Institute of Technology, college life extends far beyond lecture halls. 
              Our 25-acre campus in Ambegaon, Pune provides residential hostels, a vast digital library, 
              sports arenas, and student-driven technical societies.
            </p>
          </div>
        </div>
      </section>

      {/* Central Library Feature */}
      <section className="border-b border-border py-14 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Knowledge Commons</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-text">Central Digital Library &amp; Research Hall</h2>
              <p className="text-sm text-muted leading-relaxed">
                Spanning over 15,000 sq. ft. across two floors, the Central Library houses more than 45,000 print textbooks, 
                monographs, reference encyclopedias, and subscriptions to IEEE Xplore, DELNET, ScienceDirect, and NPTEL.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-lg border border-border bg-surface">
                  <div className="text-xl font-bold text-text">45,000+</div>
                  <div className="text-xs text-muted">Print Volumes &amp; Books</div>
                </div>
                <div className="p-3.5 rounded-lg border border-border bg-surface">
                  <div className="text-xl font-bold text-text">350 Seats</div>
                  <div className="text-xs text-muted">Quiet Reading Commons</div>
                </div>
              </div>
              <ul className="space-y-1.5 text-xs text-muted pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Automated Koha LMS barcode circulation for instant book issue/return</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Extended opening hours until 10:00 PM during end-semester exams</span>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-border shadow-sm">
              <img 
                src="/images/library.jpg" 
                alt="Central Library & Reading Commons" 
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Hostels & Dining */}
      <section className="border-b border-border py-14 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Hostels &amp; Student Living</h2>
            <p className="text-xs sm:text-sm text-muted">Secure, hygienic, and vibrant residential living inside the campus gates.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-border bg-bg space-y-3">
              <div className="text-base font-bold text-text">Sahyadri Boys Hostel</div>
              <p className="text-xs text-muted leading-relaxed">
                Capacity of 320 students. 2-seater and 3-seater rooms equipped with individual study desks, 
                wardrobes, high-speed Wi-Fi, and solar water heating.
              </p>
              <div className="text-[11px] font-semibold text-muted pt-1">Resident Warden &amp; 24/7 Security</div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-bg space-y-3">
              <div className="text-base font-bold text-text">Shivalik Girls Hostel</div>
              <p className="text-xs text-muted leading-relaxed">
                Dedicated on-campus girls hostel with biometric access control, full-time female wardens, 
                power backup, indoor recreation hall, and 24/7 medical tie-up.
              </p>
              <div className="text-[11px] font-semibold text-muted pt-1">Biometric Attendance &amp; Security</div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-bg space-y-3">
              <div className="text-base font-bold text-text">Campus Mess &amp; Cafeteria</div>
              <p className="text-xs text-muted leading-relaxed">
                Hygienic vegetarian dining facility supervised by a student food committee. 
                Serves nutritious breakfast, lunch, evening snacks, and dinner with North &amp; South Indian menus.
              </p>
              <div className="text-[11px] font-semibold text-muted pt-1">FSSAI Certified Food Quality</div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Clubs & Technical Societies */}
      <section className="py-16 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Clubs &amp; Student Societies</h2>
            <p className="text-xs sm:text-sm text-muted">Over 15 active student-led chapters in technology, robotics, open-source, and fine arts.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-border bg-surface space-y-2">
              <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Tech Club</div>
              <h3 className="font-bold text-sm text-text">GDSC KRC Chapter</h3>
              <p className="text-xs text-muted leading-relaxed">
                Google Developer Student Club organizing hands-on workshops on Flutter, Web Development, and Google Cloud study jams.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-surface space-y-2">
              <div className="text-xs font-bold text-blue-500 uppercase tracking-wider">Hardware</div>
              <h3 className="font-bold text-sm text-text">KRC Robotics Society</h3>
              <p className="text-xs text-muted leading-relaxed">
                Teams building autonomous robots for national Robocon, e-Yantra (IIT Bombay), and university drone derbies.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-surface space-y-2">
              <div className="text-xs font-bold text-amber-500 uppercase tracking-wider">Competitive</div>
              <h3 className="font-bold text-sm text-text">AlgoKRC Coding Arena</h3>
              <p className="text-xs text-muted leading-relaxed">
                Weekly problem-solving contests, LeetCode mock rounds, and mentorship for ICPC &amp; Smart India Hackathons.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-surface space-y-2">
              <div className="text-xs font-bold text-purple-500 uppercase tracking-wider">Cultural</div>
              <h3 className="font-bold text-sm text-text">Swaranjali Cultural Forum</h3>
              <p className="text-xs text-muted leading-relaxed">
                Music, dance, theatre, and literary society organizing the flagship annual cultural extravaganza <em>Aarohan</em>.
              </p>
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
