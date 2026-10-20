/**
 * @fileoverview Suspense fallback shown while a lazily loaded page chunk downloads.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import BootstrapSpinner from '../ui/BootstrapSpinner';

export default function PageLoader({ fullScreen = false }) {
  return (
    <div
      className={`${fullScreen ? 'h-screen h-[100dvh] w-screen bg-bg' : 'min-h-[40vh] w-full'} flex items-center justify-center text-text`}
      role="status"
      aria-live="polite"
    >
      <BootstrapSpinner type="border" size="md" className="text-emerald-500" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
