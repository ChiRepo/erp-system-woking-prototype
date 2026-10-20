/**
 * @fileoverview Dedicated Campus Search & Discovery Feed
 * Full-page BM25 search feed across registered students.
 * Strictly student-only: filters out faculty and unauthorized accounts.
 * Provides direct DM triggers and profile view transitions with tactile feedback.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Users, Sparkles, MessageSquare, 
  UserPlus, ExternalLink, ShieldCheck, Filter, ArrowRight, X 
} from 'lucide-react';
import { studentSearchService } from '../../../services/studentSearchService.js';
import { studentChatService } from '../../../services/studentChatService.js';
import { studentMlService } from '../../../services/studentMlService.js';
import DefaultAvatar from '../../common/DefaultAvatar.jsx';
import { soundEffects } from '../../../utils/soundEffects.js';

const DEPARTMENTS = ['All', 'CSE', 'IT', 'ECE', 'Mech', 'Civil'];
const SEMESTERS = ['All', 'Sem I', 'Sem II', 'Sem III', 'Sem IV', 'Sem V', 'Sem VI', 'Sem VII', 'Sem VIII'];

export default function SearchFeedView({
  currentStudent,
  onStartChat,
  beginChatAction = () => action => { action(); return true; },
  onViewProfile,
  archetype,
  searchService = studentSearchService,
  chatService = studentChatService
}) {
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [semFilter, setSemFilter] = useState('All');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [directoryStatus, setDirectoryStatus] = useState({ loading: true, error: null });
  const [departments, setDepartments] = useState(DEPARTMENTS);
  const [conversations, setConversations] = useState([]);
  const [openingStudent, setOpeningStudent] = useState('');
  const [chatError, setChatError] = useState('');
  useEffect(() => currentStudent?.uid ? chatService.subscribeToConversations(currentStudent.uid, (items, status = {}) => {
    setConversations(items);
    if (status.error) setChatError(status.error);
  }, { includeClosed: true }) : undefined, [chatService, currentStudent?.uid]);
  const hasConversation = student => conversations.some(chat => chat.participants?.includes(student.uid));
  const requestRef = useRef(0);
  const debounceRef = useRef(null);
  const queryRef = useRef(query);
  queryRef.current = query;
  const deptFilterRef = useRef(deptFilter);
  deptFilterRef.current = deptFilter;
  const semFilterRef = useRef(semFilter);
  semFilterRef.current = semFilter;

  const loadStudents = useCallback((searchTerm, immediate = false) => {
    const request = ++requestRef.current;
    setLoading(true);
    clearTimeout(debounceRef.current);

    const execute = async () => {
      try {
        const filters = {};
        if (deptFilterRef.current !== 'All') filters.dept = deptFilterRef.current;
        if (semFilterRef.current !== 'All') filters.sem = semFilterRef.current;

        const data = await searchService.searchStudents(
          searchTerm, 
          currentStudent,
          filters,
          100
        );

        // Score and rank candidates using client-side TF-IDF Cosine Similarity ML Engine
        const ranked = studentMlService.rankCandidates(currentStudent, data);
        const scored = new Map(ranked.map(student => [student.uid, student]));
        // Preserve lexical relevance while typing; recommendations rank the empty feed.
        if (request === requestRef.current) setResults(searchTerm.trim() ? data.map(student => scored.get(student.uid) || student) : ranked);
      } catch (err) {
        console.warn('[SearchFeed] Error searching students:', err);
      } finally {
        if (request === requestRef.current) setLoading(false);
      }
    };

    if (immediate) {
      execute();
    } else {
      debounceRef.current = setTimeout(execute, 75);
    }
  }, [currentStudent, searchService]);

  // Re-run search whenever query, deptFilter, or semFilter changes
  useEffect(() => {
    loadStudents(query, !query);
    return () => clearTimeout(debounceRef.current);
  }, [query, deptFilter, semFilter, loadStudents]);

  // Real-time synchronization subscription (receives new students instantly from Firestore)
  useEffect(() => {
    const unsubscribe = searchService.subscribeStudents((students, status) => {
      setDirectoryStatus(status || { loading: false, error: null });
      setDepartments([...new Set([...DEPARTMENTS, ...students.map(s => s.dept).filter(Boolean)])]);
      loadStudents(queryRef.current, true);
    }, true);

    return () => {
      if (unsubscribe) unsubscribe();
      clearTimeout(debounceRef.current);
      ++requestRef.current;
    };
  }, [loadStudents]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleClearQuery = () => {
    soundEffects.playClick();
    setQuery('');
  };

  const handleStartDm = async (targetStudent) => {
    if (openingStudent) return;
    const finish = beginChatAction();
    setOpeningStudent(targetStudent.uid);
    setChatError('');
    soundEffects.playThonk();
    studentMlService.trackInteraction('student', targetStudent.uid || targetStudent.id, [targetStudent.dept, targetStudent.sem]);
    try {
      const chat = await chatService.getOrCreateConversation(currentStudent, targetStudent);
      finish(() => onStartChat(chat));
    } catch (e) {
      setChatError(e.message || 'The conversation could not be opened. Please try again.');
    } finally {
      setOpeningStudent('');
    }
  };

  const handleProfileClick = (targetStudent) => {
    soundEffects.playClick();
    studentMlService.trackInteraction('student', targetStudent.uid || targetStudent.id, [targetStudent.dept, targetStudent.sem]);
    onViewProfile(targetStudent);
  };

  return (
    <div className={`flex-1 w-full h-full flex flex-col overflow-y-auto ${archetype.classes.shell} transition-colors p-4 sm:p-6 lg:p-8 custom-scrollbar`}>
      {chatError && <p role="alert" className="text-sm text-rose-500 mb-3">{chatError}</p>}
      {/* Search Header Banner */}
      <div className="max-w-4xl w-full mx-auto space-y-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-none ${archetype.classes.badge}`}>
              Verified Directory
            </span>
            <span className="text-[11px] text-muted font-mono">
              Updates automatically
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-text">
            Campus Peer Discovery
          </h1>
          <p className="text-xs text-muted">
            Find and connect with verified enrolled students across engineering disciplines.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search by student name, PRN (e.g. PRN-2026-081), handle (@aarav), or roll..."
            className={`w-full pl-10 pr-10 py-3 text-sm ${archetype.classes.input} transition-all`}
          />
          {query && (
            <button
              type="button"
              onClick={handleClearQuery}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-text cursor-pointer transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Rails */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-muted flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Dept:
          </span>
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setDeptFilter(dept);
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-none cursor-pointer ${
                deptFilter === dept ? archetype.classes.activeTab : archetype.classes.inactiveTab
              }`}
            >
              {dept}
            </button>
          ))}

          <span className="text-xs font-bold text-muted flex items-center gap-1 ml-3 mr-1">
            Semester:
          </span>
          {SEMESTERS.map((sem) => (
            <button
              key={sem}
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setSemFilter(sem);
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-none cursor-pointer ${
                semFilter === sem ? archetype.classes.activeTab : archetype.classes.inactiveTab
              }`}
            >
              {sem}
            </button>
          ))}
        </div>
      </div>

      {/* Results Feed */}
      <div className="max-w-4xl w-full mx-auto flex-1">
        {directoryStatus.error && (
          <div role="alert" className="p-3 mb-4 border border-amber-500/40 text-sm text-text">
            {directoryStatus.error}
            <button type="button" className="ml-3 underline" onClick={() => searchService.invalidateCache()}>Retry directory</button>
          </div>
        )}
        {loading || directoryStatus.loading ? (
          <div className="py-16 text-center text-muted">
            <Sparkles className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-xs font-semibold">Indexing campus directory...</p>
          </div>
        ) : results.length === 0 ? (
          <div className={`p-8 rounded-none ${archetype.classes.surfaceMuted} text-center text-muted my-6`}>
            <Users className="w-8 h-8 mx-auto mb-2 text-muted/60" />
            <h4 className="font-bold text-sm text-text">{!query.trim() && deptFilter === 'All' && semFilter === 'All' ? 'No other students are available yet' : 'No Matching Students Found'}</h4>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              {!query.trim() && deptFilter === 'All' && semFilter === 'All'
                ? 'Your own account is hidden here. Other enrolled students with chat access will appear automatically.'
                : 'Try adjusting your query or resetting department/semester filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
            {results.map((student) => (
              <div
                key={student.uid || student.id}
                className={`p-4 rounded-none ${archetype.classes.card} flex flex-col justify-between transition-transform`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <DefaultAvatar
                      src={student.avatar || student.photoURL}
                      user={student}
                      userId={student.uid || student.id || student.prn}
                      alt={student.name || student.displayName}
                      className="w-10 h-10 rounded-xl"
                    />
                    <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 border border-zinc-950" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-sm text-text truncate">
                        {student.name || student.displayName}
                      </h4>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
                      <span className="font-mono">{student.prn || 'PRN Verified'}</span>
                      <span>•</span>
                      <span>{student.dept || 'Engineering'}</span>
                      {student.sem && (
                        <>
                          <span>•</span>
                          <span>{student.sem}</span>
                        </>
                      )}
                    </div>

                    {student.matchReason && (
                      <p className="text-[10px] font-mono text-indigo-400/90 mt-1">
                        ↳ {student.matchReason}
                      </p>
                    )}

                    {student.bio && (
                      <p className="text-xs text-muted mt-1.5 line-clamp-2 leading-relaxed">
                        {student.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-inherit">
                  <button
                    type="button"
                    onClick={() => handleProfileClick(student)}
                    className={`flex-1 py-1.5 px-3 rounded-none ${archetype.classes.buttonSecondary} text-xs flex items-center justify-center gap-1.5 cursor-pointer`}
                  >
                    <span>View Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartDm(student)}
                    disabled={!!openingStudent}
                    className={`flex-1 py-1.5 px-3 rounded-none ${archetype.classes.buttonPrimary} text-xs flex items-center justify-center gap-1.5 cursor-pointer`}
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>{openingStudent === student.uid ? 'Opening…' : hasConversation(student) ? 'Open chat' : 'Direct Message'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
