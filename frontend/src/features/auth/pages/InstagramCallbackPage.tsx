import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useProfileStore } from '../../../store/profileStore';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';
import TransitionLoader from '../../../components/ui/TransitionLoader';

const InstagramCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isInitialized } = useAuthStore();
  const { addVerifiedSocialLink } = useProfileStore();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCode = async () => {
      if (!isInitialized) return;
      
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        toast.error(`Instagram login failed: ${searchParams.get('error_description') || error}`);
        navigate('/profile/account');
        return;
      }

      if (!code || !user) {
        toast.error("Missing code or user session.");
        navigate('/profile/account');
        return;
      }

      try {
        const origin = window.location.origin.includes('http://localhost') 
          ? window.location.origin.replace('http://', 'https://')
          : window.location.origin;

        const { data, error: functionError } = await supabase.functions.invoke('link-instagram-account', {
          body: { 
            code, 
            redirect_uri: `${origin}/auth/instagram/callback`,
            profile_id: user.id
          }
        });

        if (functionError) throw functionError;

        if (data && data.success) {
          await addVerifiedSocialLink(
            'Instagram', 
            data.username, 
            `https://instagram.com/${data.username}`, 
            data.followers, 
            data.access_token
          );
          toast.success("Instagram Business Account linked successfully!");
        } else {
          toast.error(data?.message || "Failed to link Instagram account.");
        }
      } catch (err: any) {
        console.error("Error linking Instagram:", err);
        toast.error(err.message || "An unexpected error occurred while linking Instagram.");
      } finally {
        setIsProcessing(false);
        navigate('/profile/account');
      }
    };

    processCode();
  }, [searchParams, user, isInitialized, navigate, addVerifiedSocialLink]);

  return (
    <div className="min-h-screen bg-ginger-bg text-white flex flex-col items-center justify-center relative overflow-hidden">
      <TransitionLoader isActive={isProcessing} />
      <div className="text-center z-10 p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
        <h2 className="text-2xl font-bold mb-4 font-outfit">Connecting Instagram...</h2>
        <p className="text-white/70">Please wait while we securely link your Business Account.</p>
      </div>
    </div>
  );
};

export default InstagramCallbackPage;
