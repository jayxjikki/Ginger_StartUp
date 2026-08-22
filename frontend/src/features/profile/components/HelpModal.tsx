import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './HelpModal.css';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="help-modal-overlay"
          className="help-modal-overlay"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* TopAppBar */}
          <header className="help-top-bar">
            <button 
              className="help-back-btn" 
              onClick={onClose}
              aria-label="Go back"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
            </button>
            <h1 className="help-title">Help Centre</h1>
          </header>

          {/* Main Content Area */}
          <main className="help-main">
            {/* Search Bar */}
            <div className="help-search-container group">
              <span className="material-symbols-outlined help-search-icon">search</span>
              <input 
                className="help-search-input" 
                placeholder="Search for help..." 
                type="text" 
              />
            </div>

            {/* Bento Grid for Support Sections */}
            <div className="help-grid">
              
              {/* Account Management */}
              <section className="help-glass-card">
                <h2 className="help-card-title">
                  <span className="material-symbols-outlined">manage_accounts</span>
                  Account Management
                </h2>
                <ul className="help-list">
                  <li className="help-list-item">
                    <a href="#delete-account">
                      <span className="help-list-item-text">Delete Account</span>
                      <span className="material-symbols-outlined help-list-item-icon">chevron_right</span>
                    </a>
                  </li>
                  <li className="help-list-item">
                    <a href="#forgot-password">
                      <span className="help-list-item-text">Forgot Password</span>
                      <span className="material-symbols-outlined help-list-item-icon">chevron_right</span>
                    </a>
                  </li>
                  <li className="help-list-item">
                    <a href="#security-settings">
                      <span className="help-list-item-text">Change Security Settings</span>
                      <span className="material-symbols-outlined help-list-item-icon">chevron_right</span>
                    </a>
                  </li>
                </ul>
              </section>

              {/* Payments & Wallet */}
              <section className="help-glass-card">
                <h2 className="help-card-title">
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                  Payments & Wallet
                </h2>
                <ul className="help-list">
                  <li className="help-list-item">
                    <a href="#withdraw">
                      <span className="help-list-item-text">How can I withdraw?</span>
                      <span className="material-symbols-outlined help-list-item-icon">chevron_right</span>
                    </a>
                  </li>
                  <li className="help-list-item">
                    <a href="#money-problems">
                      <span className="help-list-item-text">Money Problems</span>
                      <span className="material-symbols-outlined help-list-item-icon">chevron_right</span>
                    </a>
                  </li>
                  <li className="help-list-item">
                    <a href="#transaction-history">
                      <span className="help-list-item-text">Transaction History Help</span>
                      <span className="material-symbols-outlined help-list-item-icon">chevron_right</span>
                    </a>
                  </li>
                </ul>
              </section>

              {/* Support & Feedback */}
              <section className="help-glass-card">
                <h2 className="help-card-title">
                  <span className="material-symbols-outlined">forum</span>
                  Support & Feedback
                </h2>
                <ul className="help-list">
                  <li className="help-list-item">
                    <a href="#raise-query">
                      <span className="help-list-item-text">Raise a Query</span>
                      <span className="material-symbols-outlined help-list-item-icon">chevron_right</span>
                    </a>
                  </li>
                  <li className="help-list-item">
                    <a href="#report-problem">
                      <span className="help-list-item-text">Report a Problem</span>
                      <span className="material-symbols-outlined help-list-item-icon">chevron_right</span>
                    </a>
                  </li>
                  <li className="help-list-item">
                    <a href="#send-feedback">
                      <span className="help-list-item-text">Send Feedback</span>
                      <span className="material-symbols-outlined help-list-item-icon">chevron_right</span>
                    </a>
                  </li>
                </ul>
              </section>

            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default HelpModal;
