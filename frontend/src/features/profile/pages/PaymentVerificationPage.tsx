import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PaymentVerificationPage.css';

const PaymentVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState('National Identity Card');
  
  const docOptions = ['National Identity Card', 'School ID Card', 'Driving License'];

  return (
    <div className="payment-page">
      {/* TopAppBar */}
      <header className="payment-top-bar">
        <button 
          aria-label="Go back" 
          className="payment-back-btn"
          onClick={() => navigate('/profile', { state: { openSettings: true } })}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
        </button>
        <h1 className="payment-brand">Ginger</h1>
        {/* Empty div for flex spacing alignment */}
        <div style={{ width: '40px' }}></div>
      </header>

      {/* Main Content Canvas */}
      <main className="payment-main">
        <div className="payment-header">
          <h2 className="payment-title">Payment Verification</h2>
          <p className="payment-subtitle">Securely verify your identity and link your bank account to proceed.</p>
        </div>

        {/* Document Upload Section */}
        <section className="liquid-glass">
          <div>
            <h3 className="payment-section-title">Upload Documents</h3>
            <p className="payment-section-subtitle">Please select the type of document you wish to upload for verification.</p>
          </div>
          
          <div className="payment-input-group">
            <label className="payment-label">Document Type</label>
            <div className="payment-select-wrap">
              <div 
                className="liquid-input" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}
              >
                <span style={{ color: selectedDoc ? '#e5e2e1' : '#c4c7c8' }}>{selectedDoc}</span>
                <span className="material-symbols-outlined" style={{ color: '#c4c7c8', fontSize: '20px' }}>
                  {isDropdownOpen ? 'expand_less' : 'expand_more'}
                </span>
              </div>
              
              {isDropdownOpen && (
                <div className="custom-dropdown-menu">
                  {docOptions.map((opt) => (
                    <div 
                      key={opt}
                      className={`custom-dropdown-item ${selectedDoc === opt ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedDoc(opt);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="payment-upload-area">
            <div className="payment-upload-icon-wrap">
              <span className="material-symbols-outlined payment-upload-icon">upload_file</span>
            </div>
            <p className="payment-upload-text">Tap to upload your document</p>
            <p className="payment-upload-subtext">JPEG, PNG or PDF (Max 5MB)</p>
          </div>
        </section>

        {/* Bank Details Section */}
        <section className="liquid-glass">
          <div>
            <h3 className="payment-section-title">Bank Details</h3>
            <p className="payment-section-subtitle">Enter your account information carefully.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="payment-input-group">
              <label className="payment-label" htmlFor="account_holder">Bank Account Holder Name</label>
              <input className="liquid-input" id="account_holder" placeholder="e.g. Jane Doe" type="text" />
            </div>
            <div className="payment-input-group">
              <label className="payment-label" htmlFor="account_number">Bank Account Number</label>
              <input className="liquid-input" id="account_number" placeholder="Enter account number" type="text" />
            </div>
            <div className="payment-input-group">
              <label className="payment-label" htmlFor="ifsc_code">Bank IFSC Code</label>
              <input className="liquid-input" id="ifsc_code" placeholder="e.g. ABCD0123456" type="text" />
            </div>
          </div>
        </section>

        {/* Account Management Section */}
        <section className="liquid-glass">
          <h3 className="payment-section-title" style={{ marginBottom: '8px' }}>Account Management</h3>
          <div className="payment-actions">
            <button className="liquid-button">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
              Add More Accounts
            </button>
            <button className="payment-remove-btn">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
              Remove Account
            </button>
          </div>
        </section>

        {/* Submit Action */}
        <div>
          <button className="payment-submit-btn">
            Submit Verification
          </button>
        </div>
      </main>
    </div>
  );
};

export default PaymentVerificationPage;
