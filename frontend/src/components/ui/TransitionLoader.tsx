import React from 'react';
import './TransitionLoader.css';

interface TransitionLoaderProps {
  isActive: boolean;
}

const TransitionLoader: React.FC<TransitionLoaderProps> = ({ isActive }) => {
  return (
    <div className={`transition-loader-overlay ${isActive ? 'active' : ''}`}>
      <div className="spinner-circle"></div>
    </div>
  );
};

export default TransitionLoader;
