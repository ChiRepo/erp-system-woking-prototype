/**
 * @fileoverview Student Social Search Service
 * Implements real-time Firestore synchronization, tokenized BM25-style lexical ranking,
 * exact matching, prefix filtering, and strict student-only authorization filtering.
 * Automatically receives and propagates newly added students across all connected clients in real time.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { firestoreService } from './firestoreService.js';
import { sameStudentIdentity, isDemoStudent } from './studentDirectory.js';

export class StudentSearchService {
  constructor(repository = firestoreService) {
    this._repository = repository;
    this._liveStudents = [];
    this._status = { loading: true, error: null };
    this._requestRevision = 0;
    this._localUpdate = null;
    this._studentIndexCache = null;
    this._subscribers = new Set();
    this._isRealtimeInitialized = false;
    this._unsubscribeRealtime = null;
  }

  /**
   * Initializes real-time sync with Firestore and local window/storage events.
   * Ensures newly created or updated students instantly update the candidate pool.
   */
  startRealtimeSync() {
    if (this._isRealtimeInitialized) return;
    this._isRealtimeInitialized = true;
    this._unsubscribeRealtime = this._repository.subscribeStudents((students, status = {}) => {
      ++this._requestRevision;
      this._liveStudents = students;
      this._status = { loading: false, error: null, ...status };
      this._mergeAndCache(students);
    });
    this._localUpdate = event => {
      if (event.type !== 'storage' || event.key === 'krc_students') this.getStudentPool(true);
    };
    for (const name of ['krc_students_updated', 'krc_student_created', 'krc_search_cache_invalidated', 'storage']) {
      window.addEventListener(name, this._localUpdate);
    }
  }

  stopRealtimeSync() {
    this._unsubscribeRealtime?.();
    for (const name of ['krc_students_updated', 'krc_student_created', 'krc_search_cache_invalidated', 'storage']) {
      window.removeEventListener(name, this._localUpdate);
    }
    this._unsubscribeRealtime = null;
    this._isRealtimeInitialized = false;
    ++this._requestRevision;
    this._studentIndexCache = null;
    this._liveStudents = [];
    this._status = { loading: true, error: null };
  }

  _mergeAndCache(students = []) {
    // This pool never writes to the enrollment directory or grants institutional roles.
    this._studentIndexCache = students.filter(s => !isDemoStudent(s) && String(s.role).toLowerCase() === 'student' && s.allowChatting !== false);
    this._notifySubscribers(this._studentIndexCache);
    return this._studentIndexCache;
  }

  getStatus() {
    return this._status;
  }

  /**
   * Registers a subscriber callback for real-time student updates.
   */
  subscribeStudents(callback, emitImmediately = false) {
    if (typeof callback !== 'function') return () => {};
    this._subscribers.add(callback);
    this.startRealtimeSync();

    if (emitImmediately) {
      if (this._studentIndexCache && this._studentIndexCache.length > 0) {
        callback(this._studentIndexCache, this._status);
      } else {
        this.getStudentPool().then(pool => {
          if (this._subscribers.has(callback)) callback(pool, this._status);
        }).catch(() => {});
      }
    }

    return () => {
      this._subscribers.delete(callback);
      if (this._subscribers.size === 0) this.stopRealtimeSync();
    };
  }

  _notifySubscribers(pool) {
    this._subscribers.forEach(cb => {
      try {
        cb(pool, this._status);
      } catch (e) {
        console.warn('[Search] Subscriber callback error:', e);
      }
    });
  }

  /**
   * Loads candidate students pool with multi-source fallback.
   */
  async getStudentPool(forceRefresh = false) {
    this.startRealtimeSync();
    if (!forceRefresh && this._studentIndexCache !== null) return this._studentIndexCache;
    const revision = ++this._requestRevision;
    try {
      const live = await this._repository.getStudents();
      if (revision !== this._requestRevision) return this._studentIndexCache || [];
      this._liveStudents = live;
      this._status = { loading: false, error: null };
      return this._mergeAndCache(live);
    } catch (error) {
      if (revision !== this._requestRevision) return this._studentIndexCache || [];
      this._status = { loading: false, error: 'The student directory could not be loaded. Check your connection and retry.' };
      return this._mergeAndCache(this._liveStudents);
    }
  }

  /**
   * Tokenizes text into search terms
   */
  _tokenize(text) {
    if (!text) return [];
    return String(text)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 0);
  }

  /**
   * Fine-tuned lexical match scoring algorithm:
   * 1. Exact full matches (Name, PRN, email, username) -> +180 - +200
   * 2. Starts-with prefix matches (Immediate keystroke feedback) -> +90 - +120
   * 3. Word-level prefix matches (e.g. "desh" for "Deshpande") -> +80
   * 4. PRN number & substring matching ("081", "81", "2026-081") -> +60 - +80
   * 5. Initials / Acronym match ("TD" -> "Tanmay Deshpande") -> +85
   * 6. Multi-token overlap with BM25 term length weighting
   * 7. Department & Semester matching
   */
  _calculateScore(student, queryTokens, rawQuery) {
    let score = 0;
    const q = String(rawQuery || '').toLowerCase().trim().replace(/^@/, '');
    if (!q) return 1;

    const name = (student.name || student.displayName || '').toLowerCase().trim();
    const prn = String(student.prn || '').toLowerCase().trim();
    const googleEmail = String(student.googleEmail || '').toLowerCase().trim();
    const roll = String(student.roll || student.rollNumber || student.rollNo || '').toLowerCase().trim();
    const email = (student.email || '').toLowerCase().trim();
    const emailUser = email.split('@')[0] || '';
    const username = (student.username || emailUser || '').toLowerCase().trim();
    const dept = (student.dept || '').toLowerCase().trim();
    const sem = (student.sem || '').toLowerCase().trim();
    const bio = (student.bio || '').toLowerCase().trim();

    // 1. Exact Full Matches (Highest Priority)
    if (name === q) score += 200;
    if (prn === q) score += 200;
    if (email === q || emailUser === q) score += 180;
    if (username === q) score += 180;
    if (googleEmail === q || roll === q) score += 200;

    // 2. Starts-with Prefix Matches
    if (name.startsWith(q)) score += 100;
    if (prn.startsWith(q)) score += 120;
    if (emailUser.startsWith(q)) score += 90;
    if (username.startsWith(q)) score += 90;

    // 3. Name Word Prefix Matches (e.g., "desh" matches "Deshpande" in "Tanmay Deshpande")
    const nameParts = name.split(/\s+/);
    for (const part of nameParts) {
      if (part === q) {
        score += 120;
      } else if (part.startsWith(q)) {
        score += 80;
      } else if (part.includes(q)) {
        score += 40;
      }
    }

    // 4. PRN Substring & Numeric Matching (e.g. "081", "81", "2026-081")
    if (prn.includes(q)) score += 75;
    const prnNum = prn.replace(/[^0-9]/g, '');
    const qNum = q.replace(/[^0-9]/g, '');
    if (qNum && prnNum && (prnNum.endsWith(qNum) || prnNum.includes(qNum))) {
      score += 70;
    }

    // 5. Initials / Acronym Matching (e.g. "TD" matches "Tanmay Deshpande")
    if (nameParts.length > 1 && q.length >= 2 && q.length <= 4) {
      const initials = nameParts.map(p => p[0]).join('');
      if (initials === q || initials.startsWith(q)) {
        score += 85;
      }
    }

    // 6. Token-based multi-field overlap
    const studentTokens = new Set([
      ...this._tokenize(name),
      ...this._tokenize(username),
      ...this._tokenize(email),
      ...this._tokenize(emailUser),
      ...this._tokenize(dept),
      ...this._tokenize(sem),
      ...this._tokenize(prn),
      ...this._tokenize(googleEmail),
      ...this._tokenize(roll)
    ]);

    let matchedTokens = 0;
    for (const t of queryTokens) {
      if (studentTokens.has(t)) {
        score += 35;
        matchedTokens++;
      } else {
        for (const st of studentTokens) {
          if (st.startsWith(t)) {
            score += 25 * (t.length / st.length);
            matchedTokens++;
            break;
          } else if (st.includes(t)) {
            score += 15 * (t.length / st.length);
            matchedTokens += 0.5;
            break;
          }
        }
      }
    }

    if (queryTokens.length > 1 && matchedTokens >= queryTokens.length) {
      score += 50;
    }

    // 7. Department & Semester Filter Relevance
    if (dept === q || dept.includes(q)) {
      score += 35;
    }
    if (sem === q || sem.includes(q)) {
      score += 30;
    }

    // 8. Bio / Interactivity Relevance
    if (bio.includes(q)) {
      score += 15;
    }

    if (queryTokens.length > 1 && matchedTokens < queryTokens.length && !email.includes(q) && !googleEmail.includes(q) && !prn.includes(q) && !roll.includes(q)) return 0;
    return score;
  }

  /**
   * Searches students by query with deterministic ranking and tie-breaking
   */
  async search(query, currentStudentUid = null, limit = 50) {
    const rawQuery = (query || '').trim();
    const pool = await this.getStudentPool();

    const identity = typeof currentStudentUid === 'object' ? currentStudentUid : { uid: currentStudentUid };
    const isCurrentStudent = s => sameStudentIdentity(s, identity);

    if (!rawQuery) {
      // Return top candidates excluding current user
      return pool
        .filter(s => !isCurrentStudent(s))
        .slice(0, limit);
    }

    const queryTokens = this._tokenize(rawQuery);
    if (queryTokens.length === 0) return [];

    const scoredCandidates = [];

    for (const student of pool) {
      // Exclude current student from search results
      if (isCurrentStudent(student)) {
        continue;
      }

      const score = this._calculateScore(student, queryTokens, rawQuery);
      if (score > 0) {
        scoredCandidates.push({ student, score });
      }
    }

    // Deterministic tie-breaking: score DESC, then name ASC, then PRN ASC
    scoredCandidates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const nameCompare = (a.student.name || '').localeCompare(b.student.name || '');
      if (nameCompare !== 0) return nameCompare;
      return (a.student.prn || '').localeCompare(b.student.prn || '');
    });

    return scoredCandidates.slice(0, limit).map(item => item.student);
  }

  /**
   * Searches students with department and semester filters
   */
  async searchStudents(query, currentStudentUid = null, filters = {}, limit = 60) {
    let pool = await this.search(query, currentStudentUid, Number.MAX_SAFE_INTEGER);
    if (filters?.dept && filters.dept !== 'All') {
      const targetDept = String(filters.dept).toLowerCase().trim();
      pool = pool.filter(s => s && String(s.dept || '').toLowerCase().trim() === targetDept);
    }
    if (filters?.sem && filters.sem !== 'All') {
      const targetSem = String(filters.sem).toLowerCase().trim();
      pool = pool.filter(s => s && String(s.sem || '').toLowerCase().trim() === targetSem);
    }
    return pool.slice(0, limit);
  }

  /**
   * Invalidate cache when students are created, updated, or modified
   */
  invalidateCache() {
    this._studentIndexCache = null;
    this.getStudentPool(true);
  }
}

export const studentSearchService = new StudentSearchService();
