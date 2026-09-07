import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { useAuthStore } from '../../../store/authStore';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isInitialized } = useAuthStore();

  useEffect(() => {
    // If the user is already logged in, redirect them to the app
    if (isInitialized && user) {
      navigate('/campaigns', { replace: true });
    }
  }, [user, isInitialized, navigate]);

  return (
    <main className="landing-page-minimal">
      {/* Ambient warm background aura */}
      <div className="landing-ambient-circle" />

      <motion.div 
        className="landing-center-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Ginger Logo and Brand Name */}
        <div className="landing-logo-brand">
          <div className="landing-logo-glow-wrapper">
            <img 
              src="/logo.jpg" 
              alt="Ginger Logo" 
              className="landing-logo-img" 
            />
          </div>
          <h1 className="landing-logo-text">GINGER</h1>
        </div>

        {/* Get Started Button */}
        <motion.button 
          id="get-started-btn"
          className="landing-get-started-btn"
          onClick={() => navigate('/login')}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <span>Get Started</span>
          <FiArrowRight className="landing-btn-icon" />
        </motion.button>
      </motion.div>
    </main>
  );
};

export default LandingPage;
