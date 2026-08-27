import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './HelpModal.css'; // Reusing HelpModal styles for consistency

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="privacy-modal-overlay"
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
            <h1 className="help-title">Privacy Centre</h1>
          </header>

          {/* Main Content Area */}
          <main className="help-main" style={{ paddingBottom: '40px' }}>
            <div className="help-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <section className="help-glass-card">
                <h2 className="help-card-title">
                  <span className="material-symbols-outlined">data_exploration</span>
                  Data Collection & Authorization
                </h2>
                <div style={{ padding: '0 16px', color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.6' }}>
                  <p>
                    Ginger uses direct authorization and strict OAuth protocols to manage your identity securely. 
                    We collect only the essential data required to facilitate seamless campaigns and payments. 
                    By utilizing direct integrations from connected apps and experiences, we minimize data storage on our end and maximize your account's security.
                  </p>
                </div>
              </section>

              <section className="help-glass-card">
                <h2 className="help-card-title">
                  <span className="material-symbols-outlined">family_star</span>
                  Teen Privacy & Safe Experience
                </h2>
                <div style={{ padding: '0 16px', color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.6' }}>
                  <p>
                    We are deeply committed to providing an age-appropriate experience. Ginger enforces a zero-tolerance policy towards 18+ content and strictly prohibits its promotion.
                    We actively filter and monitor campaigns to ensure a safe environment for all creators, specifically protecting teens. We do not use unsafe third-party sites or external untrusted links.
                  </p>
                </div>
              </section>

              <section className="help-glass-card">
                <h2 className="help-card-title">
                  <span className="material-symbols-outlined">gpp_maybe</span>
                  Data Responsibility & Sharing
                </h2>
                <div style={{ padding: '0 16px', color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.6' }}>
                  <p>
                    <strong>Ginger does not sell your personal data.</strong> Your information is never packaged or sold to third-party data brokers.
                  </p>
                  <p style={{ marginTop: '10px' }}>
                    Because we rely on secure OAuth connections and direct links from established platforms (like Google and social networks), any potential loss of data resulting from vulnerabilities in those external platforms is outside of Ginger's liability. We act as a secure bridge, meaning your core credentials remain safely with your original identity providers.
                  </p>
                </div>
              </section>

              <section className="help-glass-card">
                <h2 className="help-card-title">
                  <span className="material-symbols-outlined">visibility</span>
                  Transparency & Control
                </h2>
                <div style={{ padding: '0 16px', color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.6' }}>
                  <p>
                    You are in control of your digital footprint. You can revoke access at any time through your respective platform settings. 
                    Our algorithms match you with campaigns based on public metrics and authorized performance data, ensuring fairness without invasive tracking techniques.
                  </p>
                </div>
              </section>

            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default PrivacyModal;
