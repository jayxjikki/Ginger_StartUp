import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TransitionLoader from '../../../../components/ui/TransitionLoader';
import { supabase } from '../../../../lib/supabase';
import { useAuthStore } from '../../../../store/authStore';
import '../ActivityPage.css';

const MyPostsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [mediaKits, setMediaKits] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return;
      try {
        const [
          { data: mkData },
          { data: campData },
          { data: postData },
          { data: achData }
        ] = await Promise.all([
          supabase.from('media_kits').select('*').eq('profile_id', user.id),
          supabase.from('campaigns').select('*').eq('advertiser_id', user.id),
          supabase.from('posts').select('*').eq('author_id', user.id),
          supabase.from('achievements').select('*').eq('profile_id', user.id)
        ]);

        setMediaKits(mkData || []);
        setCampaigns(campData || []);
        setPosts(postData || []);
        setAchievements(achData || []);
      } catch (err) {
        console.error('Error fetching posts data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [user]);

  const handleBack = () => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate('/profile/activity', { state: { fromTransition: true } });
    }, 400);
  };

  const hasContent = mediaKits.length > 0 || campaigns.length > 0 || posts.length > 0 || achievements.length > 0;

  return (
    <>
      <TransitionLoader isActive={isNavigating} />
      <div className="activity-page">
        <div className="activity-ambient-bg"></div>
        <header className="activity-top-bar">
          <button className="activity-back-btn" onClick={handleBack} aria-label="Go back">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="activity-brand">My Posts</span>
        </header>
        <main className="activity-main" style={{ paddingTop: '88px', alignItems: 'center', padding: '88px 24px 24px 24px' }}>
          
          {isLoading ? (
            <div style={{ marginTop: '100px' }} className="btn-spinner" />
          ) : !hasContent ? (
            <div style={{ textAlign: 'center', marginTop: '100px', color: 'rgba(255,255,255,0.5)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '64px', marginBottom: '16px' }}>grid_on</span>
              <h2>No Posts Yet</h2>
              <p>Your media kit, blogs, and campaign posts will appear here.</p>
            </div>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Media Kit Block */}
              {mediaKits.length > 0 && (
                <section>
                  <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Media Kit</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {mediaKits.map((mk) => (
                      <div key={mk.id} className="activity-glass-card" style={{ padding: '16px', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="material-symbols-outlined" style={{ color: '#F7931E' }}>description</span>
                          <span style={{ fontWeight: 600, color: '#fff' }}>Media Kit Profile</span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 }}>
                          {mk.description || 'No description provided.'}
                        </p>
                        {mk.pdf_url && (
                          <a href={mk.pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: '#F7931E', fontSize: '14px', textDecoration: 'none', marginTop: '4px' }}>
                            View PDF attachment
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Campaigns Block */}
              {campaigns.length > 0 && (
                <section>
                  <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Campaigns</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {campaigns.map((camp) => (
                      <div key={camp.id} className="activity-glass-card" style={{ padding: '16px', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-symbols-outlined" style={{ color: '#F7931E' }}>campaign</span>
                            <span style={{ fontWeight: 600, color: '#fff' }}>{camp.title}</span>
                          </div>
                          <span style={{ 
                            background: camp.status === 'active' ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255,255,255,0.1)', 
                            color: camp.status === 'active' ? '#34C759' : '#fff',
                            padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase'
                          }}>
                            {camp.status}
                          </span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 }}>
                          {camp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Achievements & Blog Posts Block */}
              {(posts.length > 0 || achievements.length > 0) && (
                <section>
                  <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Achievements & Blogs</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {posts.map((post) => (
                      <div key={post.id} className="activity-glass-card" style={{ padding: '16px', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="material-symbols-outlined" style={{ color: '#F7931E' }}>article</span>
                          <span style={{ fontWeight: 600, color: '#fff' }}>{post.title}</span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 }}>
                          {post.content.length > 100 ? `${post.content.substring(0, 100)}...` : post.content}
                        </p>
                      </div>
                    ))}
                    
                    {achievements.map((ach) => (
                      <div key={ach.id} className="activity-glass-card" style={{ padding: '16px', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="material-symbols-outlined" style={{ color: '#F7931E' }}>emoji_events</span>
                          <span style={{ fontWeight: 600, color: '#fff' }}>{ach.title}</span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 }}>
                          {ach.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>
          )}

        </main>
      </div>
    </>
  );
};

export default MyPostsPage;
