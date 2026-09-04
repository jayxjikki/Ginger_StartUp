// ═══════════════════════════════════════════════════════════
// GINGER — Admin Dashboard
// Premium Global administration panel
// ═══════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, FiVideo, FiDollarSign, FiImage, FiTarget, 
  FiTrash2, FiCheckCircle, FiXCircle, FiSlash, FiMenu 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAdminStore } from '../../../store/adminStore';
import { useAuthStore } from '../../../store/authStore';
import { useGlobalModalStore } from '../../../store/globalModalStore';
import { formatCurrency, formatDate } from '../../../utils/formatters';
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
    fetchAllData, toggleUserBan, rejectSubmission,
    processWithdrawal, deleteSlideshow, createSlideshow, deleteCampaign, approveAndPayCampaign 
  } = useAdminStore();

  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
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

  const handleRejectSubmission = async (subId: string) => {
    const confirmed = await useGlobalModalStore.getState().showConfirm('Reject this submission?');
    if (!confirmed) return;
    try {
      await rejectSubmission(subId);
      toast.success('Submission rejected');
    } catch (err: any) {
      toast.error(err.message);
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

  const renderSubmissions = () => (
    <motion.div variants={listVariants} initial="hidden" animate="show" className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Creator</th>
            <th>Video Link</th>
            <th>Status</th>
            <th>Earned</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map(s => (
            <motion.tr variants={itemVariants} key={s.id} className="admin-table-row">
              <td className="user-cell">
                <Avatar src={s.profiles?.avatar_url} name={s.profiles?.full_name || '?'} size="sm" />
                <span className="user-cell-name">{s.profiles?.full_name}</span>
              </td>
              <td>
                <a href={s.video_url} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                  View Video
                </a>
              </td>
              <td>
                <Badge variant={s.status === 'approved' ? 'success' : s.status === 'rejected' ? 'error' : 'warning'}>
                  {s.status.toUpperCase()}
                </Badge>
              </td>
              <td>{s.earned_amount > 0 ? formatCurrency(s.earned_amount) : '-'}</td>
              <td>
                {(s.status === 'pending' || s.status === 'flagged' || s.status === 'verified') && (
                  <div className="action-buttons">
                    <button className="icon-btn reject" onClick={() => handleRejectSubmission(s.id)} title="Reject">
                      <FiXCircle />
                    </button>
                  </div>
                )}
              </td>
            </motion.tr>
          ))}
          {submissions.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-state">No pending video submissions.</td>
            </tr>
          )}
        </tbody>
      </table>
    </motion.div>
  );

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
    </div>
  );
};

export default AdminDashboard;
