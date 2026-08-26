import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';

export default function ConnectTelegram() {
  const { profile } = useAuthStore();
  const userId = profile?.id;
  
  const [telegramUser, setTelegramUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verification state
  const [channelInput, setChannelInput] = useState('');
  const [verifyStatus, setVerifyStatus] = useState({ loading: false, message: '', isError: false });
  const [showAddForm, setShowAddForm] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  // Fetch user's verified channels
  const fetchChannels = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('verified_channels')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });
    if (data) setChannels(data);
  };

  useEffect(() => {
    if (userId) fetchChannels();
  }, [userId]);

  // Load initial status
  useEffect(() => {
    if (profile?.telegram_username) {
      setTelegramUser(profile.telegram_username);
    }
  }, [profile]);

  // 1. Generate token and open Telegram deep link
  const handleConnect = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = crypto.randomUUID();
      
      // Store token in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ verify_token: token })
        .eq('id', userId);
        
      if (updateError) throw updateError;
      
      // Open Ginger_verification_bot with the start token
      const botName = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'Ginger_verification_bot';
      window.open(`https://t.me/${botName}?start=${token}`, '_blank');
    } catch (err: any) {
      console.error("Error generating token:", err);
      setError("Failed to initiate connection. Please try again.");
      setLoading(false);
    }
  };

  // 2. Listen in realtime for when the user clicks Start in Telegram
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('profile_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          if (payload.new.telegram_id) {
            setTelegramUser(payload.new.telegram_username || 'Connected');
            setLoading(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleVerifyChannel = async () => {
    if (!userId) return;
    setVerifyStatus({ loading: true, message: '', isError: false });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-channel`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          userId: userId,
          channelUsername: channelInput,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setVerifyStatus({ loading: false, message: data.message, isError: false });
        setChannelInput(''); // Clear input on success
        setShowAddForm(false);
        fetchChannels(); // Refresh the list
      } else {
        setVerifyStatus({ loading: false, message: data.error || 'Failed to verify', isError: true });
      }
    } catch (error) {
      setVerifyStatus({ loading: false, message: 'Something went wrong.', isError: true });
    }
  };

  return (
    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginTop: '16px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '600' }}>Telegram Account</h3>
        <button 
          onClick={() => setShowHelp(!showHelp)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>help</span>
        </button>
      </div>

      {showHelp && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px',
          fontSize: '13px',
          color: 'rgba(255,255,255,0.85)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span className="material-symbols-outlined" style={{ color: '#4ade80', fontSize: '20px' }}>info</span>
            <strong style={{ color: 'white', fontSize: '14px', letterSpacing: '0.3px' }}>How to link channels</strong>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>1</div>
              <div style={{ lineHeight: '1.5', marginTop: '2px' }}>Verify and link your personal Telegram account.</div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>2</div>
              <div style={{ lineHeight: '1.5', marginTop: '2px' }}>Add <strong style={{ color: '#0088cc', fontWeight: '600' }}>@Ginger_verification_bot</strong> as an admin in your channel or group.</div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>3</div>
              <div style={{ lineHeight: '1.5', marginTop: '2px' }}>Click <strong style={{ color: 'white' }}>+</strong> and enter your channel ID (e.g. <em style={{ opacity: 0.7 }}>@example_id</em>).</div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>4</div>
              <div style={{ lineHeight: '1.5', marginTop: '2px' }}>Click <strong style={{ color: 'white' }}>Verify</strong>. You can add multiple channels!</div>
            </div>

          </div>
        </div>
      )}
      
      {error && (
        <p style={{ color: '#ff4d4d', fontSize: '14px', marginBottom: '12px' }}>
          {error}
        </p>
      )}

      {telegramUser ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#4ade80' }}>check_circle</span>
            <p style={{ color: '#4ade80', margin: 0, fontWeight: '500' }}>Connected as @{telegramUser}</p>
          </div>
          
          <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>Verified Channels</h4>
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                <span className="material-symbols-outlined">{showAddForm ? 'close' : 'add'}</span>
              </button>
            </div>

            {channels.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: showAddForm ? '16px' : '0' }}>
                {channels.map((ch) => (
                  <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#4ade80' }}>verified</span>
                    <span style={{ fontSize: '14px' }}>{ch.channel_username}</span>
                  </div>
                ))}
              </div>
            ) : (
              !showAddForm && (
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', opacity: 0.7 }}>
                  No channels verified yet. Click + to add one.
                </p>
              )
            )}

            {showAddForm && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', opacity: 0.7 }}>
                  Must add <strong>@Ginger_verification_bot</strong> as an admin first.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="@YourChannel"
                    value={channelInput}
                    onChange={(e) => setChannelInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(0,0,0,0.2)',
                      color: 'white',
                      outline: 'none'
                    }}
                  />
                  <button 
                    onClick={handleVerifyChannel} 
                    disabled={verifyStatus.loading || !channelInput}
                    style={{
                      background: 'white',
                      color: 'black',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: (verifyStatus.loading || !channelInput) ? 'not-allowed' : 'pointer',
                      opacity: (verifyStatus.loading || !channelInput) ? 0.7 : 1,
                    }}
                  >
                    {verifyStatus.loading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                {verifyStatus.message && (
                  <p style={{ 
                    color: verifyStatus.isError ? '#ff4d4d' : '#4ade80', 
                    fontSize: '13px', 
                    margin: '8px 0 0 0' 
                  }}>
                    {verifyStatus.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', opacity: 0.8 }}>
            Link your Telegram account to verify your identity and manage your channels.
          </p>
          <button 
            onClick={handleConnect} 
            disabled={loading}
            style={{
              background: '#0088cc',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              justifyContent: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
            {loading ? 'Waiting for you in Telegram...' : 'Connect Telegram'}
          </button>
        </div>
      )}
    </div>
  );
}
