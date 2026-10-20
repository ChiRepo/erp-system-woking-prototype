import { Suspense } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import PageLoader from '../common/PageLoader';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';
import PageTransition from './PageTransition';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * PublicLayout Component
 * Keeps PublicNavbar and PublicFooter persistent across all university public pages.
 * Only the main outlet page content animates on route switch, eliminating navbar flickering,
 * ghosting, and content disappearing/reappearing artifacts.
 */
export default function PublicLayout() {
  const { user, role } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-bg text-text selection:bg-text selection:text-bg">
      {/* Top Banner for Unregistered Google Sign-In Users */}
      {user && role === 'guest' && (
        <div className="bg-surface border-b border-border py-2.5 px-4 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-text">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Signed in as <strong className="font-semibold">{user.displayName || user.email}</strong> · Unregistered Account (Pending Admin Enrollment)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted">
                Contact Admin to enroll as Student or Faculty
              </span>
              <span className="text-muted">·</span>
              <Link 
                to="/admissions" 
                className="underline font-semibold hover:text-text cursor-pointer transition-colors"
              >
                Apply for Admission
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Navbar across all public pages */}
      <PublicNavbar />

      {/* Fluid Page Transition Container for Outlets */}
      <main className="flex-1 w-full relative">
        <PageTransition key={location.pathname}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </PageTransition>
      </main>

      {/* Persistent Footer */}
      <PublicFooter />
    </div>
  );
}
