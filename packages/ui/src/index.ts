// Re-export all UI component types and utilities.
// Actual React components live in packages/ui/src/components/ once
// the web app has a component library set up. For now we export
// shared prop types and class-name helpers used across the monorepo.

// ─── Class-name helper ────────────────────────────────────────────────────────
/**
 * Joins class names, filtering out falsy values.
 * Lightweight alternative to `clsx` / `classnames`.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ─── Shared component prop types ─────────────────────────────────────────────
export interface WithClassName {
  className?: string;
}

export interface WithChildren {
  children?: React.ReactNode;
}

export interface BaseProps extends WithClassName, WithChildren {}

// ─── Button variant types ─────────────────────────────────────────────────────
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

// ─── Badge / Tag types ────────────────────────────────────────────────────────
export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

// ─── Input types ─────────────────────────────────────────────────────────────
export type InputSize = 'sm' | 'md' | 'lg';

// ─── Toast / notification ─────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number; // ms, default 4000
}
