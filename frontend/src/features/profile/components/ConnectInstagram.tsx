import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useProfileStore } from '../../../store/profileStore';
import { toast } from 'react-hot-toast';

export default function ConnectInstagram() {
  const { profile } = useAuthStore();
  const userId = profile?.id;
  const { socialLinks } = useProfileStore();

  // States: 'initial' | 'pending' | 'success'
  const [viewState, setViewState] = useState<'initial' | 'pending' | 'success'>('initial');
  const [token, setToken] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check if user already has an Instagram linked
  const instagramLink = socialLinks.find(l => l.platform.toLowerCase() === 'instagram');
  const linkedUsername = profile?.ig_username || instagramLink?.username || null;
  const followerCount = profile?.ig_followers_count ?? instagramLink?.followers ?? 0;

  useEffect(() => {
    if (linkedUsername) {
      setViewState('success');
    } else if (profile?.ig_verification_token) {
      setToken(profile.ig_verification_token);
      setExpiresAt(profile.ig_token_expires_at || null);
      setViewState('pending');
    } else {
      setViewState('initial');
    }
  }, [linkedUsername, profile]);

  // 1. Generate verification token
  const handleGenerateToken = async () => {
    if (!userId) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const edgeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-instagram`;
      const res = await fetch(edgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate verification token');
      }

      setToken(data.token);
      setExpiresAt(data.expiresAt);
      setViewState('pending');
      toast.success('Verification code generated!');
    } catch (err: any) {
      console.error('Error generating token:', err);
      setErrorMsg(err.message || 'Failed to generate token. Please try again.');
      toast.error(err.message || 'Failed to generate token');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Copy code to clipboard
  const handleCopyCode = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setIsCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  // 3. Verify Instagram account
  const handleVerify = async () => {
    if (!userId) return;
    if (!usernameInput.trim()) {
      toast.error('Please enter your Instagram username');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const edgeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-instagram`;
      const res = await fetch(edgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          userId,
          username: usernameInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed. Make sure the code is in your bio and your profile is public.');
      }

      // Success
      toast.success(`Verified as @${data.username}!`);
      setViewState('success');
      setUsernameInput('');

      // Refresh local & global profile state
      await useAuthStore.getState().fetchProfile();
      useProfileStore.getState().fetchProfileData(userId);
    } catch (err: any) {
      console.error('Verification error:', err);
      setErrorMsg(err.message || 'Verification failed');
      toast.error(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  // ═════════════════════════════════════════════════════════════
  // STATE 3: SUCCESS STATE (Linked)
  // ═════════════════════════════════════════════════════════════
  if (viewState === 'success') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(225, 48, 108, 0.35)',
            }}>
              <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '22px' }}>check_circle</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>@{linkedUsername}</span>
                <span style={{
                  fontSize: '11px',
                  background: 'rgba(57, 233, 100, 0.15)',
                  color: '#39E964',
                  border: '1px solid rgba(57, 233, 100, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 600,
                }}>
                  Verified
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#a0a5ad', marginTop: '3px' }}>
                {followerCount.toLocaleString()} followers
              </div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: '#7e838b', textAlign: 'center', margin: '4px 0 0' }}>
          Your Instagram is verified and connected to brand campaigns. You can safely remove the verification code from your bio now.
        </p>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // STATE 2: PENDING STATE (Code Generated, Waiting for Verify)
  // ═════════════════════════════════════════════════════════════
  if (viewState === 'pending') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Token Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(225, 48, 108, 0.08) 0%, rgba(253, 29, 29, 0.04) 100%)',
          border: '1px solid rgba(225, 48, 108, 0.3)',
          borderRadius: '16px',
          padding: '18px 20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '12px', color: '#ff7799', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Your Bio Verification Code
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <span style={{
              fontSize: '24px',
              fontWeight: 800,
              fontFamily: 'monospace',
              letterSpacing: '0.12em',
              color: '#ffffff',
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '6px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}>
              {token}
            </span>

            <button
              onClick={handleCopyCode}
              title="Copy code"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isCopied ? '#39E964' : 'rgba(255, 255, 255, 0.1)',
                color: isCopied ? '#000000' : '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {isCopied ? 'check' : 'content_copy'}
              </span>
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div style={{ fontSize: '11px', color: '#a0a5ad', marginTop: '8px' }}>
            Code expires in 15 minutes{expiresAt ? ` (valid until ${new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}. Ensure your Instagram profile is public.
          </div>
        </div>

        {/* 3 Step Instructions */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '14px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#e0e0e0', marginBottom: '2px' }}>
            3 Simple Steps to Verify:
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#b0b5be' }}>
            <span style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}>1</span>
            <span>Copy the unique code above.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#b0b5be' }}>
            <span style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}>2</span>
            <span>Paste the code anywhere in your public Instagram bio.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#b0b5be' }}>
            <span style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}>3</span>
            <span>Enter your Instagram username below and click "Verify Now".</span>
          </div>
        </div>

        {/* Username Input & Verify Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8b909a',
              fontSize: '14px',
              fontWeight: 600,
            }}>@</span>
            <input
              type="text"
              placeholder="your_instagram_username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '12px 14px 12px 34px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {errorMsg && (
            <div style={{
              fontSize: '12px',
              color: '#ff4d4f',
              background: 'rgba(255, 77, 79, 0.1)',
              border: '1px solid rgba(255, 77, 79, 0.2)',
              borderRadius: '8px',
              padding: '8px 12px',
            }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={handleVerify}
              disabled={isVerifying || !usernameInput.trim()}
              style={{
                flex: 1,
                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: (isVerifying || !usernameInput.trim()) ? 'not-allowed' : 'pointer',
                opacity: (isVerifying || !usernameInput.trim()) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(225, 48, 108, 0.35)',
                transition: 'all 0.2s',
              }}
            >
              {isVerifying ? (
                <>
                  <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite', fontSize: '18px' }}>
                    progress_activity
                  </span>
                  <span>Verifying Bio...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified</span>
                  <span>Verify Now</span>
                </>
              )}
            </button>

            <button
              onClick={handleGenerateToken}
              disabled={isLoading}
              title="Generate new code"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#c4c7c8',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '12px 14px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // STATE 1: INITIAL STATE (Connect Instagram Button)
  // ═════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '10px 0' }}>
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        boxShadow: '0 6px 20px rgba(225, 48, 108, 0.35)',
      }}>
        <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '32px' }}>link</span>
      </div>

      <div>
        <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: '#fff' }}>
          Connect Instagram
        </h4>
        <p style={{ margin: 0, fontSize: '13px', color: '#9fa3ab', lineHeight: '1.4' }}>
          Verify ownership of your Instagram account by placing a temporary one-time verification code in your public bio.
        </p>
      </div>

      <button
        onClick={handleGenerateToken}
        disabled={isLoading}
        style={{
          background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '12px',
          padding: '13px 24px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 4px 16px rgba(225, 48, 108, 0.35)',
          marginTop: '6px',
        }}
      >
        {isLoading ? (
          <>
            <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite', fontSize: '18px' }}>
              progress_activity
            </span>
            <span>Generating Code...</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock_open</span>
            <span>Connect Instagram</span>
          </>
        )}
      </button>

      {errorMsg && (
        <div style={{
          fontSize: '12px',
          color: '#ff4d4f',
          background: 'rgba(255, 77, 79, 0.1)',
          border: '1px solid rgba(255, 77, 79, 0.2)',
          borderRadius: '8px',
          padding: '8px 12px',
        }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}
