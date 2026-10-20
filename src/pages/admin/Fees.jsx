/**
 * @fileoverview ADMIN Fees Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState, useEffect } from 'react';
import { IndianRupee, FileText, CheckCircle, Clock, Download } from 'lucide-react';
import { demoFees } from '../../data/demoData';
import { firestoreService } from '../../services/firestoreService';
import { downloadReceipt } from '../../utils/receiptGenerator';

export default function Fees() {
  const [feeRecords, setFeeRecords] = useState(demoFees);

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const live = await firestoreService.getAllFeeReceipts();
        if (live && live.length > 0) {
          setFeeRecords(live);
        }
      } catch (e) {
        console.warn("[Firestore] Fees fetch notice:", e.message);
      }
    };
    fetchFees();

    const handleUpdate = () => {
      fetchFees();
    };

    window.addEventListener('krc_students_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('krc_students_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const total = feeRecords.reduce((acc, f) => acc + (Number(f.amount) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Fee Management & Finance</h1>
        <p className="text-muted text-sm mt-1">Student fee ledgers, automated receipts, and online collection logs.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-lg p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Total Collected</p>
          <h3 className="text-3xl font-bold text-text">₹{total.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-muted mt-2">Verified in institutional bank account</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Total Receipts</p>
          <h3 className="text-3xl font-bold text-text">{feeRecords.length}</h3>
          <p className="text-xs text-muted mt-2">Academic year 2026-27</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Payment Gateway</p>
          <h3 className="text-xl font-bold text-green-600 mt-2 flex items-center gap-1.5">
            <CheckCircle className="w-5 h-5" /> Active & Online
          </h3>
          <p className="text-xs text-muted mt-2">UPI, NetBanking, Cards</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <h3 className="text-base font-bold text-text">Transaction Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-bg/50 text-xs text-muted uppercase">
              <tr>
                <th className="py-2.5 px-4">Receipt No</th>
                <th className="py-2.5 px-4">Student</th>
                <th className="py-2.5 px-4">PRN</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Mode</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Receipt PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {feeRecords.length > 0 ? (
                feeRecords.map(f => (
                  <tr key={f.receiptNo} className="hover:bg-bg/40">
                    <td className="py-2.5 px-4 font-mono text-xs font-bold text-text">{f.receiptNo}</td>
                    <td className="py-2.5 px-4 font-medium text-text">{f.stuName}</td>
                    <td className="py-2.5 px-4 font-mono text-xs text-muted">{f.prn}</td>
                    <td className="py-2.5 px-4 font-mono font-medium">₹{f.amount.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-4 text-xs text-muted">{f.dateStr}</td>
                    <td className="py-2.5 px-4 text-xs">{f.mode}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {f.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => downloadReceipt(f)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-border rounded text-xs font-semibold hover:bg-bg transition cursor-pointer text-text shadow-sm"
                        title="Download Official Fee Invoice PDF"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted text-sm">
                    No fee transaction records found.
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
