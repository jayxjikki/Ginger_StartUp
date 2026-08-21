// ═══════════════════════════════════════════════════════════
// GINGER — App Root with Routing
// ═══════════════════════════════════════════════════════════

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Pages
import LoginPage from './features/auth/pages/LoginPage';
import ProfilePage from './features/profile/pages/ProfilePage';
import EditProfilePage from './features/profile/pages/EditProfilePage';
import CampaignFeedPage from './features/campaigns/pages/CampaignFeedPage';
import CampaignDetailPage from './features/campaigns/pages/CampaignDetailPage';
import CreateCampaignPage from './features/advertise/pages/CreateCampaignPage';
import MarketplacePage from './features/marketplace/pages/MarketplacePage';
import WalletPage from './features/wallet/pages/WalletPage';

// Components
import BottomNav from './components/ui/BottomNav';

// Styles
import './styles/index.css';
import './styles/animations.css';
import './styles/utilities.css';

// Auth guard wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isInitialized } = useAuthStore();
  
  if (!isInitialized) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="btn-spinner" style={{ width: '40px', height: '40px', borderColor: 'rgba(247, 147, 30, 0.3)', borderTopColor: '#F7931E' }} />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

// Layout with bottom nav
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
};

const App: React.FC = () => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1A1A1A',
            color: '#FAFAF9',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />

      <AnimatePresence mode="wait">
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />

          {/* Main App — Protected */}
          <Route
            path="/campaigns"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CampaignFeedPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaigns/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CampaignDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MarketplacePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/advertise"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CreateCampaignPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <WalletPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <EditProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/campaigns" replace />} />
          <Route path="*" element={<Navigate to="/campaigns" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
};

export default App;
