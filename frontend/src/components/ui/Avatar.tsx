// ═══════════════════════════════════════════════════════════
// GINGER — Avatar Component
// ═══════════════════════════════════════════════════════════

import React from 'react';
import { getInitials } from '../../utils/formatters';
import './Avatar.css';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  verified?: boolean;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  verified = false,
  className = '',
}) => {
  return (
    <div className={`avatar avatar-${size} ${className}`}>
      {src ? (
        <img src={src} alt={name} className="avatar-img" />
      ) : (
        <div className="avatar-fallback">{getInitials(name)}</div>
      )}
      {verified && (
        <span className="avatar-verified" title="Verified">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill="#F7931E" />
            <path d="M8 12.5L11 15.5L16 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </div>
  );
};

export default Avatar;
