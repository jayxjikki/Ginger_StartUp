import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import TransitionLoader from '../../../components/ui/TransitionLoader';
import LoginBackground from '../components/LoginBackground';
import TermsModal from '../components/TermsModal';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const { signInWithGoogle, isLoading } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [isEntering, setIsEntering] = useState((location.state as any)?.fromTransition || false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

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
      <LoginBackground />
      
      {/* Central Brand Logo Background */}
      <div className="login-glow"></div>
      <img 
        src="/image.png" 
        alt="Ginger Background" 
        className="login-bg-image" 
      />

      <div className="login-content-wrapper" ref={containerRef}>
        {/* Hero Section / Text */}
        <div className="login-hero">
          <div>
            <h1 className="login-hero-title">Welcome</h1>
            <p className="login-hero-subtitle">Experience fluid precision.</p>
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
          
          <div className="login-links">
            <a href="#" className="login-link-primary">Log In</a>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>•</span>
            <a href="#" className="login-link-secondary">Sign Up</a>
          </div>
          
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
        </div>

        {/* Footer / Terms */}
        <div className="login-footer">
          <p>
            By continuing, you agree to Ginger's <br />
            <a href="#" className="login-footer-link">Terms of Service</a> and <a href="#" className="login-footer-link">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
    
    <TermsModal 
      isOpen={isTermsModalOpen} 
      onClose={() => setIsTermsModalOpen(false)} 
      onAccept={handleAcceptTerms} 
    />
    </>
  );
};

export default LoginPage;
