/**
 * @fileoverview Route-level code splitting helper.
 * Wraps React.lazy so that a chunk which fails to load (typically because a new
 * deploy replaced the hashed file while this tab was open) triggers one full page
 * reload to pick up the fresh index.html, instead of crashing into the ErrorBoundary.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { lazy } from 'react';

const RELOAD_FLAG = 'krc_chunk_reload_at';

export default function lazyWithRetry(importer) {
  return lazy(async () => {
    try {
      const mod = await importer();
      try { sessionStorage.removeItem(RELOAD_FLAG); } catch (e) {}
      return mod;
    } catch (err) {
      let lastReload = 0;
      try { lastReload = Number(sessionStorage.getItem(RELOAD_FLAG) || 0); } catch (e) {}
      // Reload at most once per 10 s to avoid a loop when the network is genuinely down
      if (Date.now() - lastReload > 10000) {
        try { sessionStorage.setItem(RELOAD_FLAG, String(Date.now())); } catch (e) {}
        window.location.reload();
        return new Promise(() => {}); // keep Suspense fallback up until the reload happens
      }
      throw err;
    }
  });
}
