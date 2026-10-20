import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, Search, Moon, Sun, GraduationCap, Settings, LogOut, Key, User } from 'lucide-react';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { credentialService } from '../../services/credentialService';
import LiveClock from '../common/LiveClock';
import DefaultAvatar from '../common/DefaultAvatar';
import LiveEventsButton from '../events/LiveEventsButton';

export default function Topbar({ openMobile }) {
  const { darkMode, toggleTheme } = useTheme();
  const { user, role, signOut } = useAuth();
  const isStarting = credentialService.isStartingPassword(user?.email);

  const getInitials = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.replace('/?signout=' + Date.now());
  };

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-3 sm:px-4 lg:px-6 shrink-0 z-30">
      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={openMobile} 
          className="md:hidden p-2 -ml-1 rounded-md text-muted hover:bg-bg transition-colors border border-transparent dark:border-white/10 touch-manipulation"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <Link 
          to="/" 
          className="flex items-center gap-2 text-text font-semibold text-xs sm:text-sm tracking-tight hover:opacity-80 transition-all cursor-pointer"
          title="Return to KRC Institute of Technology Home"
        >
          <div className="p-1 rounded bg-text text-bg shrink-0">
            <GraduationCap className="w-4 h-4 stroke-[1.8]" />
          </div>
          <span className="whitespace-nowrap">KRC IT</span>
          <span className="text-muted font-normal ml-1 hidden sm:inline-block">/ {role?.charAt(0).toUpperCase() + role?.slice(1)} Workspace</span>
        </Link>
      </div>

      {/* Global Live Clock: Real-Time, Day/Date, Month/Year */}
      <div className="hidden sm:flex items-center">
        <LiveClock className="scale-95 sm:scale-100" />
      </div>

      <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
        <div className="hidden md:flex items-center relative text-sm">
          <Search className="w-4 h-4 text-muted absolute left-2.5" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-8 pr-3 py-1.5 bg-bg border border-border rounded-md focus:outline-none focus:border-text text-text placeholder-muted w-64 transition-colors"
          />
        </div>

        <div className="h-4 w-px bg-border hidden sm:block"></div>

        {/* Live Campus Events Quick Link (Desktop Only - Removed from Mobile Header) */}
        <div className="hidden md:flex items-center">
          <LiveEventsButton variant="topbar" />
        </div>

        <button 
          onClick={(e) => toggleTheme(e)}
          className="p-1.5 sm:p-2 rounded-lg text-muted hover:text-text hover:bg-bg transition-all border border-border/60 hover:border-border active:scale-95 touch-manipulation cursor-pointer flex items-center justify-center overflow-hidden"
          title={`Switch to ${darkMode ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle Theme"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-500 transition-transform duration-150" />
          ) : (
            <Moon className="w-4 h-4 text-blue-500 transition-transform duration-150" />
          )}
        </button>

        {/* Profile Button - Prominently Accessible on Mobile & Desktop in Navbar Top-Right */}
        <HeadlessMenu as="div" className="relative text-sm">
          <HeadlessMenu.Button 
            className="flex items-center gap-1.5 p-0.5 sm:p-1 rounded-full hover:bg-bg transition-all focus:outline-none cursor-pointer ring-1 ring-border/80 hover:ring-emerald-500/50"
            aria-label="User Profile & Settings Menu"
            title={user?.displayName || 'My Profile'}
          >
            <DefaultAvatar
              src={user?.photoURL}
              user={user}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-xs"
            />
          </HeadlessMenu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <HeadlessMenu.Items className="absolute right-0 mt-2 w-60 bg-surface rounded-xl border border-border focus:outline-none overflow-hidden shadow-lg py-1 z-50">
              <div className="px-3.5 py-3 border-b border-border mb-1 flex items-center gap-2.5">
                <DefaultAvatar
                  src={user?.photoURL}
                  user={user}
                  className="w-9 h-9 rounded-full shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-text truncate">{user?.displayName || 'User'}</p>
                  <p className="text-[10px] text-muted truncate">{user?.email}</p>
                </div>
              </div>
              
              {role === 'student' && (
                <HeadlessMenu.Item>
                  {({ active }) => (
                    <Link
                      to="/student/profile"
                      className={`${active ? 'bg-bg' : ''} flex items-center gap-2 w-full text-left px-3 py-1.5 text-text`}
                    >
                      <User className="w-4 h-4 text-emerald-500" />
                      <span>My Profile</span>
                    </Link>
                  )}
                </HeadlessMenu.Item>
              )}

              <HeadlessMenu.Item>
                {({ active }) => (
                  <Link
                    to={`/${role}/settings`}
                    className={`${active ? 'bg-bg' : ''} flex items-center gap-2 w-full text-left px-3 py-1.5 text-text`}
                  >
                    <Settings className="w-4 h-4 text-muted" />
                    Profile Settings
                  </Link>
                )}
              </HeadlessMenu.Item>

              <HeadlessMenu.Item>
                {({ active }) => (
                  <Link
                    to={`/${role}/settings`}
                    className={`${active ? 'bg-bg' : ''} flex items-center justify-between w-full text-left px-3 py-1.5 text-text`}
                  >
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-muted" />
                      <span>Security & Password</span>
                    </div>
                    {isStarting && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Starting password active" />
                    )}
                  </Link>
                )}
              </HeadlessMenu.Item>
              
              <div className="my-1 border-t border-border"></div>

              <HeadlessMenu.Item>
                {({ active }) => (
                  <button
                    onClick={handleSignOut}
                    className={`${active ? 'bg-bg text-red-600 dark:text-red-400' : 'text-text'} flex items-center gap-2 w-full text-left px-3 py-1.5 transition-colors`}
                  >
                    <LogOut className="w-4 h-4 text-muted" />
                    Log out
                  </button>
                )}
              </HeadlessMenu.Item>
            </HeadlessMenu.Items>
          </Transition>
        </HeadlessMenu>
      </div>
    </header>
  );
}
