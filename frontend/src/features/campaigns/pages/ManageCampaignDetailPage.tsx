import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiFlag, FiVideo, FiDollarSign, FiCheck } from 'react-icons/fi';
import { useAuthStore } from '../../../store/authStore';
import { useCampaignStore } from '../../../store/campaignStore';
import { useGlobalModalStore } from '../../../store/globalModalStore';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import { formatCurrency } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import './ManageCampaignsPage.css';

const ManageCampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { myCreatedCampaigns, fetchMyCreatedCampaigns, flagSubmissionByAdvertiser, approveSubmissionByAdvertiser, submitCampaignToAdmin, isLoading } = useCampaignStore();
  const { showConfirm, showAlert } = useGlobalModalStore();

  useEffect(() => {
    if (user?.id && myCreatedCampaigns.length === 0) {
      fetchMyCreatedCampaigns(user.id);
    }
  }, [user?.id, myCreatedCampaigns.length, fetchMyCreatedCampaigns]);

  const campaign = useMemo(() => myCreatedCampaigns.find(c => c.id === id), [myCreatedCampaigns, id]);
  const submissions = (campaign?.submissions as any[]) || [];

  const handleFlagSubmission = async (submissionId: string) => {
    const confirmed = await showConfirm(
      "Are you sure you want to flag this submission? Admin will review it and decide whether to reject it permanently.",
      "Flag Video"
    );
    if (!confirmed) return;
    
    try {
      await flagSubmissionByAdvertiser(submissionId);
      toast.success('Submission flagged for admin review');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to flag submission. Please try again.');
    }
  };

  const handleApproveSubmission = async (submissionId: string) => {
    try {
      await approveSubmissionByAdvertiser(submissionId);
      showAlert("Submission approved! Sent to Admin for final payment processing.", "Success");
    } catch (err) {
      console.error(err);
      showAlert('Failed to approve submission. Please try again.');
    }
  };

  const handleSubmitCampaign = async () => {
    const confirmed = await showConfirm('Submit this campaign for final approval? You will not be able to verify more submissions after this.');
    if (!confirmed) return;
    try {
      await submitCampaignToAdmin(id!);
      toast.success('Campaign submitted for final approval and payout!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit campaign.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="warning" size="sm">Pending</Badge>;
      case 'verified': return <Badge variant="success" size="sm">Verified</Badge>;
      case 'paid': return <Badge variant="accent" size="sm">Paid</Badge>;
      case 'rejected': return <Badge variant="error" size="sm">Rejected</Badge>;
      case 'flagged': return <Badge variant="error" size="sm">Flagged (Reviewing)</Badge>;
      case 'verified': return <Badge variant="success" size="sm">Approved</Badge>;
      case 'disputed': return <Badge variant="warning" size="sm">Disputed</Badge>;
      default: return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  if (isLoading && !campaign) {
    return (
      <div className="manage-campaigns-page flex justify-center items-center h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="manage-campaigns-page flex flex-col justify-center items-center h-screen gap-4">
        <h2>Campaign Not Found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/manage-campaigns')}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="manage-campaigns-page">
      <header className="manage-header">
        <button className="icon-btn" onClick={() => navigate('/manage-campaigns')}>
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="manage-title">Campaign Submissions</h1>
        </div>
      </header>

      <main className="manage-main">
        <div className="manage-detail-header">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-2xl font-bold text-white">{campaign.title || 'Untitled'}</h2>
            <Badge variant={campaign.status === 'active' ? 'success' : 'default'}>{campaign.status.toUpperCase()}</Badge>
          </div>
          <p className="text-secondary mb-4">{campaign.slogan}</p>
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-xs text-tertiary mb-1 font-bold tracking-wider">BUDGET</p>
              <p className="text-xl font-black text-accent">{formatCurrency(campaign.prize_pool || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-tertiary mb-1 font-bold tracking-wider">SUBMISSIONS</p>
              <p className="text-xl font-black text-white"><FiVideo className="inline mr-1" size={16}/>{submissions.length}</p>
            </div>
          </div>
          
          {campaign.status === 'active' && (
            <div className="mt-6">
              <button 
                className="fancy-btn primary-glow w-full"
                onClick={handleSubmitCampaign}
              >
                Submit Campaign for Final Approval
              </button>
              <p className="text-xs text-secondary mt-2 text-center">Verify all submissions before clicking this.</p>
            </div>
          )}
          
          {campaign.status === 'paused' && (
            <div className="mt-6 p-4 rounded-xl border border-warning/20 bg-warning/5 text-warning flex items-center justify-center font-bold">
              <FiCheck className="mr-2" /> Campaign Submitted for Admin Final Approval
            </div>
          )}
        </div>

        <h3 className="font-bold text-lg mb-4 text-white">All Submissions</h3>
        
        {submissions.length === 0 ? (
          <div className="glass-panel text-center p-8">
            <p className="text-secondary">No submissions received yet.</p>
          </div>
        ) : (
          <div className="submission-list">
            {submissions.map(sub => (
              <motion.div 
                key={sub.id} 
                className="submission-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="submission-info">
                  <Avatar src={sub.creator?.avatar_url} name={sub.creator?.full_name || '?'} size="md" />
                  <div>
                    <p className="font-bold text-white text-base">{sub.creator?.full_name}</p>
                    <a href={sub.video_url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent underline">
                      Watch Video Link
                    </a>
                  </div>
                </div>
                
                <div className="submission-actions">
                  <div className="flex justify-end w-full mb-1">
                    {getStatusBadge(sub.status)}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(sub.status === 'pending' && campaign.status === 'active') && (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => handleApproveSubmission(sub.id)}
                      >
                        <FiCheck /> Approve
                      </button>
                    )}
                    {(sub.status === 'pending' || sub.status === 'verified' || sub.status === 'paid') && campaign.status === 'active' && (
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: '#ff3b30', borderColor: '#ff3b30' }}
                        onClick={() => handleFlagSubmission(sub.id)}
                      >
                        <FiFlag /> Flag
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageCampaignDetailPage;
