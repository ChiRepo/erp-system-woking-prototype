/**
 * @fileoverview Klipy GIF Service
 * Integrates with third-party Klipy GIF API using encrypted key from SecurityVault.
 * Stores GIFs directly as database URLs with ZERO object storage overhead.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { securityVault } from './securityVault.js';

class KlipyGifService {
  constructor() {
    this._cache = new Map();
    this._activeAbortController = null;
  }

  async _getBaseUrl() {
    const key = await securityVault.fetchEncryptedApiKey('klipy');
    return `https://api.klipy.com/api/v1/${key}/gifs`;
  }

  _normalizeGifItem(gif) {
    if (!gif) return null;
    const hdUrl = gif.file?.hd?.gif?.url || gif.file?.md?.gif?.url || gif.url || '';
    const smUrl = gif.file?.sm?.gif?.url || gif.file?.xs?.gif?.url || gif.url || hdUrl;

    return {
      id: gif.id || String(Math.random()),
      url: hdUrl,
      preview: smUrl,
      title: gif.title || 'Campus GIF',
      width: gif.file?.sm?.gif?.width || 200,
      height: gif.file?.sm?.gif?.height || 200
    };
  }

  /**
   * Fetches trending campus GIFs
   */
  async getTrendingGifs(limit = 24) {
    const cacheKey = `trending_${limit}`;
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey);
    }

    try {
      const baseUrl = await this._getBaseUrl();
      const res = await fetch(`${baseUrl}/trending?per_page=${limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      const rawList = data.data?.data || data.data || data.results || [];
      const normalized = rawList.map(g => this._normalizeGifItem(g)).filter(Boolean);
      
      this._cache.set(cacheKey, normalized);
      return normalized;
    } catch (err) {
      console.warn('[Klipy] Trending load warning:', err.message);
      return this._getCuratedFallbackGifs();
    }
  }

  /**
   * Searches GIFs by keyword with AbortController cancellation for obsolete requests
   */
  async searchGifs(query, limit = 24) {
    const cleanQuery = (query || '').trim().toLowerCase();
    if (!cleanQuery) {
      return this.getTrendingGifs(limit);
    }

    const cacheKey = `search_${cleanQuery}_${limit}`;
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey);
    }

    if (this._activeAbortController) {
      this._activeAbortController.abort();
    }
    this._activeAbortController = new AbortController();

    try {
      const baseUrl = await this._getBaseUrl();
      const res = await fetch(`${baseUrl}/search?q=${encodeURIComponent(cleanQuery)}&per_page=${limit}`, {
        signal: this._activeAbortController.signal
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const rawList = data.data?.data || data.data || data.results || [];
      const normalized = rawList.map(g => this._normalizeGifItem(g)).filter(Boolean);

      this._cache.set(cacheKey, normalized);
      return normalized;
    } catch (err) {
      if (err.name === 'AbortError') {
        return [];
      }
      console.warn('[Klipy] Search warning:', err.message);
      return this._getCuratedFallbackGifs().filter(g => 
        g.title.toLowerCase().includes(cleanQuery)
      );
    }
  }

  /**
   * Safe campus fallback GIFs in case of offline/network disruption
   */
  _getCuratedFallbackGifs() {
    return [
      {
        id: 'fallback_study',
        url: 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif',
        preview: 'https://media.giphy.com/media/unQ3IJU2RG7DO/200w.gif',
        title: 'Coding Mode'
      },
      {
        id: 'fallback_cheer',
        url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
        preview: 'https://media.giphy.com/media/111ebonMs90YLu/200w.gif',
        title: 'Celebration'
      },
      {
        id: 'fallback_mindblown',
        url: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif',
        preview: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/200w.gif',
        title: 'Mind Blown'
      },
      {
        id: 'fallback_coffee',
        url: 'https://media.giphy.com/media/oZEBLugoTdzxK/giphy.gif',
        preview: 'https://media.giphy.com/media/oZEBLugoTdzxK/200w.gif',
        title: 'Exam Coffee'
      }
    ];
  }
}

export const klipyGifService = new KlipyGifService();
