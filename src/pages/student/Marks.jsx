/**
 * @fileoverview STUDENT Marks Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentAcademicData } from '../../hooks/useStudentAcademicData';
import { academicHighlights } from '../../utils/academicRecords';

export default function StudentMarks() {
  const {user}=useAuth();
  const records=useStudentAcademicData(user?.uid,['profile','grades','academicSummary']);
  const summary=academicHighlights({academicSummary:records.data.academicSummary});
  const semester=records.data.profile?.sem || user?.sem || 'Not assigned';
  const display=value=>value==null || value==='' ? 'Not published' : value;
  return <div className="max-w-7xl mx-auto space-y-6">
    <div className="flex flex-col sm:flex-row justify-between gap-4">
      <div><h1 className="text-2xl font-bold text-text">Academic Marks &amp; Transcripts</h1><p className="text-sm text-muted mt-1">Published assessments and academic summaries for your enrollment.</p></div>
      <button disabled={records.loading || !records.data.grades.length} onClick={()=>window.print()} className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm disabled:opacity-50"><Download className="w-4 h-4"/>Download Grade Card</button>
    </div>
    {records.error && <p role="alert" className="text-sm text-red-500">{records.error} <button onClick={records.retry}>Retry</button></p>}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[['Cumulative CGPA',summary.cgpa],['Total Credits Earned',summary.earnedCredits],['Academic Status',summary.academicStatus]].map(([label,value])=><div key={label} className="bg-surface p-5 rounded-xl border border-border"><p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">{label}</p><h3 className="text-2xl font-bold text-text">{display(value)}</h3></div>)}
    </div>
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex flex-wrap justify-between gap-2"><h2 className="text-base font-bold text-text">Course Grade Breakdown — {semester}</h2><span className="text-xs text-muted">Semester SGPA: {display(summary.sgpa)}</span></div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-bg text-xs text-muted uppercase"><tr>{['Course Code','Course Title','Credits','Internal (30)','Mid (30)','End (40)','Total (100)','Grade'].map(label=><th key={label} className="px-4 py-3">{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-border text-text">{records.data.grades.length ? records.data.grades.map(course=><tr key={course.gradeId || course.code}>{[course.code || course.gradeId,course.name || course.courseName,course.credits,course.internal,course.mid ?? course.midterm,course.endSem,course.total,course.grade || course.finalGrade].map((value,index)=><td key={index} className="px-4 py-3">{display(value)}</td>)}</tr>) : <tr><td colSpan={8} className="p-8 text-center text-muted" role="status">{records.loading?'Loading published grades…':'No grades have been published for your account.'}</td></tr>}</tbody>
      </table></div>
    </div>
  </div>;
}
