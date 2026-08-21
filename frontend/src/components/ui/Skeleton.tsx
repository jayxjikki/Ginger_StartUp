// ═══════════════════════════════════════════════════════════
// GINGER — Skeleton Loading Component
// ═══════════════════════════════════════════════════════════

import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius,
  className = '',
}) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
};

export default Skeleton;

// ── Skeleton Card Preset ────────────────────────────────
export const SkeletonCard: React.FC = () => (
  <div className="skeleton-card">
    <Skeleton height="180px" borderRadius="var(--radius-lg)" />
    <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <Skeleton width="70%" height="20px" />
      <Skeleton width="100%" height="14px" />
      <Skeleton width="80%" height="14px" />
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
        <Skeleton width="60px" height="24px" borderRadius="var(--radius-full)" />
        <Skeleton width="80px" height="24px" borderRadius="var(--radius-full)" />
      </div>
    </div>
  </div>
);
