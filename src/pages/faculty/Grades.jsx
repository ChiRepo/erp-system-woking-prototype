/**
 * @fileoverview FACULTY Grades Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState, useEffect } from 'react';
import { Search, Save, Check, Award, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { timetableService } from '../../services/timetableService';
import { facultyScheduleId } from '../../utils/scheduleIdentity';
import { firestoreService } from '../../services/firestoreService';

export default function FacultyGrades() {
  const { user } = useAuth();
  const facultyId = facultyScheduleId(user);
  const assignedLectures = timetableService.getFacultyLectures(facultyId);
  const courses = [...new Map(assignedLectures.map(l => [l.courseCode, {code:l.courseCode, name:l.courseName}])).values()];
  const [courseChoice, setCourseChoice] = useState('');
  const selectedCourse = courses.some(c => c.code === courseChoice) ? courseChoice : courses[0]?.code || '';
  const [students, setStudents] = useState([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStudents([]); setSaved(false); setError('');
    if (!selectedCourse) { setLoading(false); return; }
    setLoading(true);
    let roster = [];
    try { roster = JSON.parse(localStorage.getItem('krc_students') || '[]'); } catch { /* No cached enrollment. */ }
    const cohort = timetableService.getFacultyLectures(facultyId).filter(l => l.courseCode === selectedCourse);
    const eligible = roster.filter(s => s.uid && cohort.some(l => l.dept === s.dept && l.sem === s.sem));
    Promise.all(eligible.map(async student => {
      const grades = await firestoreService.getStudentGrades(student.uid);
      const record = grades.find(g => (g.gradeId || g.code) === selectedCourse);
      return {...student, internal:record?.internal ?? '', midterm:record?.midterm ?? ''};
    })).then(rows => { if (!cancelled) setStudents(rows); })
      .catch(() => { if (!cancelled) setError('Grades could not be loaded.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [facultyId, selectedCourse]);

  const validScore = value => value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 30;
  const readyToSave = Boolean(selectedCourse && students.length && !loading && students.every(s => validScore(s.internal) && validScore(s.midterm)));
  const gradeFor = total => total >= 50 ? 'A+' : total >= 45 ? 'A' : total >= 40 ? 'B+' : 'B';
  const handleScoreChange = (prn, field, val) => {
    setStudents(prev => prev.map(s => s.prn === prn ? { ...s, [field]: val === '' ? '' : Number(val) } : s));
    setSaved(false);
  };
  const handleSaveGrades = async () => {
    if (!readyToSave || saving) return;
    setSaving(true); setSaved(false); setError('');
    try {
      const results = await Promise.all(students.map(s => firestoreService.saveStudentGrade(s.uid, selectedCourse, {
        code:selectedCourse, internal:Number(s.internal), midterm:Number(s.midterm),
        finalGrade:gradeFor(Number(s.internal)+Number(s.midterm)), studentName:s.name, prn:s.prn
      })));
      if (results.some(result => result !== true)) throw new Error('Some grades were not saved. Retry to finish saving.');
      setSaved(true);
    } catch (err) { setError(err.message || 'Grades could not be saved.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Grades & Internal Assessment</h1>
          <p className="text-muted text-sm mt-1">Submit periodic internal assessment, quiz scores, and end-term grades.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSaveGrades}
            disabled={!readyToSave || saving}
            className="flex items-center gap-2 px-4 py-2 bg-text text-bg rounded-md text-sm font-medium hover:opacity-90 transition"
          >
            {saved ? <Check className="w-4 h-4 text-green-400" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : saved ? 'Scores Saved' : 'Save Grades'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-border pb-4 overflow-x-auto">
        {courses.map(c => (
          <button
            key={c.code}
            onClick={() => setCourseChoice(c.code)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
              selectedCourse === c.code 
                ? 'bg-text text-bg' 
                : 'bg-surface border border-border text-muted hover:text-text'
            }`}
          >
            {c.code}: {c.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg border-b border-border text-xs text-muted font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3">PRN</th>
                <th className="px-5 py-3 text-center">Internal (30)</th>
                <th className="px-5 py-3 text-center">Mid-Term (30)</th>
                <th className="px-5 py-3 text-center">Calculated Total</th>
                <th className="px-5 py-3 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text">
              {students.length > 0 ? (
                students.map((student) => {
                  const recorded = validScore(student.internal) && validScore(student.midterm);
                  const total = Number(student.internal) + Number(student.midterm);
                  return (
                    <tr key={student.prn} className="hover:bg-bg/50 transition">
                      <td className="px-5 py-3.5 font-medium">{student.name}</td>
                      <td className="px-5 py-3.5 text-muted font-mono text-xs">{student.prn}</td>
                      <td className="px-5 py-3.5 text-center">
                        <input 
                          type="number" 
                          max={30} 
                          min={0}
                          value={student.internal}
                          onChange={(e) => handleScoreChange(student.prn, 'internal', e.target.value)}
                          className="w-16 px-2 py-1 text-center bg-bg border border-border rounded text-sm text-text focus:outline-none focus:border-text font-semibold"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <input 
                          type="number" 
                          max={30} 
                          min={0}
                          value={student.midterm}
                          onChange={(e) => handleScoreChange(student.prn, 'midterm', e.target.value)}
                          className="w-16 px-2 py-1 text-center bg-bg border border-border rounded text-sm text-text focus:outline-none focus:border-text font-semibold"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-sm">
                        {recorded ? `${total} / 60` : 'Not recorded'}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                          {recorded ? gradeFor(total) : 'Not recorded'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted text-sm">
                    {loading ? 'Loading enrolled students…' : selectedCourse ? 'No enrolled students found for this assigned course.' : 'No courses assigned to your faculty account.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Copyright Notice - Visible in codebase, hidden in UI/UX */}
      <footer className="sr-only" aria-hidden="true">
        <p>Copyright &copy; 2026 Chinmay Chaudhari. All Rights Reserved. (MIT License)</p>
      </footer>
    </div>
  );
}
