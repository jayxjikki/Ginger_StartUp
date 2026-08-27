import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const TermsOfServicePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page-content" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <button className="icon-btn mb-6" onClick={() => navigate(-1)}>
        <FiArrowLeft />
      </button>
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      
      <div className="prose prose-invert max-w-none space-y-6" style={{ lineHeight: '1.6', color: '#c4c7c8' }}>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p>By accessing and using the Ginger platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. This agreement constitutes a legally binding contract between you (the user, brand, or creator) and Ginger.</p>
        
        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">2. User Generated Content (UGC) and Intellectual Property</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li><strong>User Responsibility:</strong> You are solely responsible for the content you submit, post, or display on the platform. By uploading, publishing, or displaying any content (including videos, text, images, and campaign assets), you represent and warrant that you hold all necessary licenses, rights, consents, and permissions to use and authorize Ginger to use such content.</li>
          <li><strong>Content Removal:</strong> We reserve the right to remove any content that violates our policies or is deemed inappropriate at our sole discretion. This includes, without limitation, material that is defamatory, fraudulent, obscene, legally actionable, or infringes upon any third-party intellectual property rights (such as copyright or trademark).</li>
          <li><strong>Community Moderation:</strong> Users can flag or report inappropriate content. While Ginger provides reporting mechanisms, we act strictly as a passive conduit for distribution and assume no active obligation to monitor the platform, nor do we accept liability for any user-generated content.</li>
          <li><strong>License Grant:</strong> By submitting content to Ginger, you grant us a worldwide, non-exclusive, royalty-free, transferable license to use, reproduce, distribute, prepare derivative works of, and display the content in connection with the platform's operations.</li>
        </ul>

        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">3. Payments, Transactions, and Fraud Prevention</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li><strong>Verification and Processing:</strong> Payments for campaigns and submissions are subject to verification. We use third-party payment processors (e.g., Razorpay) and are not responsible for errors or delays caused by these processors.</li>
          <li><strong>Right to Withhold Funds:</strong> To protect against financial abuse, Ginger reserves the right to freeze, withhold, or cancel payouts if we suspect fraudulent activity, bot-generated views, manipulation of performance metrics, or a violation of these Terms.</li>
          <li><strong>Tax Liability:</strong> Users (both brands and creators) are solely responsible for determining, collecting, reporting, and remitting any applicable taxes arising from transactions on the platform.</li>
        </ul>

        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">4. Account Suspension and Termination</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li><strong>Discretionary Termination:</strong> We reserve the right to suspend or terminate your account at any time, with or without cause, including for violations of these Terms of Service.</li>
          <li><strong>Consequences of Termination:</strong> Upon termination for cause (such as fraud or policy violation), any pending, un-cleared, or disputed funds associated with your account may be permanently forfeited. Sections pertaining to Limitation of Liability, Indemnification, and Intellectual Property shall survive the termination of your account.</li>
        </ul>

        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">5. Disclaimer of Warranties</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>The service is provided "as is" and "as available" without warranties of any kind, either express or implied.</li>
          <li>To the fullest extent permissible pursuant to applicable law, Ginger disclaims all warranties, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the platform will be uninterrupted, error-free, completely secure, or that defects will be corrected.</li>
        </ul>

        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
        <p>Under no circumstances, including negligence, shall Ginger, its founders, employees, or affiliates be liable for any direct, indirect, incidental, special, punitive, or consequential damages (including loss of profits, data, goodwill, or business interruption) arising out of your use or inability to use the platform. In no event shall Ginger's total liability to you for all damages, losses, and causes of action exceed the total amount of platform fees paid by you to Ginger in the three (3) months prior to the event giving rise to the claim, or INR 1,000, whichever is less.</p>

        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">7. Indemnification (Hold Harmless)</h2>
        <p>You agree to indemnify, defend, and hold harmless Ginger, its officers, directors, employees, and agents from and against any and all claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) that such parties may incur as a result of or arising from your (or anyone using your account) violation of these Terms, submission of infringing User Generated Content, misuse of the platform, or violation of any applicable law.</p>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
