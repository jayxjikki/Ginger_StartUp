import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const TermsOfServicePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page-content" style={{ padding: '80px 20px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <button className="icon-btn mb-6" onClick={() => navigate(-1)}>
        <FiArrowLeft />
      </button>
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      
      <div className="prose prose-invert max-w-none space-y-6" style={{ lineHeight: '1.6', color: '#c4c7c8' }}>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p>By accessing and using the Ginger platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
        
        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">2. User Generated Content</h2>
        <p>You are solely responsible for the content you submit, post, or display on the platform. We reserve the right to remove any content that violates our policies or is deemed inappropriate at our sole discretion. Users can flag or report inappropriate content.</p>
        
        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">3. Payments & Transactions</h2>
        <p>Payments for campaigns and submissions are subject to verification. We use third-party payment processors (e.g., Razorpay) and are not responsible for errors or delays caused by these processors.</p>
        
        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">4. Account Termination</h2>
        <p>We reserve the right to suspend or terminate your account at any time, with or without cause, including for violations of these Terms of Service.</p>
        
        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">5. Disclaimer of Warranties</h2>
        <p>The service is provided "as is" and "as available" without warranties of any kind, either express or implied.</p>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
