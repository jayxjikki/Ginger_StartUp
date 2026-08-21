// ═══════════════════════════════════════════════════════════
// GINGER — Badge Component
// ═══════════════════════════════════════════════════════════

import React from 'react';
import './Badge.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'ginger' | 'success' | 'warning' | 'error' | 'accent';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className = '',
}) => {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
};

export default Badge;
