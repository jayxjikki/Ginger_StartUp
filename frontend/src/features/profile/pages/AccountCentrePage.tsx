import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useProfileStore } from '../../../store/profileStore';
import './AccountCentrePage.css';

const AccountCentrePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  const actualAvatarUrl = profile?.avatar_url || 'https://via.placeholder.com/150';
  const fullName = profile?.full_name || 'Jikki Thakur';
  const email = user?.email || 'jikki@example.com';

  return (
    <div className="account-centre-page">
      {/* Ambient Glow */}
      <div className="account-ambient-glow"></div>

      {/* TopAppBar */}
      <header className="account-top-bar">
        <button 
          aria-label="Go back" 
          className="account-back-btn"
          onClick={() => navigate('/profile', { state: { openSettings: true } })}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
        </button>
        <h1 className="account-brand">GINGER</h1>
        <div className="account-avatar">
          <img src={actualAvatarUrl} alt="Avatar" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="account-main">
        {/* Page Title */}
        <div className="account-header">
          <h2 className="account-title">Account Centre</h2>
          <p className="account-subtitle">Manage your identity, security, and linked platforms.</p>
        </div>

        {/* 1. Linked Accounts (Bento Style) */}
        <section className="account-section">
          <h3 className="account-section-title">Linked Accounts</h3>
          <div className="linked-accounts-grid">
            {/* Instagram Card */}
            <div className="glass-panel liquid-hover account-card">
              <div className="account-icon-wrap">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-_fEtxWsDPv5ORuPg843yzzOsgzH_SylqtXy9lf_8rdt9oBbFHleN-k553txsHeIwBHOcAnpN-t6yb68bU27r1LjVx-sk-BV4ei1uuSEh2NlEqhgfvQKvws2zgXNvvMzjZBT59KRo75ltWt1HIcDEjiSAOy33fQ_8S6v0DvfS07NUYxMCp2h9Wg7csGrNesrV-ZySmMcYbe1nIOCpZ5B7hqRwj-WD7QzA_s9wR3WLLIzMsn0D5UAg" 
                  alt="Instagram" 
                  style={{ width: '24px', height: '24px', opacity: 0.8 }} 
                />
              </div>
              <div>
                <div className="account-card-name">Instagram</div>
                <div className="account-status">
                  <span className="status-dot"></span> Linked
                </div>
              </div>
            </div>

            {/* YouTube Card */}
            <div className="glass-panel liquid-hover account-card">
              <div className="account-icon-wrap">
                <span className="material-symbols-outlined" style={{ color: '#ffffff', fontSize: '24px', fontVariationSettings: "'FILL' 1", opacity: 0.8 }}>play_circle</span>
              </div>
              <div>
                <div className="account-card-name">YouTube</div>
                <div className="account-status">
                  <span className="status-dot"></span> Linked
                </div>
              </div>
            </div>

            {/* Add New Card */}
            <div className="add-account-card">
              <div className="add-icon-wrap">
                <span className="material-symbols-outlined">add</span>
              </div>
              <div className="add-account-text">Connect new platform</div>
            </div>
          </div>
        </section>

        {/* 2. Personal Information */}
        <section className="account-section">
          <h3 className="account-section-title">Personal Information</h3>
          <div className="glass-panel info-list-container">
            {/* Name */}
            <div className="info-item liquid-hover">
              <div className="info-item-content">
                <span className="info-item-label">Name</span>
                <span className="info-item-value">{fullName}</span>
              </div>
              <span className="material-symbols-outlined info-item-icon">edit</span>
            </div>
            {/* Email */}
            <div className="info-item liquid-hover">
              <div className="info-item-content">
                <span className="info-item-label">Email</span>
                <span className="info-item-value">{email}</span>
              </div>
              <span className="material-symbols-outlined info-item-icon">edit</span>
            </div>
            {/* Phone */}
            <div className="info-item liquid-hover">
              <div className="info-item-content">
                <span className="info-item-label">Phone Number</span>
                <span className="info-item-value">+1 (555) 019-2834</span>
              </div>
              <span className="material-symbols-outlined info-item-icon">edit</span>
            </div>
            {/* DOB */}
            <div className="info-item liquid-hover">
              <div className="info-item-content">
                <span className="info-item-label">Date of Birth</span>
                <span className="info-item-value">October 14, 1992</span>
              </div>
              <span className="material-symbols-outlined info-item-icon">edit</span>
            </div>
          </div>
        </section>

        {/* 3. Account Security */}
        <section className="account-section">
          <h3 className="account-section-title">Security</h3>
          <div className="glass-panel info-list-container">
            {/* Password */}
            <div className="info-item liquid-hover">
              <div className="security-item">
                <div className="security-icon-wrap">
                  <span className="material-symbols-outlined">lock</span>
                </div>
                <span className="info-item-value">Change Password</span>
              </div>
              <span className="material-symbols-outlined info-item-icon">chevron_right</span>
            </div>
            {/* 2FA */}
            <div className="info-item liquid-hover">
              <div className="security-item">
                <div className="security-icon-wrap">
                  <span className="material-symbols-outlined">verified_user</span>
                </div>
                <div className="info-item-content">
                  <span className="info-item-value">Two-Factor Auth</span>
                  <span className="info-item-label">Enabled via App</span>
                </div>
              </div>
              <span className="material-symbols-outlined info-item-icon">chevron_right</span>
            </div>
          </div>
        </section>

        {/* 4. Danger Zone */}
        <section className="danger-zone">
          <div className="danger-card">
            <div className="danger-content">
              <span className="danger-title">Delete Account</span>
              <span className="danger-subtitle">Permanently remove your data</span>
            </div>
            <span className="material-symbols-outlined danger-icon">delete_forever</span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AccountCentrePage;
