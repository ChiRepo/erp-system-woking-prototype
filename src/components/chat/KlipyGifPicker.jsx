/**
 * @fileoverview Klipy GIF Picker Modal Component
 * Displays trending and searchable GIF grids powered by the encrypted Klipy API.
 * Passes selected GIF URLs directly to chat with zero cloud storage footprint.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Loader2, Flame, Sparkles } from 'lucide-react';
import { klipyGifService } from '../../services/klipyGifService.js';

export default function KlipyGifPicker({ isOpen, onClose, onSelectGif }) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    loadTrending();
  }, [isOpen]);

  const loadTrending = async () => {
    setLoading(true);
    try {
      const data = await klipyGifService.getTrendingGifs(24);
      setGifs(data);
    } catch (e) {
      console.warn('[Klipy] Trending load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await klipyGifService.searchGifs(val, 24);
        setGifs(results);
      } catch (err) {
        console.warn('[Klipy] Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full sm:max-w-md h-[520px] max-h-[85vh] bg-surface border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-3.5 border-b border-border flex items-center justify-between bg-bg/40 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500 border border-pink-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-text">Campus GIFs</h3>
              <p className="text-[10px] text-muted">Powered by Klipy API &bull; Zero Storage Footprint</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted hover:text-text hover:bg-bg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-border bg-bg/20 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              placeholder="Search GIFs (e.g. happy, study, exam, coffee)..."
              className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text placeholder-muted focus:outline-none focus:border-text transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* GIF Grid */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-muted">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-semibold">Loading Klipy GIFs...</span>
            </div>
          ) : gifs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted text-xs p-6 text-center">
              <p className="font-semibold text-text">No GIFs Found</p>
              <p className="mt-1 text-muted">Try searching with different keywords</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  type="button"
                  onClick={() => {
                    onSelectGif(gif.url);
                    onClose();
                  }}
                  className="group relative rounded-xl overflow-hidden aspect-video sm:aspect-square bg-bg border border-border/60 hover:border-pink-500/50 hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <img
                    src={gif.preview || gif.url}
                    alt={gif.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                    <span className="text-[10px] text-white font-medium truncate">{gif.title}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
