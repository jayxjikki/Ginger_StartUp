import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import TransitionLoader from '../../../components/ui/TransitionLoader';
import TermsModal from '../components/TermsModal';
import { motion, AnimatePresence } from 'framer-motion';
import './LoginPage.css';
import gingerback1Bg from '../../../assets/gingerback1.jpeg';


const LoginPage: React.FC = () => {
  const { signInWithGoogle, isLoading, user, isInitialized } = useAuthStore();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [isEntering, setIsEntering] = useState((location.state as any)?.fromTransition || false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isBannedPopupOpen, setIsBannedPopupOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('showBannedPopup')) {
      setIsBannedPopupOpen(true);
      sessionStorage.removeItem('showBannedPopup');
    }
  }, []);

  useEffect(() => {
    // If the user is already logged in, redirect them to the intended page or app
    if (isInitialized && user) {
      const redirectPath = (location.state as any)?.from || localStorage.getItem('auth_redirect_url') || '/campaigns';
      localStorage.removeItem('auth_redirect_url');
      navigate(redirectPath, { replace: true });
    }
  }, [user, isInitialized, navigate, location.state]);

  const handleTermsCheckboxClick = () => {
    if (isTermsAccepted) {
      setIsTermsAccepted(false);
    } else {
      setIsTermsModalOpen(true);
    }
  };

  const handleAcceptTerms = () => {
    setIsTermsAccepted(true);
    setIsTermsModalOpen(false);
  };

  useEffect(() => {
    if (isEntering) {
      setTimeout(() => setIsEntering(false), 400);
    }
  }, [isEntering]);

  useEffect(() => {
    // Simple subtle entrance animation similar to provided HTML
    if (containerRef.current) {
      const elements = containerRef.current.children;
      Array.from(elements).forEach((el, index) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.opacity = '0';
        htmlEl.style.transform = 'translateY(10px)';
        htmlEl.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) ${index * 0.15}s`;
        
        requestAnimationFrame(() => {
          htmlEl.style.opacity = '1';
          htmlEl.style.transform = 'translateY(0)';
        });
      });
    }
  }, []);

  return (
    <>
      <TransitionLoader isActive={isEntering} />
      <div className="login-container">
      <img 
        src={gingerback1Bg} 
        alt="Ginger Background" 
        className="login-bg-image" 
      />

      <div className="login-content-wrapper" ref={containerRef}>
        {/* Hero Section / Text */}
        <div className="login-hero">
          <div>
            <h1 className="login-hero-title">Welcome to gingerproject</h1>
            <p className="login-hero-subtitle" style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '12px', lineHeight: '1.4' }}>
              GINGER is a UGC marketing platform connecting brands with creators.<br/>Participate in campaigns, submit videos, and earn rewards.
            </p>
          </div>
        </div>

        {/* Authentication Options */}
        <div className="login-auth-options">
          <button 
            className="liquid-chrome" 
            onClick={signInWithGoogle}
            disabled={isLoading || !isTermsAccepted}
          >
            <span className="material-symbols-outlined">mail</span>
            <span>{isLoading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>
          
          <button className="ghost-button" disabled={!isTermsAccepted}>
            <span className="material-symbols-outlined">phone_iphone</span>
            <span>Continue with Phone Number</span>
          </button>
          
          <div className="login-divider">
            <div className="login-divider-line"></div>
            <span className="login-divider-text">or</span>
            <div className="login-divider-line"></div>
          </div>
          

        </div>

        {/* Footer / Terms */}
        <div className="login-footer">
          <div className="login-terms-wrapper">
            <div 
              className={`login-terms-checkbox ${isTermsAccepted ? 'accepted' : ''}`}
              onClick={handleTermsCheckboxClick}
            >
              <span className="material-symbols-outlined">check</span>
            </div>
            <div className="login-terms-label" onClick={handleTermsCheckboxClick}>
              I have read and agree to the <span>Terms & Conditions</span>
            </div>
          </div>

          <div className="login-links">
            <a href="#" className="login-link-primary">Log In</a>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>•</span>
            <a href="#" className="login-link-secondary">Sign Up</a>
          </div>

          <p>
            By continuing, you agree to Ginger's <br />
            <a href="/terms-of-service" className="login-footer-link">Terms of Service</a> and <a href="/privacy-policy" className="login-footer-link">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
    
    <TermsModal 
      isOpen={isTermsModalOpen} 
      onClose={() => setIsTermsModalOpen(false)} 
      onAccept={handleAcceptTerms} 
    />

    <AnimatePresence>
      {isBannedPopupOpen && (
        <motion.div 
          className="admin-modal-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}
        >
          <motion.div 
            className="admin-modal-content glass-strong"
            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            style={{ maxWidth: '400px', width: '90%', padding: '2rem', textAlign: 'center', borderRadius: '16px', background: 'rgba(20,20,20,0.8)' }}
          >
            <div style={{ fontSize: '48px', color: '#ff3b30', marginBottom: '16px' }}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>block</span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px', color: '#fff' }}>Account Suspended</h2>
            <p style={{ color: '#8c90a0', marginBottom: '32px', fontSize: '15px', lineHeight: '1.5' }}>
              Your account has been permanently banned by an administrator for violating our terms of service. You can no longer access this platform.
            </p>
            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#ff3b30', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => setIsBannedPopupOpen(false)}
            >
              Acknowledge
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default LoginPage;
