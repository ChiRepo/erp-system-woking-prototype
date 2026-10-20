import React from 'react';

/**
 * Bootstrap 5 Spinner Component
 * @param {'border' | 'grow'} type - 'border' (rotating circle) or 'grow' (pulsing circle)
 * @param {'sm' | 'md' | 'lg'} size - size of spinner (sm = 1rem, md = 2rem, lg = 3rem)
 * @param {'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'current'} variant
 * @param {string} className - optional additional Tailwind classes
 * @param {string} label - screen reader accessibility text
 */
export default function BootstrapSpinner({
  type = 'border',
  size = 'md',
  variant = 'current',
  className = '',
  label = 'Loading...'
}) {
  const baseClass = type === 'grow' ? 'spinner-grow' : 'spinner-border';
  const sizeClass = size === 'sm' ? `${baseClass}-sm` : size === 'lg' ? 'w-12 h-12 border-4' : '';
  const variantClass = variant !== 'current' ? `text-${variant}` : '';

  return (
    <span
      className={`${baseClass} ${sizeClass} ${variantClass} ${className} inline-block align-middle shrink-0`}
      role="status"
      aria-hidden="true"
    >
      <span className="sr-only">{label}</span>
    </span>
  );
}
