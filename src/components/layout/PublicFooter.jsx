import { Link } from 'react-router-dom';
import { GraduationCap, MapPin, Phone, Mail, Globe, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface text-text mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Column 1: College Identity */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="p-2 bg-text text-bg rounded-lg">
                <GraduationCap className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <span className="font-extrabold tracking-tight text-lg text-text">KRC Institute of Technology</span>
                <p className="text-xs text-muted">Estd. 2008 · Ambegaon BK, Pune</p>
              </div>
            </Link>
            <p className="text-xs text-muted leading-relaxed pr-6">
              Approved by AICTE New Delhi, Recognized by Directorate of Technical Education (DTE Code: EN-6285), 
              Govt. of Maharashtra, and Affiliated to Savitribai Phule Pune University (SPPU). NAAC Grade A Accredited.
            </p>
            <div className="flex flex-col gap-2 text-xs text-muted">
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-text" /> Survey No. 44/1, Vadgaon-Ambegaon Campus, Pune - 411041, Maharashtra
              </span>
              <span className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 shrink-0 text-text" /> +91 (020) 2439-2008 / 2439-2009
              </span>
              <span className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 shrink-0 text-text" /> admissions@krc.edu.in / principal@krc.edu.in
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text">Navigation</h4>
            <ul className="space-y-2 text-xs text-muted">
              <li><Link to="/about" className="hover:text-text transition-colors">About KRC IT</Link></li>
              <li><Link to="/academics" className="hover:text-text transition-colors">Academic Programs</Link></li>
              <li><Link to="/research" className="hover:text-text transition-colors">Computing &amp; Research Labs</Link></li>
              <li><Link to="/admissions" className="hover:text-text transition-colors">Admissions 2025–26</Link></li>
              <li><Link to="/campus-life" className="hover:text-text transition-colors">Campus Life &amp; Hostels</Link></li>
              <li><Link to="/placements" className="hover:text-text transition-colors">Placement Records</Link></li>
            </ul>
          </div>

          {/* Column 3: Academic Programs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text">B.Tech Degrees</h4>
            <ul className="space-y-2 text-xs text-muted">
              <li>Computer Science &amp; Engineering</li>
              <li>AI &amp; Machine Learning (CSE)</li>
              <li>Information Technology (IT)</li>
              <li>Electronics &amp; Telecommunication</li>
              <li>Robotics &amp; Automation</li>
              <li>M.Tech Computer Engineering</li>
            </ul>
          </div>

          {/* Column 4: Portals & Statutory */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text">Portals &amp; Statutory</h4>
            <ul className="space-y-2 text-xs text-muted">
              <li>
                <Link to="/login" className="font-semibold text-text hover:underline flex items-center gap-1">
                  ERP Portal Login <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
              <li><a href="https://www.aicte-india.org" target="_blank" rel="noreferrer" className="hover:text-text transition-colors">AICTE Approvals</a></li>
              <li><a href="http://www.unipune.ac.in" target="_blank" rel="noreferrer" className="hover:text-text transition-colors">SPPU Pune Affiliation</a></li>
              <li><a href="https://cetcell.mahacet.org" target="_blank" rel="noreferrer" className="hover:text-text transition-colors">MHT-CET Cell</a></li>
              <li><span className="hover:text-text transition-colors">Anti-Ragging Committee</span></li>
              <li><span className="hover:text-text transition-colors">Internal Complaints Committee (ICC)</span></li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright & attribution */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted gap-4">
          <p>© {new Date().getFullYear()} KRC Institute of Technology. All rights reserved. DTE Code: EN-6285.</p>
          <div className="flex items-center gap-4">
            <span>Affiliated to SPPU</span>
            <span>·</span>
            <span>NAAC Grade A</span>
            <span>·</span>
            <span>NBA Tier-1 Accredited</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
