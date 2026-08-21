// ═══════════════════════════════════════════════════════════
// GINGER — Login Page
// Premium splash + Google auth with animated background
// ═══════════════════════════════════════════════════════════

import React from 'react';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { useAuthStore } from '../../../store/authStore';
import Button from '../../../components/ui/Button';
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from '../../../lib/constants';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const { signInWithGoogle, isLoading } = useAuthStore();

  return (
    <div className="login-page">
      {/* Animated Background Orbs */}
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      <div className="login-content">
        {/* Logo & Branding */}
        <motion.div
          className="login-brand"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring' as const, stiffness: 200, damping: 20, delay: 0.1 }}
        >
          <div className="login-logo">
            <span className="login-logo-icon">🫚</span>
          </div>
          <h1 className="login-title">{APP_NAME}</h1>
          <p className="login-tagline gradient-text">{APP_TAGLINE}</p>
        </motion.div>

        {/* Description */}
        <motion.p
          className="login-description"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring' as const, stiffness: 200, damping: 20, delay: 0.25 }}
        >
          {APP_DESCRIPTION}
        </motion.p>

        {/* Features Preview */}
        <motion.div
          className="login-features"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring' as const, stiffness: 200, damping: 20, delay: 0.4 }}
        >
          <div className="login-feature">
            <span className="login-feature-icon">🎬</span>
            <span className="login-feature-text">Create videos & earn from campaigns</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">📢</span>
            <span className="login-feature-text">Advertise & pay only for results</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">💰</span>
            <span className="login-feature-text">Fair payouts based on verified views</span>
          </div>
        </motion.div>

        {/* Auth Buttons */}
        <motion.div
          className="login-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring' as const, stiffness: 200, damping: 20, delay: 0.55 }}
        >
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            icon={<FcGoogle size={22} />}
            onClick={signInWithGoogle}
            isLoading={isLoading}
            id="btn-google-login"
          >
            Continue with Google
          </Button>

          <p className="login-terms">
            By continuing, you agree to our{' '}
            <a href="#terms">Terms of Service</a> and{' '}
            <a href="#privacy">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
