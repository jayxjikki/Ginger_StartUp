// ═══════════════════════════════════════════════════════════
// GINGER — Bottom Navigation (New UI)
// ═══════════════════════════════════════════════════════════

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './BottomNav.css';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav-container" id="bottom-nav">
      <button 
        className={`bottom-nav-btn ${location.pathname === '/campaigns' ? 'active' : ''}`}
        onClick={() => navigate('/campaigns')}
      >
        <span 
          className="material-symbols-outlined bottom-nav-icon" 
          style={location.pathname === '/campaigns' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          movie
        </span>
        <span className="bottom-nav-label">Clipping</span>
      </button>

      <button 
        className={`bottom-nav-btn ${location.pathname === '/marketplace' ? 'active' : ''}`}
        onClick={() => navigate('/marketplace')}
      >
        <span 
          className="material-symbols-outlined bottom-nav-icon"
          style={location.pathname === '/marketplace' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          play_circle
        </span>
        <span className="bottom-nav-label">Feed</span>
      </button>

      <div className="bottom-nav-fab-wrapper">
        <button 
          className="bottom-nav-fab"
          onClick={() => navigate('/advertise')}
        >
          <span className="material-symbols-outlined bottom-nav-fab-icon">add</span>
        </button>
      </div>

      <button 
        className={`bottom-nav-btn ${location.pathname === '/wallet' ? 'active' : ''}`}
        onClick={() => navigate('/wallet')}
      >
        <span 
          className="material-symbols-outlined bottom-nav-icon"
          style={location.pathname === '/wallet' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          credit_card
        </span>
        <span className="bottom-nav-label">Wallet</span>
      </button>

      <button 
        className={`bottom-nav-btn ${location.pathname === '/profile' ? 'active' : ''}`}
        onClick={() => navigate('/profile')}
      >
        <span 
          className="material-symbols-outlined bottom-nav-icon"
          style={location.pathname === '/profile' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          person
        </span>
        <span className="bottom-nav-label">Profile</span>
      </button>
    </nav>
  );
};

export default BottomNav;
