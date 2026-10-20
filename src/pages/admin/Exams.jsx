/**
 * @fileoverview ADMIN Exams Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { Calendar, FileCheck, Award, Clock } from 'lucide-react';
import { demoExams } from '../../data/demoData';

export default function Exams() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Examinations & Assessments</h1>
        <p className="text-muted text-sm mt-1">End-semester timetables, hall allocations, and question paper vault.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demoExams.map(ex => (
          <div key={ex.code} className="bg-surface border border-border rounded-lg p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-bg rounded border border-border">
                  {ex.code}
                </span>
                <h3 className="font-bold text-text text-base mt-2">{ex.name}</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-border/50 text-text">
                Max: {ex.totalMarks} Marks
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted pt-2 border-t border-border">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Date: {ex.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{ex.time}</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <Award className="w-3.5 h-3.5" />
                <span>Venue: {ex.hall}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hidden Copyright Notice - Visible in codebase, hidden in UI/UX */}
      <footer className="sr-only" aria-hidden="true">
        <p>Copyright &copy; 2026 Chinmay Chaudhari. All Rights Reserved. (MIT License)</p>
      </footer>
    </div>
  );
}
