import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import './EditProfilePage.css';

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, fetchProfile } = useAuthStore();
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || 'https://via.placeholder.com/150');
      // pronouns typically aren't in standard DB yet, so leaving blank or mock
      setPronouns('She/Her');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          username: username,
          bio: bio,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      await fetchProfile(); // refresh authStore
      navigate('/profile'); // go back
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = () => {
    // In a real app, this would open a file picker or ImageUpload
    // For now, we'll just mock it or leave it interactive
    const newUrl = prompt("Enter new Avatar URL:");
    if (newUrl) setAvatarUrl(newUrl);
  };

  // Focus effect for inputs
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const label = e.currentTarget.parentElement?.querySelector('label');
    if (label) {
      label.style.color = '#fff'; // primary equivalent in this design
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const label = e.currentTarget.parentElement?.querySelector('label');
    if (label) {
      label.style.color = '#B8860B'; // revert to golden
    }
  };

  const bannerBg = "https://lh3.googleusercontent.com/aida-public/AB6AXuDifATJQAZTpi5ddzaL2NmTbVC0DfuJaSEqidhed2JqlqZbyfG9xRu-2jYAht-VkgnHjNmxqnWsMkLCoTmBwqkzE8idZwsO6AAMOgUGJR4B4o05dPx1zHXZ4NK93rvJ0Nn2h_ZmlcIZV3FfjM1bSfBhAVycAU1LVh5HfVaEEBd78WgT5aUNoUsvTPNxU-kaaayozD1CxOE0nZys7SX4GTj9mCkr89a46V_BOkcjPAVMJQIHoBKE2QUZ";

  return (
    <div className="edit-profile-wrapper liquid-bg">
      {/* Top App Bar */}
      <header className="edit-top-bar">
        <div className="edit-top-bar-content">
          <button className="edit-close-btn" onClick={() => navigate('/profile')}>
            <span className="material-symbols-outlined">close</span>
          </button>
          <h1 className="edit-title">Edit Profile</h1>
          <button className="edit-save-btn" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="edit-main">
        {/* Profile Picture Section */}
        <section className="banner-section">
          <div className="banner-bg-wrapper">
            <img alt="Background" className="banner-bg-img" src={bannerBg} />
            <div className="banner-gradient"></div>
          </div>
          
          <div className="avatar-wrapper" onClick={handleAvatarChange}>
            <div className="avatar-container">
              <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <img alt="Background" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} src={bannerBg} />
              </div>
              <img alt="Profile Picture" className="avatar-img" src={avatarUrl} />
            </div>
            <div className="avatar-overlay">
              <span className="material-symbols-outlined" style={{ color: 'white' }}>photo_camera</span>
            </div>
          </div>
          
          <button className="change-photo-btn" onClick={handleAvatarChange}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
            Change profile photo
          </button>
        </section>

        {/* Input Fields */}
        <section className="form-section">
          <div className="input-group">
            <label className="input-label">Name</label>
            <input 
              className="glass-input" 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Username</label>
            <input 
              className="glass-input" 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Pronouns</label>
            <input 
              className="glass-input" 
              type="text" 
              value={pronouns} 
              onChange={e => setPronouns(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Bio</label>
            <textarea 
              className="glass-input" 
              rows={3} 
              style={{ resize: 'none' }}
              value={bio}
              onChange={e => setBio(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
        </section>

        {/* Links Section */}
        <section className="links-section">
          <h2 className="input-label" style={{ marginBottom: '0.5rem' }}>Links</h2>
          <div className="links-list">
            
            <div className="glass-card link-item group">
              <div className="link-info">
                <div className="link-icon-wrap">
                  <span className="material-symbols-outlined text-primary">play_circle</span>
                </div>
                <span className="link-name">YouTube</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_right</span>
            </div>
            
            <div className="glass-card link-item group">
              <div className="link-info">
                <div className="link-icon-wrap">
                  <span className="material-symbols-outlined text-primary">photo_camera</span>
                </div>
                <span className="link-name">Instagram</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_right</span>
            </div>

            <div className="glass-card link-item group">
              <div className="link-info">
                <div className="link-icon-wrap">
                  <span className="material-symbols-outlined text-primary">music_note</span>
                </div>
                <span className="link-name">TikTok</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_right</span>
            </div>
            
            <button className="add-link-btn">
              <span className="material-symbols-outlined">add</span>
              Add Link
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default EditProfilePage;
