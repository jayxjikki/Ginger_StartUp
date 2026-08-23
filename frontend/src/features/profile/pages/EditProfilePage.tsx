import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { uploadToCloudinary } from '../../../lib/cloudinary';
import './EditProfilePage.css';

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, fetchProfile } = useAuthStore();
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || 'https://via.placeholder.com/150');
      setBannerUrl(profile.banner_url || '');
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
          banner_url: bannerUrl,
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
    avatarInputRef.current?.click();
  };

  const handleBannerChange = () => {
    bannerInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingAvatar(true);
    try {
      const url = await uploadToCloudinary(file);
      setAvatarUrl(url);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      alert('Failed to upload image to Cloudinary.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingBanner(true);
    try {
      const url = await uploadToCloudinary(file);
      setBannerUrl(url);
    } catch (err) {
      console.error('Failed to upload banner:', err);
      alert('Failed to upload image to Cloudinary.');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Focus effect for inputs
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const label = e.currentTarget.parentElement?.querySelector('label');
    if (label) {
      label.style.color = '#34d399'; // Emerald color
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const label = e.currentTarget.parentElement?.querySelector('label');
    if (label) {
      label.style.color = '#8fa696'; // Revert to inactive color
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
          <input type="file" ref={bannerInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleBannerUpload} />
          <input type="file" ref={avatarInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
          
          <div className="banner-bg-wrapper" onClick={handleBannerChange} style={{ cursor: 'pointer' }}>
            <img alt="Background" className="banner-bg-img" src={bannerUrl || bannerBg} />
            <div className="banner-gradient"></div>
            <div className="banner-overlay" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', background: 'rgba(0,0,0,0.4)', zIndex: 2 }}>
              {isUploadingBanner ? (
                <span className="material-symbols-outlined spin-animation" style={{ color: 'white', fontSize: '32px' }}>sync</span>
              ) : (
                <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '32px' }}>photo_camera</span>
              )}
            </div>
          </div>
          
          <div className="avatar-wrapper" onClick={handleAvatarChange}>
            <div className="avatar-container">
              <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <img alt="Background" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} src={bannerUrl || bannerBg} />
              </div>
              <img alt="Profile Picture" className="avatar-img" src={avatarUrl} />
            </div>
            <div className="avatar-overlay">
              {isUploadingAvatar ? (
                <span className="material-symbols-outlined spin-animation" style={{ color: 'white' }}>sync</span>
              ) : (
                <span className="material-symbols-outlined" style={{ color: 'white' }}>photo_camera</span>
              )}
            </div>
          </div>
          
          <button className="change-photo-btn" onClick={handleAvatarChange}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
            {isUploadingAvatar ? 'Uploading...' : 'Change profile photo'}
          </button>
        </section>

        {/* Input Fields */}
        <section className="form-section">
          <div className="input-group">
            <label className="edit-input-label">Name</label>
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
            <label className="edit-input-label">Username</label>
            <input 
              className="glass-input" 
              type="text" 
              value={username} 
              onChange={e => {
                let val = e.target.value;
                if (val && !val.startsWith('@')) {
                  val = '@' + val;
                }
                setUsername(val);
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          <div className="input-group">
            <label className="edit-input-label">Pronouns</label>
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
            <label className="edit-input-label">Bio</label>
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
      </main>
    </div>
  );
};

export default EditProfilePage;
