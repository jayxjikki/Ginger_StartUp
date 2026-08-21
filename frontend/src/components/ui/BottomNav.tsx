// ═══════════════════════════════════════════════════════════
// GINGER — Bottom Navigation
// Floating pill nav with animated active indicator
// ═══════════════════════════════════════════════════════════

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilm, FiPlusCircle, FiSearch, FiUser, FiCreditCard } from 'react-icons/fi';
import './BottomNav.css';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'clipping', label: 'Clipping', icon: <FiFilm />, path: '/campaigns' },
  { id: 'marketplace', label: 'Discover', icon: <FiSearch />, path: '/marketplace' },
  { id: 'advertise', label: 'Advertise', icon: <FiPlusCircle />, path: '/advertise' },
  { id: 'wallet', label: 'Wallet', icon: <FiCreditCard />, path: '/wallet' },
  { id: 'profile', label: 'Profile', icon: <FiUser />, path: '/profile' },
];

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveIndex = () => {
    const idx = navItems.findIndex((item) => location.pathname.startsWith(item.path));
    return idx >= 0 ? idx : 0;
  };

  const activeIndex = getActiveIndex();

  return (
    <nav className="bottom-nav" id="bottom-nav">
      <div className="bottom-nav-inner">
        {navItems.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={item.id}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              id={`nav-${item.id}`}
            >
              <span className="bottom-nav-icon">{item.icon}</span>
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    className="bottom-nav-label"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && (
                <motion.div
                  className="bottom-nav-indicator"
                  layoutId="nav-indicator"
                  transition={{ type: 'spring' as const, stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
