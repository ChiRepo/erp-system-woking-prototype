/**
 * @fileoverview ADMIN Faculty Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Mail, 
  MapPin, 
  Briefcase, 
  Plus, 
  X, 
  Key, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  CheckCircle2, 
  Trash2, 
  AlertTriangle, 
  RotateCcw 
} from 'lucide-react';
import { demoFaculty } from '../../data/demoData';
import { credentialService } from '../../services/credentialService';
import { firestoreService } from '../../services/firestoreService';
import { provisionAuthUser } from '../../firebase';
import { createEnrollmentId, normalizeFullName } from '../../utils/enrollmentIdentity';

export default function Faculty() {
  const [facultyList, setFacultyList] = useState(() => {
    try {
      const saved = localStorage.getItem('krc_faculty');
      if (saved) return JSON.parse(saved);
      localStorage.setItem('krc_faculty', JSON.stringify(demoFaculty));
      return demoFaculty;
    } catch (e) {
      return demoFaculty;
    }
  });

  useEffect(() => {
    const loadFaculty = async () => {
      try {
        const live = await firestoreService.getFaculty();
        if (live && live.length > 0) {
          setFacultyList(live);
          localStorage.setItem('krc_faculty', JSON.stringify(live));
        }
      } catch (err) {
        console.warn("[Firestore] Load faculty notice:", err.message);
      }
    };
    loadFaculty();
  }, []);
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState(null);
  const [removedNotice, setRemovedNotice] = useState(null);
  const [startingPassword, setStartingPassword] = useState(() => credentialService.generateRandomPassword('Faculty'));
  const [showPassword, setShowPassword] = useState(false);
  const [addedNotice, setAddedNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const pendingAccount = useRef(null);
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    email: '',
    dept: 'CSE',
    role: 'Assistant Professor',
    subjects: 'Data Structures, AI',
    room: 'Turing Block 202',
    exp: '5 Yrs Exp',
    status: 'Office Hours'
  });

  const filtered = (facultyList || []).filter(f => {
    if (!f) return false;
    const q = String(query || '').toLowerCase().trim();
    const matchesQuery = !q ||
      String(f.name || '').toLowerCase().includes(q) || 
      String(f.email || '').toLowerCase().includes(q) ||
      String(f.subjects || '').toLowerCase().includes(q);
    const matchesDept = deptFilter === 'ALL' || f.dept === deptFilter;
    return matchesQuery && matchesDept;
  });

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaveError('');
    const fullName = normalizeFullName(newFaculty.name);
    if (!fullName) { setSaveError('Enter the faculty member’s full name.'); return; }
    const id = createEnrollmentId('faculty');
    setSaving(true);
    try {
    
      // Provision actual Firebase Authentication account
      const email = newFaculty.email.trim().toLowerCase();
      const previous = pendingAccount.current;
      const authUid = previous?.email === email ? previous.uid : await provisionAuthUser(email, startingPassword, fullName);
      const docId = authUid;
      const assignedId = previous?.email === email ? previous.id : id;
      pendingAccount.current = { email, uid: authUid, id: assignedId };

      // Persist to Firestore /users/{docId} (Admin authority)
      const saved = await firestoreService.setUserProfile(docId, {
        uid: docId,
        id: assignedId,
        email,
        name: fullName,
        fullName,
        displayName: fullName,
        role: 'faculty',
        dept: newFaculty.dept,
        roleTitle: newFaculty.role,
        subjects: newFaculty.subjects,
        room: newFaculty.room,
        exp: newFaculty.exp,
        status: newFaculty.status,
        isStartingPassword: true,
        mustChangePassword: true
      }, true);
      if (!saved) throw new Error('The database did not confirm this enrollment. Please retry.');
      pendingAccount.current = null;
      const facultyWithCred = { ...newFaculty, email, name: fullName, displayName: fullName, fullName, id: assignedId, uid: docId };
      const updated = [facultyWithCred, ...facultyList.filter(f => f.uid !== docId)];
      setFacultyList(updated);
      localStorage.setItem('krc_faculty', JSON.stringify(updated));
      credentialService.setStartingPassword(email, startingPassword, 'faculty', fullName);

      setAddedNotice({
        name: fullName,
        email,
        id: assignedId,
        password: startingPassword
      });

      setShowAddModal(false);
      setNewFaculty({
        name: '',
        email: '',
        dept: 'CSE',
        role: 'Assistant Professor',
        subjects: 'Data Structures, AI',
        room: 'Turing Block 202',
        exp: '5 Yrs Exp',
        status: 'Office Hours'
      });
      setStartingPassword(credentialService.generateRandomPassword('Faculty'));
    } catch (error) {
      setSaveError(error.code === 'auth/email-already-in-use'
        ? 'That email already has a login. Use its existing enrollment or a different institutional email.'
        : 'Faculty registration was not completed. ' + (error.message || 'Please retry.'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFaculty = (facultyMember) => {
    if (!facultyMember) return;
    const updated = facultyList.filter(f => f.id !== facultyMember.id && f.email !== facultyMember.email);
    setFacultyList(updated);
    localStorage.setItem('krc_faculty', JSON.stringify(updated));

    // Remove credentials from credentialService
    if (facultyMember.email) {
      credentialService.removeCredential(facultyMember.email);
    }
    // If it was demo faculty (FAC-101 or arvind.j), also revoke fallback alias
    if (facultyMember.id === 'FAC-101' || facultyMember.email === 'arvind.j@faculty.krc.edu') {
      credentialService.removeCredential('faculty@krc.edu');
    }

    // Delete from Firestore /users/{uid} and /users/{id}
    const targetUid = facultyMember.uid || facultyMember.id;
    if (targetUid) {
      firestoreService.deleteUserProfile(targetUid).catch(err => {
        console.warn("[Firestore] Delete faculty profile notice:", err);
      });
    }
    if (facultyMember.id && facultyMember.id !== targetUid) {
      firestoreService.deleteUserProfile(facultyMember.id).catch(() => {});
    }

    setRemovedNotice({
      name: facultyMember.name,
      id: facultyMember.id,
      email: facultyMember.email,
      dept: facultyMember.dept,
      role: facultyMember.role,
      data: facultyMember
    });

    setFacultyToDelete(null);
  };

  const handleUndoRemove = () => {
    if (!removedNotice?.data) return;
    const restored = [removedNotice.data, ...facultyList];
    setFacultyList(restored);
    localStorage.setItem('krc_faculty', JSON.stringify(restored));

    if (removedNotice.data.startingPassword) {
      credentialService.setStartingPassword(
        removedNotice.data.email,
        removedNotice.data.startingPassword,
        'faculty',
        removedNotice.data.name
      );
    }
    setRemovedNotice(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Faculty & Staff Directory</h1>
          <p className="text-muted text-sm mt-1">Manage active faculty professors, academic deans, and research staff.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-text text-bg rounded-md text-sm font-medium hover:opacity-90 transition self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Faculty
        </button>
      </div>

      {/* Removed Faculty Notice with Undo */}
      {removedNotice && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-300 rounded-xl text-xs space-y-1 animate-in fade-in flex items-start justify-between">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-text">Faculty Member Removed</p>
              <p className="text-muted">
                <strong>{removedNotice.name}</strong> (<span className="font-mono">{removedNotice.id}</span>) was removed from the directory and portal access revoked.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndoRemove}
              className="px-3 py-1 bg-surface border border-border rounded-md text-xs font-semibold text-text hover:bg-bg transition flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Undo
            </button>
            <button onClick={() => setRemovedNotice(null)} className="text-muted hover:text-text p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Starting Password Registration Notification */}
      {addedNotice && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs space-y-1 animate-in fade-in flex items-start justify-between">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-text">Faculty Member Registered!</p>
              <p className="text-muted">
                <strong>{addedNotice.name}</strong> ({addedNotice.id}) registered with email <span className="font-mono text-text">{addedNotice.email}</span>.
              </p>
              <div className="mt-2 inline-flex items-center gap-2 p-2 bg-bg rounded-lg border border-border">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-mono font-bold text-text">Starting Password: {addedNotice.password}</span>
                <span className="text-[10px] text-muted">(Faculty member can change this anytime from their dashboard)</span>
              </div>
            </div>
          </div>
          <button onClick={() => setAddedNotice(null)} className="text-muted hover:text-text p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search by faculty name, subject, or cabin..."
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((f) => (
          <div key={f.id} className="bg-surface border border-border rounded-lg p-5 space-y-4 hover:border-text/40 transition relative group">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-border/60 text-text">
                    {f.dept}
                  </span>
                  <span className="font-mono text-[10px] text-muted font-medium bg-bg border border-border px-1.5 py-0.5 rounded">
                    {f.id}
                  </span>
                </div>
                <h3 className="font-bold text-text text-base mt-2">{f.name}</h3>
                <p className="text-xs text-muted">{f.role}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  f.status.includes('Office') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  f.status.includes('Lecture') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-border text-muted'
                }`}>
                  {f.status}
                </span>
                <button
                  type="button"
                  onClick={() => setFacultyToDelete(f)}
                  className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md border border-transparent hover:border-red-500/20 transition"
                  title={`Remove ${f.name}`}
                  aria-label={`Remove ${f.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-muted pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                <span>{f.subjects}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{f.room} · {f.exp}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{f.email}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-border text-xs">
              <span className="text-[11px] text-muted">Faculty Member</span>
              <button
                type="button"
                onClick={() => setFacultyToDelete(f)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-md border border-transparent hover:border-red-500/20 font-medium transition"
                title={`Remove ${f.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center bg-surface border border-dashed border-border rounded-xl">
            <Briefcase className="w-10 h-10 text-muted mx-auto mb-3 opacity-40" />
            <h3 className="font-bold text-text">No faculty members found</h3>
            <p className="text-xs text-muted mt-1">Try adjusting your search query or department filter, or add a new faculty member.</p>
          </div>
        )}
      </div>

      {/* Remove Faculty Confirmation Modal */}
      {facultyToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-text">Remove Faculty Member?</h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Are you sure you want to remove <strong className="text-text">{facultyToDelete.name}</strong> (<span className="font-mono">{facultyToDelete.id}</span>)?
                  This will revoke their faculty portal access, remove them from the institutional directory, and delete their stored credentials.
                </p>
              </div>
            </div>

            <div className="bg-bg border border-border rounded-lg p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted">Email:</span>
                <span className="font-mono text-text font-medium">{facultyToDelete.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Department:</span>
                <span className="text-text font-medium">{facultyToDelete.dept}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Role:</span>
                <span className="text-text font-medium">{facultyToDelete.role}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFacultyToDelete(null)}
                className="px-4 py-2 border border-border rounded-md text-sm font-medium text-muted hover:text-text hover:bg-bg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRemoveFaculty(facultyToDelete)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold transition shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Faculty Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-lg text-text">Register New Faculty Member</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-md text-muted hover:text-text hover:bg-bg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFaculty} className="space-y-4">
              {saveError && <p role="alert" className="text-sm text-red-600">{saveError}</p>}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={newFaculty.name}
                  onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                  placeholder="e.g. Dr. Ramesh Kumar"
                  className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-text transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text uppercase tracking-wider">Institutional or Google Email</label>
                <input
                  type="email"
                  required
                  value={newFaculty.email}
                  onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                  placeholder="e.g. ramesh.k@faculty.krc.edu or google.email@gmail.com"
                  className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-text transition"
                />
                <p className="text-[11px] text-muted">Registering this email grants immediate Faculty Portal access upon Google sign-in.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text uppercase tracking-wider">Department</label>
                  <select
                    value={newFaculty.dept}
                    onChange={(e) => setNewFaculty({ ...newFaculty, dept: e.target.value })}
                    className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-text transition"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="MBA">MBA</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text uppercase tracking-wider">Designation / Role</label>
                  <input
                    type="text"
                    value={newFaculty.role}
                    onChange={(e) => setNewFaculty({ ...newFaculty, role: e.target.value })}
                    placeholder="Assistant Professor"
                    className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-text transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text uppercase tracking-wider">Cabin / Room</label>
                  <input
                    type="text"
                    value={newFaculty.room}
                    onChange={(e) => setNewFaculty({ ...newFaculty, room: e.target.value })}
                    placeholder="Turing Block 204"
                    className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-text transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text uppercase tracking-wider">Teaching Subjects</label>
                  <input
                    type="text"
                    value={newFaculty.subjects}
                    onChange={(e) => setNewFaculty({ ...newFaculty, subjects: e.target.value })}
                    placeholder="Operating Systems, AI"
                    className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-text transition"
                  />
                </div>
              </div>

              {/* Starting Password Option */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    Starting Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setStartingPassword(credentialService.generateRandomPassword('Faculty'))}
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
                    className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text pr-10 font-mono focus:outline-none focus:border-text transition"
                    placeholder="Enter a temporary password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted leading-tight">
                  Faculty member will use this starting password on initial login and can change it anytime from their dashboard.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-border rounded-md text-sm font-medium text-muted hover:text-text hover:bg-bg transition"
                >
                  Cancel
                </button>
                <button disabled={saving}
                  type="submit"
                  className="px-4 py-2 bg-text text-bg rounded-md text-sm font-semibold hover:opacity-90 transition"
                >
                  Register Faculty Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Copyright Notice - Visible in codebase, hidden in UI/UX */}
      <footer className="sr-only" aria-hidden="true">
        <p>Copyright &copy; 2026 Chinmay Chaudhari. All Rights Reserved. (MIT License)</p>
      </footer>
    </div>
  );
}

