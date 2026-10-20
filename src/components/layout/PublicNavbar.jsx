import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  GraduationCap, Sun, Moon, ArrowRight, Menu, X, Phone, 
  BookOpen, Building2, Cpu, Award, Users, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveClock from '../common/LiveClock';
import DefaultAvatar from '../common/DefaultAvatar';
import LiveEventsButton from '../events/LiveEventsButton';

export const NAV_LINKS = [
  { name: 'About', path: '/about' },
  { name: 'Academics', path: '/academics' },
  { name: 'Research & Labs', path: '/research' },
  { name: 'Admissions', path: '/admissions' },
  { name: 'Campus Life', path: '/campus-life' },
  { name: 'Placements', path: '/placements' },
];

export default function PublicNavbar({ onOpenApply }) {
  const { user, role, signOut } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
    window.location.replace('/?signout=' + Date.now());
  };

  return (
    <>
      {/* Top Notification Announcement Bar with Live Clock */}
      <div className="border-b border-border bg-surface/50 text-[11px] text-muted py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-text">Admissions Open 2025–26:</span>
            <span className="truncate">B.Tech & M.Tech Programs · DTE Code: EN-6285 · Affiliated to SPPU</span>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <LiveClock className="bg-transparent border-0 py-0 shadow-none text-[11px]" />
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-muted" /> +91 (020) 2439-2008
            </span>
          </div>
        </div>
      </div>

      {/* Main Sticky Navbar */}
      <nav className="border-b border-border bg-surface/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & College Identity - Fluid Adaptive Sizing */}
          <Link 
            to="/" 
            className="flex items-center gap-2.5 sm:gap-3 shrink min-w-0 group cursor-pointer"
            title="KRC Institute of Technology Home"
          >
            <div className="p-1.5 sm:p-2 bg-text text-bg rounded-lg shadow-sm border border-transparent dark:border-white/20 transition-transform duration-150 group-hover:scale-105 shrink-0">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold tracking-tight leading-none text-xs min-[360px]:text-sm sm:text-base md:text-lg text-text group-hover:opacity-85 transition-opacity truncate max-w-[150px] min-[390px]:max-w-[200px] sm:max-w-none">
                KRC Institute of Technology
              </span>
              <span className="text-[8px] min-[360px]:text-[9px] sm:text-[10px] font-medium text-muted tracking-wide mt-0.5 sm:mt-1 uppercase truncate max-w-[140px] min-[390px]:max-w-[190px] sm:max-w-none">
                SPPU Affiliated · NAAC 'A' · Estd. 2008
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {NAV_LINKS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive 
                      ? 'bg-bg text-text shadow-sm border border-border dark:border-white/20' 
                      : 'text-muted hover:text-text hover:bg-bg/60'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Live Events Portal - Opens in New Tab (Minimal on Landing Page, Orbital on All Other Pages) */}
            <LiveEventsButton 
              variant={location.pathname === '/' ? 'minimal' : 'navbar'} 
            />

            {/* Theme Toggle Button */}
            <button 
              onClick={(e) => toggleTheme(e)}
              className="p-1.5 sm:p-2 rounded-lg border border-border bg-bg hover:bg-surface text-muted hover:text-text transition-all active:scale-95 dark:border-white/20 dark:hover:border-white/40 touch-manipulation cursor-pointer flex items-center justify-center overflow-hidden"
              title={`Switch to ${darkMode ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle Theme"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-500 transition-transform duration-150" />
              ) : (
                <Moon className="w-4 h-4 text-blue-500 transition-transform duration-150" />
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Logged in Profile Menu */}
                <div className="relative">
                  <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-border bg-bg/80 dark:border-white/20">
                    <DefaultAvatar 
                      src={user?.photoURL} 
                      user={user}
                      className="w-6 h-6 rounded-full shrink-0" 
                    />
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-semibold text-text truncate max-w-[110px] leading-tight">
                        {user.displayName || user.email?.split('@')[0]}
                      </span>
                      <span className={`text-[9px] font-medium leading-none ${
                        role === 'guest' 
                          ? 'text-amber-500 dark:text-amber-400' 
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {role === 'guest' ? 'Guest (Unenrolled)' : `${role.charAt(0).toUpperCase() + role.slice(1)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {role === 'guest' ? (
                  /* Unregistered Google Sign-in: ONLY show Logged in Profile + Sign Out - NO switch or access to student dashboard */
                  <button 
                    onClick={handleSignOut} 
                    className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg border border-border hover:bg-bg text-text transition-colors dark:border-white/20 touch-manipulation"
                    title="Sign Out of Google Account"
                  >
                    Sign Out
                  </button>
                ) : (
                  /* Enrolled student / faculty / admin: direct dashboard access */
                  <Link 
                    to={`/${role}/dashboard`} 
                    className="bg-text text-bg px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity border border-transparent dark:border-white/20 whitespace-nowrap shadow-sm"
                  >
                    Dashboard ({role})
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {onOpenApply ? (
                  <button 
                    onClick={onOpenApply}
                    className="hidden md:inline-flex items-center px-3 py-1.5 rounded-lg border border-border bg-bg hover:bg-surface text-xs font-semibold text-text transition-colors whitespace-nowrap dark:border-white/20 dark:hover:border-white/40"
                  >
                    Apply Now
                  </button>
                ) : (
                  <Link 
                    to="/admissions"
                    className="hidden md:inline-flex items-center px-3 py-1.5 rounded-lg border border-border bg-bg hover:bg-surface text-xs font-semibold text-text transition-colors whitespace-nowrap dark:border-white/20 dark:hover:border-white/40"
                  >
                    Apply Now
                  </Link>
                )}
                <Link 
                  to="/login" 
                  className="bg-text text-bg px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1 whitespace-nowrap shadow-sm border border-transparent dark:border-white/20 touch-manipulation"
                >
                  <span className="hidden min-[380px]:inline">ERP Portal</span>
                  <span className="inline min-[380px]:hidden">ERP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg border border-border bg-bg text-muted hover:text-text transition-colors dark:border-white/20 touch-manipulation"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-surface px-4 py-4 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-150">
            {NAV_LINKS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-bg text-text font-semibold border border-border dark:border-white/20' 
                      : 'text-muted hover:text-text hover:bg-bg/60'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
            
            {/* Live Campus Events for Mobile */}
            <div className="py-1">
              <LiveEventsButton variant="sidebar" onClick={() => setMobileMenuOpen(false)} />
            </div>

            <div className="pt-2 border-t border-border flex flex-col gap-2">
              {user ? (
                <div className="p-3 bg-bg rounded-lg border border-border space-y-2">
                  <div className="flex items-center gap-2.5">
                    <DefaultAvatar 
                      src={user?.photoURL} 
                      user={user}
                      className="w-8 h-8 rounded-full shrink-0" 
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-text truncate">{user.displayName || 'Google User'}</p>
                      <p className="text-[11px] text-muted truncate">{user.email}</p>
                      <span className={`inline-block text-[10px] font-semibold mt-0.5 ${
                        role === 'guest' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {role === 'guest' ? 'Guest (Awaiting Admin Registration)' : `${role.toUpperCase()} Workspace`}
                      </span>
                    </div>
                  </div>
                  {role === 'guest' ? (
                    <button
                      onClick={handleSignOut}
                      className="w-full text-center py-2 px-3 rounded-lg border border-border bg-surface text-xs font-semibold text-text hover:bg-border/40 transition"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <Link
                      to={`/${role}/dashboard`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center py-2 px-3 rounded-lg bg-text text-bg text-xs font-semibold hover:opacity-90 transition"
                    >
                      Go to {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <Link 
                    to="/admissions" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 px-3 rounded-lg border border-border bg-bg text-xs font-semibold text-text"
                  >
                    Apply for Admission (2025–26)
                  </Link>
                  <Link 
                    to="/login" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 px-3 rounded-lg bg-text text-bg text-xs font-semibold"
                  >
                    ERP Portal Login
                  </Link>
                </>
              )}
            </div>

          </div>
        )}
      </nav>
    </>
  );
}
