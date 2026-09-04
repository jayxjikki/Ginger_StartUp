// ═══════════════════════════════════════════════════════════
// GINGER — Admin Dashboard
// Premium Global administration panel
// ═══════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, FiVideo, FiDollarSign, FiImage, FiTarget, 
  FiTrash2, FiCheckCircle, FiXCircle, FiSlash, FiMenu,
  FiPlay, FiEye, FiCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAdminStore } from '../../../store/adminStore';
import { useAuthStore } from '../../../store/authStore';
import { useGlobalModalStore } from '../../../store/globalModalStore';
import { formatCurrency, formatDate, formatCount } from '../../../utils/formatters';
import { getVideoThumbnail } from '../../../utils/videoHelpers';
import { getSocialIcon } from '../../../utils/socialHelpers';
import SubmissionVideoModal from '../../campaigns/components/SubmissionVideoModal';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import ImageUpload from '../../../components/ui/ImageUpload';
import './AdminDashboard.css';

// --- Animation Variants ---
const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { profile } = useAuthStore();
  
  const { 
    users, campaigns, submissions, withdrawals, slideshows, isLoading,
    fetchAllData, toggleUserBan, rejectSubmission, deleteSubmission,
    approveSubmissionAsAdmin,
    processWithdrawal, deleteSlideshow, createSlideshow, deleteCampaign, approveAndPayCampaign 
  } = useAdminStore();

  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [selectedSubmissionForModal, setSelectedSubmissionForModal] = useState<any | null>(null);
  const [subFilter, setSubFilter] = useState<'all' | 'needs_admin' | 'pending' | 'paid' | 'rejected'>('all');
  const [slideForm, setSlideForm] = useState({
    title: '', subtitle: '', image_url: '', badge_text: '', badge_icon: 'star', theme_color: 'red', link_url: ''
  });

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  if (isLoading && users.length === 0) {
    return (
      <div className="flex-center" style={{ height: '70vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  // --- Handlers ---
  const handleBan = async (userId: string, currentBanStatus: boolean) => {
    try {
      await toggleUserBan(userId, !currentBanStatus);
      toast.success(currentBanStatus ? 'User Unbanned' : 'User Banned');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleApproveAndPayCampaign = async (campaignId: string) => {
    const payout = parseFloat(prompt('Enter payout amount per verified creator for this campaign:', '0') || '0');
    if (isNaN(payout) || payout < 0) return toast.error('Invalid payout amount');
    
    const confirmed = await useGlobalModalStore.getState().showConfirm(`Approve this campaign and pay ${formatCurrency(payout)} to each verified creator? The remaining budget will be refunded to the advertiser.`);
    if (!confirmed) return;
    
    try {
      await approveAndPayCampaign(campaignId, payout);
      toast.success('Campaign completed, creators paid, and advertiser refunded!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleApproveSubmission = async (sub: any) => {
    const isDirectDiscount = sub.submission_type === 'direct_discount';
    let payout = 0;

    if (isDirectDiscount) {
      const confirmed = await useGlobalModalStore.getState().showConfirm(
        `Approve this direct discount video as final call? Creator will receive verified completion status for "${sub.campaign?.title || 'this campaign'}".`
      );
      if (!confirmed) return;
    } else {
      const input = prompt(
        `Approve this submission as final call?\n\nEnter cash payout amount in ₹ (leave 0 if milestone/tier or perk reward):`,
        sub.earned_amount > 0 ? String(sub.earned_amount) : '0'
      );
      if (input === null) return;
      payout = parseFloat(input.trim()) || 0;
      if (payout < 0) return toast.error('Payout amount cannot be negative');
    }

    try {
      await approveSubmissionAsAdmin(sub.id, payout);
      toast.success(payout > 0 
        ? `Submission approved! ${formatCurrency(payout)} paid to creator.` 
        : 'Submission approved as final call!'
      );
      if (selectedSubmissionForModal?.id === sub.id) {
        setSelectedSubmissionForModal(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve submission');
    }
  };

  const handleRejectSubmission = async (subId: string) => {
    const confirmed = await useGlobalModalStore.getState().showConfirm('Reject this submission? Creator will see the rejected status.');
    if (!confirmed) return;
    try {
      await rejectSubmission(subId);
      toast.success('Submission rejected');
      if (selectedSubmissionForModal?.id === subId) {
        setSelectedSubmissionForModal(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject submission');
    }
  };

  const handleDeleteSubmission = async (subId: string) => {
    const confirmed = await useGlobalModalStore.getState().showConfirm('Delete this submission permanently?');
    if (!confirmed) return;
    try {
      await deleteSubmission(subId);
      toast.success('Submission deleted permanently');
      if (selectedSubmissionForModal?.id === subId) {
        setSelectedSubmissionForModal(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete submission');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    const confirmed = await useGlobalModalStore.getState().showConfirm('Delete this campaign completely? This action cannot be undone.');
    if (!confirmed) return;
    try {
      await deleteCampaign(id);
      toast.success('Campaign deleted permanently');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleProcessWithdrawal = async (txId: string) => {
    const confirmed = await useGlobalModalStore.getState().showConfirm('Mark this withdrawal as completed?');
    if (!confirmed) return;
    try {
      await processWithdrawal(txId);
      toast.success('Withdrawal marked as completed');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSlideshow(slideForm);
      toast.success('Slideshow added!');
      setIsSlideModalOpen(false);
      setSlideForm({ title: '', subtitle: '', image_url: '', badge_text: '', badge_icon: 'star', theme_color: 'red', link_url: '' });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!window.confirm('Delete this slideshow?')) return;
    try {
      await deleteSlideshow(id);
      toast.success('Slideshow deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // --- Render Tabs ---
  const renderOverview = () => (
    <motion.div className="admin-grid" variants={listVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants} className="stat-card">
        <FiUsers className="stat-icon" />
        <div className="stat-info">
          <h3>{users.length}</h3>
          <p>Total Users</p>
        </div>
      </motion.div>
      <motion.div variants={itemVariants} className="stat-card">
        <FiTarget className="stat-icon" />
        <div className="stat-info">
          <h3>{campaigns.length}</h3>
          <p>Campaigns</p>
        </div>
      </motion.div>
      <motion.div variants={itemVariants} className="stat-card">
        <FiVideo className="stat-icon" />
        <div className="stat-info">
          <h3>{submissions.filter(s => s.status === 'pending').length}</h3>
          <p>Pending Videos</p>
        </div>
      </motion.div>
      <motion.div variants={itemVariants} className="stat-card">
        <FiDollarSign className="stat-icon" />
        <div className="stat-info">
          <h3>{withdrawals.filter(w => w.status === 'pending').length}</h3>
          <p>Pending Payouts</p>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderUsers = () => (
    <motion.div variants={listVariants} initial="hidden" animate="show" className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <motion.tr variants={itemVariants} key={u.id} className="admin-table-row">
              <td className="user-cell">
                <Avatar src={u.avatar_url} name={u.full_name || 'U'} size="md" />
                <div className="user-cell-info">
                  <span className="user-cell-name">{u.full_name}</span>
                  <span className="user-cell-handle">@{u.username}</span>
                </div>
              </td>
              <td>
                <Badge variant={u.role === 'admin' ? 'accent' : 'default'}>{(u.role || "user").toUpperCase()}</Badge>
              </td>
              <td>{formatDate(u.created_at)}</td>
              <td>
                <Badge variant={u.is_banned ? 'error' : 'success'}>
                  {u.is_banned ? 'Banned' : 'Active'}
                </Badge>
              </td>
              <td>
                <div className="action-buttons">
                  <button 
                    className={`icon-btn ${u.is_banned ? 'unban' : 'ban'}`}
                    onClick={() => handleBan(u.id, u.is_banned ?? false)}
                    title={u.is_banned ? "Unban User" : "Ban User"}
                  >
                    {u.is_banned ? <FiCheckCircle /> : <FiSlash />}
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-state">No users found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </motion.div>
  );

  const renderSubmissions = () => {
    const counts = {
      all: submissions.length,
      needs_admin: submissions.filter(s => s.status === 'verified').length,
      pending: submissions.filter(s => s.status === 'pending').length,
      paid: submissions.filter(s => s.status === 'paid').length,
      rejected: submissions.filter(s => s.status === 'rejected').length,
    };

    const filtered = submissions.filter(s => {
      if (subFilter === 'needs_admin') return s.status === 'verified';
      if (subFilter === 'pending') return s.status === 'pending';
      if (subFilter === 'paid') return s.status === 'paid';
      if (subFilter === 'rejected') return s.status === 'rejected';
      return true;
    });

    return (
      <motion.div variants={listVariants} initial="hidden" animate="show" className="admin-submissions-section">
        {/* Submissions Filter Pills */}
        <div className="admin-sub-filters">
          <button
            type="button"
            className={`sub-filter-pill ${subFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSubFilter('all')}
          >
            <span>All Submissions</span>
            <span className="pill-count">{counts.all}</span>
          </button>

          <button
            type="button"
            className={`sub-filter-pill highlight-needs-admin ${subFilter === 'needs_admin' ? 'active' : ''}`}
            onClick={() => setSubFilter('needs_admin')}
          >
            <span className="pulsing-dot-accent" />
            <span>Needs Final Call (Owner Approved)</span>
            <span className="pill-count count-highlight">{counts.needs_admin}</span>
          </button>

          <button
            type="button"
            className={`sub-filter-pill ${subFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setSubFilter('pending')}
          >
            <span>Pending Owner Review</span>
            <span className="pill-count">{counts.pending}</span>
          </button>

          <button
            type="button"
            className={`sub-filter-pill ${subFilter === 'paid' ? 'active' : ''}`}
            onClick={() => setSubFilter('paid')}
          >
            <span>Approved & Paid</span>
            <span className="pill-count">{counts.paid}</span>
          </button>

          <button
            type="button"
            className={`sub-filter-pill ${subFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setSubFilter('rejected')}
          >
            <span>Rejected</span>
            <span className="pill-count">{counts.rejected}</span>
          </button>
        </div>

        {/* Table Container */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Video</th>
                <th>Creator</th>
                <th>Campaign</th>
                <th>Type</th>
                <th>Views & Earned</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const platform = s.platform || 'video';
                const platformIcon = getSocialIcon(platform);
                const thumbUrl = getVideoThumbnail(s.video_url, platform);

                return (
                  <motion.tr variants={itemVariants} key={s.id} className="admin-table-row">
                    {/* Video Thumbnail Cell */}
                    <td className="video-thumb-cell">
                      <div 
                        className="admin-video-thumb-box"
                        onClick={() => setSelectedSubmissionForModal(s)}
                        title="Click to play video"
                      >
                        <img 
                          src={thumbUrl || '/images/brand/logo.png'} 
                          alt="Video thumbnail"
                          className="admin-thumb-img"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/brand/logo.png';
                          }}
                        />
                        <div className="admin-thumb-play-overlay">
                          <FiPlay size={14} />
                        </div>
                        {platformIcon && (
                          <div className="admin-thumb-platform-tag">
                            <img 
                              src={platformIcon} 
                              alt={platform} 
                              style={{ width: 12, height: 12, minWidth: 12, maxWidth: 12, objectFit: 'contain' }} 
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Creator Info */}
                    <td className="user-cell">
                      <Avatar 
                        src={s.creator?.avatar_url} 
                        name={s.creator?.full_name || 'Creator'} 
                        size="sm" 
                      />
                      <div className="user-cell-info">
                        <span className="user-cell-name">{s.creator?.full_name || 'Creator'}</span>
                        <span className="user-cell-handle">@{s.creator?.username || 'user'}</span>
                      </div>
                    </td>

                    {/* Campaign Info */}
                    <td>
                      <div className="admin-camp-cell">
                        <span className="admin-camp-title truncate" title={s.campaign?.title}>
                          {s.campaign?.title || 'Unknown Campaign'}
                        </span>
                        <span className="admin-camp-adv">
                          by {s.campaign?.advertiser?.full_name || 'Advertiser'}
                        </span>
                      </div>
                    </td>

                    {/* Submission Type */}
                    <td>
                      <Badge 
                        variant={s.submission_type === 'direct_discount' ? 'warning' : 'accent'} 
                        size="sm"
                      >
                        {s.submission_type === 'direct_discount' ? '🏷️ Direct Discount' : '🏆 All Rewards'}
                      </Badge>
                    </td>

                    {/* Views & Earned */}
                    <td>
                      <div className="admin-views-earned-cell">
                        <span className="admin-views-text flex items-center gap-1 text-xs">
                          <FiEye size={12} className="text-secondary" />
                          {formatCount(s.current_views || 0)}
                        </span>
                        <span className="admin-earned-text text-accent font-bold text-xs">
                          {s.earned_amount > 0 ? formatCurrency(s.earned_amount) : '₹0'}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      {s.status === 'verified' ? (
                        <Badge variant="success" size="sm">
                          <span className="pulsing-dot-inline" /> Owner Approved (Needs Admin)
                        </Badge>
                      ) : s.status === 'paid' ? (
                        <Badge variant="accent" size="sm">Admin Approved & Paid</Badge>
                      ) : s.status === 'pending' ? (
                        <Badge variant="warning" size="sm">Pending Owner Review</Badge>
                      ) : s.status === 'rejected' ? (
                        <Badge variant="error" size="sm">Rejected</Badge>
                      ) : (
                        <Badge variant="default" size="sm">{s.status?.toUpperCase()}</Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="action-buttons admin-submission-actions">
                        <button 
                          className="btn-admin-preview"
                          onClick={() => setSelectedSubmissionForModal(s)}
                          title="Watch Video"
                        >
                          <FiPlay size={12} />
                          <span>Watch</span>
                        </button>

                        {s.status !== 'paid' && (
                          <button 
                            className="btn-admin-approve"
                            onClick={() => handleApproveSubmission(s)}
                            title="Approve as Final Call"
                          >
                            <FiCheck size={13} />
                            <span>Approve (Final Call)</span>
                          </button>
                        )}

                        {s.status !== 'rejected' && (
                          <button 
                            className="icon-btn reject"
                            onClick={() => handleRejectSubmission(s.id)}
                            title="Reject Submission"
                          >
                            <FiXCircle size={15} />
                          </button>
                        )}

                        <button 
                          className="icon-btn reject"
                          style={{ opacity: 0.7 }}
                          onClick={() => handleDeleteSubmission(s.id)}
                          title="Delete Submission"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-state">
                    No video submissions found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  };

  const renderCampaigns = () => {
    // Sort campaigns so 'paused' (pending admin approval) appear first
    const sortedCampaigns = [...campaigns].sort((a, b) => {
      if (a.status === 'paused' && b.status !== 'paused') return -1;
      if (b.status === 'paused' && a.status !== 'paused') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    return (
      <motion.div variants={listVariants} initial="hidden" animate="show" className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Advertiser</th>
              <th>Total Budget</th>
              <th>Platform</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedCampaigns.map(c => (
              <motion.tr variants={itemVariants} key={c.id} className="admin-table-row">
                <td className="user-cell">
                  <Avatar 
                    src={Array.isArray(c.advertiser) ? c.advertiser[0]?.avatar_url : c.advertiser?.avatar_url} 
                    name={Array.isArray(c.advertiser) ? (c.advertiser[0]?.full_name || '?') : (c.advertiser?.full_name || '?')} 
                    size="sm" 
                  />
                  <span className="user-cell-name">
                    {Array.isArray(c.advertiser) ? c.advertiser[0]?.full_name : c.advertiser?.full_name}
                  </span>
                </td>
                <td className="text-accent font-bold">{formatCurrency(c.prize_pool || 0)}</td>
                <td><Badge variant="default">{(c.platform || 'all').toUpperCase()}</Badge></td>
                <td>
                  <Badge variant={c.status === 'active' ? 'success' : c.status === 'paused' ? 'warning' : 'default'}>
                    {c.status === 'paused' ? 'NEEDS PAYMENT' : c.status.toUpperCase()}
                  </Badge>
                </td>
                <td>
                  <div className="action-buttons">
                    {c.status === 'paused' && (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '4px 8px', fontSize: '12px', background: '#34c759', borderColor: '#34c759' }}
                        onClick={(e) => { e.stopPropagation(); handleApproveAndPayCampaign(c.id); }} 
                        title="Approve & Pay All"
                      >
                        Approve & Pay
                      </button>
                    )}
                    <button className="icon-btn reject" onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(c.id); }} title="Delete Campaign">
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">No campaigns found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>
    );
  };

  const renderWithdrawals = () => (
    <motion.div variants={listVariants} initial="hidden" animate="show" className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Amount</th>
            <th>Type</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.map(w => (
            <motion.tr variants={itemVariants} key={w.id} className="admin-table-row">
              <td className="user-cell">
                <Avatar src={w.profiles?.avatar_url} name={w.profiles?.full_name || '?'} size="sm" />
                <span className="user-cell-name">{w.profiles?.full_name}</span>
              </td>
              <td className="text-accent font-bold">{formatCurrency(w.amount)}</td>
              <td><Badge variant="default">{w.type.toUpperCase()}</Badge></td>
              <td>{formatDate(w.created_at)}</td>
              <td>
                <Badge variant={w.status === 'completed' ? 'success' : 'warning'}>
                  {w.status.toUpperCase()}
                </Badge>
              </td>
              <td>
                {w.status === 'pending' && (
                  <div className="action-buttons">
                    <button className="icon-btn approve" onClick={() => handleProcessWithdrawal(w.id)} title="Mark Paid">
                      <FiCheckCircle />
                    </button>
                  </div>
                )}
              </td>
            </motion.tr>
          ))}
          {withdrawals.length === 0 && (
            <tr>
              <td colSpan={6} className="empty-state">No withdrawal requests.</td>
            </tr>
          )}
        </tbody>
      </table>
    </motion.div>
  );

  const renderSlideshows = () => (
    <motion.div variants={listVariants} initial="hidden" animate="show" className="admin-table-container">
      <div className="admin-table-header">
        <h3 className="text-xl font-bold">Slideshows</h3>
        <Button variant="primary" size="sm" onClick={() => setIsSlideModalOpen(true)}>Add New Slide</Button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Redirect Link</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {slideshows.map(s => (
            <motion.tr variants={itemVariants} key={s.id} className="admin-table-row">
              <td className="user-cell">
                <img src={s.image_url} alt="slide" className="w-16 h-10 object-cover rounded" />
              </td>
              <td className="font-bold">{s.title}</td>
              <td>{s.link_url ? <a href={s.link_url} target="_blank" className="text-accent underline text-sm">{s.link_url}</a> : '-'}</td>
              <td>
                <div className="action-buttons">
                  <button className="icon-btn reject" onClick={() => handleDeleteSlide(s.id)} title="Delete Slide">
                    <FiTrash2 />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
          {slideshows.length === 0 && (
            <tr>
              <td colSpan={4} className="empty-state">No slideshows found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </motion.div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiTarget },
    { id: 'users', label: 'Users', icon: FiUsers },
    { id: 'campaigns', label: 'Campaigns', icon: FiTarget },
    { id: 'submissions', label: 'Submissions', icon: FiVideo },
    { id: 'withdrawals', label: 'Payouts', icon: FiDollarSign },
    { id: 'slideshows', label: 'Slideshows', icon: FiImage },
  ];

  return (
    <div className="admin-dashboard container-padding">
      <div className="admin-ambient-glow"></div>
      
      <div className="admin-header mb-8">
        <div className="flex items-center justify-center gap-4 relative">
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <FiMenu />
          </button>
          <h1 className="admin-page-title">Welcome, {profile?.full_name?.split(' ')[0] || 'Admin'}</h1>
        </div>
        <p className="text-secondary">Platform Control Center</p>
      </div>

      <div className="admin-layout">
        {/* Sidebar */}
        <div className={`admin-sidebar glass-strong ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMobileMenuOpen(false);
              }}
            >
              <tab.icon className="tab-icon" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="admin-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'users' && renderUsers()}
              {activeTab === 'campaigns' && renderCampaigns()}
              {activeTab === 'submissions' && renderSubmissions()}
              {activeTab === 'withdrawals' && renderWithdrawals()}
              {activeTab === 'slideshows' && renderSlideshows()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Slide Modal */}
      <AnimatePresence>
        {isSlideModalOpen && (
          <motion.div 
            className="admin-modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div 
              className="admin-modal-content glass-strong"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            >
              <button className="admin-modal-close" onClick={() => setIsSlideModalOpen(false)}>×</button>
              <h2 className="admin-modal-title">Add New Slide</h2>
              <form onSubmit={handleCreateSlide} className="admin-form">
                <input required type="text" placeholder="Title" className="input-field" value={slideForm.title} onChange={e => setSlideForm({...slideForm, title: e.target.value})} />
                <input required type="text" placeholder="Subtitle" className="input-field" value={slideForm.subtitle} onChange={e => setSlideForm({...slideForm, subtitle: e.target.value})} />
                
                <ImageUpload 
                  label="Slideshow Image" 
                  defaultImage={slideForm.image_url} 
                  onUploadSuccess={(url) => setSlideForm({...slideForm, image_url: url})} 
                />
                
                <input type="url" placeholder="Redirect Link (Optional)" className="input-field" value={slideForm.link_url} onChange={e => setSlideForm({...slideForm, link_url: e.target.value})} />
                <div className="admin-form-row">
                  <input required type="text" placeholder="Badge Text" className="input-field w-half" value={slideForm.badge_text} onChange={e => setSlideForm({...slideForm, badge_text: e.target.value})} />
                  <input required type="text" placeholder="Badge Icon (e.g. star)" className="input-field w-half" value={slideForm.badge_icon} onChange={e => setSlideForm({...slideForm, badge_icon: e.target.value})} />
                </div>
                <Button type="submit" variant="primary" className="mt-2">Save Slide</Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Submission Video Modal */}
      <SubmissionVideoModal
        submission={selectedSubmissionForModal}
        isOpen={!!selectedSubmissionForModal}
        onClose={() => setSelectedSubmissionForModal(null)}
        onApprove={() => handleApproveSubmission(selectedSubmissionForModal)}
        onReject={(id) => handleRejectSubmission(id)}
        isAdmin={true}
      />
    </div>
  );
};

export default AdminDashboard;
