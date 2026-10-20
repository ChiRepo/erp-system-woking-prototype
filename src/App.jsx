/**
 * @fileoverview App Root & Router Configuration
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import BootstrapSpinner from './components/ui/BootstrapSpinner';
import ScrollToTop from './components/common/ScrollToTop';
import PublicLayout from './components/layout/PublicLayout';

import { Suspense } from 'react';
import lazyWithRetry from './utils/lazyWithRetry';
import PageLoader from './components/common/PageLoader';

// The landing page is the first screen for most visitors, so it ships in the main bundle.
// Every other page is code-split and downloaded on first visit to its route.
import LandingPage from './pages/public/LandingPage';

// Logged-in portal chrome (top bar, sidebar, messenger) — not needed by public visitors
const AppShell = lazyWithRetry(() => import('./components/layout/AppShell'));

const Login = lazyWithRetry(() => import('./pages/auth/Login'));
const AboutPage = lazyWithRetry(() => import('./pages/public/AboutPage'));
const AcademicsPage = lazyWithRetry(() => import('./pages/public/AcademicsPage'));
const ResearchPage = lazyWithRetry(() => import('./pages/public/ResearchPage'));
const AdmissionsPage = lazyWithRetry(() => import('./pages/public/AdmissionsPage'));
const CampusLifePage = lazyWithRetry(() => import('./pages/public/CampusLifePage'));
const PlacementsPage = lazyWithRetry(() => import('./pages/public/PlacementsPage'));
const LiveEventsPage = lazyWithRetry(() => import('./pages/events/LiveEventsPage'));

// Admin Pages
const AdminDashboard = lazyWithRetry(() => import('./pages/admin/Dashboard'));
const Students = lazyWithRetry(() => import('./pages/admin/Students'));
const Faculty = lazyWithRetry(() => import('./pages/admin/Faculty'));
const Courses = lazyWithRetry(() => import('./pages/admin/Courses'));
const Attendance = lazyWithRetry(() => import('./pages/admin/Attendance'));
const Fees = lazyWithRetry(() => import('./pages/admin/Fees'));
const Exams = lazyWithRetry(() => import('./pages/admin/Exams'));
const Library = lazyWithRetry(() => import('./pages/admin/Library'));
const Hostel = lazyWithRetry(() => import('./pages/admin/Hostel'));
const Reports = lazyWithRetry(() => import('./pages/admin/Reports'));
const ChatModeration = lazyWithRetry(() => import('./pages/admin/ChatModeration'));

// Faculty Pages
const FacultyDashboard = lazyWithRetry(() => import('./pages/faculty/Dashboard'));
const FacultyClasses = lazyWithRetry(() => import('./pages/faculty/Classes'));
const FacultyAttendance = lazyWithRetry(() => import('./pages/faculty/Attendance'));
const FacultyGrades = lazyWithRetry(() => import('./pages/faculty/Grades'));

// Student Pages
const StudentDashboard = lazyWithRetry(() => import('./pages/student/Dashboard'));
const StudentTimetable = lazyWithRetry(() => import('./pages/student/Timetable'));
const StudentAttendance = lazyWithRetry(() => import('./pages/student/Attendance'));
const StudentMarks = lazyWithRetry(() => import('./pages/student/Marks'));
const StudentFees = lazyWithRetry(() => import('./pages/student/Fees'));
const StudentLibrary = lazyWithRetry(() => import('./pages/student/Library'));
const StudentChatPage = lazyWithRetry(() => import('./pages/student/StudentChatPage'));
const StudentProfilePage = lazyWithRetry(() => import('./pages/student/StudentProfilePage'));

const Settings = lazyWithRetry(() => import('./pages/Settings'));
import RoleGuard from './guards/RoleGuard';
import ErrorBoundary from './components/common/ErrorBoundary';
import CustomAlertModal from './components/common/CustomAlertModal';

// Dashboard preferences are presentation state, never authentication authority.
function RootRoute() {
  const { user, role } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const forceLanding = searchParams.get('landing') === 'true' || searchParams.get('public') === 'true' || searchParams.has('signout');

  if (!forceLanding && user && ['admin', 'faculty', 'student'].includes(role)) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  return <LandingPage />;
}

export default function App() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg text-text gap-4">
        <div className="relative flex items-center justify-center">
          <BootstrapSpinner type="border" size="lg" className="text-emerald-500" />
          <BootstrapSpinner type="grow" size="sm" className="text-text absolute" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted">
          <span>Loading KRC Institute of Technology Workspace...</span>
          <BootstrapSpinner type="grow" size="sm" variant="success" />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      title="Application Error"
      message="An unexpected system error occurred. Click below to return to your dashboard or reload the page."
    >
      <ScrollToTop />
      <Suspense fallback={<PageLoader fullScreen />}>
      <Routes>
        {/* Public University Website Layout (Persistent Navbar & Footer with Fluid Outlet Transitions) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<RootRoute />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/academics" element={<AcademicsPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/admissions" element={<AdmissionsPage />} />
          <Route path="/campus-life" element={<CampusLifePage />} />
          <Route path="/placements" element={<PlacementsPage />} />
        </Route>

        {/* Live Campus Events Portal (Opens in standalone festival window/tab) */}
        <Route path="/events" element={<LiveEventsPage />} />

        {/* Login Portal */}
        <Route 
          path="/login" 
          element={<Login />}
        />

        {/* Admin Portal (Guarded with AppShell PageTransition on Outlet) */}
        <Route path="/admin" element={<RoleGuard requiredRole="admin"><AppShell /></RoleGuard>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="faculty" element={<Faculty />} />
          <Route path="courses" element={<Courses />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="fees" element={<Fees />} />
          <Route path="exams" element={<Exams />} />
          <Route path="library" element={<Library />} />
          <Route path="hostel" element={<Hostel />} />
          <Route path="reports" element={<Reports />} />
          <Route path="chat-moderation" element={<ChatModeration />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Faculty Portal (Guarded with AppShell PageTransition on Outlet) */}
        <Route path="/faculty" element={<RoleGuard requiredRole="faculty"><AppShell /></RoleGuard>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<FacultyDashboard />} />
          <Route path="classes" element={<FacultyClasses />} />
          <Route path="attendance" element={<FacultyAttendance />} />
          <Route path="grades" element={<FacultyGrades />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Student Portal (Guarded with AppShell PageTransition on Outlet) */}
        <Route path="/student" element={<RoleGuard requiredRole="student"><AppShell /></RoleGuard>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="timetable" element={<StudentTimetable />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="marks" element={<StudentMarks />} />
          <Route path="fees" element={<StudentFees />} />
          <Route path="library" element={<StudentLibrary />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Dedicated Student Chatting & Social Platform Page (Student Only) */}
        <Route 
          path="/student/chat" 
          element={
            <RoleGuard requiredRole="student">
              <StudentChatPage />
            </RoleGuard>
          } 
        />

        {/* Global Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
      <CustomAlertModal />
    </ErrorBoundary>
  );
}
