import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './HelpModal.css'; // Reusing HelpModal styles for consistency

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="about-modal-overlay"
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
            <h1 className="help-title">About</h1>
          </header>

          {/* Main Content Area */}
          <main className="help-main" style={{ paddingBottom: '40px' }}>
            <div className="help-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <section className="help-glass-card">
                <h2 className="help-card-title">
                  <span className="material-symbols-outlined">info</span>
                  App Info
                </h2>
                <div style={{ padding: '0 16px', color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.6' }}>
                  <p><strong>App Version:</strong> 1.0.0</p>
                  <p><strong>Purpose:</strong> Ginger is a UGC marketing platform connecting brands with creators. It provides the Growth Operating System for Brands, Businesses & the Next Generation of Ecosystems.</p>
                </div>
              </section>

              <section className="help-glass-card">
                <h2 className="help-card-title">
                  <span className="material-symbols-outlined">groups</span>
                  Team
                </h2>
                <div style={{ padding: '0 16px', color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.6' }}>
                  <p><strong>Founder:</strong> Manish Kumar</p>
                  <p><strong>Cofounder:</strong> Jay Singh Sengar</p>
                </div>
              </section>

              <section className="help-glass-card">
                <h2 className="help-card-title">
                  <span className="material-symbols-outlined">menu_book</span>
                  About Ginger
                </h2>
                <div style={{ width: '100%', height: '500px', borderRadius: '8px', overflow: 'hidden', marginTop: '12px', WebkitOverflowScrolling: 'touch' }}>
                  <embed 
                    src="/Ginger (1).pdf#toolbar=0&navpanes=0&scrollbar=1&view=FitH" 
                    type="application/pdf"
                    width="100%" 
                    height="100%" 
                    style={{ border: 'none', backgroundColor: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                  <a 
                    href="/Ginger (1).pdf" 
                    download="About_Ginger.pdf"
                    className="liquid-chrome"
                    style={{ 
                      padding: '10px 24px', 
                      textDecoration: 'none', 
                      borderRadius: '8px', 
                      fontSize: '14px', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      color: '#fff' 
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                    Download Presentation
                  </a>
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

export default AboutModal;
