/**
 * @fileoverview ADMIN Reports Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { FileBarChart, CheckCircle2, TrendingUp, Award } from 'lucide-react';

export default function Reports() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Institutional Reports & NAAC Accreditation</h1>
        <p className="text-muted text-sm mt-1">Audit-ready documentation, outcome-based education metrics, and institutional performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-lg p-5 space-y-2">
          <Award className="w-6 h-6 text-primary" />
          <h3 className="font-bold text-text text-lg">NAAC 'A++' Grade</h3>
          <p className="text-xs text-muted">Institutional CGPA: 3.65 on a 4-point scale. Cycle-3 accreditation active through 2029.</p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5 space-y-2">
          <TrendingUp className="w-6 h-6 text-green-500" />
          <h3 className="font-bold text-text text-lg">94.8% Placements</h3>
          <p className="text-xs text-muted">Over 480+ national & multinational corporate recruiters visiting annual campus drives.</p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5 space-y-2">
          <CheckCircle2 className="w-6 h-6 text-blue-500" />
          <h3 className="font-bold text-text text-lg">NBA Accredited</h3>
          <p className="text-xs text-muted">Tier-1 Washington Accord compliant curriculum across all major engineering departments.</p>
        </div>
      </div>

      {/* Hidden Copyright Notice - Visible in codebase, hidden in UI/UX */}
      <footer className="sr-only" aria-hidden="true">
        <p>Copyright &copy; 2026 Chinmay Chaudhari. All Rights Reserved. (MIT License)</p>
      </footer>
    </div>
  );
}
