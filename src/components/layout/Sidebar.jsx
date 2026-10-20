import { useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  LayoutDashboard, Users, UserSquare2, BookOpen, 
  CalendarCheck2, IndianRupee, FileCheck, Library, 
  Home, FileBarChart, Settings, X, GraduationCap,
  LogOut, Sun, Moon, ShieldCheck, ChevronRight, User
} from 'lucide-react';
import DefaultAvatar from '../common/DefaultAvatar';
import LiveEventsButton from '../events/LiveEventsButton';
import StudentChatButton from '../chat/StudentChatButton';

const ADMIN_LINKS = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { path: '/admin/students', icon: Users, label: 'Students' },
  { path: '/admin/faculty', icon: UserSquare2, label: 'Faculty' },
  { path: '/admin/courses', icon: BookOpen, label: 'Courses' },
  { path: '/admin/attendance', icon: CalendarCheck2, label: 'Attendance' },
  { path: '/admin/fees', icon: IndianRupee, label: 'Fees' },
  { path: '/admin/exams', icon: FileCheck, label: 'Exams' },
  { path: '/admin/library', icon: Library, label: 'Library' },
  { path: '/admin/hostel', icon: Home, label: 'Hostel' },
  { path: '/admin/reports', icon: FileBarChart, label: 'Reports' },
  { path: '/admin/chat-moderation', icon: ShieldCheck, label: 'Message moderation' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' }
];

const FACULTY_LINKS = [
  { path: '/faculty/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { path: '/faculty/classes', icon: BookOpen, label: 'My Classes' },
  { path: '/faculty/attendance', icon: CalendarCheck2, label: 'Attendance' },
  { path: '/faculty/grades', icon: FileCheck, label: 'Grades' }
];

const STUDENT_LINKS = [
  { path: '/student/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { path: '/student/profile', icon: User, label: 'My Profile' },
  { path: '/student/timetable', icon: CalendarCheck2, label: 'Timetable' },
  { path: '/student/attendance', icon: UserSquare2, label: 'Attendance' },
  { path: '/student/marks', icon: FileCheck, label: 'Marks & Grades' },
  { path: '/student/fees', icon: IndianRupee, label: 'Fee Status' },
  { path: '/student/library', icon: Library, label: 'Library' }
];

export default function Sidebar({ isMobileOpen, closeMobile }) {
  const { user, role, signOut } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  // Swipe-to-close gesture tracking for mobile touch devices
  const touchStartX = useRef(null);
  const touchCurrentX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchCurrentX.current !== null) {
      const deltaX = touchCurrentX.current - touchStartX.current;
      // If user swiped left by at least 45px, close mobile sidebar
      if (deltaX < -45) {
        closeMobile();
      }
    }
    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  let links = [];
  let roleTitle = 'Student Portal';
  let badgeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-500/20';

  if (role === 'admin') {
    links = ADMIN_LINKS;
    roleTitle = 'Admin Workspace';
    badgeColor = 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-500/20';
  } else if (role === 'faculty') {
    links = FACULTY_LINKS;
    roleTitle = 'Faculty Portal';
    badgeColor = 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-500/20';
  } else if (role === 'student') {
    links = STUDENT_LINKS;
    roleTitle = 'Student Portal';
  }

  const handleSignOut = async () => {
    closeMobile();
    await signOut();
    window.location.replace('/?signout=' + Date.now());
  };

  return (
    <>
      {/* Blurry Frosted Glass Backdrop for Mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 md:hidden transition-opacity duration-300 animate-in fade-in" 
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Slide-over Drawer with Swipe-to-Dismiss */}
      <aside
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed md:relative z-50 h-full w-[285px] sm:w-64 max-w-[85vw] bg-surface/95 dark:bg-surface/90 backdrop-blur-2xl border-r border-border shadow-2xl md:shadow-none flex flex-col transition-transform duration-300 ease-out will-change-transform ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Header Inside Drawer */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-bg/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-text text-bg shadow-sm">
              <GraduationCap className="w-4 h-4 stroke-[1.8]" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-text block leading-none">
                KRC Institute
              </span>
              <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.2 rounded-full border ${badgeColor}`}>
                {roleTitle}
              </span>
            </div>
          </div>
          
          <button 
            onClick={closeMobile} 
            className="p-2 rounded-full text-muted hover:text-text hover:bg-bg border border-border touch-manipulation transition-colors"
            aria-label="Close Navigation"
          >
            <X className="w-4 h-4"/>
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-3 custom-scrollbar space-y-4">
          
          {/* Mobile Persona Card */}
          <div className="md:hidden p-3 rounded-xl bg-bg border border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <DefaultAvatar 
                src={user?.photoURL} 
                user={user} 
                className="w-8 h-8 rounded-full shrink-0" 
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-text truncate">{user?.displayName || 'Academic User'}</p>
                <p className="text-[10px] text-muted truncate">{user?.email}</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Online" />
          </div>

          <div>
            <div className="mb-2 px-3 text-[11px] font-bold text-muted uppercase tracking-wider flex items-center justify-between">
              <span>Workspace Navigation</span>
              <span className="text-[10px] font-mono text-muted/80">{links.length} Pages</span>
            </div>

            <nav className="space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={closeMobile}
                    className={({ isActive }) => 
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all touch-manipulation min-h-[44px] ${
                        isActive 
                          ? 'bg-text text-bg font-bold shadow-sm' 
                          : 'text-muted hover:bg-bg hover:text-text active:scale-[0.98]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 shrink-0 stroke-[1.8] ${isActive ? 'text-bg' : 'text-muted'}`} />
                          <span>{link.label}</span>
                        </div>
                        {isActive && (
                          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-bg/80" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Student In-Campus Messenger (Positioned directly above Events button) */}
        {role === 'student' && (
          <div className="px-3 pt-2.5 pb-1 border-t border-border bg-gradient-to-t from-surface to-bg/20 shrink-0">
            <div className="mb-1 px-1 text-[11px] font-bold text-muted uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Student Hub</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                Encrypted
              </span>
            </div>
            <StudentChatButton 
              onClick={() => {
                closeMobile();
                window.dispatchEvent(new CustomEvent('krc_toggle_chat_window'));
              }}
            />
          </div>
        )}

        {/* Campus Pulse - Live Events in College Campus (Repositioned to bottom of sidebar) */}
        <div className="p-3 border-t border-border bg-gradient-to-t from-surface to-bg/30 shrink-0">
          <div className="mb-1.5 px-1 text-[11px] font-bold text-muted uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Campus Pulse</span>
            </span>
            <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
              Live Portal
            </span>
          </div>
          <LiveEventsButton variant="sidebar" onClick={closeMobile} />
        </div>

        {/* Drawer Bottom Controls for Mobile (Theme & Sign Out) */}
        <div className="p-3 border-t border-border bg-bg/50 space-y-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium text-muted">Theme</span>
            <button 
              onClick={(e) => toggleTheme(e)}
              className="px-2.5 py-1 rounded-lg border border-border bg-surface text-text hover:bg-bg transition text-xs font-semibold flex items-center gap-1.5 touch-manipulation overflow-hidden"
              title={`Switch to ${darkMode ? 'Light' : 'Dark'} mode`}
            >
              {darkMode ? (
                <Sun className="w-3.5 h-3.5 text-amber-500 transition-transform duration-150" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-blue-500 transition-transform duration-150" />
              )}
              <span>{darkMode ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full px-3 py-2 rounded-lg border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors text-xs font-bold flex items-center justify-center gap-2 touch-manipulation min-h-[40px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Workspace</span>
          </button>
        </div>
      </aside>
    </>
  );
}
