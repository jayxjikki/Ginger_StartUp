import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TransitionLoader from '../../../components/ui/TransitionLoader';
import './ActivityPage.css';

const ActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isEntering, setIsEntering] = useState((location.state as any)?.fromTransition || false);

  useEffect(() => {
    if (isEntering) {
      setTimeout(() => setIsEntering(false), 400);
    }
  }, [isEntering]);

  const handleBack = () => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate('/profile', { state: { openSettings: true, fromTransition: true } });
    }, 400);
  };

  return (
    <>
      <TransitionLoader isActive={isNavigating || isEntering} />
      <div className="activity-page">
        {/* Ambient Liquid Background Effect */}
      <div className="activity-ambient-bg"></div>

      {/* TopAppBar */}
      <header className="activity-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            aria-label="Go back" 
            className="activity-back-btn"
            onClick={handleBack}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>
        <span className="activity-brand">Ginger</span>
      </header>

      {/* Main Content Canvas */}
      <main className="activity-main">
        <header className="activity-header">
          <h1 className="activity-title">Activity</h1>
          <p className="activity-subtitle">Manage your digital footprint and interactions.</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Content Section */}
          <section className="activity-section">
            <h3 className="activity-section-title">Content</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="activity-glass-card">
                <div className="activity-card-left">
                  <div className="activity-icon-wrap">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>grid_on</span>
                  </div>
                  <span className="activity-card-text">My Posts</span>
                </div>
                <div className="activity-card-right">
                  <span className="activity-count">142</span>
                  <span className="material-symbols-outlined activity-chevron">chevron_right</span>
                </div>
              </div>

              <div className="activity-glass-card">
                <div className="activity-card-left">
                  <div className="activity-icon-wrap">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>amp_stories</span>
                  </div>
                  <span className="activity-card-text">My Stories</span>
                </div>
                <div className="activity-card-right">
                  <span className="activity-count">89</span>
                  <span className="material-symbols-outlined activity-chevron">chevron_right</span>
                </div>
              </div>

              <div className="activity-glass-card">
                <div className="activity-card-left">
                  <div className="activity-icon-wrap">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>article</span>
                  </div>
                  <span className="activity-card-text">My Blogs</span>
                </div>
                <div className="activity-card-right">
                  <span className="activity-count">12</span>
                  <span className="material-symbols-outlined activity-chevron">chevron_right</span>
                </div>
              </div>
            </div>
          </section>

          {/* Engagement Section */}
          <section className="activity-section">
            <h3 className="activity-section-title">Engagement</h3>
            <div className="activity-grid-2">
              <div className="activity-glass-card">
                <div className="activity-card-left">
                  <div className="activity-icon-wrap">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  </div>
                  <span className="activity-card-text">Likes</span>
                </div>
                <span className="material-symbols-outlined activity-chevron">chevron_right</span>
              </div>

              <div className="activity-glass-card">
                <div className="activity-card-left">
                  <div className="activity-icon-wrap">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                  </div>
                  <span className="activity-card-text">Comments</span>
                </div>
                <span className="material-symbols-outlined activity-chevron">chevron_right</span>
              </div>
            </div>
          </section>

          {/* Interactions Section */}
          <section className="activity-section">
            <h3 className="activity-section-title">Interactions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="activity-glass-card danger-hover">
                <div className="activity-card-left">
                  <div className="activity-icon-wrap">
                    <span className="material-symbols-outlined">block</span>
                  </div>
                  <span className="activity-card-text">Blocked Users</span>
                </div>
                <span className="material-symbols-outlined activity-chevron">chevron_right</span>
              </div>

              <div className="activity-glass-card danger-hover">
                <div className="activity-card-left">
                  <div className="activity-icon-wrap">
                    <span className="material-symbols-outlined">delete_sweep</span>
                  </div>
                  <span className="activity-card-text">Deleted Content</span>
                </div>
                <span className="material-symbols-outlined activity-chevron">chevron_right</span>
              </div>
            </div>
          </section>

          {/* History Section */}
          <section className="activity-section">
            <h3 className="activity-section-title">History</h3>
            <div className="activity-grid-2">
              <div className="activity-glass-card" style={{ flexDirection: 'column', alignItems: 'flex-start', minHeight: '120px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <div className="activity-icon-wrap" style={{ marginBottom: '16px' }}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
                  </div>
                  <span className="material-symbols-outlined activity-chevron">arrow_forward</span>
                </div>
                <span className="activity-card-text">Collaboration History</span>
              </div>

              <div className="activity-glass-card" style={{ flexDirection: 'column', alignItems: 'flex-start', minHeight: '120px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <div className="activity-icon-wrap" style={{ marginBottom: '16px' }}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>work_history</span>
                  </div>
                  <span className="material-symbols-outlined activity-chevron">arrow_forward</span>
                </div>
                <span className="activity-card-text">Past Projects</span>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
    </>
  );
};

export default ActivityPage;
