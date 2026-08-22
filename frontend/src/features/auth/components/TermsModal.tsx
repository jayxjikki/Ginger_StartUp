import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './TermsModal.css';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  hideAcceptButton?: boolean;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, onAccept, hideAcceptButton = false }) => {
  const [expandedAccordion, setExpandedAccordion] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setExpandedAccordion(expandedAccordion === index ? null : index);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="terms-modal-overlay"
          className="terms-modal-overlay"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* TopAppBar Container */}
          <div className="terms-top-bar">
            <button 
              className="terms-back-btn" 
              onClick={onClose}
              aria-label="Go back"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
            </button>
            <h1 className="terms-title">GINGER</h1>
            <div className="terms-header-placeholder"></div>
          </div>

          {/* Main Content Area */}
          <main className={`terms-main ${hideAcceptButton ? 'no-bottom-bar' : ''}`}>
            <p className="terms-description">
              Last updated: October 24, 2023. Please read these terms carefully before using the Ginger application.
            </p>

            {/* Section 1: Quick FAQ (Glassmorphic Accordions) */}
            <section className="terms-section">
              <h2 className="terms-section-title">Quick FAQ</h2>
              
              <div className="terms-accordion-list">
                {/* Accordion Item 1 */}
                <div className="terms-glass-panel">
                  <button 
                    className="terms-accordion-trigger" 
                    onClick={() => toggleAccordion(0)}
                  >
                    <span>What data do we collect?</span>
                    <span className={`material-symbols-outlined terms-accordion-icon ${expandedAccordion === 0 ? 'expanded' : ''}`}>expand_more</span>
                  </button>
                  <div className={`terms-accordion-content ${expandedAccordion === 0 ? 'expanded' : ''}`}>
                    We collect minimal data required to provide you with the best experience. This includes your account details, usage metrics, and necessary device identifiers. We do not sell your personal data to third parties.
                  </div>
                </div>

                {/* Accordion Item 2 */}
                <div className="terms-glass-panel">
                  <button 
                    className="terms-accordion-trigger" 
                    onClick={() => toggleAccordion(1)}
                  >
                    <span>How do payments work?</span>
                    <span className={`material-symbols-outlined terms-accordion-icon ${expandedAccordion === 1 ? 'expanded' : ''}`}>expand_more</span>
                  </button>
                  <div className={`terms-accordion-content ${expandedAccordion === 1 ? 'expanded' : ''}`}>
                    Payments are processed securely through our trusted payment gateways. Subscriptions are billed automatically according to your chosen plan. You can cancel at any time through your account settings.
                  </div>
                </div>

                {/* Accordion Item 3 */}
                <div className="terms-glass-panel">
                  <button 
                    className="terms-accordion-trigger" 
                    onClick={() => toggleAccordion(2)}
                  >
                    <span>Can I delete my account?</span>
                    <span className={`material-symbols-outlined terms-accordion-icon ${expandedAccordion === 2 ? 'expanded' : ''}`}>expand_more</span>
                  </button>
                  <div className={`terms-accordion-content ${expandedAccordion === 2 ? 'expanded' : ''}`}>
                    Yes, you have full control over your data. You can request account deletion at any time from the Profile section. Note that this action is irreversible and will remove all your data from our active servers within 30 days.
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Full Policies */}
            <section className="terms-section">
              <h2 className="terms-section-title">Full Policies</h2>
              <div className="terms-glass-panel terms-policy-container">
                
                <div className="terms-policy-item">
                  <h3>1. User Agreement</h3>
                  <p>
                    By accessing or using the Ginger application, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service. We reserve the right to modify or replace these Terms at any time.
                  </p>
                  <p>
                    You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password. You agree not to disclose your password to any third party.
                  </p>
                </div>
                
                <hr className="terms-divider" />
                
                <div className="terms-policy-item">
                  <h3>2. Privacy Policy</h3>
                  <p>
                    Your privacy is critical to us. We employ industry-standard security measures to protect your personal information. Our use of your personal data is governed by our Privacy Policy, which is incorporated into these Terms by reference.
                  </p>
                  <ul className="terms-policy-list">
                    <li>Data encryption at rest and in transit.</li>
                    <li>Regular third-party security audits.</li>
                    <li>Strict access controls for internal staff.</li>
                  </ul>
                </div>
                
                <hr className="terms-divider" />
                
                <div className="terms-policy-item">
                  <h3>3. Prohibited Content</h3>
                  <p>
                    Users must not upload, share, or transmit any content that is illegal, offensive, discriminatory, or infringes on the intellectual property rights of others. Violation of these rules may result in immediate account termination.
                  </p>
                </div>

              </div>
            </section>
          </main>

          {/* Bottom Action Bar */}
          {!hideAcceptButton && (
            <div className="terms-bottom-bar">
              <div className="terms-bottom-content">
                <p className="terms-bottom-text">
                  I have read and agree to the Terms & Conditions.
                </p>
                <button className="terms-accept-btn" onClick={onAccept}>
                  ACCEPT & CONTINUE
                </button>
              </div>
            </div>
          )}

        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default TermsModal;
