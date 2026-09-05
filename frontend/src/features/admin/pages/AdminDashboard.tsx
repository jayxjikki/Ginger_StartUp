// ═══════════════════════════════════════════════════════════
// GINGER — Admin Dashboard
// Premium Global administration panel
// ═══════════════════════════════════════════════════════════

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, FiVideo, FiDollarSign, FiImage, FiTarget, 
  FiTrash2, FiCheckCircle, FiXCircle, FiSlash, FiMenu,
  FiPlay, FiEye, FiCheck, FiRotateCcw, FiExternalLink,
  FiSearch, FiChevronLeft, FiChevronRight,
  FiMessageSquare, FiSend, FiGrid, FiList
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
import { isDirectDiscountSubmission, isReviewSubmission, getSubmissionReviewUrl } from '../../../utils/submissionHelpers';
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
  const [activeTab, setActiveTab] = useState('submissions');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    return typeof window !== 'undefined' && window.innerWidth <= 900 ? 'cards' : 'table';
  });
  const { profile } = useAuthStore();
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const handleScrollTable = (direction: 'left' | 'right') => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({
        left: direction === 'left' ? -350 : 350,
        behavior: 'smooth'
      });
    }
  };
  
  const { 
    users, campaigns, submissions, withdrawals, slideshows, isLoading,
    fetchAllData, toggleUserBan, rejectSubmission, deleteSubmission,
    deleteUser, deleteWithdrawal,
    unflagSubmissionAsAdmin,
    approveSubmissionAsAdmin,
    processWithdrawal, deleteSlideshow, createSlideshow, deleteCampaign, approveAndPayCampaign,
    fetchUserNotifications, deleteUserNotification, fetchUserMessages, deleteUserMessage, sendGingerNotification
  } = useAdminStore();

  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [selectedSubmissionForModal, setSelectedSubmissionForModal] = useState<any | null>(null);
  const [subFilter, setSubFilter] = useState<'all' | 'needs_admin' | 'pending' | 'flagged' | 'paid' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'review' | 'photo' | 'post_link'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [slideForm, setSlideForm] = useState({
    title: '', subtitle: '', image_url: '', badge_text: '', badge_icon: 'star', theme_color: 'red', link_url: ''
  });

  // Communications & Notifications state
  const [selectedCommsUser, setSelectedCommsUser] = useState<any | null>(null);
  const [commsSubTab, setCommsSubTab] = useState<'notifs' | 'messages'>('notifs');
  const [userNotifs, setUserNotifs] = useState<any[]>([]);
  const [userMessages, setUserMessages] = useState<any[]>([]);
  const [userConversations, setUserConversations] = useState<any[]>([]);
  const [activeConversationPartner, setActiveConversationPartner] = useState<any | null>(null);
  const [isCommsLoading, setIsCommsLoading] = useState<boolean>(false);

  // Ginger notification composer modal state
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState<boolean>(false);
  const [notifyTargetUser, setNotifyTargetUser] = useState<any | null>(null);
  const [notifyTitle, setNotifyTitle] = useState<string>('');
  const [notifyMessage, setNotifyMessage] = useState<string>('');
  const [isSendingNotification, setIsSendingNotification] = useState<boolean>(false);

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
    const isDirectDiscount = isDirectDiscountSubmission(sub);
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
    const confirmed = await useGlobalModalStore.getState().showConfirm('Delete this submission permanently from the database? This action cannot be undone and will completely remove it from all lists.');
    if (!confirmed) return;
    try {
      await deleteSubmission(subId);
      toast.success('Submission deleted permanently from database');
      if (selectedSubmissionForModal?.id === subId) {
        setSelectedSubmissionForModal(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete submission');
    }
  };

  const handleUnflagSubmission = async (subId: string) => {
    const confirmed = await useGlobalModalStore.getState().showConfirm('Unflag this submission and restore to Pending review?');
    if (!confirmed) return;
    try {
      await unflagSubmissionAsAdmin(subId);
      toast.success('Submission unflagged and restored to pending');
      if (selectedSubmissionForModal?.id === subId) {
        setSelectedSubmissionForModal((prev: any) => prev ? { ...prev, status: 'pending' } : null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to unflag submission');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    const confirmed = await useGlobalModalStore.getState().showConfirm('Delete this campaign completely? This action cannot be undone and will purge all its submissions, reports, and records.');
    if (!confirmed) return;
    try {
      await deleteCampaign(id);
      toast.success('Campaign and all its records deleted permanently');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    const confirmed = await useGlobalModalStore.getState().showConfirm(
      `Permanently delete user "${name}"? This action cannot be undone and will completely wipe all their submissions, campaigns, and records.`,
      'Delete User'
    );
    if (!confirmed) return;
    try {
      await deleteUser(userId);
      toast.success('User and all associated records permanently deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  const handleDeleteWithdrawal = async (txId: string) => {
    const confirmed = await useGlobalModalStore.getState().showConfirm(
      'Permanently delete this payout request record? This cannot be undone.',
      'Delete Payout'
    );
    if (!confirmed) return;
    try {
      await deleteWithdrawal(txId);
      toast.success('Payout record permanently deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete payout');
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

  const handleSelectCommsUser = async (user: any) => {
    setSelectedCommsUser(user);
    setIsCommsLoading(true);
    try {
      const notifs = await fetchUserNotifications(user.id);
      setUserNotifs(notifs);
      const { messages, conversations } = await fetchUserMessages(user.id);
      setUserMessages(messages);
      setUserConversations(conversations);
      if (conversations.length > 0) {
        setActiveConversationPartner(conversations[0].partner);
      } else {
        setActiveConversationPartner(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load user communications');
    } finally {
      setIsCommsLoading(false);
    }
  };

  const handleDeleteUserNotification = async (notifId: string) => {
    const confirmed = await useGlobalModalStore.getState().showConfirm('Delete this notification permanently?');
    if (!confirmed) return;
    try {
      await deleteUserNotification(notifId);
      setUserNotifs(prev => prev.filter(n => n.id !== notifId));
      toast.success('Notification deleted permanently');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete notification');
    }
  };

  const handleDeleteUserMessage = async (msgId: string) => {
    const confirmed = await useGlobalModalStore.getState().showConfirm('Delete this message permanently?');
    if (!confirmed) return;
    try {
      await deleteUserMessage(msgId);
      setUserMessages(prev => prev.filter(m => m.id !== msgId));
      setUserConversations(prev => prev.map(c => ({
        ...c,
        messages: c.messages.filter((m: any) => m.id !== msgId)
      })).filter(c => c.messages.length > 0));
      toast.success('Message deleted permanently');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete message');
    }
  };

  const handleSendGingerNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyTargetUser) {
      toast.error('Please select a recipient user');
      return;
    }
    if (!notifyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    setIsSendingNotification(true);
    try {
      await sendGingerNotification(
        notifyTargetUser.id,
        notifyTitle.trim(),
        notifyMessage.trim(),
        profile?.id
      );
      toast.success(`Ginger Notification sent to ${notifyTargetUser.full_name || notifyTargetUser.username}!`);
      setIsNotifyModalOpen(false);
      setNotifyTitle('');
      setNotifyMessage('');
      if (selectedCommsUser?.id === notifyTargetUser.id) {
        handleSelectCommsUser(notifyTargetUser);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send notification');
    } finally {
      setIsSendingNotification(false);
    }
  };

  const openNotifyModalForUser = (targetUser: any) => {
    setNotifyTargetUser(targetUser);
    setIsNotifyModalOpen(true);
  };

  const openCommsForUser = (targetUser: any) => {
    setActiveTab('comms');
    handleSelectCommsUser(targetUser);
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

  const renderUsersCards = (userList: any[]) => {
    return (
      <div className="admin-cards-grid">
        {userList.map(u => (
          <motion.div variants={itemVariants} key={u.id} className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-user">
                <Avatar src={u.avatar_url} name={u.full_name || 'U'} size="md" />
                <div className="admin-card-user-info">
                  <span className="admin-card-name">{u.full_name}</span>
                  <span className="admin-card-handle">@{u.username}</span>
                </div>
              </div>
              <Badge variant={u.is_banned ? 'error' : 'success'}>
                {u.is_banned ? 'Banned' : 'Active'}
              </Badge>
            </div>

            <div className="admin-card-body">
              <div className="flex items-center justify-between text-xs text-secondary">
                <span>Role: <strong className="text-white">{(u.role || 'user').toUpperCase()}</strong></span>
                <span>Joined: {formatDate(u.created_at)}</span>
              </div>
            </div>

            <div className="admin-card-actions">
              <button 
                type="button"
                className={`btn-card-action ${u.is_banned ? 'btn-card-approve' : 'btn-card-reject'}`}
                onClick={() => handleBan(u.id, u.is_banned ?? false)}
                title={u.is_banned ? "Unban User" : "Ban User"}
              >
                {u.is_banned ? <FiCheckCircle size={13} /> : <FiSlash size={13} />}
                <span>{u.is_banned ? 'Unban' : 'Ban'}</span>
              </button>

              <button 
                type="button"
                className="btn-card-action btn-card-preview"
                onClick={() => openCommsForUser(u)}
                title="View user notifications & messages"
              >
                <FiMessageSquare size={13} />
                <span>Comms</span>
              </button>

              <button 
                type="button"
                className="btn-card-action"
                style={{ background: 'rgba(255, 77, 77, 0.15)', border: '1px solid rgba(255, 77, 77, 0.35)', color: '#ff8080' }}
                onClick={() => openNotifyModalForUser(u)}
                title="Send official Ginger Notification"
              >
                <FiSend size={13} />
                <span>Notify</span>
              </button>

              <button 
                type="button"
                className="btn-card-action btn-card-delete"
                onClick={() => handleDeleteUser(u.id, u.full_name || u.username || 'User')}
                title="Permanently Delete User"
              >
                <FiTrash2 size={13} />
                <span>Delete</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderUsers = () => (
    <motion.div variants={listVariants} initial="hidden" animate="show">
      {/* Header & View Switcher */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Users Management</span>
            <span className="admin-count-badge">{users.length} Users</span>
          </h3>
          <p className="text-xs text-secondary mt-0.5">Manage user access, ban/unban, view communications, and delete accounts.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="admin-view-toggle">
            <button 
              type="button" 
              className={`admin-view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Cards View (Best for Mobile)"
            >
              <FiGrid size={13} /> <span>Cards</span>
            </button>
            <button 
              type="button" 
              className={`admin-view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View (Best for Desktop)"
            >
              <FiList size={13} /> <span>Table</span>
            </button>
          </div>

          <button
            type="button"
            className="btn-ginger-notify"
            style={{ padding: '5px 12px', fontSize: '12px' }}
            onClick={() => {
              setNotifyTargetUser(users[0] || null);
              setIsNotifyModalOpen(true);
            }}
          >
            <FiSend size={13} /> <span>Notify User</span>
          </button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        renderUsersCards(users)
      ) : (
        <>
          <div className="table-scroll-banner">
            <span className="scroll-hint-text">↔️ Scroll horizontally to see all columns & actions</span>
            <div className="table-scroll-btn-group">
              <button type="button" className="table-scroll-btn" onClick={() => handleScrollTable('left')} title="Scroll Left">
                <FiChevronLeft size={14} /> <span>Left</span>
              </button>
              <button type="button" className="table-scroll-btn" onClick={() => handleScrollTable('right')} title="Scroll Right">
                <span>Right</span> <FiChevronRight size={14} />
              </button>
            </div>
          </div>
          <div className="admin-table-container" ref={tableContainerRef}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '200px' }}>User</th>
                  <th style={{ minWidth: '110px' }}>Role</th>
                  <th style={{ minWidth: '130px' }}>Joined</th>
                  <th style={{ minWidth: '110px' }}>Status</th>
                  <th className="admin-sticky-actions-header" style={{ width: '190px', minWidth: '190px' }}>Actions</th>
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
                    <td className="admin-sticky-actions-cell">
                      <div className="action-buttons">
                        <button 
                          className={`icon-btn ${u.is_banned ? 'unban' : 'ban'}`}
                          onClick={() => handleBan(u.id, u.is_banned ?? false)}
                          title={u.is_banned ? "Unban User" : "Ban User"}
                        >
                          {u.is_banned ? <FiCheckCircle /> : <FiSlash />}
                        </button>
                        <button 
                          className="icon-btn" 
                          style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                          onClick={() => openCommsForUser(u)}
                          title="Inspect User Notifications & Messages"
                        >
                          <FiMessageSquare />
                        </button>
                        <button 
                          className="icon-btn" 
                          style={{ background: 'rgba(255, 77, 77, 0.15)', color: '#ff8080', border: '1px solid rgba(255, 77, 77, 0.3)' }}
                          onClick={() => openNotifyModalForUser(u)}
                          title="Send Official Ginger Notification"
                        >
                          <FiSend />
                        </button>
                        <button 
                          className="icon-btn reject" 
                          onClick={() => handleDeleteUser(u.id, u.full_name || u.username || 'User')}
                          title="Permanently Delete User & All Their Records"
                        >
                          <FiTrash2 />
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
          </div>
        </>
      )}
    </motion.div>
  );

  const getSubmissionTypeCategory = (s: any): 'review' | 'photo' | 'post_link' | 'video' => {
    if (isReviewSubmission(s)) return 'review';
    const url = (s.video_url || '').toLowerCase();
    if (
      /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url) ||
      (url.includes('cloudinary.com') && url.includes('/image/upload/'))
    ) {
      return 'photo';
    }
    if (
      url.includes('instagram.com/p/') ||
      url.includes('instagram.com/stories/') ||
      url.includes('instagram.com/reel/') ||
      url.includes('tiktok.com/@') ||
      url.includes('twitter.com') ||
      url.includes('x.com') ||
      url.includes('facebook.com') ||
      url.includes('threads.net')
    ) {
      return 'post_link';
    }
    return 'video';
  };

  const renderSubmissionsCards = (filtered: any[]) => {
    return (
      <div className="admin-cards-grid">
        {filtered.map(s => {
          const sType = getSubmissionTypeCategory(s);
          const isReview = sType === 'review';
          const isPhoto = sType === 'photo';
          const isPostLink = sType === 'post_link';
          const platform = s.platform || 'video';
          const thumbUrl = getVideoThumbnail(s.video_url, platform);
          const revUrl = isReview ? getSubmissionReviewUrl(s, s.campaign) : null;
          const isDirectDiscount = isDirectDiscountSubmission(s);
          const voucherDetails = s.voucher_details || {};
          const discountPct = voucherDetails.discount_percent || voucherDetails.discount_rate || s.campaign?.direct_discount_rate || 0;
          const perkTerm = voucherDetails.perk_term || voucherDetails.reward_text || s.campaign?.direct_perk_term;

          return (
            <motion.div variants={itemVariants} key={s.id} className="admin-card">
              {/* Card Header: Creator Info + Status Badge */}
              <div className="admin-card-header">
                <div className="admin-card-user">
                  <Avatar 
                    src={s.creator?.avatar_url} 
                    name={s.creator?.full_name || 'Creator'} 
                    size="sm" 
                  />
                  <div className="admin-card-user-info">
                    <span className="admin-card-name">{s.creator?.full_name || 'Creator'}</span>
                    <span className="admin-card-handle">@{s.creator?.username || 'user'}</span>
                  </div>
                </div>

                <div>
                  {s.status === 'verified' ? (
                    <Badge variant="success" size="sm">
                      <span className="pulsing-dot-inline" /> Owner Approved
                    </Badge>
                  ) : s.status === 'paid' ? (
                    <Badge variant="accent" size="sm">Admin Approved & Paid</Badge>
                  ) : s.status === 'pending' ? (
                    <Badge variant="warning" size="sm">Pending Owner</Badge>
                  ) : s.status === 'flagged' ? (
                    <Badge variant="error" size="sm">🚩 Flagged</Badge>
                  ) : s.status === 'rejected' ? (
                    <Badge variant="error" size="sm">Rejected</Badge>
                  ) : (
                    <Badge variant="default" size="sm">{s.status?.toUpperCase()}</Badge>
                  )}
                </div>
              </div>

              {/* Card Body: Media Preview + Campaign + Type & Reward */}
              <div className="admin-card-body">
                <div className="admin-card-media-row">
                  {/* Thumbnail */}
                  <div 
                    className="admin-card-media-preview"
                    onClick={() => {
                      if (isReview && revUrl) {
                        window.open(revUrl, '_blank');
                      } else {
                        setSelectedSubmissionForModal(s);
                      }
                    }}
                    title="Tap to preview"
                  >
                    {isReview ? (
                      <div className="flex-center flex-col h-full bg-amber-950/30">
                        <span style={{ fontSize: '20px' }}>⭐</span>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#fbbf24' }}>REVIEW</span>
                      </div>
                    ) : (
                      <>
                        <img 
                          src={isPhoto ? s.video_url : (thumbUrl || '/images/brand/logo.png')} 
                          alt="Proof" 
                          className="admin-card-media-img"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/images/brand/logo.png'; }}
                        />
                        <div className="admin-card-media-overlay">
                          {isPhoto ? <FiEye size={18} /> : isPostLink ? <FiExternalLink size={18} /> : <FiPlay size={18} />}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Details */}
                  <div className="admin-card-details">
                    <span className="admin-card-camp-title">{s.campaign?.title || 'Unknown Campaign'}</span>
                    <span className="admin-card-camp-adv">by {s.campaign?.advertiser?.full_name || 'Advertiser'}</span>
                    
                    <div className="admin-card-badges">
                      {isReview ? (
                        <span className="admin-tag-pill review">⭐ Review</span>
                      ) : isDirectDiscount ? (
                        <span className="admin-tag-pill direct">
                          🏷️ {discountPct > 0 ? `${discountPct}% Off` : (perkTerm || 'Perk Reward')}
                        </span>
                      ) : (
                        <span className="admin-tag-pill video">
                          🎬 Video ({formatCurrency(s.earned_amount || 0)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="admin-card-stats">
                  <span>Views: <strong className="text-white">{formatCount(s.views_count || 0)}</strong></span>
                  <span>Earned: <strong className="text-accent">{formatCurrency(s.earned_amount || 0)}</strong></span>
                  <span>{formatDate(s.submitted_at || s.created_at)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="admin-card-actions">
                <button 
                  type="button"
                  className="btn-card-action btn-card-preview"
                  onClick={() => {
                    if (isReview && revUrl) {
                      window.open(revUrl, '_blank');
                    } else {
                      setSelectedSubmissionForModal(s);
                    }
                  }}
                >
                  {isReview ? <FiExternalLink size={13} /> : isPhoto ? <FiEye size={13} /> : <FiPlay size={13} />}
                  <span>{isReview ? 'Review' : isPhoto ? 'Proof' : 'Watch'}</span>
                </button>

                {s.status !== 'paid' && (
                  <button 
                    type="button"
                    className="btn-card-action btn-card-approve"
                    onClick={() => handleApproveSubmission(s)}
                    title="Approve as Final Call"
                  >
                    <FiCheck size={13} />
                    <span>Approve</span>
                  </button>
                )}

                {s.status === 'flagged' && (
                  <button 
                    type="button"
                    className="btn-card-action btn-card-unflag"
                    onClick={() => handleUnflagSubmission(s.id)}
                    title="Unflag and restore to pending"
                  >
                    <FiRotateCcw size={13} />
                    <span>Unflag</span>
                  </button>
                )}

                {s.status !== 'rejected' && (
                  <button 
                    type="button"
                    className="btn-card-action btn-card-reject"
                    onClick={() => handleRejectSubmission(s.id)}
                    title="Reject"
                  >
                    <FiXCircle size={13} />
                    <span>Reject</span>
                  </button>
                )}

                <button 
                  type="button"
                  className="btn-card-action btn-card-delete"
                  onClick={() => handleDeleteSubmission(s.id)}
                  title="Permanently Delete Submission"
                >
                  <FiTrash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '2.5rem' }}>
            No submissions found matching the selected filters.
          </div>
        )}
      </div>
    );
  };

  const renderSubmissions = () => {
    const counts = {
      all: submissions.length,
      needs_admin: submissions.filter(s => s.status === 'verified').length,
      pending: submissions.filter(s => s.status === 'pending').length,
      flagged: submissions.filter(s => s.status === 'flagged').length,
      paid: submissions.filter(s => s.status === 'paid').length,
      rejected: submissions.filter(s => s.status === 'rejected').length,
    };

    const typeCounts = {
      all: submissions.length,
      video: submissions.filter(s => getSubmissionTypeCategory(s) === 'video').length,
      review: submissions.filter(s => getSubmissionTypeCategory(s) === 'review').length,
      photo: submissions.filter(s => getSubmissionTypeCategory(s) === 'photo').length,
      post_link: submissions.filter(s => getSubmissionTypeCategory(s) === 'post_link').length,
    };

    const filtered = submissions.filter(s => {
      // 1. Status Filter
      if (subFilter === 'needs_admin' && s.status !== 'verified') return false;
      if (subFilter === 'pending' && s.status !== 'pending') return false;
      if (subFilter === 'flagged' && s.status !== 'flagged') return false;
      if (subFilter === 'paid' && s.status !== 'paid') return false;
      if (subFilter === 'rejected' && s.status !== 'rejected') return false;

      // 2. Type Filter
      const sType = getSubmissionTypeCategory(s);
      if (typeFilter !== 'all' && sType !== typeFilter) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const creatorName = (s.creator?.full_name || '').toLowerCase();
        const username = (s.creator?.username || '').toLowerCase();
        const campaignTitle = (s.campaign?.title || '').toLowerCase();
        const voucher = (s.voucher_code || '').toLowerCase();
        const url = (s.video_url || '').toLowerCase();
        const rewardMsg = (s.voucher_details?.custom_message || s.voucher_details?.reward_text || '').toLowerCase();
        if (
          !creatorName.includes(q) &&
          !username.includes(q) &&
          !campaignTitle.includes(q) &&
          !voucher.includes(q) &&
          !url.includes(q) &&
          !rewardMsg.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });

    return (
      <motion.div variants={listVariants} initial="hidden" animate="show" className="admin-submissions-section">
        {/* Submissions Control Header */}
        <div className="admin-submissions-header-bar">
          <div className="admin-toolbar-top flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Submissions Management</span>
                <span className="admin-count-badge">{filtered.length} of {submissions.length}</span>
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Review, approve, and manage all creator submissions across campaigns. Admin can view and delete any submission.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* View Switcher */}
              <div className="admin-view-toggle">
                <button 
                  type="button" 
                  className={`admin-view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                  onClick={() => setViewMode('cards')}
                  title="Cards View (Best for Mobile)"
                >
                  <FiGrid size={13} /> <span>Cards</span>
                </button>
                <button 
                  type="button" 
                  className={`admin-view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Table View (Best for Desktop)"
                >
                  <FiList size={13} /> <span>Table</span>
                </button>
              </div>

              {/* Quick Search */}
              <div className="admin-search-wrapper">
                <FiSearch className="admin-search-icon" size={15} />
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Search creator, campaign, or voucher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="admin-search-clear"
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                  >
                    <FiXCircle size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Type Filter Tabs: All, Videos, Reviews, Photos, Posts/Links */}
          <div className="admin-filter-row">
            <span className="filter-row-label">TYPE:</span>
            <div className="admin-type-filters">
              <button
                type="button"
                className={`type-filter-pill ${typeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                <span>All Types</span>
                <span className="pill-count">{typeCounts.all}</span>
              </button>

              <button
                type="button"
                className={`type-filter-pill ${typeFilter === 'video' ? 'active' : ''}`}
                onClick={() => setTypeFilter('video')}
              >
                <span>🎬 Videos</span>
                <span className="pill-count">{typeCounts.video}</span>
              </button>

              <button
                type="button"
                className={`type-filter-pill highlight-review ${typeFilter === 'review' ? 'active' : ''}`}
                onClick={() => setTypeFilter('review')}
              >
                <span>⭐ Reviews</span>
                <span className="pill-count">{typeCounts.review}</span>
              </button>

              <button
                type="button"
                className={`type-filter-pill ${typeFilter === 'photo' ? 'active' : ''}`}
                onClick={() => setTypeFilter('photo')}
              >
                <span>📸 Photos / Proofs</span>
                <span className="pill-count">{typeCounts.photo}</span>
              </button>

              <button
                type="button"
                className={`type-filter-pill ${typeFilter === 'post_link' ? 'active' : ''}`}
                onClick={() => setTypeFilter('post_link')}
              >
                <span>📱 Posts & Links</span>
                <span className="pill-count">{typeCounts.post_link}</span>
              </button>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="admin-filter-row">
            <span className="filter-row-label">STATUS:</span>
            <div className="admin-sub-filters">
              <button
                type="button"
                className={`sub-filter-pill ${subFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSubFilter('all')}
              >
                <span>All Statuses</span>
                <span className="pill-count">{counts.all}</span>
              </button>

              <button
                type="button"
                className={`sub-filter-pill highlight-needs-admin ${subFilter === 'needs_admin' ? 'active' : ''}`}
                onClick={() => setSubFilter('needs_admin')}
              >
                <span className="pulsing-dot-accent" />
                <span>Needs Final Call</span>
                <span className="pill-count count-highlight">{counts.needs_admin}</span>
              </button>

              <button
                type="button"
                className={`sub-filter-pill ${subFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setSubFilter('pending')}
              >
                <span>Pending Review</span>
                <span className="pill-count">{counts.pending}</span>
              </button>

              <button
                type="button"
                className={`sub-filter-pill highlight-flagged ${subFilter === 'flagged' ? 'active' : ''}`}
                onClick={() => setSubFilter('flagged')}
              >
                <span>🚩 Flagged</span>
                <span className="pill-count">{counts.flagged}</span>
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
          </div>
        </div>

        {viewMode === 'cards' ? (
          renderSubmissionsCards(filtered)
        ) : (
          <>
            {/* Horizontal Scroll Bar Helper & Controls */}
            <div className="table-scroll-banner">
              <span className="scroll-hint-text">↔️ Scroll horizontally to see all columns & actions</span>
              <div className="table-scroll-btn-group">
                <button type="button" className="table-scroll-btn" onClick={() => handleScrollTable('left')} title="Scroll Left">
                  <FiChevronLeft size={14} /> <span>Left</span>
                </button>
                <button type="button" className="table-scroll-btn" onClick={() => handleScrollTable('right')} title="Scroll Right">
                  <span>Right</span> <FiChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Table Container with Sticky Actions */}
            <div className="admin-table-container" ref={tableContainerRef}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Media</th>
                    <th style={{ width: '160px' }}>Creator</th>
                    <th style={{ width: '180px' }}>Campaign</th>
                    <th style={{ width: '170px' }}>Type & Reward</th>
                    <th style={{ width: '110px' }}>Views & Earned</th>
                    <th style={{ width: '160px' }}>Status</th>
                    <th className="admin-sticky-actions-header" style={{ width: '220px', minWidth: '220px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const sType = getSubmissionTypeCategory(s);
                    const isReview = sType === 'review';
                    const isPhoto = sType === 'photo';
                    const isPostLink = sType === 'post_link';
                    const platform = s.platform || 'video';
                    const platformIcon = getSocialIcon(platform);
                    const thumbUrl = getVideoThumbnail(s.video_url, platform);
                    const revUrl = isReview ? getSubmissionReviewUrl(s, s.campaign) : null;
                    const isDirectDiscount = isDirectDiscountSubmission(s);
                    const voucherDetails = s.voucher_details || {};
                    const discountPct = voucherDetails.discount_percent || voucherDetails.discount_rate || s.campaign?.direct_discount_rate || 0;
                    const perkTerm = voucherDetails.perk_term || voucherDetails.reward_text || s.campaign?.direct_perk_term;

                    return (
                      <motion.tr variants={itemVariants} key={s.id} className="admin-table-row">
                        {/* Media Thumbnail Cell */}
                        <td className="video-thumb-cell">
                          {isReview ? (
                            <div 
                              className="admin-video-thumb-box admin-review-thumb-box"
                              onClick={() => {
                                if (revUrl) {
                                  window.open(revUrl, '_blank');
                                } else {
                                  setSelectedSubmissionForModal(s);
                                }
                              }}
                              title="Click to open review"
                            >
                              <span style={{ fontSize: '16px', lineHeight: 1 }}>⭐</span>
                              <span style={{ fontSize: '9px', fontWeight: 800, color: '#ffd700', textTransform: 'uppercase' }}>Review</span>
                            </div>
                          ) : isPhoto ? (
                            <div 
                              className="admin-video-thumb-box"
                              onClick={() => setSelectedSubmissionForModal(s)}
                              title="Click to view image proof"
                            >
                              <img 
                                src={s.video_url} 
                                alt="Photo proof" 
                                className="admin-thumb-img"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/brand/logo.png';
                                }}
                              />
                              <div className="admin-thumb-play-overlay">
                                <FiEye size={14} />
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="admin-video-thumb-box"
                              onClick={() => setSelectedSubmissionForModal(s)}
                              title="Click to view video / post"
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
                                {isPostLink ? <FiExternalLink size={14} /> : <FiPlay size={14} />}
                              </div>
                              {platformIcon && (
                                <div className="admin-thumb-platform-tag">
                                  <img 
                                    src={platformIcon} 
                                    alt={platform} 
                                    style={{ width: 11, height: 11, objectFit: 'contain' }} 
                                  />
                                </div>
                              )}
                            </div>
                          )}
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

                        {/* Type & Reward Details */}
                        <td>
                          <div className="admin-reward-cell">
                            {isReview ? (
                              <>
                                <span className="admin-tag-pill review">⭐ Review</span>
                                {s.voucher_code && (
                                  <span className="admin-voucher-code" title="Voucher Code">
                                    🎟️ {s.voucher_code}
                                  </span>
                                )}
                              </>
                            ) : isDirectDiscount ? (
                              <>
                                <span className="admin-tag-pill direct">
                                  🏷️ {discountPct > 0 ? `${discountPct}% Off` : (perkTerm || 'Direct Discount')}
                                </span>
                                {(voucherDetails.reward_text || perkTerm) && (
                                  <span className="admin-perk-sub" title={voucherDetails.reward_text || perkTerm}>
                                    🎁 {voucherDetails.reward_text || perkTerm}
                                  </span>
                                )}
                                {s.voucher_code && (
                                  <span className="admin-voucher-code" title="Voucher Code">
                                    🎟️ {s.voucher_code}
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="admin-tag-pill video">
                                  🎬 Video Reward
                                </span>
                                {s.voucher_code && (
                                  <span className="admin-voucher-code" title="Voucher Code">
                                    🎟️ {s.voucher_code}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        {/* Views & Cash Earned */}
                        <td>
                          <div className="admin-views-earned-cell">
                            <span className="text-xs text-secondary flex items-center gap-1">
                              <FiEye size={11} /> {formatCount(s.views_count || 0)}
                            </span>
                            <span className="font-bold text-accent text-sm">
                              {formatCurrency(s.earned_amount || 0)}
                            </span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td>
                          {s.status === 'verified' ? (
                            <Badge variant="success" size="sm">
                              <span className="pulsing-dot-inline" /> Owner Approved
                            </Badge>
                          ) : s.status === 'paid' ? (
                            <Badge variant="accent" size="sm">Admin Approved & Paid</Badge>
                          ) : s.status === 'pending' ? (
                            <Badge variant="warning" size="sm">Pending Owner</Badge>
                          ) : s.status === 'flagged' ? (
                            <Badge variant="error" size="sm">🚩 Flagged</Badge>
                          ) : s.status === 'rejected' ? (
                            <Badge variant="error" size="sm">Rejected</Badge>
                          ) : (
                            <Badge variant="default" size="sm">{s.status?.toUpperCase()}</Badge>
                          )}
                        </td>

                        {/* Sticky Actions Column */}
                        <td className="admin-sticky-actions-cell">
                          <div className="admin-submission-actions">
                            {/* 1. Preview / Open button */}
                            <button 
                              className="btn-admin-preview"
                              onClick={() => {
                                if (isReview && revUrl) {
                                  window.open(revUrl, '_blank');
                                } else {
                                  setSelectedSubmissionForModal(s);
                                }
                              }}
                              title={isReview ? 'Open Review Link' : isPhoto ? 'View Proof Image' : 'Watch Video'}
                            >
                              {isReview ? <FiExternalLink size={12} /> : isPhoto ? <FiEye size={12} /> : <FiPlay size={12} />}
                              <span>{isReview ? 'Review' : isPhoto ? 'Proof' : 'Watch'}</span>
                            </button>

                            {/* 2. Approve (Final Call) button */}
                            {s.status !== 'paid' && (
                              <button 
                                className="btn-admin-approve"
                                onClick={() => handleApproveSubmission(s)}
                                title="Approve as Final Call"
                              >
                                <FiCheck size={12} />
                                <span>Approve</span>
                              </button>
                            )}

                            {/* 3. Unflag button */}
                            {s.status === 'flagged' && (
                              <button
                                className="icon-btn unflag"
                                style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                                onClick={() => handleUnflagSubmission(s.id)}
                                title="Unflag submission (Restore to Pending)"
                              >
                                <FiRotateCcw size={13} />
                              </button>
                            )}

                            {/* 4. Reject button */}
                            {s.status !== 'rejected' && (
                              <button 
                                className="icon-btn reject"
                                onClick={() => handleRejectSubmission(s.id)}
                                title="Reject Submission"
                              >
                                <FiXCircle size={14} />
                              </button>
                            )}

                            {/* 5. Delete button for ANY submission */}
                            <button 
                              className="btn-admin-delete"
                              onClick={() => handleDeleteSubmission(s.id)}
                              title="Permanently Delete Submission from Database"
                            >
                              <FiTrash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty-state">
                        No submissions found matching the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </motion.div>
    );
  };

  const renderCampaignsCards = (campList: any[]) => {
    return (
      <div className="admin-cards-grid">
        {campList.map(c => (
          <motion.div variants={itemVariants} key={c.id} className="admin-card">
            <div className="admin-card-header">
              <div>
                <h4 className="font-bold text-white text-base">{c.title}</h4>
                {(c as any).brand_name && <span className="text-xs text-secondary">{(c as any).brand_name}</span>}
              </div>
              <Badge variant={c.status === 'active' ? 'success' : c.status === 'paused' ? 'warning' : 'default'}>
                {c.status === 'paused' ? 'NEEDS PAYMENT' : c.status.toUpperCase()}
              </Badge>
            </div>

            <div className="admin-card-body">
              <div className="flex items-center gap-2">
                <Avatar 
                  src={Array.isArray(c.advertiser) ? c.advertiser[0]?.avatar_url : c.advertiser?.avatar_url} 
                  name={Array.isArray(c.advertiser) ? (c.advertiser[0]?.full_name || '?') : (c.advertiser?.full_name || '?')} 
                  size="sm" 
                />
                <span className="text-xs text-secondary">
                  by {Array.isArray(c.advertiser) ? c.advertiser[0]?.full_name : c.advertiser?.full_name}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                <span>Budget: <strong className="text-accent">{formatCurrency(c.prize_pool || 0)}</strong></span>
                <span>Platform: <Badge variant="default" size="sm">{(c.platform || 'all').toUpperCase()}</Badge></span>
              </div>
            </div>

            <div className="admin-card-actions">
              {c.status === 'paused' && (
                <button 
                  type="button"
                  className="btn-card-action btn-card-approve"
                  onClick={() => handleApproveAndPayCampaign(c.id)}
                >
                  <FiCheck size={13} />
                  <span>Approve & Pay</span>
                </button>
              )}
              <button 
                type="button"
                className="btn-card-action btn-card-delete"
                onClick={() => handleDeleteCampaign(c.id)}
              >
                <FiTrash2 size={13} />
                <span>Delete Campaign</span>
              </button>
            </div>
          </motion.div>
        ))}
        {campList.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '2.5rem' }}>
            No campaigns found.
          </div>
        )}
      </div>
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
      <motion.div variants={listVariants} initial="hidden" animate="show">
        {/* Header & View Switcher */}
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Campaigns Management</span>
              <span className="admin-count-badge">{campaigns.length} Total</span>
            </h3>
            <p className="text-xs text-secondary mt-0.5">Review active and paused campaigns, approve payouts, or delete campaigns.</p>
          </div>

          <div className="admin-view-toggle">
            <button 
              type="button" 
              className={`admin-view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Cards View (Best for Mobile)"
            >
              <FiGrid size={13} /> <span>Cards</span>
            </button>
            <button 
              type="button" 
              className={`admin-view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View (Best for Desktop)"
            >
              <FiList size={13} /> <span>Table</span>
            </button>
          </div>
        </div>

        {viewMode === 'cards' ? (
          renderCampaignsCards(sortedCampaigns)
        ) : (
          <>
            {/* Horizontal Scroll Bar Helper & Controls */}
            <div className="table-scroll-banner">
              <span className="scroll-hint-text">↔️ Scroll horizontally to see all columns & actions</span>
              <div className="table-scroll-btn-group">
                <button type="button" className="table-scroll-btn" onClick={() => handleScrollTable('left')} title="Scroll Left">
                  <FiChevronLeft size={14} /> <span>Left</span>
                </button>
                <button type="button" className="table-scroll-btn" onClick={() => handleScrollTable('right')} title="Scroll Right">
                  <span>Right</span> <FiChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="admin-table-container" ref={tableContainerRef}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '220px' }}>Campaign</th>
                    <th style={{ minWidth: '180px' }}>Advertiser</th>
                    <th style={{ minWidth: '130px' }}>Total Budget</th>
                    <th style={{ minWidth: '110px' }}>Platform</th>
                    <th style={{ minWidth: '140px' }}>Status</th>
                    <th className="admin-sticky-actions-header" style={{ width: '160px', minWidth: '160px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCampaigns.map(c => (
                    <motion.tr variants={itemVariants} key={c.id} className="admin-table-row">
                      <td>
                        <div className="admin-camp-cell">
                          <span className="admin-camp-title font-bold text-white">{c.title}</span>
                          {(c as any).brand_name && <span className="admin-camp-adv text-xs text-secondary">{(c as any).brand_name}</span>}
                        </div>
                      </td>
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
                      <td className="admin-sticky-actions-cell">
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
                          <button className="icon-btn reject" onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(c.id); }} title="Delete Campaign Permanently">
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {campaigns.length === 0 && (
                    <tr>
                      <td colSpan={6} className="empty-state">No campaigns found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </motion.div>
    );
  };

  const renderWithdrawalsCards = (withList: any[]) => {
    return (
      <div className="admin-cards-grid">
        {withList.map(w => {
          const userProfile = (w as any).user || (w as any).profiles;
          return (
            <motion.div variants={itemVariants} key={w.id} className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-user">
                  <Avatar src={userProfile?.avatar_url} name={userProfile?.full_name || '?'} size="sm" />
                  <div className="admin-card-user-info">
                    <span className="admin-card-name">{userProfile?.full_name || 'User'}</span>
                    <span className="admin-card-handle">{formatDate(w.created_at)}</span>
                  </div>
                </div>
                <Badge variant={w.status === 'completed' ? 'success' : 'warning'}>
                  {w.status.toUpperCase()}
                </Badge>
              </div>

              <div className="admin-card-body">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-accent">{formatCurrency(w.amount)}</span>
                  <Badge variant="default" size="sm">{w.type.toUpperCase()}</Badge>
                </div>
              </div>

              <div className="admin-card-actions">
                {w.status === 'pending' && (
                  <button 
                    type="button"
                    className="btn-card-action btn-card-approve"
                    onClick={() => handleProcessWithdrawal(w.id)}
                  >
                    <FiCheckCircle size={13} />
                    <span>Mark Paid</span>
                  </button>
                )}
                <button 
                  type="button"
                  className="btn-card-action btn-card-delete"
                  onClick={() => handleDeleteWithdrawal(w.id)}
                >
                  <FiTrash2 size={13} />
                  <span>Delete Payout</span>
                </button>
              </div>
            </motion.div>
          );
        })}
        {withList.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '2.5rem' }}>
            No withdrawal requests.
          </div>
        )}
      </div>
    );
  };

  const renderWithdrawals = () => (
    <motion.div variants={listVariants} initial="hidden" animate="show">
      {/* Header & View Switcher */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Payout Requests</span>
            <span className="admin-count-badge">{withdrawals.length} Total</span>
          </h3>
          <p className="text-xs text-secondary mt-0.5">Manage withdrawal and cash payout requests across the platform.</p>
        </div>

        <div className="admin-view-toggle">
          <button 
            type="button" 
            className={`admin-view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
            title="Cards View (Best for Mobile)"
          >
            <FiGrid size={13} /> <span>Cards</span>
          </button>
          <button 
            type="button" 
            className={`admin-view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Table View (Best for Desktop)"
          >
            <FiList size={13} /> <span>Table</span>
          </button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        renderWithdrawalsCards(withdrawals)
      ) : (
        <>
          {/* Horizontal Scroll Bar Helper & Controls */}
          <div className="table-scroll-banner">
            <span className="scroll-hint-text">↔️ Scroll horizontally to see all columns & actions</span>
            <div className="table-scroll-btn-group">
              <button type="button" className="table-scroll-btn" onClick={() => handleScrollTable('left')} title="Scroll Left">
                <FiChevronLeft size={14} /> <span>Left</span>
              </button>
              <button type="button" className="table-scroll-btn" onClick={() => handleScrollTable('right')} title="Scroll Right">
                <span>Right</span> <FiChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="admin-table-container" ref={tableContainerRef}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '200px' }}>User</th>
                  <th style={{ minWidth: '130px' }}>Amount</th>
                  <th style={{ minWidth: '110px' }}>Type</th>
                  <th style={{ minWidth: '140px' }}>Date</th>
                  <th style={{ minWidth: '130px' }}>Status</th>
                  <th className="admin-sticky-actions-header" style={{ width: '140px', minWidth: '140px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => {
                  const userProfile = (w as any).user || (w as any).profiles;
                  return (
                    <motion.tr variants={itemVariants} key={w.id} className="admin-table-row">
                      <td className="user-cell">
                        <Avatar src={userProfile?.avatar_url} name={userProfile?.full_name || '?'} size="sm" />
                        <span className="user-cell-name">{userProfile?.full_name || 'User'}</span>
                      </td>
                      <td className="text-accent font-bold">{formatCurrency(w.amount)}</td>
                      <td><Badge variant="default">{w.type.toUpperCase()}</Badge></td>
                      <td>{formatDate(w.created_at)}</td>
                      <td>
                        <Badge variant={w.status === 'completed' ? 'success' : 'warning'}>
                          {w.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="admin-sticky-actions-cell">
                        <div className="action-buttons">
                          {w.status === 'pending' && (
                            <button className="icon-btn approve" onClick={() => handleProcessWithdrawal(w.id)} title="Mark Paid">
                              <FiCheckCircle />
                            </button>
                          )}
                          <button 
                            className="icon-btn reject" 
                            onClick={() => handleDeleteWithdrawal(w.id)} 
                            title="Permanently Delete Payout Record"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {withdrawals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">No withdrawal requests.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </motion.div>
  );

  const renderCommunications = () => {
    return (
      <motion.div variants={listVariants} initial="hidden" animate="show" className="admin-comms-container">
        <div className="admin-comms-header-card">
          <div className="comms-top-bar">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>User Communications Inspector</span>
                <span className="admin-count-badge">Official Admin Tools</span>
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Inspect any user's notifications and direct chat messages, delete items permanently, and send official Ginger Notifications.
              </p>
            </div>

            <button 
              type="button"
              className="btn-ginger-notify"
              onClick={() => {
                setNotifyTargetUser(selectedCommsUser || users[0] || null);
                setIsNotifyModalOpen(true);
              }}
            >
              <FiSend size={15} />
              <span>Send Ginger Notification</span>
            </button>
          </div>

          <div className="comms-user-picker-row">
            <span className="text-xs font-bold text-secondary">SELECT USER:</span>
            <select
              className="comms-user-select"
              value={selectedCommsUser?.id || ''}
              onChange={(e) => {
                const u = users.find(user => user.id === e.target.value);
                if (u) handleSelectCommsUser(u);
              }}
            >
              <option value="" disabled>-- Select a user to inspect --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name || 'User'} (@{u.username || 'user'}) — {u.role || 'user'}
                </option>
              ))}
            </select>

            {selectedCommsUser && (
              <div className="comms-tab-pills">
                <button
                  type="button"
                  className={`comms-tab-pill ${commsSubTab === 'notifs' ? 'active' : ''}`}
                  onClick={() => setCommsSubTab('notifs')}
                >
                  🔔 Notifications ({userNotifs.length})
                </button>
                <button
                  type="button"
                  className={`comms-tab-pill ${commsSubTab === 'messages' ? 'active' : ''}`}
                  onClick={() => setCommsSubTab('messages')}
                >
                  💬 Messages ({userConversations.length} chats)
                </button>
              </div>
            )}
          </div>
        </div>

        {!selectedCommsUser ? (
          <div className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '42px', display: 'block', marginBottom: '0.5rem' }}>👥</span>
            <h4 className="text-white font-bold mb-1">No User Selected</h4>
            <p className="text-xs text-secondary max-w-sm mx-auto">
              Select any user above to inspect their real-time notifications feed and private message conversations.
            </p>
          </div>
        ) : isCommsLoading ? (
          <div className="flex-center py-12">
            <div className="spinner" />
          </div>
        ) : commsSubTab === 'notifs' ? (
          /* User Notifications Feed */
          <div className="comms-notifs-grid">
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="text-xs font-bold text-secondary">
                NOTIFICATIONS FOR: <strong className="text-white">{selectedCommsUser.full_name} (@{selectedCommsUser.username})</strong>
              </span>
              <span className="text-xs text-secondary">{userNotifs.length} records</span>
            </div>

            {userNotifs.map(n => (
              <div key={n.id} className={`comms-notif-card ${!n.is_read ? 'unread' : ''}`}>
                <div className="comms-notif-body">
                  <div className="flex items-center gap-2">
                    <Badge variant={n.type === 'admin' ? 'accent' : n.is_read ? 'default' : 'warning'} size="sm">
                      {n.type === 'admin' ? 'GINGER' : n.is_read ? 'READ' : 'UNREAD'}
                    </Badge>
                    <span className="text-xs text-white font-medium">{n.content}</span>
                  </div>
                  <div className="comms-notif-meta">
                    <span>{formatDate(n.created_at)}</span>
                    {n.entity_id && <span>Entity: {n.entity_id.substring(0, 8)}...</span>}
                  </div>
                </div>

                <button
                  type="button"
                  className="icon-btn reject"
                  onClick={() => handleDeleteUserNotification(n.id)}
                  title="Permanently Delete Notification"
                >
                  <FiTrash2 size={13} />
                </button>
              </div>
            ))}

            {userNotifs.length === 0 && (
              <div className="empty-state">No notifications recorded for this user.</div>
            )}
          </div>
        ) : (
          /* User Messages / Chats Inspector */
          <div className="comms-messages-layout">
            <div className="comms-conversations-panel">
              <span className="text-xs font-bold text-secondary px-2 mb-1">CONVERSATIONS</span>
              {userConversations.map(c => {
                const isSelected = activeConversationPartner?.id === c.partner.id;
                return (
                  <div
                    key={c.partner.id}
                    className={`comms-conv-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setActiveConversationPartner(c.partner)}
                  >
                    <Avatar src={c.partner.avatar_url} name={c.partner.full_name || 'U'} size="sm" />
                    <div className="comms-conv-details">
                      <span className="comms-conv-name">{c.partner.full_name || 'User'}</span>
                      <span className="comms-conv-preview">{c.lastMessage?.content || ''}</span>
                    </div>
                  </div>
                );
              })}

              {userConversations.length === 0 && (
                <div className="text-xs text-secondary p-4 text-center">No chat conversations found for this user.</div>
              )}
            </div>

            <div className="comms-chat-window">
              {activeConversationPartner ? (
                <>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Avatar src={activeConversationPartner.avatar_url} name={activeConversationPartner.full_name || 'U'} size="sm" />
                      <div>
                        <span className="text-sm font-bold text-white block">{activeConversationPartner.full_name}</span>
                        <span className="text-xs text-secondary">@{activeConversationPartner.username}</span>
                      </div>
                    </div>
                    <span className="text-xs text-secondary">
                      Conversation with {selectedCommsUser.full_name}
                    </span>
                  </div>

                  <div className="comms-chat-messages">
                    {userMessages
                      .filter(m => 
                        (m.sender_id === selectedCommsUser.id && m.receiver_id === activeConversationPartner.id) ||
                        (m.sender_id === activeConversationPartner.id && m.receiver_id === selectedCommsUser.id)
                      )
                      .map(m => {
                        const sentByInspectedUser = m.sender_id === selectedCommsUser.id;
                        return (
                          <div
                            key={m.id}
                            className={`comms-chat-bubble-row ${sentByInspectedUser ? 'sent-by-user' : ''}`}
                          >
                            <div className={`comms-chat-bubble ${sentByInspectedUser ? 'sent' : 'received'}`}>
                              <div>{m.content}</div>
                              <div className="comms-msg-time">{formatDate(m.created_at)}</div>
                            </div>
                            <button
                              type="button"
                              className="btn-comms-delete-msg"
                              onClick={() => handleDeleteUserMessage(m.id)}
                              title="Delete message"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </>
              ) : (
                <div className="flex-center h-full text-xs text-secondary">
                  Select a conversation on the left to view message history.
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const renderSlideshows = () => (
    <motion.div variants={listVariants} initial="hidden" animate="show">
      <div className="admin-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className="text-xl font-bold">Slideshows</h3>
        <Button variant="primary" size="sm" onClick={() => setIsSlideModalOpen(true)}>Add New Slide</Button>
      </div>

      {/* Horizontal Scroll Bar Helper & Controls */}
      <div className="table-scroll-banner">
        <span className="scroll-hint-text">↔️ Scroll horizontally to see all columns & actions</span>
        <div className="table-scroll-btn-group">
          <button type="button" className="table-scroll-btn" onClick={() => handleScrollTable('left')} title="Scroll Left">
            <FiChevronLeft size={14} /> <span>Left</span>
          </button>
          <button type="button" className="table-scroll-btn" onClick={() => handleScrollTable('right')} title="Scroll Right">
            <span>Right</span> <FiChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="admin-table-container" ref={tableContainerRef}>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ minWidth: '120px' }}>Image</th>
              <th style={{ minWidth: '220px' }}>Title</th>
              <th style={{ minWidth: '220px' }}>Redirect Link</th>
              <th className="admin-sticky-actions-header" style={{ width: '120px', minWidth: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {slideshows.map(s => (
              <motion.tr variants={itemVariants} key={s.id} className="admin-table-row">
                <td className="user-cell">
                  <img src={s.image_url} alt="slide" className="w-16 h-10 object-cover rounded" />
                </td>
                <td className="font-bold">{s.title}</td>
                <td>{s.link_url ? <a href={s.link_url} target="_blank" rel="noreferrer" className="text-accent underline text-sm">{s.link_url}</a> : '-'}</td>
                <td className="admin-sticky-actions-cell">
                  <div className="action-buttons">
                    <button className="icon-btn reject" onClick={() => handleDeleteSlide(s.id)} title="Delete Slide Permanently">
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
      </div>
    </motion.div>
  );

  const tabs = [
    { id: 'submissions', label: 'Submissions', icon: FiVideo, badge: submissions.length, alert: submissions.filter(s => s.status === 'verified').length },
    { id: 'users', label: 'Users', icon: FiUsers, badge: users.length },
    { id: 'campaigns', label: 'Campaigns', icon: FiTarget, badge: campaigns.length, alert: campaigns.filter(c => c.status === 'paused').length },
    { id: 'withdrawals', label: 'Payouts', icon: FiDollarSign, badge: withdrawals.filter(w => w.status === 'pending').length, alert: withdrawals.filter(w => w.status === 'pending').length },
    { id: 'comms', label: 'Communications', icon: FiMessageSquare, badge: undefined },
    { id: 'slideshows', label: 'Slideshows', icon: FiImage, badge: slideshows.length },
    { id: 'overview', label: 'Overview', icon: FiTarget },
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

      {/* Mobile Horizontal Navigation Tab Strip */}
      <div className="admin-mobile-nav">
        <div className="admin-mobile-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-mobile-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMobileMenuOpen(false);
              }}
            >
              <tab.icon size={15} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`mobile-tab-badge ${tab.alert ? 'alert' : ''}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
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
              <div className="flex items-center gap-3">
                <tab.icon className="tab-icon" />
                <span>{tab.label}</span>
              </div>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`admin-tab-badge ${tab.alert ? 'alert' : ''}`}>
                  {tab.badge}
                </span>
              )}
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
              {activeTab === 'comms' && renderCommunications()}
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

      {/* Send Ginger Notification Modal */}
      <AnimatePresence>
        {isNotifyModalOpen && (
          <motion.div 
            className="admin-modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div 
              className="admin-modal-content glass-strong"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              style={{ maxWidth: '520px' }}
            >
              <button className="admin-modal-close" onClick={() => setIsNotifyModalOpen(false)}>×</button>
              
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: '24px' }}>📢</span>
                <h2 className="admin-modal-title" style={{ margin: 0 }}>Send Ginger Notification</h2>
              </div>
              <p className="text-xs text-secondary mb-4">
                This will send an official notification to the user labeled as <strong>Ginger Notification</strong> with verified Ginger branding.
              </p>

              <form onSubmit={handleSendGingerNotification} className="admin-form">
                <div>
                  <label className="text-xs font-bold text-secondary block mb-1">RECIPIENT USER:</label>
                  <select
                    className="input-field"
                    value={notifyTargetUser?.id || ''}
                    onChange={(e) => {
                      const u = users.find(user => user.id === e.target.value);
                      if (u) setNotifyTargetUser(u);
                    }}
                    required
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || 'User'} (@{u.username || 'user'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-secondary block mb-1">NOTIFICATION TITLE (OPTIONAL):</label>
                  <input
                    type="text"
                    placeholder="e.g. Account Notice, Reward Alert, System Update"
                    className="input-field"
                    value={notifyTitle}
                    onChange={e => setNotifyTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-secondary block mb-1">MESSAGE BODY:</label>
                  <textarea
                    rows={4}
                    placeholder="Write the message that will be sent to the user..."
                    className="input-field"
                    style={{ resize: 'vertical' }}
                    value={notifyMessage}
                    onChange={e => setNotifyMessage(e.target.value)}
                    required
                  />
                </div>

                {/* Live Preview Card */}
                <div>
                  <span className="text-[11px] font-bold text-secondary block mb-1 uppercase">Recipient Preview:</span>
                  <div className="ginger-notif-preview-card">
                    <div className="ginger-notif-avatar">
                      <img src="/images/brand/logo.png" alt="Ginger" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span style={{ background: 'linear-gradient(135deg, #ff4d4d 0%, #f97316 100%)', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>
                          Official Ginger
                        </span>
                        <strong style={{ color: '#ff6b6b', fontSize: '12px' }}>Ginger Notification</strong>
                      </div>
                      <div style={{ color: '#fff', fontSize: '13px', lineHeight: 1.4 }}>
                        {notifyTitle.trim() && <strong>{notifyTitle.trim()}: </strong>}
                        {notifyMessage.trim() || 'Your message preview will appear here...'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-4">
                  <Button variant="outline" size="sm" type="button" onClick={() => setIsNotifyModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    type="submit" 
                    disabled={isSendingNotification || !notifyMessage.trim()}
                    style={{ background: 'linear-gradient(135deg, #ff4d4d 0%, #f97316 100%)', border: 'none' }}
                  >
                    {isSendingNotification ? 'Sending...' : 'Send Notification 🚀'}
                  </Button>
                </div>
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
        onDelete={(id) => handleDeleteSubmission(id)}
        isAdmin={true}
      />
    </div>
  );
};

export default AdminDashboard;
