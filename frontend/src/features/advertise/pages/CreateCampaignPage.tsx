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
  const [formData, setFormData] = useState({
    type: 'pool' as string,
    title: '',
    description: '',
    slogan: '',
    keywords: [] as string[],
    keywordInput: '',
    location: '',
    platforms: [] as string[],
    videoRequirements: '',
    prizePool: '',
    discountPercent: '',
    verificationDays: 7,
    image_url: '',
    endDate: '',
    tiers: [
      { minViews: '1000', amount: '1000', rewardType: 'cash' },
      { minViews: '10000', amount: '10000', rewardType: 'cash' },
    ] as { minViews: string; amount: string; rewardType: string }[],
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addKeyword = () => {
    if (formData.keywordInput.trim() && !formData.keywords.includes(formData.keywordInput.trim())) {
      updateField('keywords', [...formData.keywords, formData.keywordInput.trim()]);
      updateField('keywordInput', '');
    }
  };

  const removeKeyword = (kw: string) => {
    updateField('keywords', formData.keywords.filter((k) => k !== kw));
  };

  const togglePlatform = (platform: string) => {
    if (formData.platforms.includes(platform)) {
      updateField('platforms', formData.platforms.filter((p) => p !== platform));
    } else {
      updateField('platforms', [...formData.platforms, platform]);
    }
  };

  const addTier = () => {
    updateField('tiers', [...formData.tiers, { minViews: '', amount: '', rewardType: 'cash' }]);
  };

  const removeTier = (index: number) => {
    updateField('tiers', formData.tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: string, value: string) => {
    const newTiers = [...formData.tiers];
    (newTiers[index] as any)[field] = value;
    updateField('tiers', newTiers);
  };

  const handleLaunch = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await createCampaign({
        advertiser_id: user.id,
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
        end_date: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        payout_tiers: formData.tiers.map(t => ({
          min_views: Number(t.minViews) || 0,
          payout_amount: Number(t.amount) || 0,
          reward_type: t.rewardType as any
        })) as any,
      });
      navigate('/campaigns');
    } catch (err) {
      console.error('Failed to create campaign', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <div className="container create-campaign">
        {/* Top Bar */}
        <div className="create-topbar">
          <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <FiArrowLeft />
          </button>
          <h4>Create Campaign</h4>
          <div style={{ width: 40 }} />
        </div>

        {/* Progress Steps */}
        <div className="step-progress">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`step-item ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`}
            >
              <div className="step-dot">
                {currentStep > step.id ? <FiCheck size={12} /> : step.icon}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          ))}
          <div className="step-line">
            <motion.div
              className="step-line-fill"
              animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
              className="step-content"
            >
              <h3>Choose Campaign Type</h3>
              <p className="text-secondary text-sm mb-6">How do you want creators to be rewarded?</p>

              <div className="campaign-type-grid">
                {CAMPAIGN_TYPES.map((type) => (
                  <Card
                    key={type.id}
                    variant={formData.type === type.id ? 'ginger' : 'default'}
                    padding="md"
                    onClick={() => updateField('type', type.id)}
                    className="campaign-type-card"
                  >
                    <h5>{type.label}</h5>
                    <p className="text-xs text-secondary mt-2">{type.description}</p>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
              className="step-content"
            >
              <h3>Campaign Details</h3>
              <p className="text-secondary text-sm mb-6">Tell creators what you need</p>

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
                  placeholder="Describe what kind of videos you want..."
                />

                <ImageUpload 
                  label="Campaign Cover Image (Cloudinary)" 
                  onUploadSuccess={(url) => updateField('image_url', url)}
                  onUploadError={(err) => console.error(err)}
                />

                <Input
                  label="Slogan / Tagline"
                  value={formData.slogan}
                  onChange={(e) => updateField('slogan', e.target.value)}
                  placeholder="e.g., Where Luxury Meets the Clouds"
                />

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
                  placeholder="Select deadline"
                />

                <Textarea
                  label="Video Requirements"
                  value={formData.videoRequirements}
                  onChange={(e) => updateField('videoRequirements', e.target.value)}
                  placeholder="What must the video include?"
                />

                {/* Keywords */}
                <div>
                  <label className="form-label">Keywords</label>
                  <div className="keyword-input-row">
                    <Input
                      value={formData.keywordInput}
                      onChange={(e) => updateField('keywordInput', e.target.value)}
                      placeholder="Add a keyword"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    />
                    <Button variant="secondary" size="sm" onClick={addKeyword}>Add</Button>
                  </div>
                  <div className="keywords-list mt-2">
                    {formData.keywords.map((kw) => (
                      <Badge key={kw} variant="ginger" size="sm">
                        #{kw}
                        <button className="keyword-remove" onClick={() => removeKeyword(kw)}>×</button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Platforms */}
                <div>
                  <label className="form-label">Required Platforms</label>
                  <div className="platform-grid">
                    {SOCIAL_PLATFORMS.slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        className={`platform-chip ${formData.platforms.includes(p.id) ? 'active' : ''}`}
                        onClick={() => togglePlatform(p.id)}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
              className="step-content"
            >
              <h3>Set Rewards</h3>
              <p className="text-secondary text-sm mb-6">Define how creators will earn</p>

              <div className="form-fields">
                {(formData.type === 'pool' || formData.type === 'hybrid') && (
                  <Input
                    label="Prize Pool Amount (₹)"
                    type="number"
                    value={formData.prizePool}
                    onChange={(e) => updateField('prizePool', e.target.value)}
                    placeholder="e.g., 100000"
                  />
                )}

                {(formData.type === 'discount' || formData.type === 'hybrid') && (
                  <Input
                    label="Discount Percentage (%)"
                    type="number"
                    value={formData.discountPercent}
                    onChange={(e) => updateField('discountPercent', e.target.value)}
                    placeholder="e.g., 15"
                  />
                )}

                {/* Verification Period */}
                <div>
                  <label className="form-label">Verification Period</label>
                  <div className="verify-period-grid">
                    {VERIFICATION_PERIODS.map((vp) => (
                      <button
                        key={vp.days}
                        className={`period-chip ${formData.verificationDays === vp.days ? 'active' : ''}`}
                        onClick={() => updateField('verificationDays', vp.days)}
                      >
                        {vp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payout Tiers */}
                {(formData.type === 'pool' || formData.type === 'hybrid') && (
                  <div>
                    <label className="form-label">Payout Tiers</label>
                    <div className="tiers-builder">
                      {formData.tiers.map((tier, idx) => (
                        <div key={idx} className="tier-row">
                          <Input
                            label="Min. Views"
                            type="number"
                            value={tier.minViews}
                            onChange={(e) => updateTier(idx, 'minViews', e.target.value)}
                          />
                          <span className="tier-arrow-small">→</span>
                          <Input
                            label="Payout (₹)"
                            type="number"
                            value={tier.amount}
                            onChange={(e) => updateTier(idx, 'amount', e.target.value)}
                          />
                          {formData.tiers.length > 1 && (
                            <button className="tier-delete" onClick={() => removeTier(idx)}>
                              <FiTrash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" icon={<FiPlus />} onClick={addTier}>
                        Add Tier
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
              className="step-content"
            >
              <h3>Review & Launch</h3>
              <p className="text-secondary text-sm mb-6">Make sure everything looks good</p>

              <div className="review-summary">
                <Card variant="glass" padding="md">
                  <div className="review-row"><span className="review-label">Type</span><span className="font-semibold">{formData.type}</span></div>
                  <div className="review-row"><span className="review-label">Title</span><span className="font-semibold">{formData.title || '—'}</span></div>
                  <div className="review-row"><span className="review-label">Location</span><span>{formData.location || 'Anywhere'}</span></div>
                  <div className="review-row"><span className="review-label">Prize Pool</span><span className="gradient-text font-bold">₹{formData.prizePool || '0'}</span></div>
                  {formData.discountPercent && (
                    <div className="review-row"><span className="review-label">Discount</span><span>{formData.discountPercent}%</span></div>
                  )}
                  <div className="review-row"><span className="review-label">Verification</span><span>{formData.verificationDays} days</span></div>
                  <div className="review-row"><span className="review-label">Tiers</span><span>{formData.tiers.length} tiers</span></div>
                  <div className="review-row"><span className="review-label">Platforms</span><span>{formData.platforms.join(', ') || 'Any'}</span></div>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="step-nav">
          {currentStep > 1 && (
            <Button
              variant="secondary"
              onClick={() => setCurrentStep((s) => s - 1)}
              icon={<FiArrowLeft />}
            >
              Back
            </Button>
          )}
          <div className="flex-1" />
          {currentStep < 4 ? (
            <Button
              variant="primary"
              onClick={() => setCurrentStep((s) => s + 1)}
              icon={<FiArrowRight />}
              iconPosition="right"
            >
              Next
            </Button>
          ) : (
            <Button 
              variant="primary" 
              size="lg" 
              id="btn-launch-campaign" 
              onClick={handleLaunch}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Launching...' : '🚀 Launch Campaign'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignPage;
