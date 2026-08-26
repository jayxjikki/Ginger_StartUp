// ═══════════════════════════════════════════════════════════
// GINGER — App Root with Routing
// ═══════════════════════════════════════════════════════════

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useCampaignStore } from './store/campaignStore';
import { useLocation } from 'react-router-dom';

// Pages
import LoginPage from './features/auth/pages/LoginPage';
import OnboardingPage from './features/auth/pages/OnboardingPage';
import ProfilePage from './features/profile/pages/ProfilePage';
import EditProfilePage from './features/profile/pages/EditProfilePage';
import ActivityPage from './features/profile/pages/ActivityPage';
import AccountCentrePage from './features/profile/pages/AccountCentrePage';
import PaymentVerificationPage from './features/profile/pages/PaymentVerificationPage';
import PrivacyPolicyPage from './features/legal/pages/PrivacyPolicyPage';
import TermsOfServicePage from './features/legal/pages/TermsOfServicePage';
import CampaignFeedPage from './features/campaigns/pages/CampaignFeedPage';
import DiscoverFeedPage from './features/campaigns/pages/DiscoverFeedPage';
import CampaignDetailPage from './features/campaigns/pages/CampaignDetailPage';
import CreateCampaignPage from './features/advertise/pages/CreateCampaignPage';
import WalletPage from './features/wallet/pages/WalletPage';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import InboxPage from './features/chat/pages/InboxPage';
import JoinedCampaignsPage from './features/campaigns/pages/JoinedCampaignsPage';
import ManageCampaignsPage from './features/campaigns/pages/ManageCampaignsPage';
import ManageCampaignDetailPage from './features/campaigns/pages/ManageCampaignDetailPage';

// Components
import BottomNav from './components/ui/BottomNav';
import GlobalModal from './components/ui/GlobalModal';

// Styles
import './styles/index.css';
import './styles/animations.css';
import './styles/utilities.css';

// Auth guard wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode, requireOnboarding?: boolean }> = ({ children, requireOnboarding = true }) => {
  const { user, profile, isInitialized, isLoading } = useAuthStore();
  
  if (!isInitialized || isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="btn-spinner" style={{ width: '40px', height: '40px', borderColor: 'rgba(247, 147, 30, 0.3)', borderTopColor: '#F7931E' }} />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;

  if (requireOnboarding && profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  if (profile?.is_banned) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Admin guard wrapper
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isInitialized } = useAuthStore();
  
  if (!isInitialized) return null;
  if (!user || profile?.is_banned) return <Navigate to="/login" replace />;
  
  if (profile?.role !== 'admin') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <h2>Access Denied</h2>
        <p>You must be an admin to view this page.</p>
      </div>
    );
  }
  
  return <>{children}</>;
};

// Global listener to forcefully reset filters when switching tabs
const RouteChangeListener: React.FC = () => {
  const location = useLocation();
  const { setFilters } = useCampaignStore();

  useEffect(() => {
    if (location.pathname === '/marketplace') {
      // Force DiscoverFeedPage to reset
      window.dispatchEvent(new Event('reset-feed-filters'));
    } else if (location.pathname === '/campaigns') {
      // Force CampaignFeedPage to reset
      setFilters({ search: '', location: '', type: '', minPayout: 0, maxPayout: 0, platform: '', category: '', sortBy: 'newest' });
      window.dispatchEvent(new Event('reset-clipping-filters'));
    }
  }, [location.pathname, setFilters]);

  return null;
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



const AppRoutes: React.FC = () => {
  const location = useLocation();
  
  return (
    <>
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
      <GlobalModal />
      <RouteChangeListener />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><OnboardingPage /></ProtectedRoute>} />
          <Route path="/privacy-policy" element={<AppLayout><PrivacyPolicyPage /></AppLayout>} />
          <Route path="/terms-of-service" element={<AppLayout><TermsOfServicePage /></AppLayout>} />

          {/* Main App — Protected */}
          <Route
            path="/campaigns"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CampaignFeedPage key={`clipping-${location.key}`} />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaigns/joined"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <JoinedCampaignsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-campaigns"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ManageCampaignsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-campaigns/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ManageCampaignDetailPage />
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
                  <DiscoverFeedPage key={`feed-${location.key}`} />
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
            path="/inbox"
            element={
              <ProtectedRoute>
                <InboxPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
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
            path="/profile/activity"
            element={
              <ProtectedRoute>
                <ActivityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/account"
            element={
              <ProtectedRoute>
                <AccountCentrePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/payments"
            element={
              <ProtectedRoute>
                <PaymentVerificationPage />
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
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
