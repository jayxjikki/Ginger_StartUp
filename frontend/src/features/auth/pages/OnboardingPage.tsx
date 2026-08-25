import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import { uploadToCloudinary } from '../../../lib/cloudinary';
import './OnboardingPage.css';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, completeOnboarding } = useAuthStore();
  
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

  // Social Links State
  const [socialLinks, setSocialLinks] = useState<{ platform: string; username: string }[]>([]);
  const [newPlatform, setNewPlatform] = useState('youtube');
  const [newSocialUsername, setNewSocialUsername] = useState('');

  useEffect(() => {
    if (profile) {
      if (profile.full_name) setName(profile.full_name);
      if (profile.username) setUsername(profile.username);
      if (profile.mobile_number) setMobile(profile.mobile_number);
      if (profile.gender) setGender(profile.gender);
      if (profile.location) setLocation(profile.location);
      if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
      if (profile.banner_url) setBannerUrl(profile.banner_url);
    }
  }, [profile]);

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

  const addSocialLink = () => {
    if (!newSocialUsername.trim()) return;
    setSocialLinks([...socialLinks, { platform: newPlatform, username: newSocialUsername }]);
    setNewSocialUsername('');
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    if (!name.trim() || !username.trim()) {
      toast.error("Name and Username are required!");
      return;
    }
    
    setIsSaving(true);
    try {
      await completeOnboarding({
        full_name: name,
        username,
        mobile_number: mobile,
        gender,
        location,
        avatar_url: avatarUrl,
        banner_url: bannerUrl
      }, socialLinks);
      navigate('/profile');
    } catch (err) {
      toast.error('Failed to save profile details.');
    } finally {
      setIsSaving(false);
    }
  };

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
              <button className="btn btn-primary" onClick={() => setStep(3)}>Next Step</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="onboarding-step fade-in">
            <h2>Social Connections</h2>
            <p className="onboarding-subtitle">Link your other platforms.</p>

            <div className="social-links-list">
              {socialLinks.map((link, idx) => (
                <div key={idx} className="social-link-item">
                  <span>{link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}: {link.username}</span>
                  <button className="icon-btn remove-btn" onClick={() => removeSocialLink(idx)}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="add-social-form">
              <select value={newPlatform} onChange={e => setNewPlatform(e.target.value)}>
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="twitter">X (Twitter)</option>
              </select>
              <input 
                type="text" 
                placeholder="Username or URL" 
                value={newSocialUsername} 
                onChange={e => setNewSocialUsername(e.target.value)}
              />
              <button className="btn btn-secondary" onClick={addSocialLink}>Add</button>
            </div>

            <div className="onboarding-actions">
              <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
              <button className="btn btn-primary" onClick={handleComplete} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Finish Setup'}
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
