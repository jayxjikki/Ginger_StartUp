import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useCampaignStore } from '../../../store/campaignStore';
import { useGlobalModalStore } from '../../../store/globalModalStore';
import { getSocialIcon } from '../../../utils/socialHelpers';
import { formatCurrency } from '../../../utils/formatters';
import { FiArrowLeft, FiClock, FiVideo } from 'react-icons/fi';
import Badge from '../../../components/ui/Badge';
import './JoinedCampaignsPage.css';

const JoinedCampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { mySubmissions, fetchMySubmissions, raiseDispute, isLoading } = useCampaignStore();

  useEffect(() => {
    if (user?.id) {
      fetchMySubmissions(user.id);
    }
  }, [user?.id, fetchMySubmissions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="warning" size="sm">Pending Verification</Badge>;
      case 'verified': return <Badge variant="success" size="sm">Verified</Badge>;
      case 'paid': return <Badge variant="accent" size="sm">Paid</Badge>;
      case 'rejected': return <Badge variant="error" size="sm">Rejected</Badge>;
      case 'disputed': return <Badge variant="warning" size="sm">Disputed</Badge>;
      default: return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const handleDispute = async (e: React.MouseEvent, submissionId: string) => {
    e.stopPropagation();
    const { showConfirm, showAlert } = useGlobalModalStore.getState();
    const confirmed = await showConfirm("Are you sure you want to dispute this rejection? Admin will manually review your video.");
    if (!confirmed) return;
    try {
      await raiseDispute(submissionId);
    } catch (err) {
      console.error(err);
      showAlert('Failed to raise dispute.');
    }
  };

  return (
    <div className="joined-campaigns-page">
      <header className="joined-header">
        <button className="icon-btn back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <div>
          <h1 className="joined-title">Joined Campaigns</h1>
          <p className="joined-subtitle">Track your submissions & earnings</p>
        </div>
      </header>

      <main className="joined-main">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="spinner"></div>
          </div>
        ) : mySubmissions.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined empty-icon">assignment</span>
            <h3>No campaigns joined yet</h3>
            <p>You haven't submitted videos to any campaigns.</p>
            <button className="btn btn-primary" onClick={() => navigate('/campaigns')}>
              Explore Campaigns
            </button>
          </div>
        ) : (
          <div className="submissions-list">
            {mySubmissions.map((sub) => (
              <div 
                key={sub.id} 
                className="submission-card"
                onClick={() => navigate(`/campaigns/${sub.campaign_id}`)}
              >
                <div className="submission-card-header">
                  <div className="campaign-info">
                    <h3 className="campaign-title truncate">{sub.campaign?.title || 'Unknown Campaign'}</h3>
                    <p className="campaign-advertiser text-tertiary text-xs">
                      by {sub.campaign?.advertiser?.full_name || 'Advertiser'}
                    </p>
                  </div>
                  {getStatusBadge(sub.status)}
                </div>

                <div className="submission-card-body">
                  <div className="stat-col">
                    <span className="stat-label">Platform</span>
                    <span className="stat-value platform">
                      <img src={getSocialIcon(sub.platform)} alt={sub.platform} className="platform-icon-sm" onError={(e) => e.currentTarget.style.display = 'none'} />
                      {sub.platform}
                    </span>
                  </div>
                  <div className="stat-col">
                    <span className="stat-label">Current Views</span>
                    <span className="stat-value">{sub.current_views?.toLocaleString() || 0}</span>
                  </div>
                  <div className="stat-col">
                    <span className="stat-label">Earned</span>
                    <span className="stat-value text-accent font-bold">{formatCurrency(sub.earned_amount || 0)}</span>
                  </div>
                </div>

                <div className="submission-card-footer">
                  <div className="submitted-date">
                    <FiClock size={12} />
                    <span>Submitted {new Date(sub.submitted_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {sub.status === 'rejected' && (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '4px 8px', fontSize: '12px', background: '#ff3b30', borderColor: '#ff3b30' }}
                        onClick={(e) => handleDispute(e, sub.id)}
                      >
                        Raise Dispute
                      </button>
                    )}
                    <a 
                      href={sub.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="view-video-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FiVideo size={14} /> View Video
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default JoinedCampaignsPage;
