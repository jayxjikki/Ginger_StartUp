// ═══════════════════════════════════════════════════════════
// GINGER — Formatting Utilities
// ═══════════════════════════════════════════════════════════

import { CURRENCY_SYMBOL } from '../lib/constants';

/**
 * Format a number as currency (INR by default)
 */
export function formatCurrency(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 10000000) return `${CURRENCY_SYMBOL}${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `${CURRENCY_SYMBOL}${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${CURRENCY_SYMBOL}${(amount / 1000).toFixed(1)}K`;
  }
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-IN')}`;
}

/**
 * Format a large number compactly (1.2M, 500K, etc.)
 */
export function formatCount(count: number): string {
  if (count >= 1000000000) return `${(count / 1000000000).toFixed(1)}B`;
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

/**
 * Format a relative time string (e.g., "2 hours ago", "3 days left")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 30) return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHr > 0) return `${diffHr}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return 'Just now';
}

/**
 * Format remaining time until a date
 */
export function formatTimeLeft(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  if (diffMs <= 0) return 'Expired';

  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHr = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffDay > 0) return `${diffDay}d ${diffHr}h left`;
  if (diffHr > 0) return `${diffHr}h left`;
  return 'Ending soon';
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}
