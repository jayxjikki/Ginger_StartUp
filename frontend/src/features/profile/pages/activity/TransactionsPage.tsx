import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TransitionLoader from '../../../../components/ui/TransitionLoader';
import '../ActivityPage.css';

const TransactionsPage: React.FC = () => {
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
          <span className="activity-brand">Transactions</span>
        </header>
        <main className="activity-main" style={{ paddingTop: '88px', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', marginTop: '100px', color: 'rgba(255,255,255,0.5)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '64px', marginBottom: '16px' }}>account_balance_wallet</span>
            <h2>No Transactions Found</h2>
            <p>Earnings, deposits, and charges will be logged here.</p>
          </div>
        </main>
      </div>
    </>
  );
};

export default TransactionsPage;
