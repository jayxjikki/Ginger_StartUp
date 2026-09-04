import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import { useProfileStore } from '../../../store/profileStore';
import { supabase } from '../../../lib/supabase';
import { uploadToCloudinary } from '../../../lib/cloudinary';
import { CATEGORIES_DATA, ALL_SUBCATEGORIES } from '../../../lib/categoriesData';
import './EditProfilePage.css';
import { getCategoryBanner } from './ProfilePage';

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, fetchProfile } = useAuthStore();
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('Male');
  const [mobile, setMobile] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeGroupTab, setActiveGroupTab] = useState<string>(CATEGORIES_DATA[0].name);
  const [categorySearch, setCategorySearch] = useState<string>('');
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
      setGender(profile.gender || 'Male');
      setMobile(profile.mobile_number || '');
      setLocation(profile.location || '');
      if (profile.category) {
        const parsed = profile.category
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
        setSelectedCategories(parsed.slice(0, 3));
      } else {
        setSelectedCategories([]);
      }
    }
  }, [profile]);

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      if (selectedCategories.length >= 3) {
        toast.error('You can select and pin up to 3 categories.');
        return;
      }
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const categoryStr = selectedCategories.join(', ');
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: bio,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          gender: gender,
          mobile_number: mobile,
          category: categoryStr,
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      await fetchProfile(); // refresh authStore
      await useProfileStore.getState().fetchProfileData(user.id); // refresh profileStore
      toast.success('Profile saved!');
      navigate('/profile'); // go back
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast.error(err.message || 'Failed to save profile');
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
      toast.error('Failed to upload image.');
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
      toast.error('Failed to upload image.');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Focus effect for inputs
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const label = e.currentTarget.parentElement?.querySelector('label');
    if (label) {
      label.style.color = '#34d399'; // Active color
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const label = e.currentTarget.parentElement?.querySelector('label');
    if (label) {
      label.style.color = '#8fa696'; // Revert to inactive color
    }
  };

  const bannerBg = getCategoryBanner(selectedCategories[0] || null);

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
            <div className="locked-input-container" onClick={() => navigate('/profile/account')}>
              <input 
                className="glass-input locked-input" 
                type="text" 
                value={name} 
                readOnly
                disabled
              />
              <span className="material-symbols-outlined locked-input-icon">lock</span>
            </div>
            <span className="locked-input-subtext">
              You can't change your name from here. <span className="locked-link" onClick={() => navigate('/profile/account')}>Visit Account Centre</span>
            </span>
          </div>

          <div className="input-group">
            <label className="edit-input-label">Username</label>
            <div className="locked-input-container" onClick={() => navigate('/profile/account')}>
              <input 
                className="glass-input locked-input" 
                type="text" 
                value={username} 
                readOnly
                disabled
              />
              <span className="material-symbols-outlined locked-input-icon">lock</span>
            </div>
            <span className="locked-input-subtext">
              You can't change your username from here. <span className="locked-link" onClick={() => navigate('/profile/account')}>Visit Account Centre</span>
            </span>
          </div>

          <div className="input-group">
            <label className="edit-input-label">Gender / Pronouns</label>
            <select 
              className="glass-input" 
              value={gender} 
              onChange={e => setGender(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={{ appearance: 'none' }}
            >
              <option value="Male" style={{ color: '#000' }}>Male (He/Him)</option>
              <option value="Female" style={{ color: '#000' }}>Female (She/Her)</option>
              <option value="Other" style={{ color: '#000' }}>Other / Prefer not to say</option>
            </select>
          </div>
          <div className="input-group">
            <label className="edit-input-label">Location</label>
            <div className="locked-input-container" onClick={() => navigate('/profile/account')}>
              <input 
                className="glass-input locked-input" 
                type="text" 
                value={location || 'Not set'} 
                readOnly
                disabled
              />
              <span className="material-symbols-outlined locked-input-icon">lock</span>
            </div>
            <span className="locked-input-subtext">
              You can't change your location from here. <span className="locked-link" onClick={() => navigate('/profile/account')}>Visit Account Centre</span>
            </span>
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
          <div className="input-group">
            <div className="category-section-top">
              <label className="edit-input-label">Categories & Niches</label>
              <span className="category-count-badge">
                {selectedCategories.length}/3 Pinned
              </span>
            </div>
            <p className="field-subtext">
              Choose up to 3 categories to pin to your profile and discover card.
            </p>

            {/* Pinned Categories Display */}
            {selectedCategories.length > 0 && (
              <div className="pinned-categories-tray">
                {selectedCategories.map((cat, idx) => (
                  <div key={cat} className="pinned-category-chip">
                    <span className="pin-indicator">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>push_pin</span>
                      <span className="pin-number">{idx + 1}</span>
                    </span>
                    <span className="cat-name">{cat}</span>
                    <button
                      type="button"
                      className="cat-unpin-btn"
                      onClick={() => toggleCategory(cat)}
                      title="Unpin category"
                      aria-label={`Unpin ${cat}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search within Categories */}
            <div className="category-picker-search">
              <span className="material-symbols-outlined search-icon">search</span>
              <input
                type="text"
                placeholder="Search niches (e.g. Cricket, Tech, Skincare)..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="category-search-input"
              />
              {categorySearch && (
                <button type="button" className="clear-search" onClick={() => setCategorySearch('')}>×</button>
              )}
            </div>

            {/* If searching, show matching subcategories */}
            {categorySearch.trim() ? (
              <div className="subcategories-grid">
                {ALL_SUBCATEGORIES.filter(sub => sub.toLowerCase().includes(categorySearch.toLowerCase())).map(sub => {
                  const isSelected = selectedCategories.includes(sub);
                  const pinIndex = selectedCategories.indexOf(sub) + 1;
                  return (
                    <button
                      key={sub}
                      type="button"
                      className={`niche-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleCategory(sub)}
                    >
                      <span className={`niche-pin-icon ${isSelected ? 'active' : ''}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}>push_pin</span>
                        {isSelected && <span className="niche-pin-num">{pinIndex}</span>}
                      </span>
                      <span>{sub}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <>
                {/* Category Group Tabs */}
                <div className="category-group-tabs hide-scrollbar">
                  {CATEGORIES_DATA.map(group => (
                    <button
                      key={group.id}
                      type="button"
                      className={`group-tab-btn ${activeGroupTab === group.name ? 'active' : ''}`}
                      onClick={() => setActiveGroupTab(group.name)}
                    >
                      {group.name}
                    </button>
                  ))}
                </div>

                {/* Subcategories for active group */}
                <div className="subcategories-grid">
                  {(() => {
                    const group = CATEGORIES_DATA.find(g => g.name === activeGroupTab) || CATEGORIES_DATA[0];
                    return group.subcategories.map(sub => {
                      const isSelected = selectedCategories.includes(sub);
                      const pinIndex = selectedCategories.indexOf(sub) + 1;
                      return (
                        <button
                          key={sub}
                          type="button"
                          className={`niche-chip ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleCategory(sub)}
                        >
                          <span className={`niche-pin-icon ${isSelected ? 'active' : ''}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}>push_pin</span>
                            {isSelected && <span className="niche-pin-num">{pinIndex}</span>}
                          </span>
                          <span>{sub}</span>
                        </button>
                      );
                    });
                  })()}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default EditProfilePage;
