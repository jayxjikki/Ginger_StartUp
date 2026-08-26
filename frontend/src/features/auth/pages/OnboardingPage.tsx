import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import { useProfileStore } from '../../../store/profileStore';

import { useGoogleLogin } from '@react-oauth/google';
import { uploadToCloudinary } from '../../../lib/cloudinary';
import instagramIcon from '../../../assets/instagram.png';
import telegramIcon from '../../../assets/telegram.png';
import './OnboardingPage.css';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, saveBasicProfile, completeOnboarding } = useAuthStore();
  const { socialLinks, addVerifiedSocialLink, fetchProfileData } = useProfileStore();
  
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [gender, setGender] = useState('Male');
  const [location, setLocation] = useState('');
  
  // Media State
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Telegram State
  const [telegramUsername, setTelegramUsername] = useState('');

  useEffect(() => {
    if (profile) {
      if (profile.full_name) setName(profile.full_name);
      if (profile.username) setUsername(profile.username);
      if (profile.mobile_number) setMobile(profile.mobile_number);
      if (profile.gender) setGender(profile.gender);
      if (profile.location) setLocation(profile.location);
      if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
      if (profile.banner_url) setBannerUrl(profile.banner_url);

      // Auto advance to step 3 if they already have a username (meaning step 2 was completed)
      // but only if they haven't completed onboarding yet.
      if (profile.username && !profile.onboarding_completed && step === 1) {
        setStep(3);
        fetchProfileData(profile.id); // fetch latest social links for step 3
      }
    }
  }, [profile, step, fetchProfileData]);

  // Listen for auth state changes to capture Google linking callback
  // Removed Facebook listener since we now use direct Instagram Login

  const loginWithGoogle = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/youtube.readonly',
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://youtube.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const channel = data.items[0];
          let username = channel.snippet.customUrl || channel.snippet.title;
          const url = `https://youtube.com/${channel.snippet.customUrl || '@' + username}`;
          const followers = parseInt(channel.statistics.subscriberCount, 10) || 0;
          if (username.startsWith('@')) username = username.slice(1);
          await addVerifiedSocialLink('YouTube', username, url, followers);
          toast.success("YouTube account linked successfully!");
        } else {
          toast.error("No YouTube channel found for this Google account.");
        }
      } catch (err) {
        console.error('Failed to fetch YouTube channel info:', err);
        toast.error("Failed to verify YouTube channel.");
      }
    },
    onError: () => {
      toast.error("Google authentication failed.");
    }
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const url = await uploadToCloudinary(file);
      setAvatarUrl(url);
    } catch (err) {
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
      toast.error('Failed to upload banner.');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleProceedToSocial = async () => {
    if (!name.trim() || !username.trim()) {
      toast.error("Name and Username are required!");
      return;
    }
    
    setIsSaving(true);
    try {
      await saveBasicProfile({
        full_name: name,
        username,
        mobile_number: mobile,
        gender,
        location,
        avatar_url: avatarUrl,
        banner_url: bannerUrl
      });
      if (profile) await fetchProfileData(profile.id); // Make sure profile store is loaded
      setStep(3);
    } catch (err) {
      toast.error('Failed to save profile details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOAuthLink = async (platform: 'google' | 'instagram') => {
    if (platform === 'google') {
      loginWithGoogle();
      return;
    }

    if (platform === 'instagram') {
      const clientId = import.meta.env.VITE_INSTAGRAM_CLIENT_ID;
      if (!clientId) {
        toast.error("Instagram Client ID is not configured.");
        return;
      }
      
      // Meta requires HTTPS for redirect URIs, even for localhost
      const redirectUri = `${window.location.origin}/auth/instagram/callback`;
      const authUrl = `https://api.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=instagram_business_basic,instagram_business_manage_insights`;
      window.location.href = authUrl;
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      // Save Telegram if provided
      if (telegramUsername.trim()) {
        const handle = telegramUsername.startsWith('@') ? telegramUsername.slice(1) : telegramUsername;
        await addVerifiedSocialLink('Telegram', handle, `https://t.me/${handle}`, 0);
      }
      
      await completeOnboarding();
      navigate('/profile');
    } catch (err) {
      toast.error('Failed to finish onboarding.');
    } finally {
      setIsSaving(false);
    }
  };

  const isLinked = (platform: string) => socialLinks.some(l => l.platform.toLowerCase() === platform.toLowerCase());

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="onboarding-step fade-in">
            <h2>Personal Details</h2>
            <p className="onboarding-subtitle">Let's start with the basics.</p>
            
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jay Sengar" />
            </div>
            
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. jayxjikki" />
            </div>

            <div className="form-group">
              <label>Mobile Number</label>
              <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+91 9876543210" />
            </div>

            <div className="form-group">
              <label>Gender / Pronouns</label>
              <select value={gender} onChange={e => setGender(e.target.value)}>
                <option value="Male">Male (He/Him)</option>
                <option value="Female">Female (She/Her)</option>
                <option value="Other">Other / Prefer not to say</option>
              </select>
            </div>

            <div className="form-group">
              <label>Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Mumbai, India" />
            </div>

            <button className="btn btn-primary next-btn" onClick={() => setStep(2)}>Next Step</button>
          </div>
        );
      case 2:
        return (
          <div className="onboarding-step fade-in">
            <h2>Profile Look</h2>
            <p className="onboarding-subtitle">Upload your avatar and a cool background banner.</p>

            <input type="file" ref={bannerInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleBannerUpload} />
            <input type="file" ref={avatarInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />

            <div className="onboarding-banner-wrap" onClick={() => bannerInputRef.current?.click()}>
              <img src={bannerUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwosNMbFqAsdhEk59Za1nbASUJr88irtJHIJoApwXFXI2habJyNQRj7DjNJChImWA26tsm9xH5Jz1_ttX1BOSBQPMxrcwYajTFB96saVbnc8UddW5CTits1rrJffJogQjUU_kmc4GQgBCBKvFtjrpBXN7o0kh5Ob8oj1W5d6RNxLSoGgF33c2oQ9MneVPyQuvktuSBG1KbEUZFT_GnILLNoa5SVvgZ2qooecdc_vOSFtu2Xgmzuvai'} alt="Banner" className="onboarding-banner" />
              <div className="onboarding-banner-overlay">
                {isUploadingBanner ? <span className="material-symbols-outlined spin-animation">sync</span> : <span className="material-symbols-outlined">photo_camera</span>}
                <p>Change Banner</p>
              </div>
            </div>

            <div className="onboarding-avatar-wrap" onClick={() => avatarInputRef.current?.click()}>
              <img src={avatarUrl || 'https://via.placeholder.com/150'} alt="Avatar" className="onboarding-avatar" />
              <div className="onboarding-avatar-overlay">
                {isUploadingAvatar ? <span className="material-symbols-outlined spin-animation">sync</span> : <span className="material-symbols-outlined">photo_camera</span>}
              </div>
            </div>

            <div className="onboarding-actions">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" onClick={handleProceedToSocial} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Next Step'}
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="onboarding-step fade-in">
            <h2>Social Connections</h2>
            <p className="onboarding-subtitle">Link your key platforms to verify your identity.</p>

            <div className="social-oauth-container">
              
              {/* Instagram Card */}
              <div className={`oauth-card ${isLinked('Instagram') ? 'linked' : ''}`}>
                <div className="oauth-card-left">
                  <img src={instagramIcon} alt="Instagram" className="oauth-icon" />
                  <div className="oauth-info">
                    <h4>Instagram</h4>
                    <p>{isLinked('Instagram') ? 'Connected' : 'Not Connected'}</p>
                  </div>
                </div>
                {isLinked('Instagram') ? (
                  <span className="material-symbols-outlined success-icon">check_circle</span>
                ) : (
                  <button className="btn btn-outline" onClick={() => handleOAuthLink('instagram')}>Link</button>
                )}
              </div>

              {/* YouTube Card */}
              <div className={`oauth-card ${isLinked('YouTube') ? 'linked' : ''}`}>
                <div className="oauth-card-left">
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#ff0000' }}>smart_display</span>
                  <div className="oauth-info">
                    <h4>YouTube</h4>
                    <p>{isLinked('YouTube') ? 'Connected' : 'Not Connected'}</p>
                  </div>
                </div>
                {isLinked('YouTube') ? (
                  <span className="material-symbols-outlined success-icon">check_circle</span>
                ) : (
                  <button className="btn btn-outline" onClick={() => handleOAuthLink('google')}>Link</button>
                )}
              </div>

              {/* Telegram Input */}
              <div className="oauth-card telegram-card">
                <div className="oauth-card-left">
                  <img src={telegramIcon} alt="Telegram" className="oauth-icon" />
                  <div className="oauth-info">
                    <h4>Telegram</h4>
                    <p>Enter your handle</p>
                  </div>
                </div>
                <div className="telegram-input-wrap">
                  <input 
                    type="text" 
                    placeholder="@handle" 
                    value={telegramUsername}
                    onChange={e => setTelegramUsername(e.target.value)}
                  />
                </div>
              </div>

            </div>

            <div className="onboarding-actions">
              <button className="btn btn-primary finish-btn" onClick={handleComplete} disabled={isSaving}>
                {isSaving ? 'Finishing...' : 'Finish Setup'}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-wrapper liquid-bg">
      <div className="onboarding-container">
        <div className="onboarding-progress">
          <div className={`progress-dot ${step >= 1 ? 'active' : ''}`} />
          <div className={`progress-line ${step >= 2 ? 'active' : ''}`} />
          <div className={`progress-dot ${step >= 2 ? 'active' : ''}`} />
          <div className={`progress-line ${step >= 3 ? 'active' : ''}`} />
          <div className={`progress-dot ${step >= 3 ? 'active' : ''}`} />
        </div>
        
        <div className="onboarding-content">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
