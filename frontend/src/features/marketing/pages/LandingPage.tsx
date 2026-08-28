import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCheckCircle, FiPlayCircle, FiDollarSign } from 'react-icons/fi';
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
    <div className="landing-page">
      {/* Editorial Navbar */}
      <nav className="landing-nav-editorial">
        <div className="landing-logo-editorial">GINGER</div>
        <div className="landing-nav-links-editorial">
          <button className="landing-btn-text" onClick={() => navigate('/login')}>Log In</button>
          <button className="landing-btn-primary" onClick={() => navigate('/login')}>Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="editorial-hero">
        <div className="editorial-hero-content">
          <motion.h1 
            className="editorial-hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Turn your content into cash.
          </motion.h1>
          <motion.p 
            className="editorial-hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            GINGER connects creators directly with top brands. Shoot videos, submit them, and get paid instantly to your wallet.
          </motion.p>
          <motion.div 
            className="editorial-hero-cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <button className="landing-btn-primary large" onClick={() => navigate('/login')}>
              Join as a Creator <FiArrowRight />
            </button>
            <button className="landing-btn-secondary large" onClick={() => navigate('/login')}>
              I'm a Brand
            </button>
          </motion.div>
        </div>
        
        <motion.div 
          className="editorial-hero-image"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <img src="/images/app_mockup.jpg" alt="GINGER App Interface Mockup" />
        </motion.div>
      </main>

      {/* Trust Marquee */}
      <section className="editorial-marquee-section">
        <p className="marquee-label">Trusted by innovative brands and thousands of creators</p>
        <div className="marquee-container">
          <div className="marquee-track">
            <span>Glossier</span>
            <span>Gymshark</span>
            <span>Olipop</span>
            <span>Nike</span>
            <span>Rhode</span>
            <span>Starbucks</span>
            {/* Duplicate for infinite scroll */}
            <span>Glossier</span>
            <span>Gymshark</span>
            <span>Olipop</span>
            <span>Nike</span>
            <span>Rhode</span>
            <span>Starbucks</span>
          </div>
        </div>
      </section>

      {/* How it Works - Split Section */}
      <section className="editorial-split-section">
        <div className="split-content">
          <motion.div 
            className="split-text"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2>How it works for Creators</h2>
            <ul className="editorial-steps">
              <li>
                <div className="step-icon"><FiPlayCircle /></div>
                <div>
                  <strong>Browse Campaigns</strong>
                  <p>Find products you love on the GINGER marketplace.</p>
                </div>
              </li>
              <li>
                <div className="step-icon"><FiCheckCircle /></div>
                <div>
                  <strong>Submit Content</strong>
                  <p>Shoot a short UGC video and upload it directly.</p>
                </div>
              </li>
              <li>
                <div className="step-icon"><FiDollarSign /></div>
                <div>
                  <strong>Get Paid Instantly</strong>
                  <p>Once approved, funds hit your GINGER wallet immediately.</p>
                </div>
              </li>
            </ul>
          </motion.div>
          <motion.div 
            className="split-image"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <img src="/images/creator_lifestyle.jpg" alt="Creator filming a UGC video" />
          </motion.div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="editorial-stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <h3>$500k+</h3>
            <p>Paid to Creators</p>
          </div>
          <div className="stat-item">
            <h3>10,000+</h3>
            <p>Active Campaigns</p>
          </div>
          <div className="stat-item">
            <h3>24hr</h3>
            <p>Average Payout Time</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="editorial-footer">
        <div className="footer-top">
          <div className="footer-brand">GINGER</div>
          <div className="footer-links">
            <a href="/privacy-policy" onClick={(e) => { e.preventDefault(); navigate('/privacy-policy'); }}>Privacy Policy</a>
            <a href="/terms-of-service" onClick={(e) => { e.preventDefault(); navigate('/terms-of-service'); }}>Terms of Service</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} GINGER. All rights reserved.</p>
          <p className="footer-disclaimer">GINGER requests access to your social media data solely to verify your identity. We never sell your data.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
