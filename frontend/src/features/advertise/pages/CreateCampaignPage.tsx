// ═══════════════════════════════════════════════════════════
// GINGER — Create Campaign Page (Advertise Tab)
// Campaign creation wizard for business owners
// ═══════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiArrowRight, FiPlus, FiTrash2,
  FiDollarSign, FiTarget, FiFileText, FiCheck
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input, { Textarea } from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import ImageUpload from '../../../components/ui/ImageUpload';
import { useAuthStore } from '../../../store/authStore';
import { useCampaignStore } from '../../../store/campaignStore';
import { CAMPAIGN_TYPES, VERIFICATION_PERIODS, SOCIAL_PLATFORMS } from '../../../lib/constants';
import CampaignCheckoutModal from '../components/CampaignCheckoutModal';
import './CreateCampaignPage.css';

const steps = [
  { id: 1, label: 'Type', icon: <FiTarget /> },
  { id: 2, label: 'Details', icon: <FiFileText /> },
  { id: 3, label: 'Rewards', icon: <FiDollarSign /> },
  { id: 4, label: 'Review', icon: <FiCheck /> },
];

const CreateCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createCampaign } = useCampaignStore();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'pool' as string,
    title: '',
    description: '',
    slogan: '',
    location: '',
    endDate: '',
    videoRequirements: '',
    keywords: [] as string[],
    keywordInput: '',
    platforms: ['youtube', 'instagram'] as string[],
    prizePool: '',
    discountPercent: '',
    verificationDays: 3,
    tiers: [
      { minViews: '1000', amount: '1000' },
      { minViews: '10000', amount: '10000' },
    ],
    image_url: '',
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addKeyword = () => {
    if (formData.keywordInput.trim() && !formData.keywords.includes(formData.keywordInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, prev.keywordInput.trim()],
        keywordInput: '',
      }));
    }
  };

  const removeKeyword = (kw: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== kw),
    }));
  };

  const togglePlatform = (pId: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(pId)
        ? prev.platforms.filter((p) => p !== pId)
        : [...prev.platforms, pId],
    }));
  };

  const addTier = () => {
    setFormData((prev) => ({
      ...prev,
      tiers: [...prev.tiers, { minViews: '', amount: '' }],
    }));
  };

  const updateTier = (index: number, field: 'minViews' | 'amount', value: string) => {
    setFormData((prev) => {
      const nextTiers = [...prev.tiers];
      nextTiers[index][field] = value;
      return { ...prev, tiers: nextTiers };
    });
  };

  const removeTier = (index: number) => {
    if (formData.tiers.length > 1) {
      setFormData((prev) => ({
        ...prev,
        tiers: prev.tiers.filter((_, i) => i !== index),
      }));
    }
  };

  const handleLaunch = () => {
    const cost = Number(formData.prizePool) || 0;
    if (cost > 0) {
      setShowCheckoutModal(true);
    } else {
      executeLaunch();
    }
  };

  const executeLaunch = async () => {
    setIsSubmitting(true);
    setShowCheckoutModal(false);
    try {
      await createCampaign({
        advertiser_id: user?.id || '',
        title: formData.title,
        description: formData.description,
        type: formData.type as any,
        prize_pool: Number(formData.prizePool) || 0,
        remaining_pool: Number(formData.prizePool) || 0,
        status: 'active',
        required_platforms: formData.platforms,
        video_requirements: formData.videoRequirements,
        slogan: formData.slogan,
        keywords: formData.keywords,
        location: formData.location,
        discount_percent: Number(formData.discountPercent) || 0,
        verification_days: formData.verificationDays,
        image_url: formData.image_url,
        end_date: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        payout_tiers: formData.tiers.map((t) => ({
          min_views: Number(t.minViews) || 0,
          payout_amount: Number(t.amount) || 0,
          reward_type: 'cash' as any,
        })) as any,
      });
      navigate('/campaigns');
    } catch (err) {
      console.error('Failed to create campaign:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="create-campaign">
        {/* Top Bar */}
        <div className="create-topbar">
          <button className="topbar-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <FiArrowLeft size={20} />
          </button>
          <h2 className="create-topbar-title">Create Campaign</h2>
          <div style={{ width: 40 }} />
        </div>

        {/* Progress Stepper */}
        <div className="step-progress">
          <div className="step-line">
            <motion.div
              className="step-line-fill"
              animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
          {steps.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            return (
              <div
                key={step.id}
                className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
              >
                <div className="step-dot">
                  {isCompleted ? <FiCheck size={16} /> : step.icon}
                </div>
                <span className="step-label">{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="step-content"
            >
              <div className="step-heading-group">
                <h3 className="step-title">Choose Campaign Type</h3>
                <p className="step-subtitle">How do you want creators to be rewarded for their videos?</p>
              </div>

              <div className="campaign-type-grid">
                {CAMPAIGN_TYPES.map((type) => {
                  const isSelected = formData.type === type.id;
                  return (
                    <div
                      key={type.id}
                      className={`campaign-type-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => updateField('type', type.id)}
                    >
                      <div className="campaign-type-info">
                        <h4 className="campaign-type-title">{type.label}</h4>
                        <p className="campaign-type-desc">{type.description}</p>
                      </div>
                      <div className={`campaign-type-radio ${isSelected ? 'checked' : ''}`}>
                        {isSelected && <div className="campaign-type-radio-dot" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="step-content"
            >
              <div className="step-heading-group">
                <h3 className="step-title">Campaign Details</h3>
                <p className="step-subtitle">Provide details to guide creators on what to produce</p>
              </div>

              <div className="form-fields">
                <Input
                  label="Campaign Title"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., Luxury Resort Grand Opening"
                />

                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Describe your brand and the theme of the campaign..."
                />

                <div className="image-upload-wrapper">
                  <ImageUpload 
                    label="Campaign Cover Image (Cloudinary)" 
                    onUploadSuccess={(url) => updateField('image_url', url)}
                    onUploadError={(err) => console.error(err)}
                  />
                </div>

                <Input
                  label="Slogan / Tagline"
                  value={formData.slogan}
                  onChange={(e) => updateField('slogan', e.target.value)}
                  placeholder="e.g., Where Luxury Meets the Clouds"
                />

                <div className="form-grid-2">
                  <Input
                    label="Location"
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="City, State or 'Online'"
                  />

                  <Input
                    label="Deadline (End Date)"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => updateField('endDate', e.target.value)}
                  />
                </div>

                <Textarea
                  label="Video Requirements"
                  value={formData.videoRequirements}
                  onChange={(e) => updateField('videoRequirements', e.target.value)}
                  placeholder="Detail must-include guidelines, hashtags, or required talking points..."
                />

                {/* Keywords */}
                <div className="form-group">
                  <label className="form-label">Keywords & Tags</label>
                  <div className="keyword-input-row">
                    <Input
                      value={formData.keywordInput}
                      onChange={(e) => updateField('keywordInput', e.target.value)}
                      placeholder="Add a tag..."
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    />
                    <Button variant="secondary" size="md" onClick={addKeyword} type="button">
                      Add
                    </Button>
                  </div>
                  {formData.keywords.length > 0 && (
                    <div className="keywords-list">
                      {formData.keywords.map((kw) => (
                        <Badge key={kw} variant="ginger" size="sm">
                          #{kw}
                          <button type="button" className="keyword-remove" onClick={() => removeKeyword(kw)}>×</button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Platforms */}
                <div className="form-group">
                  <label className="form-label">Required Platforms</label>
                  <div className="platform-grid">
                    {SOCIAL_PLATFORMS.slice(0, 4).map((p) => {
                      const isActive = formData.platforms.includes(p.id);
                      return (
                        <button
                          type="button"
                          key={p.id}
                          className={`platform-chip ${isActive ? 'active' : ''}`}
                          onClick={() => togglePlatform(p.id)}
                        >
                          <span className={`platform-chip-indicator ${isActive ? 'active' : ''}`} />
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="step-content"
            >
              <div className="step-heading-group">
                <h3 className="step-title">Set Rewards</h3>
                <p className="step-subtitle">Define prize pools, verification rules, and payout tiers</p>
              </div>

              <div className="form-fields">
                {(formData.type === 'pool' || formData.type === 'hybrid') && (
                  <Input
                    label="Prize Pool Amount (₹)"
                    type="number"
                    min="0"
                    value={formData.prizePool}
                    onChange={(e) => updateField('prizePool', e.target.value)}
                    placeholder="e.g., 100000"
                  />
                )}

                {(formData.type === 'discount' || formData.type === 'hybrid') && (
                  <Input
                    label="Discount Percentage (%)"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountPercent}
                    onChange={(e) => updateField('discountPercent', e.target.value)}
                    placeholder="e.g., 15"
                  />
                )}

                {/* Verification Period */}
                <div className="form-group">
                  <label className="form-label">Verification Period</label>
                  <p className="field-hint">Time allowed to review views and verify engagement before payouts release.</p>
                  <div className="verify-period-grid">
                    {VERIFICATION_PERIODS.map((vp) => {
                      const isActive = formData.verificationDays === vp.days;
                      return (
                        <button
                          type="button"
                          key={vp.days}
                          className={`period-chip ${isActive ? 'active' : ''}`}
                          onClick={() => updateField('verificationDays', vp.days)}
                        >
                          {vp.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payout Tiers */}
                {(formData.type === 'pool' || formData.type === 'hybrid') && (
                  <div className="form-group">
                    <div className="tiers-section-header">
                      <label className="form-label">Payout Tiers</label>
                      <p className="field-hint">Creators receive higher payouts as their videos achieve more verified views.</p>
                    </div>

                    <div className="tiers-builder">
                      {formData.tiers.map((tier, idx) => (
                        <div key={idx} className="tier-card">
                          <div className="tier-card-header">
                            <span className="tier-badge">Tier {idx + 1}</span>
                            {formData.tiers.length > 1 && (
                              <button
                                type="button"
                                className="tier-delete-btn"
                                onClick={() => removeTier(idx)}
                                title="Remove tier"
                                aria-label={`Remove tier ${idx + 1}`}
                              >
                                <FiTrash2 size={15} />
                              </button>
                            )}
                          </div>
                          <div className="tier-inputs-grid">
                            <Input
                              label="Min. Views"
                              type="number"
                              min="0"
                              value={tier.minViews}
                              onChange={(e) => updateTier(idx, 'minViews', e.target.value)}
                              placeholder="1000"
                            />
                            <div className="tier-arrow-indicator">
                              <FiArrowRight size={18} />
                            </div>
                            <Input
                              label="Payout (₹)"
                              type="number"
                              min="0"
                              value={tier.amount}
                              onChange={(e) => updateTier(idx, 'amount', e.target.value)}
                              placeholder="1000"
                            />
                          </div>
                        </div>
                      ))}

                      <button type="button" className="tier-add-btn" onClick={addTier}>
                        <FiPlus size={16} />
                        <span>Add Another Tier</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="step-content"
            >
              <div className="step-heading-group">
                <h3 className="step-title">Review & Launch</h3>
                <p className="step-subtitle">Make sure all your campaign details look great before publishing</p>
              </div>

              <div className="review-summary">
                <Card variant="glass" padding="lg">
                  <div className="review-header">
                    <div>
                      <span className="review-type-badge">{formData.type.toUpperCase()}</span>
                      <h3 className="review-campaign-title">{formData.title || 'Untitled Campaign'}</h3>
                      {formData.slogan && <p className="review-slogan">"{formData.slogan}"</p>}
                    </div>
                  </div>

                  <div className="review-divider" />

                  <div className="review-grid">
                    <div className="review-row">
                      <span className="review-label">Location</span>
                      <span className="review-value">{formData.location || 'Online / Anywhere'}</span>
                    </div>
                    <div className="review-row">
                      <span className="review-label">Prize Pool</span>
                      <span className="review-value prize-highlight">₹{Number(formData.prizePool || 0).toLocaleString()}</span>
                    </div>
                    {formData.discountPercent && (
                      <div className="review-row">
                        <span className="review-label">Discount</span>
                        <span className="review-value">{formData.discountPercent}% Off</span>
                      </div>
                    )}
                    <div className="review-row">
                      <span className="review-label">Verification Window</span>
                      <span className="review-value">{formData.verificationDays} days</span>
                    </div>
                    <div className="review-row">
                      <span className="review-label">Configured Tiers</span>
                      <span className="review-value">{formData.tiers.length} Tiers</span>
                    </div>
                    <div className="review-row">
                      <span className="review-label">Platforms</span>
                      <span className="review-value">{formData.platforms.join(', ') || 'All Platforms'}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation Buttons */}
        <div className="step-nav">
          {currentStep > 1 ? (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setCurrentStep((s) => s - 1)}
              icon={<FiArrowLeft />}
              type="button"
            >
              Back
            </Button>
          ) : (
            <div />
          )}
          {currentStep < 4 ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => setCurrentStep((s) => s + 1)}
              icon={<FiArrowRight />}
              iconPosition="right"
              type="button"
            >
              Next Step
            </Button>
          ) : (
            <Button 
              variant="primary" 
              size="lg" 
              id="btn-launch-campaign" 
              onClick={handleLaunch}
              disabled={isSubmitting}
              type="button"
            >
              {isSubmitting ? 'Processing...' : 'Submit & Pay 🚀'}
            </Button>
          )}
        </div>
      </div>
      
      <CampaignCheckoutModal 
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onSuccess={executeLaunch}
        campaignCost={Number(formData.prizePool) || 0}
      />
    </div>
  );
};

export default CreateCampaignPage;
