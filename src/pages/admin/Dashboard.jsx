/**
 * @fileoverview ADMIN Dashboard Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState, useEffect } from 'react';
import { 
  Users, UserSquare2, IndianRupee, CalendarCheck2, 
  Radio, Play, Clock, MapPin, CheckCircle2 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { demoFaculty, demoFees } from '../../data/demoData';
import { timetableService } from '../../services/timetableService';
import { firestoreService } from '../../services/firestoreService';
import { sanitizeEnrollmentRoster } from '../../utils/enrollmentCache.js';

const enrollmentTrend = [
  { name: 'Jan', students: 4000 },
  { name: 'Feb', students: 4200 },
  { name: 'Mar', students: 4350 },
  { name: 'Apr', students: 4500 },
  { name: 'May', students: 4700 },
  { name: 'Jun', students: 4820 },
];

export default function Dashboard() {
  const [now, setNow] = useState(new Date());
  const [students, setStudents] = useState(() => {
    try {
      const saved = localStorage.getItem('krc_students');
      return sanitizeEnrollmentRoster(saved ? JSON.parse(saved) : []);
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const live = sanitizeEnrollmentRoster(await firestoreService.getStudents({administrative:true}));
        if (live && live.length > 0) {
          setStudents(live);
          localStorage.setItem('krc_students', JSON.stringify(live));
        }
      } catch (e) {}
    };
    fetchStudents();

    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('krc_students');
        if (saved) setStudents(sanitizeEnrollmentRoster(JSON.parse(saved)));
      } catch (e) {}
    };

    window.addEventListener('krc_students_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('krc_students_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const avgAttendance = students.length > 0
    ? (students.reduce((acc, s) => acc + (Number(s.attendance) || 92), 0) / students.length).toFixed(1) + '%'
    : '92.6%';

  const { liveLectures } = timetableService.getAllCampusOngoingLectures(now);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Admin Central Dashboard</h1>
          <p className="text-muted text-sm mt-1">
            Campus operations, ongoing live lectures monitor, and institutional analytics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Campus System Operational
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Total Students</p>
            <h3 className="text-2xl font-bold text-text">{students.length}</h3>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-primary">
            <Users className="w-5 h-5" />
          </div>
        </div>
        
        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Total Faculty</p>
            <h3 className="text-2xl font-bold text-text">{demoFaculty.length * 8}</h3>
          </div>
          <div className="p-2.5 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-500">
            <UserSquare2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Fee Collection</p>
            <h3 className="text-2xl font-bold text-text">₹{(demoFees.reduce((acc, f) => acc + f.amount, 0) / 100000).toFixed(2)}L</h3>
          </div>
          <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-500">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Avg Attendance</p>
            <h3 className="text-2xl font-bold text-text">{avgAttendance}</h3>
          </div>
          <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-500">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Campus-Wide Live Lecture Monitor Widget */}
      <div className="bg-surface p-5 sm:p-6 rounded-xl sm:rounded-2xl border border-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <h3 className="text-base font-bold text-text">Campus Class Schedule</h3>
          </div>
          <span className="font-mono text-xs text-muted">
            Current time: {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liveLectures.length === 0 && (
            <p className="text-sm text-muted md:col-span-2 py-4" role="status">
              No classes are scheduled at this time.
            </p>
          )}
          {liveLectures.map((lec, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-bg border border-border space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-text">{lec.courseCode}: {lec.courseName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted mt-1 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-500" /> {lec.room}</span>
                    <span>•</span>
                    <span>Prof: {lec.facultyName}</span>
                    <span>•</span>
                    <span>{lec.sem}</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> LIVE
                </span>
              </div>

              {/* Live Playback Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-muted">
                  <span className="flex items-center gap-1">
                    <Play className="w-2.5 h-2.5 fill-current text-emerald-500" />
                    {lec.playbackFormatted}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{lec.progressPercent}%</span>
                </div>
                <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${lec.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Charts & Recent Admissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface p-6 rounded-xl sm:rounded-2xl border border-border shadow-sm space-y-4">
          <h3 className="text-base font-bold text-text">Enrollment &amp; Retention Trends</h3>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={enrollmentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.3} vertical={false} />
                <XAxis dataKey="name" stroke="currentColor" className="text-muted" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="currentColor" className="text-muted" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="students" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-xl sm:rounded-2xl border border-border shadow-sm space-y-4">
          <h3 className="text-base font-bold text-text">Recent Verified Registrations</h3>
          <div className="space-y-3">
            {students.length > 0 ? (
              students.slice(0, 5).map((student, i) => (
                <div key={student.prn || i} className="flex items-center gap-3 p-1">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 border border-primary/20">
                    {student.name ? student.name.charAt(0) : 'S'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-text truncate">{student.name}</p>
                    <p className="text-[11px] text-muted truncate">{student.prn} • {student.dept}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-muted">
                No registered students yet.
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Hidden Copyright Notice - Visible in codebase, hidden in UI/UX */}
      <footer className="sr-only" aria-hidden="true">
        <p>Copyright &copy; 2026 Chinmay Chaudhari. All Rights Reserved. (MIT License)</p>
      </footer>
    </div>
  );
}
