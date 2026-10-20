/**
 * @fileoverview ADMIN Hostel Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { Home, Phone, Check, Shield } from 'lucide-react';
import { demoHostel } from '../../data/demoData';

export default function Hostel() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Campus Hostel Showcase</h1>
        <p className="text-muted text-sm mt-1">Residential living spaces, amenities, and hostel wardens for KRC IT students.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {demoHostel.map(h => (
          <div key={h.id} className="bg-surface border border-border rounded-lg p-6 space-y-4 hover:border-text/40 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-bg rounded border border-border">{h.id}</span>
                <span className="text-xs font-semibold text-green-600">{h.occupied}/{h.capacity} Beds Occupied</span>
              </div>
              <h3 className="font-bold text-text text-lg">{h.name}</h3>
              <p className="text-sm font-semibold text-text">{h.fee}</p>

              <div className="pt-2 border-t border-border space-y-1.5 text-xs text-muted">
                <p className="font-medium text-text">Amenities & Services:</p>
                {h.amenities.map((am, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span>{am}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border text-xs text-muted space-y-1">
              <p><span className="font-medium text-text">Warden:</span> {h.warden}</p>
              <p className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {h.phone}</p>
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
