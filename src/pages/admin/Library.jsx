/**
 * @fileoverview ADMIN Library Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState } from 'react';
import { Book, Search, Check, AlertCircle } from 'lucide-react';
import { demoLibrary } from '../../data/demoData';

export default function Library() {
  const [query, setQuery] = useState('');

  const filtered = (demoLibrary || []).filter(b => {
    if (!b) return false;
    const q = String(query || '').toLowerCase().trim();
    if (!q) return true;
    return (
      String(b.title || '').toLowerCase().includes(q) ||
      String(b.author || '').toLowerCase().includes(q) ||
      String(b.category || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Central Library LMS</h1>
        <p className="text-muted text-sm mt-1">Catalog indexing, ISBN circulation, and textbook availability.</p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          type="text"
          placeholder="Search books by title, author, or discipline..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-md text-sm text-text placeholder-muted focus:outline-none focus:border-text transition"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(book => (
          <div key={book.id} className="bg-surface border border-border rounded-lg p-5 space-y-3">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-border/50 text-text">
              {book.category}
            </span>
            <h3 className="font-bold text-text text-base leading-snug">{book.title}</h3>
            <p className="text-xs text-muted">{book.author}</p>
            <p className="font-mono text-[10px] text-muted">ISBN: {book.isbn}</p>

            <div className="pt-2 border-t border-border flex justify-between items-center text-xs">
              <span className="text-muted">Available Copies:</span>
              <span className="font-bold text-text">{book.available} / {book.total}</span>
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
