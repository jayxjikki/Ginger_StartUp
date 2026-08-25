import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page-content" style={{ padding: '80px 20px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <button className="icon-btn mb-6" onClick={() => navigate(-1)}>
        <FiArrowLeft />
      </button>
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-invert max-w-none space-y-6" style={{ lineHeight: '1.6', color: '#c4c7c8' }}>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">1. Information We Collect</h2>
        <p>We collect information that you provide directly to us, including but not limited to your name, email address, profile information, and any content you submit through our platform.</p>
        
        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send notifications, and personalize your experience on the Ginger platform.</p>
        
        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">3. Information Sharing</h2>
        <p>We do not share your personal information with third parties except as described in this privacy policy (e.g., sharing public profile information with other users or sharing necessary data with payment processors).</p>
        
        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">4. Data Security</h2>
        <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
        
        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">5. Your Rights & Account Deletion</h2>
        <p>You have the right to access, update, or delete your personal information. You can permanently delete your account and associated data directly from the Account Centre in the app.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
