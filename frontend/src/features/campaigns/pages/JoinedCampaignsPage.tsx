import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useCampaignStore } from '../../../store/campaignStore';
import { useGlobalModalStore } from '../../../store/globalModalStore';
import { getSocialIcon } from '../../../utils/socialHelpers';
import { formatCurrency } from '../../../utils/formatters';
import { FiArrowLeft, FiClock, FiVideo, FiTrash2, FiCopy } from 'react-icons/fi';
import { supabase } from '../../../lib/supabase';
import Badge from '../../../components/ui/Badge';
import DiscountCalculator from '../../../components/ui/DiscountCalculator';
import { isDirectDiscountSubmission, isReviewSubmission, getSubmissionReviewUrl, openReviewPage, getFallbackUniqueVoucherCode } from '../../../utils/submissionHelpers';

import toast from 'react-hot-toast';
import './JoinedCampaignsPage.css';

const JoinedCampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { mySubmissions, fetchMySubmissions, raiseDispute, isLoading } = useCampaignStore();
  const { showConfirm } = useGlobalModalStore();

  useEffect(() => {
    if (user?.id) {
      fetchMySubmissions(user.id);
    }
  }, [user?.id, fetchMySubmissions]);

  const handleRemoveSubmission = async (e: React.MouseEvent, submissionId: string) => {
    e.stopPropagation();
    const confirmed = await showConfirm(
      'Are you sure you want to remove this video submission? You will be able to submit a new video link.',
      'Remove Submission'
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('submissions').delete().eq('id', submissionId);
      if (error) throw error;
      toast.success('Submission removed successfully.');
      if (user?.id) fetchMySubmissions(user.id);
    } catch (err: any) {
      console.error('Error removing submission:', err);
      toast.error(err.message || 'Failed to remove submission.');
    }
  };

  const getStatusBadge = (status: string, isDirectDiscount: boolean = false) => {
    switch (status) {
      case 'pending': return <Badge variant="warning" size="sm">Pending</Badge>;
      case 'verified': return <Badge variant="success" size="sm">{isDirectDiscount ? 'Approved' : 'Approved (Pending Admin)'}</Badge>;
      case 'paid': return <Badge variant="accent" size="sm">{isDirectDiscount ? 'Approved' : 'Admin Approved & Paid'}</Badge>;
      case 'rejected': return <Badge variant="error" size="sm">Rejected</Badge>;
      case 'flagged': return <Badge variant="error" size="sm">Flagged by Owner</Badge>;
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
                  <div className="submission-badges-row">
                    <Badge variant={isDirectDiscountSubmission(sub) ? 'warning' : 'accent'} size="sm">
                      {isDirectDiscountSubmission(sub) ? '🏷️ Direct Discount' : '🏆 All Rewards'}
                    </Badge>
                    {getStatusBadge(sub.status, isDirectDiscountSubmission(sub))}
                  </div>
                  <div className="campaign-info">
                    <h3 className="campaign-title">{sub.campaign?.title || 'Unknown Campaign'}</h3>
                    <p className="campaign-advertiser text-tertiary text-xs">
                      by {sub.campaign?.advertiser?.full_name || sub.campaign?.advertiser?.username || 'Advertiser'}
                    </p>
                  </div>
                </div>

                {isDirectDiscountSubmission(sub) ? (
                  <div className="submission-card-body direct-discount-body">
                    <div className="stat-col">
                      <span className="stat-label">Platform</span>
                      <span className="stat-value platform">
                        <img src={getSocialIcon(sub.platform)} alt={sub.platform} className="platform-icon-sm" onError={(e) => e.currentTarget.style.display = 'none'} />
                        {sub.platform}
                      </span>
                    </div>
                  </div>
                ) : (
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
                )}

                {/* Direct Discount Voucher Card with Calculator */}
                {isDirectDiscountSubmission(sub) && ((sub as any).voucher_code || sub.status === 'verified' || sub.status === 'paid') && (
                  <div 
                    className="p-3 mx-4 mb-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">
                        🎟️ Voucher Code:
                      </span>
                      <Badge variant={(sub as any).voucher_status === 'redeemed' ? 'warning' : 'success'} size="sm">
                        {(sub as any).voucher_status === 'redeemed' ? 'REDEEMED' : 'ACTIVE'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-white/5">
                      <span className="font-mono text-sm font-bold text-emerald-300">
                        {(sub as any).voucher_code || getFallbackUniqueVoucherCode(sub.id)}
                      </span>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => {
                          const code = (sub as any).voucher_code || getFallbackUniqueVoucherCode(sub.id);
                          navigator.clipboard.writeText(code);
                          toast.success('Voucher code copied!');
                        }}
                        title="Copy voucher code"
                      >
                        <FiCopy size={13} />
                      </button>
                    </div>

                    {/* Show Custom Reward or Quick Calculator */}
                    {((sub as any).voucher_details?.is_custom_reward || (sub as any).voucher_details?.reward_type === 'custom_message' || (sub as any).voucher_details?.custom_message) ? (
                      <div className="p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center gap-2 mt-1">
                        <span className="text-base">🎁</span>
                        <div>
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Your Reward</span>
                          <span className="text-xs font-bold text-white">
                            {(sub as any).voucher_details?.custom_message || 'Custom Reward'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <DiscountCalculator
                          initialDiscountPercent={(sub as any).discount_percent || 15}
                          lockedDiscountPercent={(sub as any).discount_percent || 15}
                          isLockedPercent={true}
                          voucherCode={(sub as any).voucher_code}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="submission-card-footer">
                  <div className="submitted-date">
                    <FiClock size={12} />
                    <span>Submitted {new Date(sub.submitted_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* For review submissions: always allow directly opening the owner's review page */}
                    {isReviewSubmission(sub) ? (
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '4px 10px', fontSize: '12px', color: '#ffd54f', borderColor: 'rgba(255, 213, 79, 0.4)', background: 'rgba(255, 179, 0, 0.08)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const reviewUrl = getSubmissionReviewUrl(sub, sub.campaign);
                          if (reviewUrl) {
                            toast.success('Opening review page! ⭐');
                            openReviewPage(reviewUrl);
                          } else {
                            toast.error('Review link not found.');
                          }
                        }}
                        title="Directly open the review page set by the owner"
                      >
                        ⭐ Submit Another Review
                      </button>
                    ) : (
                      /* Only allow removing if not approved and no voucher code issued */
                      !(sub.status === 'verified' || sub.status === 'paid' || Boolean((sub as any).voucher_code)) && (
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '4px 8px', fontSize: '12px', color: '#ff453a', borderColor: 'rgba(255, 69, 58, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={(e) => handleRemoveSubmission(e, sub.id)}
                          title="Remove submission if made by mistake"
                        >
                          <FiTrash2 size={13} /> Remove
                        </button>
                      )
                    )}
                    {sub.status === 'rejected' && (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '4px 8px', fontSize: '12px', background: '#ff3b30', borderColor: '#ff3b30' }}
                        onClick={(e) => handleDispute(e, sub.id)}
                      >
                        Raise Dispute
                      </button>
                    )}
                    {!isDirectDiscountSubmission(sub) && (
                      <a 
                        href={sub.video_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="view-video-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FiVideo size={14} /> View Video
                      </a>
                    )}
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
