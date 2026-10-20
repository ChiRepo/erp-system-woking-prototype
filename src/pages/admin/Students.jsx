/**
 * @fileoverview ADMIN Students Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Download, GraduationCap, X, Key, 
  Eye, EyeOff, RefreshCw, CheckCircle2, MessageSquare, 
  ShieldCheck, Mail, Loader2, AlertCircle, Check, Trash2 
} from 'lucide-react';
import { credentialService } from '../../services/credentialService';
import { firestoreService } from '../../services/firestoreService';
import { securityVault } from '../../services/securityVault';
import { studentChatService } from '../../services/studentChatService';
import { studentAuthProvisioningService, validateGoogleEnrollmentEmail } from '../../services/studentAuthProvisioningService';
import { studentFolderService } from '../../services/studentFolderService';
import { showCampusAlert } from '../../components/common/CustomAlertModal';
import { provisionAuthUser } from '../../firebase';
import { createEnrollmentId, normalizeFullName } from '../../utils/enrollmentIdentity';
import { sanitizeEnrollmentRoster } from '../../utils/enrollmentCache';
import { studentAccessRepository } from '../../services/studentAccessRepository.js';

export default function Students() {
  const [students, setStudents] = useState(() => {
    try {
      return sanitizeEnrollmentRoster(JSON.parse(localStorage.getItem('krc_students') || '[]'));
    } catch { return []; }
  });
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ 
    name: '', 
    email: '', 
    dept: 'CSE', 
    sem: 'Sem I', 
    attendance: null, 
    cgpa: null, 
    fee: 'Not assessed', 
    allowChatting: true,
    enableGoogleAuth: false,
    googleEmail: ''
  });
  const [startingPassword, setStartingPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [addedNotice, setAddedNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const pendingAccount = useRef(null);
  const pendingAccess = useRef(null);
  const [savingAccessUid, setSavingAccessUid] = useState(null);
  const [accessError, setAccessError] = useState('');
  const [accessNotice, setAccessNotice] = useState('');
  const [directoryStatus,setDirectoryStatus]=useState({loading:true,error:'',count:0});

  const [googleModal, setGoogleModal] = useState({ isOpen: false, student: null, googleEmail: '', loading: false, error: '' });
  const pendingGoogle = useRef(false);

  useEffect(() => firestoreService.subscribeStudents((live, status) => {
    setDirectoryStatus({loading:Boolean(status?.loading),error:status?.error || '',count:live.length});
    if (status?.loading || status?.error) return;
    const safeRoster = sanitizeEnrollmentRoster(live);
    setStudents(safeRoster);
    localStorage.setItem('krc_students', JSON.stringify(safeRoster));
  }, {administrative:true}), []);

  const handleDeleteStudent = (student) => {
    showCampusAlert({
      title: 'Delete Student Record?',
      message: `Are you sure you want to permanently delete ${student.name} (${student.prn})? This will revoke all campus access and delete all user records from the database.`,
      type: 'warning',
      confirmText: 'Delete Permanently',
      showCancel: true,
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const studentUid = student.uid || student.prn;
          const studentPrn = student.prn;
          const studentEmail = student.email;
          const googleEmail = student.googleEmail;

          // 1. Remove from local state
          const updated = sanitizeEnrollmentRoster(students.filter(s => s.prn !== studentPrn && s.uid !== studentUid));
          setStudents(updated);
          localStorage.setItem('krc_students', JSON.stringify(updated));

          // 2. Remove dedicated student folder, subcollections, and profile
          await studentFolderService.deleteStudentFolder(studentUid, studentPrn, studentEmail, googleEmail);

          showCampusAlert({
            title: 'Student Deleted',
            message: `${student.name} (${student.prn}) and all dedicated folder records have been permanently deleted from the database.`,
            type: 'success'
          });
        } catch (err) {
          showCampusAlert({
            title: 'Deletion Failed',
            message: err.message || 'Could not delete student record.',
            type: 'error'
          });
        }
      }
    });
  };

  const filtered = (students || []).filter(s => {
    if (!s) return false;
    const q = String(query || '').toLowerCase().trim();
    const name = String(s.name || s.displayName || '').toLowerCase();
    const prn = String(s.prn || '').toLowerCase();
    const email = String(s.email || '').toLowerCase();
    const matchesQuery = !q || name.includes(q) || prn.includes(q) || email.includes(q);
    const matchesDept = deptFilter === 'ALL' || s.dept === deptFilter;
    return matchesQuery && matchesDept;
  });

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaveError('');
    const fullName = normalizeFullName(newStudent.name);
    if (!fullName) { setSaveError('Enter the student’s full name.'); return; }

    let googleEmail = '';
    try {
      if (newStudent.enableGoogleAuth) googleEmail = validateGoogleEnrollmentEmail(newStudent.googleEmail || newStudent.email);
    } catch (error) { setSaveError(error.message); return; }

    const prn = createEnrollmentId();
    
    setSaving(true);
    try {
      const email = newStudent.email.trim().toLowerCase();
      const previous = pendingAccount.current;
      const authUid = previous?.email === email ? previous.uid : await provisionAuthUser(email, startingPassword, fullName);
      const assignedPrn = previous?.email === email ? previous.prn : prn;
      pendingAccount.current = previous?.email === email ? previous : { email, uid: authUid, prn: assignedPrn };
      const allowChatting = newStudent.allowChatting !== false;
      const studentWithCred = {
        ...newStudent, googleEmail: '', email, name: fullName, displayName: fullName, fullName,
        prn: assignedPrn, uid: authUid, startingPassword, role: 'student', allowChatting,
        chatAccessKey: allowChatting ? securityVault.generateStudentChatPass(authUid) : null,
        authProviders: ['password'],
        ...(previous?.email === email && previous.provisioned ? previous.profile : {})
      };
      if (!previous?.provisioned || previous.email !== email) {
        await studentFolderService.provisionStudentFolder({ ...studentWithCred, googleEmail: '' });
        pendingAccount.current.provisioned = true;
        pendingAccount.current.profile = studentWithCred;
      }
      if (googleEmail) {
        const linked = await studentAuthProvisioningService.enrollGoogleAccount({ student: studentWithCred, googleEmail });
        Object.assign(studentWithCred, linked);
      }
      pendingAccount.current = null;
      const updated = sanitizeEnrollmentRoster([studentWithCred, ...students.filter(s => s.uid !== authUid)]);
      setStudents(updated);
      localStorage.setItem('krc_students', JSON.stringify(updated));
      setAddedNotice({
        name: fullName,
        email,
        prn: assignedPrn,
        password: startingPassword,
        allowChatting,
        googleEmail: googleEmail || undefined
      });

      setShowAddModal(false);
      setNewStudent({ 
        name: '', 
        email: '', 
        dept: 'CSE', 
        sem: 'Sem I', 
        attendance: null, 
        cgpa: null, 
        fee: 'Not assessed', 
        allowChatting: true,
        enableGoogleAuth: false,
        googleEmail: ''
      });
      setStartingPassword(credentialService.generateRandomPassword('Student'));
    } catch (error) {
      setSaveError(error.code === 'auth/email-already-in-use'
        ? 'That email already has a login. Use its existing enrollment or a different institutional email.'
        : (pendingAccount.current?.provisioned ? 'Student account saved; Google enrollment is incomplete. Retry to finish without recreating the account. ' : 'Student registration was not completed. ') + (error.message || 'Please retry.'));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenLinkGoogle = student => setGoogleModal({ isOpen: true, student, googleEmail: student.googleEmail || student.email || '', loading: false, error: '' });

  const handleEnrollGoogle = async event => {
    event.preventDefault();
    if (pendingGoogle.current) return;
    pendingGoogle.current = true;
    setGoogleModal(previous => ({ ...previous, loading: true, error: '' }));
    try {
      const updated = await studentAuthProvisioningService.enrollGoogleAccount({ student: googleModal.student, googleEmail: googleModal.googleEmail });
      setAddedNotice({ name: updated.name, email: updated.email, prn: updated.prn, googleEmail: updated.googleEmail, isDualAuth: true });
      setGoogleModal(previous => ({ ...previous, isOpen: false, loading: false }));
      window.dispatchEvent(new CustomEvent('krc_student_auth_updated', { detail: { uid: updated.uid } }));
    } catch (error) {
      setGoogleModal(previous => ({ ...previous, loading: false, error: error.message || 'Google enrollment could not be saved.' }));
    } finally { pendingGoogle.current = false; }
  };

  const toggleChatAccess = async student => {
    if (pendingAccess.current) return;
    pendingAccess.current = student.uid;
    setSavingAccessUid(student.uid);
    setAccessError('');
    setAccessNotice('');
    try {
      const result = await studentAccessRepository.setChatAccess(student, student.allowChatting === false);
      // The directory subscription publishes the committed enrollment; never replace it with a draft.
      studentChatService.clearClearanceCache();
      window.dispatchEvent(new CustomEvent('krc_clearance_updated', { detail: { ...result, prn: student.prn, email: student.email } }));
      setAccessNotice(`Chat access ${result.allowChatting ? 'allowed' : 'blocked'} for ${student.name}.`);
    } catch (error) {
      setAccessError(error.code === 'permission-denied'
        ? 'Chat access was not saved. Check your administrator session and try again.'
        : error.message || 'Chat access was not saved. Please try again.');
    } finally {
      pendingAccess.current = null;
      setSavingAccessUid(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Student Directory</h1>
          <p className="text-muted text-sm mt-1">Manage enrolled students, enrollment IDs, and academic status.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-text text-bg rounded-md text-sm font-medium hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {accessError && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-300">{accessError}</p>}
      {directoryStatus.error?<p role="alert" className="text-sm text-rose-600">{directoryStatus.error}</p>:<p role="status" aria-label="Campus directory status" className="text-sm text-muted">{directoryStatus.loading?'Updating campus peer directory…':`Campus peer directory synchronized: ${directoryStatus.count} enrolled student(s).`}</p>}
      {(savingAccessUid || accessNotice) && <p role="status" aria-label="Chat access status" className="text-sm text-muted">{savingAccessUid ? 'Saving chat access…' : accessNotice}</p>}

      {/* Starting Password Registration Notification */}
      {addedNotice && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs space-y-1 animate-in fade-in flex items-start justify-between">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-text">
                {addedNotice.isDualAuth ? "Google Sign-In Enrollment Saved" : "Student Successfully Enrolled!"}
              </p>
              <p className="text-muted">
                <strong>{addedNotice.name}</strong> ({addedNotice.prn}) registered with institutional email <span className="font-mono text-text">{addedNotice.email}</span>
                {addedNotice.googleEmail && (
                  <> and enrolled Google account <span className="font-mono text-text">{addedNotice.googleEmail}</span></>
                )}.
              </p>
              {addedNotice.message && (
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 font-medium">
                  {addedNotice.message}
                </p>
              )}
              {addedNotice.password && (
                <div className="mt-2 inline-flex items-center gap-2 p-2 bg-bg rounded-lg border border-border">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-mono font-bold text-text">Starting Password: {addedNotice.password}</span>
                  <span className="text-[10px] text-muted">(Student can sign in with this or via Google)</span>
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setAddedNotice(null)} className="text-muted hover:text-text p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search by name, PRN, or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-md text-sm text-text placeholder-muted focus:outline-none focus:border-text transition"
          />
        </div>
        <div className="flex items-center gap-2">
          {['ALL', 'CSE', 'ECE', 'MECH', 'CIVIL', 'MBA'].map(dept => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition ${
                deptFilter === dept 
                  ? 'bg-text text-bg border-text' 
                  : 'bg-surface text-muted border-border hover:text-text'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-bg/50 text-xs text-muted uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">PRN</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Semester</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">CGPA</th>
                <th className="py-3 px-4">Fee Status</th>
                <th className="py-3 px-4">Sign-In Methods</th>
                <th className="py-3 px-4">Campus Chat Access</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length > 0 ? (
                filtered.map((s, idx) => (
                  <tr key={s.prn || idx} className="hover:bg-bg/40 transition">
                    <td className="py-3 px-4">
                      <p className="font-medium text-text">{s.name}</p>
                      <p className="text-xs text-muted">{s.email}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted">{s.prn}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-border/60 text-text">
                        {s.dept}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted text-xs">{s.sem}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold ${
                        s.attendance >= 90 ? 'text-green-600' : s.attendance >= 75 ? 'text-orange-500' : 'text-red-500'
                      }`}>
                        {s.attendance == null ? '—' : `${s.attendance}%`}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-medium">{s.cgpa ?? '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.fee === 'Paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        s.fee === 'Scholarship' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        {s.fee}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-border/60 text-text">
                          <Mail className="w-3 h-3 text-muted" /> Password
                        </span>
                        {s.isGoogleLinked || s.googleEmail ? (
                          <span 
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            title={`Enrolled Google account: ${s.googleEmail || s.email}`}
                          >
                            <Check className="w-3 h-3 text-emerald-500" /> Google Linked
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenLinkGoogle(s)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-surface hover:bg-bg border border-border text-muted hover:text-text transition-colors"
                            title="Enroll a Google sign-in address"
                          >
                            <Plus className="w-3 h-3" /> Add Google
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleChatAccess(s)}
                        disabled={!!savingAccessUid}
                        aria-busy={savingAccessUid === s.uid}
                        aria-label={`${s.allowChatting !== false ? 'Block' : 'Allow'} chat for ${s.name}`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait ${
                          s.allowChatting
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 active:scale-95'
                            : 'bg-muted/10 text-muted border border-border hover:bg-muted/20 active:scale-95'
                        }`}
                        title={s.allowChatting !== false ? "Chat access allowed. Click to block." : "Chat blocked. Click to allow."}
                      >
                        {savingAccessUid === s.uid ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Saving…</span></> : s.allowChatting !== false ? (
                          <>
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Allowed</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-muted" />
                            <span>Blocked</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteStudent(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 transition-all cursor-pointer active:scale-95"
                        title={`Delete student ${s.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-border/40 flex items-center justify-center text-muted">
                        <GraduationCap className="w-6 h-6 text-muted" />
                      </div>
                      <p className="font-semibold text-text text-sm">No students registered yet</p>
                      <p className="text-xs text-muted max-w-sm">
                        The institutional student roster is empty. Click <span className="font-medium text-text">"Add New Student"</span> to manually register students.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-text text-bg hover:opacity-90 rounded-md transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add New Student
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="bg-surface border border-border rounded-lg max-w-md w-full p-6 space-y-4"
            >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-text">Add New Student</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-text"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-3">
              {saveError && <p role="alert" className="text-sm text-red-600">{saveError}</p>}
              <div>
                <label className="text-xs font-medium text-muted">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full bg-bg border border-border rounded px-3 py-1.5 text-sm text-text focus:outline-none"
                  placeholder="e.g. Yash Patil"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Email</label>
                <input 
                  type="email" 
                  required
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                  className="w-full bg-bg border border-border rounded px-3 py-1.5 text-sm text-text focus:outline-none"
                  placeholder="yash.p@student.krc.edu"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted">Department</label>
                  <select 
                    value={newStudent.dept}
                    onChange={(e) => setNewStudent({...newStudent, dept: e.target.value})}
                    className="w-full bg-bg border border-border rounded px-3 py-1.5 text-sm text-text focus:outline-none"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="MBA">MBA</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Semester</label>
                  <select 
                    value={newStudent.sem}
                    onChange={(e) => setNewStudent({...newStudent, sem: e.target.value})}
                    className="w-full bg-bg border border-border rounded px-3 py-1.5 text-sm text-text focus:outline-none"
                  >
                    <option value="Sem I">Sem I</option>
                    <option value="Sem III">Sem III</option>
                    <option value="Sem V">Sem V</option>
                    <option value="Sem VII">Sem VII</option>
                  </select>
                </div>
              </div>

              {/* In-Campus Chat Authorization Toggle */}
              <div className="p-3 rounded-lg border border-border bg-bg/50 space-y-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newStudent.allowChatting}
                    onChange={(e) => setNewStudent({ ...newStudent, allowChatting: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                  />
                  <span className="text-xs font-semibold text-text flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    Allow In-Campus Chatting
                  </span>
                </label>
                <p className="text-[11px] text-muted pl-6 leading-relaxed">
                  Allows this enrolled student to use campus messaging. Changes are saved to the enrollment database.
                </p>
              </div>

              {/* Starting Password Option */}
              <div className="space-y-1.5 pt-1 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    Starting Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setStartingPassword(credentialService.generateRandomPassword('Student'))}
                    className="text-[11px] text-muted hover:text-text flex items-center gap-1 transition"
                    title="Generate a new secure temporary password"
                  >
                    <RefreshCw className="w-3 h-3" /> Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={startingPassword}
                    onChange={(e) => setStartingPassword(e.target.value)}
                    className="w-full bg-bg border border-border rounded px-3 py-1.5 text-sm text-text pr-9 font-mono focus:outline-none focus:border-text"
                    placeholder="Choose a temporary password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted leading-tight">
                  Student will use this starting password on initial login and can change it anytime from their dashboard.
                </p>
              </div>

              {/* Optional Google sign-in enrollment */}
              <div className="p-3 rounded-lg border border-border bg-bg/50 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newStudent.enableGoogleAuth}
                    onChange={(e) => setNewStudent({ ...newStudent, enableGoogleAuth: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 cursor-pointer accent-blue-500"
                  />
                  <span className="text-xs font-semibold text-text flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" opacity="0.8" d="M12 24c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 21.53 7.7 24 12 24z" />
                      <path fill="currentColor" opacity="0.6" d="M5.84 15.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V8.06H2.18C1.43 9.55 1 11.22 1 13s.43 3.45 1.18 4.94l3.66-2.84z" />
                      <path fill="currentColor" opacity="0.4" d="M12 4.75c1.61 0 3.06.56 4.2 1.64l3.15-3.15C17.45 1.43 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.06l3.66 2.84c.87-2.6 3.3-4.15 6.16-4.15z" />
                    </svg>
                    Enable Google Sign-In
                  </span>
                </label>
                {newStudent.enableGoogleAuth && (
                  <div className="pl-6 pt-1 space-y-1.5 animate-in fade-in">
                    <label className="text-[11px] font-medium text-muted">Google Account Email</label>
                    <input
                      type="email"
                      value={newStudent.googleEmail}
                      onChange={(e) => setNewStudent({ ...newStudent, googleEmail: e.target.value })}
                      placeholder={newStudent.email || "student@gmail.com"}
                      className="w-full bg-bg border border-border rounded px-2.5 py-1.5 text-xs text-text focus:outline-none focus:border-text"
                    />
                    <p className="text-[11px] text-muted leading-tight">
                      The student must sign in through Google with this verified address. No verification email is sent from this form.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 text-sm text-muted">Cancel</button>
                <button disabled={saving} type="submit" className="px-4 py-1.5 bg-text text-bg rounded text-sm font-medium hover:opacity-90">
                  {saving ? "Saving student..." : "Save Student"}
                </button>
              </div>
            </form>
          </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {googleModal.isOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div role="dialog" aria-modal="true" aria-label="Enroll Google sign-in" className="bg-surface border border-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-base font-bold text-text">Enroll Google sign-in</h3>
              <p className="text-sm text-muted">Add a Google sign-in address for {googleModal.student?.name}. Existing student records and the email password stay unchanged.</p>
              <form onSubmit={handleEnrollGoogle} className="space-y-4">
                <label className="block text-sm text-muted">Google account email
                  <input aria-label="Google account email" type="email" required disabled={googleModal.loading} value={googleModal.googleEmail} onChange={event => setGoogleModal(previous => ({ ...previous, googleEmail: event.target.value, error: '' }))} className="mt-1 w-full bg-bg border border-border rounded-md px-3 py-2 text-text" />
                </label>
                <p className="text-xs text-muted">The student proves ownership by signing in through Google with this verified address. This form does not send email or verify ownership.</p>
                {googleModal.error && <p role="alert" className="text-sm text-red-500">{googleModal.error}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" disabled={googleModal.loading} onClick={() => setGoogleModal(previous => ({ ...previous, isOpen: false }))} className="px-3 py-2 text-muted">Cancel</button>
                  <button type="submit" disabled={googleModal.loading} className="px-3 py-2 rounded bg-text text-bg">{googleModal.loading ? 'Saving Google enrollment...' : 'Save Google enrollment'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Copyright Notice - Visible in codebase, hidden in UI/UX */}
      <footer className="sr-only" aria-hidden="true">
        <p>Copyright &copy; 2026 Chinmay Chaudhari. All Rights Reserved. (MIT License)</p>
      </footer>
    </div>
  );
}
