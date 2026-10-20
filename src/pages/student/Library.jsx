/**
 * @fileoverview STUDENT Library Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState } from 'react';
import { Search, Book, Bookmark, Clock, CheckCircle } from 'lucide-react';
import { demoLibrary } from '../../data/demoData';

export default function StudentLibrary() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [reserved, setReserved] = useState({});

  const issuedBooks = [
    { title: "Modern Operating Systems (4th Ed)", author: "Andrew S. Tanenbaum", issuedOn: "2026-08-20", returnDate: "2026-09-20", status: "Active" },
    { title: "Computer Networking: A Top-Down Approach", author: "Kurose & Ross", issuedOn: "2026-09-02", returnDate: "2026-10-02", status: "Active" },
  ];

  const filtered = (demoLibrary || []).filter(b => {
    if (!b) return false;
    const q = String(query || '').toLowerCase().trim();
    const matchesQuery = !q ||
      String(b.title || '').toLowerCase().includes(q) || 
      String(b.author || '').toLowerCase().includes(q);
    const matchesCat = category === 'ALL' || b.category === category;
    return matchesQuery && matchesCat;
  });

  const handleReserve = (id) => {
    setReserved(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Central Library & Digital Archives</h1>
        <p className="text-muted text-sm mt-1">Search catalog of 150,000+ volumes, reserve titles, and check return deadlines.</p>
      </div>

      {/* Currently Issued Books */}
      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-base font-bold text-text flex items-center gap-2">
          <Book className="w-4 h-4 text-blue-500" /> Currently Borrowed Titles ({issuedBooks.length} / 4 limit)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {issuedBooks.map((b, i) => (
            <div key={i} className="p-4 rounded-lg border border-border bg-bg space-y-2">
              <h3 className="font-bold text-text text-sm">{b.title}</h3>
              <p className="text-xs text-muted">Author: {b.author}</p>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                <span className="text-muted">Issued: {b.issuedOn}</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Return by {b.returnDate}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Catalog Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search library catalog by title, author, or keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-md text-sm text-text placeholder-muted focus:outline-none focus:border-text transition"
            />
          </div>
          <div className="flex items-center gap-2">
            {['ALL', 'Computer Science', 'Networking', 'Algorithms', 'Mechanical'].map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                  category === c 
                    ? 'bg-text text-bg' 
                    : 'bg-surface border border-border text-muted hover:text-text'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((book) => (
            <div key={book.id} className="bg-surface rounded-xl border border-border p-5 flex flex-col justify-between hover:border-text/40 transition">
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded bg-bg border border-border font-mono text-muted">{book.id}</span>
                  <span className="font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                    {book.available} Available
                  </span>
                </div>
                <h3 className="font-bold text-text text-sm line-clamp-2">{book.title}</h3>
                <p className="text-xs text-muted">By {book.author}</p>
                <p className="text-[11px] text-muted font-mono">ISBN: {book.isbn}</p>
              </div>

              <button
                onClick={() => handleReserve(book.id)}
                disabled={reserved[book.id]}
                className="w-full py-2 bg-bg hover:bg-border/60 border border-border rounded-lg text-xs font-semibold text-text transition flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {reserved[book.id] ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Reserved at Circulation Desk
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" /> Reserve Copy
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden Copyright Notice - Visible in codebase, hidden in UI/UX */}
      <footer className="sr-only" aria-hidden="true">
        <p>Copyright &copy; 2026 Chinmay Chaudhari. All Rights Reserved. (MIT License)</p>
      </footer>
    </div>
  );
}
