// ═══════════════════════════════════════════════════════════
// GINGER — Card Component
// Glassmorphism card with subtle animations
// ═══════════════════════════════════════════════════════════

import React from 'react';
import { motion } from 'framer-motion';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'ginger' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  animate?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  onClick,
  className = '',
  animate = true,
}) => {
  const Component = animate ? motion.div : 'div';
  const animateProps = animate
    ? {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
        whileHover: onClick ? { y: -2, transition: { duration: 0.2 } } : undefined,
        whileTap: onClick ? { scale: 0.985 } : undefined,
      }
    : {};

  return (
    <Component
      className={`card card-${variant} card-pad-${padding} ${onClick ? 'card-clickable' : ''} ${className}`}
      onClick={onClick}
      {...(animateProps as any)}
    >
      {children}
    </Component>
  );
};

export default Card;
