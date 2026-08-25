import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiTarget, FiPlusCircle } from 'react-icons/fi';
import { useAuthStore } from '../../../store/authStore';
import { useCampaignStore } from '../../../store/campaignStore';
import Badge from '../../../components/ui/Badge';
import { formatCurrency } from '../../../utils/formatters';
import './ManageCampaignsPage.css';

const ManageCampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { myCreatedCampaigns, fetchMyCreatedCampaigns, isLoading } = useCampaignStore();

  useEffect(() => {
    if (user?.id) {
      fetchMyCreatedCampaigns(user.id);
    }
  }, [user?.id, fetchMyCreatedCampaigns]);

  return (
    <div className="manage-campaigns-page">
      {/* Dynamic Background */}
      <div className="manage-page-bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <header className="manage-header relative z-20">
        <button className="icon-btn manage-back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft size={22} />
        </button>
        <div className="manage-header-text">
          <h1 className="manage-title bg-gradient-text">Manage Campaigns</h1>
          <p className="manage-subtitle">Track performance and review submissions</p>
        </div>
      </header>

      <main className="manage-main relative z-10">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="flex justify-center items-center h-[50vh]"
            >
              <div className="spinner-large"></div>
            </motion.div>
          ) : myCreatedCampaigns.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="empty-campaigns-wrapper"
            >
              <div className="empty-campaigns-content glass-strong">
                <div className="empty-icon-wrapper">
                  <FiTarget className="empty-icon" />
                  <div className="empty-icon-pulse"></div>
                </div>
                <h3 className="empty-title">No Campaigns Yet</h3>
                <p className="empty-text">Launch your first campaign and start collaborating with amazing creators across the globe.</p>
                
                <button className="fancy-btn primary-glow mt-8 w-full max-w-[280px]" onClick={() => navigate('/advertise/create')}>
                  <span className="material-symbols-outlined mr-2">add_circle</span>
                  Create Campaign
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="manage-campaigns-grid"
            >
              {myCreatedCampaigns.map((campaign, idx) => {
                const submissions = campaign.submissions as any[] || [];
                const pendingCount = submissions.filter(s => s.status === 'pending').length;
                const approvedCount = submissions.filter(s => s.status === 'approved' || s.status === 'verified').length;
                
                return (
                  <motion.div 
                    key={campaign.id}
                    className="fancy-campaign-card group"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => navigate(`/manage-campaigns/${campaign.id}`)}
                  >
                    <div className="card-gradient-overlay"></div>
                    <div className="card-content-inner">
                      <div className="manage-card-header">
                        <div className="title-wrapper pr-4">
                          <h3 className="manage-card-title">{campaign.title || 'Untitled'}</h3>
                          <p className="manage-card-platform">
                            {campaign.platform || 'Cross-Platform'}
                          </p>
                        </div>
                        <Badge variant={campaign.status === 'active' ? 'success' : 'default'} className="status-badge shrink-0">
                          {campaign.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="manage-card-stats-modern">
                        <div className="stat-group">
                          <span className="stat-label">Budget</span>
                          <span className="stat-value text-accent">
                            {formatCurrency(campaign.prize_pool || 0)}
                          </span>
                        </div>
                        
                        <div className="stat-divider"></div>
                        
                        <div className="stat-group">
                          <span className="stat-label">Subs</span>
                          <span className="stat-value text-white">
                            {submissions.length}
                          </span>
                        </div>

                        <div className="stat-divider"></div>
                        
                        <div className="stat-group">
                          <span className="stat-label">Approved</span>
                          <span className="stat-value text-[#4caf50]">
                            {approvedCount}
                          </span>
                        </div>
                      </div>

                      <div className="manage-card-footer">
                        {pendingCount > 0 ? (
                          <div className="pending-alert text-warning">
                            <span className="pulse-dot bg-warning"></span>
                            {pendingCount} new submission{pendingCount !== 1 ? 's' : ''} to review
                          </div>
                        ) : (
                          <div className="pending-alert empty text-tertiary">
                            No pending reviews
                          </div>
                        )}
                        <FiArrowLeft className="action-arrow text-tertiary group-hover:text-white transition-colors" style={{ transform: 'rotate(180deg)' }} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Create Button when campaigns exist */}
      {myCreatedCampaigns.length > 0 && !isLoading && (
        <motion.button 
          className="floating-create-btn"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => navigate('/advertise/create')}
          title="Create New Campaign"
        >
          <FiPlusCircle size={28} />
        </motion.button>
      )}
    </div>
  );
};

export default ManageCampaignsPage;
