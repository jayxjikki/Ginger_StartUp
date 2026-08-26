import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiVideo, FiTrendingUp, FiDollarSign } from 'react-icons/fi';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-ambient-glow"></div>

      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-logo">gingerproject</div>
        <div className="landing-nav-links">
          <button className="landing-login-btn" onClick={() => navigate('/login')}>Log In</button>
          <button className="landing-signup-btn" onClick={() => navigate('/login')}>Sign Up</button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="landing-hero">
        <motion.h1 
          className="landing-hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          The Ultimate UGC Marketing Platform
        </motion.h1>
        
        <motion.p 
          className="landing-hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          GINGER connects innovative brands with creative talent. Participate in campaigns, submit user-generated videos, and earn rewards securely.
        </motion.p>
        
        <motion.div 
          className="landing-cta-group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <button className="landing-primary-cta" onClick={() => navigate('/login')}>
            Get Started
          </button>
        </motion.div>
      </main>

      {/* Features Section */}
      <section className="landing-features">
        <h2 className="landing-features-title">Why choose GINGER?</h2>
        <div className="landing-features-grid">
          
          <motion.div 
            className="landing-feature-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="landing-feature-icon">
              <FiVideo />
            </div>
            <h3>For Creators</h3>
            <p>Discover exciting campaigns from top brands. Submit your creative videos and get paid directly to your wallet for verified submissions.</p>
          </motion.div>

          <motion.div 
            className="landing-feature-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="landing-feature-icon">
              <FiTrendingUp />
            </div>
            <h3>For Brands</h3>
            <p>Launch targeted UGC campaigns with specific prize pools. Review submissions easily and only pay for high-quality, verified content.</p>
          </motion.div>

          <motion.div 
            className="landing-feature-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="landing-feature-icon">
              <FiDollarSign />
            </div>
            <h3>Secure Payments</h3>
            <p>Automated batch payments and escrow systems ensure that creators are paid fairly and advertisers' budgets are handled transparently.</p>
          </motion.div>

        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-links">
          <a href="/privacy-policy" className="landing-footer-link" onClick={(e) => { e.preventDefault(); navigate('/privacy-policy'); }}>Privacy Policy</a>
          <a href="/terms-of-service" className="landing-footer-link" onClick={(e) => { e.preventDefault(); navigate('/terms-of-service'); }}>Terms of Service</a>
        </div>
        <div className="landing-copyright">
          &copy; {new Date().getFullYear()} GINGER (gingerproject). All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
