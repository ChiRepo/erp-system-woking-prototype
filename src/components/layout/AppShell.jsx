import { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import PageTransition from './PageTransition';
import PageLoader from '../common/PageLoader';
import lazyWithRetry from '../../utils/lazyWithRetry';

// The messenger (chat room, E2EE, photo uploads) is only needed by students — load it on demand
const StudentChatContainer = lazyWithRetry(() => import('../chat/StudentChatContainer'));

export default function AppShell() {
  const { role } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleToggleChat = () => {
      setIsChatOpen(prev => !prev);
    };
    const handleCloseChat = () => {
      setIsChatOpen(false);
    };

    window.addEventListener('krc_toggle_chat_window', handleToggleChat);
    window.addEventListener('krc_close_chat_windows', handleCloseChat);

    return () => {
      window.removeEventListener('krc_toggle_chat_window', handleToggleChat);
      window.removeEventListener('krc_close_chat_windows', handleCloseChat);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen h-[100dvh] bg-bg text-text overflow-hidden">
      <Topbar openMobile={() => setIsMobileMenuOpen(true)} />

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <Sidebar 
          isMobileOpen={isMobileMenuOpen}
          closeMobile={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 lg:p-10 bg-bg relative custom-scrollbar">
          <PageTransition key={location.pathname}>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </PageTransition>
        </main>
      </div>

      {/* Student In-Campus Messenger Master Container */}
      {role === 'student' && (
        <Suspense fallback={null}>
          <StudentChatContainer
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
