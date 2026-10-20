/**
 * Ultra-Fluid Instant-Mount Page Transition
 * Eliminates "disappear and reappear" artifacts by using a pure hardware-accelerated CSS keyframe animation.
 * The browser's CSS engine enforces 0% keyframe state prior to the initial paint (animation-fill-mode: both),
 * preventing any JavaScript hydration delays, layout jumps, or opacity flashing.
 */
export const pageTransitionVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 }
};

// Backward compatibility alias for any existing imports
export const circleSlideVariants = pageTransitionVariants;

export default function PageTransition({ children, className = '' }) {
  return (
    <div
      className={`w-full min-h-full animate-page-enter ${className}`}
      style={{
        willChange: 'opacity, transform',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
