import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import TransitionLoader from '../../../components/ui/TransitionLoader';
import TermsModal from '../../auth/components/TermsModal';
import HelpModal from './HelpModal';
import './SettingsModal.css';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { signOut } = useAuthStore();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const handleNavigate = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setIsNavigating(true);
    setTimeout(() => {
      navigate(path, { state: { fromTransition: true } });
    }, 400);
  };

  const handleOpenTerms = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    setTimeout(() => {
      setIsNavigating(false);
      setIsTermsModalOpen(true);
    }, 400);
  };

  const handleOpenHelp = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    setTimeout(() => {
      setIsNavigating(false);
      setIsHelpModalOpen(true);
    }, 400);
  };

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    setTimeout(async () => {
      try {
        await signOut();
      } catch (err) {
        console.error('Sign out failed', err);
      }
      navigate('/login', { state: { fromTransition: true } });
    }, 400);
  };

  return (
    <>
      <TransitionLoader isActive={isNavigating} />
      <div className="settings-modal-overlay">
        <div className="settings-modal-container">
        {/* TopAppBar */}
        <header className="settings-header">
          <button aria-label="Close" className="settings-close-btn" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>close</span>
          </button>
          <h1 className="settings-brand">Ginger</h1>
        </header>

        {/* Main Content */}
        <main className="settings-main">
          <h2 className="settings-title">Settings</h2>
          <div className="settings-menu-list">
            
            {/* Account Centre */}
            <a 
              className="liquid-card settings-menu-item" 
              href="#account"
              onClick={(e) => handleNavigate(e, '/profile/account')}
            >
              <div className="settings-menu-item-left">
                <div className="glass-icon-container settings-icon">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                </div>
                <span className="settings-menu-text">Account Centre</span>
              </div>
              <span className="material-symbols-outlined settings-chevron">chevron_right</span>
            </a>

            {/* Payments */}
            <a 
              className="liquid-card settings-menu-item" 
              href="#payments"
              onClick={(e) => handleNavigate(e, '/profile/payments')}
            >
              <div className="settings-menu-item-left">
                <div className="glass-icon-container settings-icon">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                </div>
                <span className="settings-menu-text">Payments</span>
              </div>
              <span className="material-symbols-outlined settings-chevron">chevron_right</span>
            </a>

            {/* Activity */}
            <a 
              className="liquid-card settings-menu-item" 
              href="#activity"
              onClick={(e) => handleNavigate(e, '/profile/activity')}
            >
              <div className="settings-menu-item-left">
                <div className="glass-icon-container settings-icon">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
                </div>
                <span className="settings-menu-text">Activity</span>
              </div>
              <span className="material-symbols-outlined settings-chevron">chevron_right</span>
            </a>

            <div className="settings-divider"></div>

            {/* Privacy Centre */}
            <a className="liquid-card settings-menu-item" href="#privacy">
              <div className="settings-menu-item-left">
                <div className="glass-icon-container settings-icon">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                </div>
                <span className="settings-menu-text">Privacy Centre</span>
              </div>
              <span className="material-symbols-outlined settings-chevron">chevron_right</span>
            </a>

            {/* Help */}
            <a 
              className="liquid-card settings-menu-item" 
              href="#help"
              onClick={handleOpenHelp}
            >
              <div className="settings-menu-item-left">
                <div className="glass-icon-container settings-icon">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
                </div>
                <span className="settings-menu-text">Help</span>
              </div>
              <span className="material-symbols-outlined settings-chevron">chevron_right</span>
            </a>

            {/* Terms and Conditions */}
            <a 
              className="liquid-card settings-menu-item" 
              href="#terms"
              onClick={handleOpenTerms}
            >
              <div className="settings-menu-item-left">
                <div className="glass-icon-container settings-icon">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                </div>
                <span className="settings-menu-text">Terms and Conditions</span>
              </div>
              <span className="material-symbols-outlined settings-chevron">chevron_right</span>
            </a>

            {/* About */}
            <a className="liquid-card settings-menu-item" href="#about">
              <div className="settings-menu-item-left">
                <div className="glass-icon-container settings-icon">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                </div>
                <span className="settings-menu-text">About</span>
              </div>
              <span className="material-symbols-outlined settings-chevron">chevron_right</span>
            </a>

            <div className="settings-divider" style={{ opacity: 0.5 }}></div>

            {/* Sign Out */}
            <a 
              className="liquid-card settings-menu-item settings-sign-out" 
              href="#signout" 
              onClick={handleSignOut}
            >
              <div className="settings-menu-item-left">
                <div className="settings-icon-danger">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>logout</span>
                </div>
                <span className="settings-menu-text text-danger">Sign Out</span>
              </div>
            </a>

          </div>
        </main>
      </div>
    </div>
    
    <TermsModal 
      isOpen={isTermsModalOpen} 
      onClose={() => setIsTermsModalOpen(false)} 
      onAccept={() => setIsTermsModalOpen(false)} 
      hideAcceptButton={true}
    />
    
    <HelpModal 
      isOpen={isHelpModalOpen} 
      onClose={() => setIsHelpModalOpen(false)} 
    />
    </>
  );
};

export default SettingsModal;
