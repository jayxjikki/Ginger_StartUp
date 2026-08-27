import React, { useEffect, useRef, useState } from 'react';
import './ProfileFeedViewer.css';
import { useFeedStore } from '../../../store/feedStore';
import FeedCommentsPanel from './FeedCommentsPanel';
import FeedShareModal from './FeedShareModal';
import { useUgcStore } from '../../../store/ugcStore';
import { useGlobalModalStore } from '../../../store/globalModalStore';

interface FeedPost {
  id: string;
  image_url: string;
  title: string;
  description?: string;
  content?: string;
  created_at?: string;
}

interface ProfileFeedViewerProps {
  isOpen: boolean;
  onClose: () => void;
  posts: FeedPost[];
  initialPostIndex: number;
  profile: {
    id: string;
    full_name: string;
    avatar_url?: string;
    username?: string;
    location?: string;
  };
}

const ProfileFeedViewer: React.FC<ProfileFeedViewerProps> = ({ 
  isOpen, 
  onClose, 
  posts, 
  initialPostIndex, 
  profile 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { postLikesCount, userLikedPosts, fetchLikes, toggleLike } = useFeedStore();
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [activeSharePost, setActiveSharePost] = useState<FeedPost | null>(null);
  const [heartAnimations, setHeartAnimations] = useState<Record<string, boolean>>({});
  const [activeOptionsPostId, setActiveOptionsPostId] = useState<string | null>(null);
  const { reportItem } = useUgcStore();

  useEffect(() => {
    if (isOpen && posts.length > 0) {
      const postIds = posts.map(p => p.id);
      fetchLikes(postIds);
    }
  }, [isOpen, posts, fetchLikes]);

  useEffect(() => {
    if (isOpen && scrollRef.current && posts.length > 0) {
      // Small timeout to ensure DOM is fully rendered before scrolling
      setTimeout(() => {
        const postElement = document.getElementById(`feed-post-${initialPostIndex}`);
        if (postElement && scrollRef.current) {
          scrollRef.current.scrollTop = postElement.offsetTop - 60; // 60px for header height
        }
      }, 100);
      
      // Prevent body scrolling when feed is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, initialPostIndex, posts]);

  if (!isOpen) return null;

  const getCaption = (post: FeedPost) => {
    // Media kits and achievements usually use description, posts use content
    return post.description || post.content || post.title;
  };

  const handleDoubleClick = (postId: string, isLiked: boolean) => {
    if (!isLiked) {
      toggleLike(postId);
    }
    setHeartAnimations(prev => ({ ...prev, [postId]: true }));
    setTimeout(() => {
      setHeartAnimations(prev => ({ ...prev, [postId]: false }));
    }, 1000);
  };

  const handleReportPost = async (postId: string) => {
    setActiveOptionsPostId(null);
    const confirmed = await useGlobalModalStore.getState().showConfirm('Are you sure you want to report this post for inappropriate content?', 'Report Post');
    if (confirmed) {
      await reportItem(postId, 'submission', 'Inappropriate content');
    }
  };

  return (
    <div className="feed-viewer-overlay">
      <header className="feed-viewer-header">
        <button className="feed-viewer-back-btn" onClick={onClose} aria-label="Close feed">
          <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>arrow_back</span>
        </button>
        <h2 className="feed-viewer-title">Posts</h2>
      </header>

      <div className="feed-viewer-content" ref={scrollRef}>
        {posts.map((post, index) => {
          const isLiked = !!userLikedPosts[post.id];
          const likesCount = postLikesCount[post.id] || 0;
          const actualAvatarUrl = profile.avatar_url || 'https://via.placeholder.com/150';
          const username = profile.username ? profile.username.replace('@', '') : profile.full_name.replace(/\s+/g, '').toLowerCase();

          return (
            <article key={post.id} id={`feed-post-${index}`} className="feed-post-container">
              {/* Post Header */}
              <div className="feed-post-header">
                <img src={actualAvatarUrl} alt={profile.full_name} className="feed-post-avatar" />
                <div className="feed-post-user-info">
                  <span className="feed-post-username">{username}</span>
                  {profile.location && (
                    <span className="feed-post-location">{profile.location}</span>
                  )}
                </div>
                <button 
                  className="feed-post-options-btn"
                  onClick={() => setActiveOptionsPostId(activeOptionsPostId === post.id ? null : post.id)}
                >
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
                {activeOptionsPostId === post.id && (
                  <div className="feed-post-dropdown-menu">
                    <button className="feed-menu-item text-warning" onClick={() => handleReportPost(post.id)}>
                      <span className="material-symbols-outlined">flag</span>
                      Report Post
                    </button>
                  </div>
                )}
              </div>

              {/* Post Image */}
              <div 
                className="feed-post-image-container" 
                style={{ position: 'relative', cursor: 'pointer' }}
                onDoubleClick={() => handleDoubleClick(post.id, isLiked)}
              >
                <img src={post.image_url} alt={post.title} className="feed-post-image" />
                
                {heartAnimations[post.id] && (
                  <div className="double-click-heart-overlay">
                    <span className="material-symbols-outlined heart-icon" style={{ fontVariationSettings: "'FILL' 1" }}>
                      favorite
                    </span>
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="feed-post-actions">
                <button 
                  className={`feed-action-btn ${isLiked ? 'liked' : ''}`} 
                  onClick={() => toggleLike(post.id)}
                >
                  <span className="material-symbols-outlined">
                    {isLiked ? 'favorite' : 'favorite_border'}
                  </span>
                </button>
                <button className="feed-action-btn" onClick={() => setActiveCommentPostId(post.id)}>
                  <span className="material-symbols-outlined">chat_bubble_outline</span>
                </button>
                <button className="feed-action-btn" onClick={() => setActiveSharePost(post)}>
                  <span className="material-symbols-outlined" style={{ transform: 'rotate(-20deg)', marginTop: '-4px' }}>send</span>
                </button>
              </div>

              {/* Likes Count */}
              {likesCount > 0 && (
                <div className="feed-post-likes">
                  {likesCount} {likesCount === 1 ? 'like' : 'likes'}
                </div>
              )}

              {/* Caption */}
              <div className="feed-post-caption-box">
                <span className="feed-post-caption-username">{username}</span>
                <span>{getCaption(post)}</span>
              </div>

              {/* Date */}
              {post.created_at && (
                <div className="feed-post-date">
                  {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              )}
            </article>
          );
        })}
        
        {posts.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '100px', color: '#a8a8a8' }}>
            No posts to show.
          </div>
        )}
      </div>

      <FeedCommentsPanel 
        isOpen={!!activeCommentPostId} 
        onClose={() => setActiveCommentPostId(null)} 
        entityId={activeCommentPostId || ''} 
      />
      
      <FeedShareModal 
        isOpen={!!activeSharePost}
        onClose={() => setActiveSharePost(null)}
        post={activeSharePost ? {
          ...activeSharePost,
          caption: getCaption(activeSharePost)
        } : {} as any}
        posterName={profile.username ? profile.username.replace('@', '') : profile.full_name.replace(/\s+/g, '').toLowerCase()}
        posterAvatar={profile.avatar_url || 'https://via.placeholder.com/150'}
        posterId={profile.id}
      />
    </div>
  );
};

export default ProfileFeedViewer;
