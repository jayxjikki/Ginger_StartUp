import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page-content" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <button className="icon-btn mb-6" onClick={() => navigate(-1)}>
        <FiArrowLeft />
      </button>
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-invert max-w-none space-y-6" style={{ lineHeight: '1.6', color: '#c4c7c8' }}>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>Welcome to Ginger, the growth operating system for brands, businesses, and the next generation of ecosystems. This Privacy Policy outlines how we collect, safeguard, and utilize your information when you engage with our platform. By accessing Ginger, you consent to the data practices described herein.</p>
        
        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">2. Data Collection and Account Linking</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>We collect information to facilitate a transparent marketplace for creators and brands.</li>
          <li>We use Google Authorization securely and strictly to link your YouTube account to our platform.</li>
          <li>We utilize a dedicated Telegram bot to directly link your Telegram account.</li>
          <li>We do not use any other third-party applications for user verification or authentication.</li>
          <li>Our system allows you to manage campaigns across multiple platforms including YouTube, TikTok, LinkedIn, Twitter, Discord, and Quora.</li>
        </ul>

        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send notifications, and personalize your experience on the Ginger platform.</p>

        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">4. Financial Data and Bank Account Linking</h2>
        <p>To facilitate skill-based earning and performance-based rewards, users may link bank accounts or financial details for payouts and payments.</p>
        <ul className="list-disc pl-5 space-y-2 mt-4 text-gray-300">
          <li><strong>Third-Party Processing:</strong> All financial data is processed securely through Razorpay. Ginger does not directly collect, store, or process your credit card numbers, UPI PINs, or sensitive banking passwords on our own servers.</li>
          <li><strong>Accuracy of Information:</strong> Users are solely responsible for ensuring the absolute accuracy of the bank account details provided. Ginger assumes zero liability for funds lost, delayed, or sent to the wrong account due to user error or incorrect data entry.</li>
        </ul>

        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">5. Data Usage and Zero-Sale Guarantee</h2>
        <p>We are committed to absolute transparency regarding your information. We strictly do not sell, rent, or trade your personal data to any third-party brokers, advertisers, or external entities under any circumstances.</p>

        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">6. Data Storage, Security, and Limitation of Liability</h2>
        <p>Our application infrastructure utilizes Supabase for database management and data storage. While we operate as a highly reputable company and implement standard security practices, by agreeing to this policy, you acknowledge and accept the following without exception:</p>
        <ul className="list-disc pl-5 space-y-2 mt-4 text-gray-300">
          <li><strong>No Guarantee of Data Integrity:</strong> We are not legally responsible for any unexpected data loss, corruption, server downtime, or unauthorized breaches beyond our reasonable control.</li>
          <li><strong>Assumption of Risk:</strong> Any loss of data originating from the database infrastructure (including Supabase) is not the liability of Ginger, and users utilizing the platform explicitly agree to assume this risk in its entirety.</li>
        </ul>

        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">7. Mandatory Disclosure</h2>
        <p>We reserve the right to disclose your personal information if required to do so by law, court order, subpoena, or government request, or if we believe in good faith that such action is necessary to protect the rights, property, or safety of Ginger, its users, or the public.</p>

        <h2 className="text-2xl text-white font-semibold mt-8 mb-4">8. Your Rights & Account Deletion</h2>
        <p>You have the right to access, update, or delete your personal information. You can permanently delete your account and associated data directly from the Account Centre in the app.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
