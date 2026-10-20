/**
 * @fileoverview STUDENT Fees Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { Download, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentAcademicData } from '../../hooks/useStudentAcademicData';
import { academicHighlights, recordDateLabel } from '../../utils/academicRecords';
import { downloadReceipt } from '../../utils/receiptGenerator';

export default function StudentFees() {
  const {user}=useAuth();
  const records=useStudentAcademicData(user?.uid,['profile','fees','feeSummary']);
  const profile=records.data.profile;
  const summary=academicHighlights({feeSummary:records.data.feeSummary});
  const money=value=>typeof value==='number' && Number.isFinite(value) ? `₹${value.toLocaleString('en-IN')}` : 'Not published';
  return <div className="max-w-7xl mx-auto space-y-6">
    <div className="flex flex-col sm:flex-row justify-between gap-4">
      <div><h1 className="text-2xl font-bold text-text">Fee Status &amp; Payments</h1><p className="text-sm text-muted mt-1">Your recorded fee summary and receipts.</p></div>
      <button disabled className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm opacity-60"><CreditCard className="w-4 h-4"/>Online payments unavailable</button>
    </div>
    <p role="status" className="text-sm text-muted">Online payment processing is not connected. Contact the accounts office for payment instructions. Opening this page does not confirm payment or fee clearance.</p>
    {records.error && <p role="alert" className="text-sm text-red-500">{records.error} <button onClick={records.retry}>Retry</button></p>}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[['Annual Tuition',summary.annualTuition],['Total Paid to Date',summary.totalPaid],['Current Due Amount',summary.due]].map(([label,value])=><div key={label} className="bg-surface p-5 rounded-xl border border-border"><p className="text-xs font-semibold text-muted uppercase mb-1">{label}</p><h3 className="text-2xl font-bold text-text">{money(value)}</h3></div>)}</div>
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <h2 className="p-4 border-b border-border font-bold text-text">Recorded Payment Receipts</h2>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-bg text-xs text-muted uppercase"><tr>{['Receipt No','Date','Amount','Payment Mode','Recorded Status','Action'].map(label=><th key={label} className="px-4 py-3">{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-border text-text">{records.data.fees.length ? records.data.fees.map(item=><tr key={item.receiptId || item.receiptNo}>
          <td className="px-4 py-3 font-mono text-xs">{item.receiptNo || item.receiptId}</td><td className="px-4 py-3">{item.dateStr || recordDateLabel(item)}</td><td className="px-4 py-3">{money(item.amount)}</td><td className="px-4 py-3">{item.mode || 'Not recorded'}</td><td className="px-4 py-3">{item.status || 'Not recorded'}</td>
          <td className="px-4 py-3"><button onClick={()=>downloadReceipt({...item,receiptNo:item.receiptNo || item.receiptId,dept:profile?.dept || user?.dept || '',sem:profile?.sem || user?.sem || '',stuName:item.stuName || profile?.name || user?.displayName || user?.name || ''})} className="inline-flex items-center gap-1 px-3 py-1 border border-border rounded text-xs"><Download className="w-3 h-3"/>PDF Receipt</button></td>
        </tr>) : <tr><td colSpan={6} role="status" className="p-8 text-center text-muted">{records.loading?'Loading receipts…':'No fee payment receipts recorded for your account.'}</td></tr>}</tbody>
      </table></div>
    </div>
  </div>;
}
