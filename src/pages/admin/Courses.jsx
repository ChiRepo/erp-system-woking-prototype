/**
 * @fileoverview ADMIN Courses Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState, useEffect } from 'react';
import { BookOpen, Users, Clock, Award } from 'lucide-react';
import { demoCourses } from '../../data/demoData';
import { firestoreService } from '../../services/firestoreService';

export default function Courses() {
  const [courses, setCourses] = useState(demoCourses);
  const [selectedDept, setSelectedDept] = useState('ALL');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const live = await firestoreService.getCourses();
        if (live && live.length > 0) {
          setCourses(live);
        }
      } catch (e) {
        console.warn("[Firestore] Courses fetch notice:", e.message);
      }
    };
    fetchCourses();
  }, []);

  const filtered = selectedDept === 'ALL' 
    ? courses 
    : courses.filter(c => c.dept === selectedDept);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Curriculum & Syllabi</h1>
        <p className="text-muted text-sm mt-1">Accredited degree programs, semester curricula, and credit allocations.</p>
      </div>

      <div className="flex gap-2">
        {['ALL', 'CSE', 'ECE', 'MECH', 'MBA'].map(d => (
          <button
            key={d}
            onClick={() => setSelectedDept(d)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition ${
              selectedDept === d 
                ? 'bg-text text-bg border-text' 
                : 'bg-surface text-muted border-border hover:text-text'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((course) => (
          <div key={course.code} className="bg-surface border border-border rounded-lg p-5 space-y-4 hover:border-text/40 transition">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-xs font-bold text-text px-2 py-0.5 bg-bg rounded border border-border">
                  {course.code}
                </span>
                <h3 className="font-bold text-text text-base mt-2.5 leading-snug">{course.name}</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-border/50 text-text">
                {course.credits} Credits
              </span>
            </div>

            <div className="pt-2 border-t border-border space-y-2 text-xs text-muted">
              <div className="flex justify-between">
                <span>Faculty:</span>
                <span className="text-text font-medium">{course.faculty}</span>
              </div>
              <div className="flex justify-between">
                <span>Classroom:</span>
                <span className="text-text font-medium">{course.room}</span>
              </div>
              <div className="flex justify-between">
                <span>Enrolled:</span>
                <span className="text-text font-medium">{course.studentsCount} Students</span>
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
