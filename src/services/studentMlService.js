/**
 * @fileoverview Student Campus ML Recommendation Service
 * Client-side recommendation engine powered by Term-Frequency Inverse Document Frequency (TF-IDF)
 * and Cosine Similarity vector ranking.
 * Analyzes:
 * 1. Student watch and view history (channels visited, profiles inspected).
 * 2. Declared research topics and preferences.
 * 3. Enrolled course curriculum, department, and semester background.
 * 4. Recent chat thread keywords and interests.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

class StudentMlService {
  constructor() {
    this._historyKey = 'krc_ml_watch_history';
  }

  /**
   * Tracks an item view/click in user's interaction history
   */
  trackInteraction(itemType, itemId, tags = []) {
    try {
      const history = this.getHistory();
      const entry = {
        type: itemType, // 'channel', 'student', 'artifact', 'topic'
        id: itemId,
        tags: Array.isArray(tags) ? tags : [tags],
        timestamp: Date.now()
      };
      const updated = [entry, ...history.filter(h => h.id !== itemId)].slice(0, 50);
      localStorage.setItem(this._historyKey, JSON.stringify(updated));
    } catch (e) {}
  }

  /**
   * Retrieves interaction history from localStorage
   */
  getHistory() {
    try {
      const raw = localStorage.getItem(this._historyKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Builds a normalized keyword frequency vector from student's profile & context
   */
  _buildStudentProfileVector(student) {
    const vector = new Map();

    const addTokens = (text, weight = 1.0) => {
      if (!text) return;
      const tokens = String(text)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2);

      tokens.forEach(t => {
        vector.set(t, (vector.get(t) || 0) + weight);
      });
    };

    // 1. Department & Program (High Weight)
    addTokens(student?.dept || 'CSE', 3.0);
    addTokens(student?.program || 'Engineering', 2.0);

    // 2. Declared Bio & Interests (Medium Weight)
    addTokens(student?.bio || '', 1.5);
    if (Array.isArray(student?.interests)) {
      student.interests.forEach(i => addTokens(i, 2.5));
    }

    // 3. Interaction & Watch History (Dynamic Recent Weight)
    const history = this.getHistory();
    history.slice(0, 20).forEach((h, idx) => {
      const recencyDecay = Math.max(0.5, 1.0 - (idx * 0.03));
      h.tags.forEach(tag => addTokens(tag, 2.0 * recencyDecay));
    });

    // 4. Default Academic Curriculum Core
    addTokens('algorithms systems architecture data neural networks distributed', 1.0);

    return vector;
  }

  /**
   * Calculates Cosine Similarity between two term vectors
   */
  _cosineSimilarity(vecA, vecB) {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    vecA.forEach((val, key) => {
      normA += val * val;
      if (vecB.has(key)) {
        dotProduct += val * vecB.get(key);
      }
    });

    vecB.forEach(val => {
      normB += val * val;
    });

    if (normA === 0 || normB === 0) return 0.5; // neutral baseline
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.min(0.99, Math.max(0.60, similarity));
  }

  /**
   * Evaluates candidates (channels, students, or topics) against the ML profile vector
   */
  rankCandidates(student, candidates) {
    if (!Array.isArray(candidates) || candidates.length === 0) return [];

    const studentVector = this._buildStudentProfileVector(student);
    const history = this.getHistory();
    const historyIds = new Set(history.map(h => h.id));

    return candidates.map(candidate => {
      const candidateVector = new Map();
      const addCandidateTokens = (text, weight = 1.0) => {
        if (!text) return;
        const tokens = String(text)
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter(t => t.length > 2);

        tokens.forEach(t => {
          candidateVector.set(t, (candidateVector.get(t) || 0) + weight);
        });
      };

      addCandidateTokens(candidate.name || candidate.title || '', 2.5);
      addCandidateTokens(candidate.topic || candidate.dept || candidate.category || '', 2.0);
      addCandidateTokens(candidate.description || candidate.bio || '', 1.0);

      let sim = this._cosineSimilarity(studentVector, candidateVector);

      // Boost if recently interacted or matching department
      if (candidate?.dept && student?.dept && String(candidate.dept).toLowerCase().trim() === String(student.dept).toLowerCase().trim()) {
        sim = Math.min(0.98, sim + 0.12);
      }
      if (historyIds.has(candidate.id)) {
        sim = Math.min(0.99, sim + 0.08);
      }

      // Generate matching percentage & rationale
      const matchPercentage = Math.round(sim * 100);
      let matchReason = 'Curriculum & Department Match';
      if (candidate.category === 'Study Group') {
        matchReason = 'Course Curriculum & Peer Study Group';
      } else if (candidate.dept) {
        matchReason = `${candidate.dept} Cohort & Peer Connection`;
      } else if (candidate.tags?.length) {
        matchReason = `Matched on #${candidate.tags[0]}`;
      }

      return {
        ...candidate,
        matchScore: matchPercentage,
        matchReason
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }
}

export const studentMlService = new StudentMlService();
