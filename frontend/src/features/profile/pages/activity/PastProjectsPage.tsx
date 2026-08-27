import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TransitionLoader from '../../../../components/ui/TransitionLoader';
import '../ActivityPage.css';

const PastProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleBack = () => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate('/profile/activity', { state: { fromTransition: true } });
    }, 400);
  };

  return (
    <>
      <TransitionLoader isActive={isNavigating} />
      <div className="activity-page">
        <div className="activity-ambient-bg"></div>
        <header className="activity-top-bar">
          <button className="activity-back-btn" onClick={handleBack} aria-label="Go back">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="activity-brand">Past Projects</span>
        </header>
        <main className="activity-main" style={{ paddingTop: '88px', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', marginTop: '100px', color: 'rgba(255,255,255,0.5)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '64px', marginBottom: '16px' }}>work_history</span>
            <h2>No Past Projects</h2>
            <p>Campaigns you have participated in will be shown here.</p>
          </div>
        </main>
      </div>
    </>
  );
};

export default PastProjectsPage;
