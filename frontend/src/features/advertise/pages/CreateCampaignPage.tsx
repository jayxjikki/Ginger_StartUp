// ═══════════════════════════════════════════════════════════
// GINGER — Create Campaign Page (Advertise Tab)
// Campaign creation wizard for business owners
// ═══════════════════════════════════════════════════════════

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiArrowRight, FiPlus, FiTrash2,
  FiDollarSign, FiTarget, FiFileText, FiCheck, FiEye,
  FiUploadCloud, FiMapPin, FiGlobe
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input, { Textarea } from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import { useAuthStore } from '../../../store/authStore';
import { useCampaignStore } from '../../../store/campaignStore';
import { CAMPAIGN_TYPES, VERIFICATION_PERIODS, SOCIAL_PLATFORMS } from '../../../lib/constants';
import { getSocialIcon } from '../../../utils/socialHelpers';
import { uploadToCloudinary } from '../../../lib/cloudinary';
import { CampaignImageSlideshow } from '../../../components/ui/CampaignImageSlideshow';
import { INDIAN_STATES_AND_CITIES } from '../../../lib/indianLocations';
import { DIRECT_DISCOUNT_TERMS, type DirectDiscountTierItem } from '../../../types/campaign.types';
import CampaignCheckoutModal from '../components/CampaignCheckoutModal';
import './CreateCampaignPage.css';

const steps = [
  { id: 1, label: 'Type', icon: <FiTarget size={16} /> },
  { id: 2, label: 'Details', icon: <FiFileText size={16} /> },
  { id: 3, label: 'Rewards', icon: <FiDollarSign size={16} /> },
  { id: 4, label: 'Review', icon: <FiEye size={16} /> },
];

const CreateCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createCampaign } = useCampaignStore();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Multi-image upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    type: 'pool' as string,
    title: '',
    description: '',
    slogan: '',
    // Location: Physical vs Online / None
    isOnlineVenue: false,
    locationState: 'Karnataka',
    locationCity: 'Bengaluru',
    locationCustomCity: '',
    locationExact: '',
    location: 'Bengaluru, Karnataka',
    videoRequirements: '',
    keywords: [] as string[],
    keywordInput: '',
    platforms: ['youtube', 'instagram'] as string[],
    prizePool: '',
    verificationDays: 30,
    directDiscountTiers: [
      { term: 'Shoot a video', reward: '' },
    ] as DirectDiscountTierItem[],
    cashTiers: [
      { minViews: '', amount: '' },
    ],
    discountTiers: [
      { minViews: '', amount: '' },
    ],
    giftTiers: [
      { type: 'views' as 'views' | 'text', minViews: '', condition: '', gift: '' },
    ],
    images: [] as string[],
    image_url: '',
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ── Multi-Image Handlers (Up to 3 images with Automatic Slideshow) ──
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files);
    const remainingSlots = 3 - formData.images.length;
    if (remainingSlots <= 0) {
      toast.error('Maximum 3 pictures allowed');
      return;
    }

    const filesToUpload = fileList.slice(0, remainingSlots);
    setIsUploadingImage(true);

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error(`"${file.name}" is not an image file`);
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`"${file.name}" exceeds 10MB limit`);
        }
        return await uploadToCloudinary(file, user?.id);
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData((prev) => {
        const nextImages = [...prev.images, ...uploadedUrls].slice(0, 3);
        return {
          ...prev,
          images: nextImages,
          image_url: nextImages[0] || '',
        };
      });
      toast.success(
        uploadedUrls.length === 1
          ? 'Picture added!'
          : `${uploadedUrls.length} pictures added!`
      );
    } catch (err: any) {
      console.error('Image upload failed:', err);
      toast.error(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const removeImage = (idx: number) => {
    setFormData((prev) => {
      const nextImages = prev.images.filter((_, i) => i !== idx);
      return {
        ...prev,
        images: nextImages,
        image_url: nextImages[0] || '',
      };
    });
  };

  const setCoverImage = (idx: number) => {
    if (idx === 0) return;
    setFormData((prev) => {
      const selected = prev.images[idx];
      const rest = prev.images.filter((_, i) => i !== idx);
      const nextImages = [selected, ...rest];
      return {
        ...prev,
        images: nextImages,
        image_url: nextImages[0] || '',
      };
    });
    toast.success('Cover image set!');
  };

  // ── Location Handlers ──
  const updateLocationState = (newState: string) => {
    const defaultCity = INDIAN_STATES_AND_CITIES[newState]?.[0] || 'Other';
    setFormData((prev) => {
      const cityToUse = defaultCity === 'Other' ? prev.locationCustomCity.trim() : defaultCity;
      const parts = [prev.locationExact.trim(), cityToUse, newState].filter(Boolean);
      return {
        ...prev,
        locationState: newState,
        locationCity: defaultCity,
        location: prev.isOnlineVenue ? 'None' : parts.join(', '),
      };
    });
  };

  const updateLocationCity = (newCity: string) => {
    setFormData((prev) => {
      const cityToUse = newCity === 'Other' ? prev.locationCustomCity.trim() : newCity;
      const parts = [prev.locationExact.trim(), cityToUse, prev.locationState].filter(Boolean);
      return {
        ...prev,
        locationCity: newCity,
        location: prev.isOnlineVenue ? 'None' : parts.join(', '),
      };
    });
  };

  const updateLocationCustomCity = (val: string) => {
    setFormData((prev) => {
      const parts = [prev.locationExact.trim(), val.trim(), prev.locationState].filter(Boolean);
      return {
        ...prev,
        locationCustomCity: val,
        location: prev.isOnlineVenue ? 'None' : parts.join(', '),
      };
    });
  };

  const updateLocationExact = (val: string) => {
    setFormData((prev) => {
      const cityToUse = prev.locationCity === 'Other' ? prev.locationCustomCity.trim() : prev.locationCity;
      const parts = [val.trim(), cityToUse, prev.locationState].filter(Boolean);
      return {
        ...prev,
        locationExact: val,
        location: prev.isOnlineVenue ? 'None' : parts.join(', '),
      };
    });
  };

  const toggleVenueType = (isOnline: boolean) => {
    setFormData((prev) => {
      if (isOnline) {
        return {
          ...prev,
          isOnlineVenue: true,
          location: 'None',
        };
      } else {
        const cityToUse = prev.locationCity === 'Other' ? prev.locationCustomCity.trim() : prev.locationCity;
        const parts = [prev.locationExact.trim(), cityToUse, prev.locationState].filter(Boolean);
        return {
          ...prev,
          isOnlineVenue: false,
          location: parts.join(', '),
        };
      }
    });
  };

  // ── Smart Hashtags / Keywords Handlers ──
  const handleKeywordChange = (val: string) => {
    if (!val) {
      updateField('keywordInput', '');
      return;
    }
    // As soon as user starts to type, prefix with hashtag without double ##
    let formatted = val;
    if (!formatted.startsWith('#')) {
      formatted = '#' + formatted.replace(/^#+/, '');
    } else {
      formatted = '#' + formatted.replace(/^#+/, '');
    }
    updateField('keywordInput', formatted);
  };

  const addKeyword = () => {
    const raw = formData.keywordInput.trim();
    if (!raw || raw === '#') return;

    // Split by space, comma, or enter (in case user pasted or typed multiple hashtags)
    const extracted = raw
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#+/, '').trim())
      .filter((t) => t.length > 0);

    if (extracted.length > 0) {
      setFormData((prev) => {
        const next = [...prev.keywords];
        extracted.forEach((k) => {
          if (!next.includes(k)) next.push(k);
        });
        return { ...prev, keywords: next, keywordInput: '' };
      });
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

  const handleTypeSelect = (typeId: string) => {
    updateField('type', typeId);
  };

  // ── Tier Completion Helper Checks (Prevents adding new tier until current one is filled) ──
  const isLastDirectDiscountTierFilled =
    formData.directDiscountTiers.length === 0 ||
    Boolean(formData.directDiscountTiers[formData.directDiscountTiers.length - 1]?.reward?.trim());

  const isLastCashTierFilled =
    formData.cashTiers.length === 0 ||
    (Boolean(formData.cashTiers[formData.cashTiers.length - 1]?.minViews?.trim()) &&
     Boolean(formData.cashTiers[formData.cashTiers.length - 1]?.amount?.trim()));

  const isLastDiscountTierFilled =
    formData.discountTiers.length === 0 ||
    (Boolean(formData.discountTiers[formData.discountTiers.length - 1]?.amount?.trim()) &&
     Boolean(formData.discountTiers[formData.discountTiers.length - 1]?.minViews?.trim()));

  const isLastGiftTierFilled =
    formData.giftTiers.length === 0 ||
    (() => {
      const last = formData.giftTiers[formData.giftTiers.length - 1];
      if (!last) return true;
      if (!last.gift?.trim()) return false;
      if (last.type === 'views') {
        return Boolean(last.minViews && String(last.minViews).trim() !== '');
      } else {
        return Boolean(last.condition && last.condition.trim() !== '');
      }
    })();

  // Direct Discount Tiers Handlers (1st Tier in Every Campaign, Max 4, non-repeating terms)
  const addDirectDiscountTier = () => {
    if (formData.directDiscountTiers.length >= 4) {
      toast.error('Maximum 4 direct discount tiers allowed');
      return;
    }
    if (!isLastDirectDiscountTierFilled) {
      toast.error(
        `Please fill in the reward for Direct Discount Tier ${formData.directDiscountTiers.length} before adding another.`
      );
      return;
    }
    const usedTerms = formData.directDiscountTiers.map((t) => t.term);
    const nextAvailable =
      DIRECT_DISCOUNT_TERMS.find((t) => !usedTerms.includes(t.label))?.label ||
      DIRECT_DISCOUNT_TERMS[0].label;

    setFormData((prev) => ({
      ...prev,
      directDiscountTiers: [
        ...prev.directDiscountTiers,
        { term: nextAvailable, reward: '' },
      ],
    }));
  };

  const updateDirectDiscountTier = (
    index: number,
    field: 'term' | 'reward',
    value: string
  ) => {
    setFormData((prev) => {
      const nextTiers = [...prev.directDiscountTiers];
      if (field === 'term') {
        const isAlreadyUsed = nextTiers.some((t, i) => i !== index && t.term === value);
        if (isAlreadyUsed) {
          toast.error(`"${value}" is already selected in another tier. Please pick another option.`);
          return prev;
        }
      }
      nextTiers[index] = { ...nextTiers[index], [field]: value };
      return { ...prev, directDiscountTiers: nextTiers };
    });
  };

  const removeDirectDiscountTier = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      directDiscountTiers: prev.directDiscountTiers.filter((_, i) => i !== index),
    }));
  };

  // Cash Tiers Handlers
  const addCashTier = () => {
    if (!isLastCashTierFilled) {
      toast.error(
        `Please fill in Min. Views and Payout for Cash Tier ${formData.cashTiers.length} before adding another.`
      );
      return;
    }
    setFormData((prev) => ({
      ...prev,
      cashTiers: [...prev.cashTiers, { minViews: '', amount: '' }],
    }));
  };

  const updateCashTier = (index: number, field: 'minViews' | 'amount', value: string) => {
    setFormData((prev) => {
      const nextTiers = [...prev.cashTiers];
      nextTiers[index][field] = value;
      return { ...prev, cashTiers: nextTiers };
    });
  };

  const removeCashTier = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      cashTiers: prev.cashTiers.filter((_, i) => i !== index),
    }));
  };

  // Discount Tiers Handlers
  const addDiscountTier = () => {
    if (!isLastDiscountTierFilled) {
      toast.error(
        `Please fill in Discount (%) and Min. Views for Discount Tier ${formData.discountTiers.length} before adding another.`
      );
      return;
    }
    setFormData((prev) => ({
      ...prev,
      discountTiers: [...prev.discountTiers, { minViews: '', amount: '' }],
    }));
  };

  const updateDiscountTier = (index: number, field: 'minViews' | 'amount', value: string) => {
    setFormData((prev) => {
      const nextTiers = [...prev.discountTiers];
      nextTiers[index][field] = value;
      return { ...prev, discountTiers: nextTiers };
    });
  };

  const removeDiscountTier = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      discountTiers: prev.discountTiers.filter((_, i) => i !== index),
    }));
  };

  // Gift Tiers Handlers
  const addGiftTier = (tierType: 'views' | 'text' = 'views') => {
    if (!isLastGiftTierFilled) {
      const last = formData.giftTiers[formData.giftTiers.length - 1];
      const missingField =
        last?.type === 'views'
          ? !last?.minViews?.trim()
            ? 'Min. Views'
            : 'Gift Description'
          : !last?.condition?.trim()
          ? 'Requirement / Task'
          : 'Reward / Perk';
      toast.error(
        `Please fill in ${missingField} for Gift Tier ${formData.giftTiers.length} before adding another.`
      );
      return;
    }
    setFormData((prev) => ({
      ...prev,
      giftTiers: [
        ...prev.giftTiers,
        {
          type: tierType,
          minViews: tierType === 'views' ? '' : '0',
          condition: '',
          gift: '',
        },
      ],
    }));
  };

  const updateGiftTier = (
    index: number,
    field: 'type' | 'minViews' | 'condition' | 'gift',
    value: string
  ) => {
    setFormData((prev) => {
      const nextTiers = [...prev.giftTiers];
      nextTiers[index] = { ...nextTiers[index], [field]: value };
      return { ...prev, giftTiers: nextTiers };
    });
  };

  const removeGiftTier = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      giftTiers: prev.giftTiers.filter((_, i) => i !== index),
    }));
  };

  // Step Validations
  const validateStep = (step: number): boolean => {
    if (step === 2) {
      if (!formData.title?.trim()) {
        toast.error('Campaign title is compulsory. Please enter a title.');
        return false;
      }
      if (formData.images.length === 0) {
        toast.error('At least 1 campaign picture is compulsory. Please upload an image.');
        return false;
      }
      if (!formData.videoRequirements?.trim()) {
        toast.error('Video requirements are compulsory. Please detail guidelines for creators.');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (formData.directDiscountTiers.length === 0) {
        toast.error('At least 1 Direct Discount Tier is compulsory. Please add a tier.');
        return false;
      }
      const emptyDirectTier = formData.directDiscountTiers.find((t) => !t.reward?.trim());
      if (emptyDirectTier) {
        toast.error(`Please enter the reward for "${emptyDirectTier.term}" in Direct Discount Tiers.`);
        return false;
      }

      if (formData.type === 'pool') {
        const poolVal = Number(formData.prizePool);
        if (!formData.prizePool || isNaN(poolVal) || poolVal <= 0) {
          toast.error('Prize pool amount is compulsory for Prize Pool campaigns.');
          return false;
        }
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((s) => s + 1);
  };

  const handleLaunch = () => {
    if (!validateStep(2) || !validateStep(3)) return;
    const cost = Number(formData.prizePool) || 0;
    if (cost > 0) {
      setShowCheckoutModal(true);
    } else {
      executeLaunch();
    }
  };

  const executeLaunch = async () => {
    if (!validateStep(2) || !validateStep(3)) return;
    setIsSubmitting(true);
    setShowCheckoutModal(false);
    try {
      const allTiers: any[] = [];

      // ── 1ST TIER: Direct Discount Tiers (always above every tier) ──
      formData.directDiscountTiers.forEach((t) => {
        if (t.term && t.reward?.trim()) {
          const numericAmount = parseFloat(t.reward.replace(/[^0-9.]/g, '')) || 0;
          allTiers.push({
            min_views: 0,
            payout_amount: numericAmount,
            reward_type: 'discount' as const,
            reward_description: `[Direct Discount] ${t.term} ::: ${t.reward.trim()}`,
          });
        }
      });

      if (formData.type === 'pool') {
        formData.cashTiers.forEach((t) => {
          if (t.minViews?.trim() && t.amount?.trim()) {
            allTiers.push({
              min_views: Number(t.minViews) || 0,
              payout_amount: Number(t.amount) || 0,
              reward_type: 'cash' as const,
              reward_description: null,
            });
          }
        });
      } else if (formData.type === 'discount') {
        formData.discountTiers.forEach((t) => {
          if (t.minViews?.trim() && t.amount?.trim()) {
            allTiers.push({
              min_views: Number(t.minViews) || 0,
              payout_amount: Number(t.amount) || 0,
              reward_type: 'discount' as const,
              reward_description: `${t.amount}% Discount`,
            });
          }
        });
      } else if (formData.type === 'hybrid') {
        // 1st: Cash tiers (views : pay)
        formData.cashTiers.forEach((t) => {
          if (t.minViews?.trim() && t.amount?.trim()) {
            allTiers.push({
              min_views: Number(t.minViews) || 0,
              payout_amount: Number(t.amount) || 0,
              reward_type: 'cash' as const,
              reward_description: null,
            });
          }
        });
        // 2nd: Discount tiers (discount : views)
        formData.discountTiers.forEach((t) => {
          if (t.minViews?.trim() && t.amount?.trim()) {
            allTiers.push({
              min_views: Number(t.minViews) || 0,
              payout_amount: Number(t.amount) || 0,
              reward_type: 'discount' as const,
              reward_description: `${t.amount}% Discount`,
            });
          }
        });
        // 3rd: Gift tiers (views : gifts or condition : reward)
        formData.giftTiers.forEach((t) => {
          if (t.type === 'text') {
            if (t.condition?.trim() && t.gift?.trim()) {
              allTiers.push({
                min_views: 0,
                payout_amount: 0,
                reward_type: 'gift' as const,
                reward_description: `${t.condition.trim()} : REWARD : ${t.gift.trim()}`,
              });
            }
          } else {
            if (t.minViews?.trim() && t.gift?.trim()) {
              allTiers.push({
                min_views: Number(t.minViews) || 0,
                payout_amount: 0,
                reward_type: 'gift' as const,
                reward_description: t.gift.trim(),
              });
            }
          }
        });
      }

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
        location: formData.isOnlineVenue ? 'None' : (formData.location || 'None'),
        discount_percent:
          formData.directDiscountTiers.some((t) => t.reward?.trim())
            ? parseFloat(formData.directDiscountTiers.find((t) => t.reward?.trim())!.reward.replace(/[^0-9.]/g, '')) || 0
            : (formData.type === 'discount' || formData.type === 'hybrid') && formData.discountTiers.length > 0
            ? Number(formData.discountTiers[0].amount) || 0
            : 0,
        verification_days: formData.verificationDays,
        image_url: formData.images[0] || '',
        images: formData.images,
        terms: {
          images: formData.images,
          direct_discount_tiers: formData.directDiscountTiers.filter((t) => t.reward?.trim()),
        },
        payout_tiers: allTiers as any,
      });
      toast.success('Campaign published successfully! 🚀');
      navigate('/campaigns');
    } catch (err: any) {
      console.error('Failed to create campaign:', err);
      toast.error(err?.message || 'Failed to publish campaign. Please try again.');
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
                  <AnimatePresence mode="wait" initial={false}>
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="step-icon-center"
                      >
                        <FiCheck size={18} strokeWidth={2.5} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="icon"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="step-icon-center"
                      >
                        {step.icon}
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                      onClick={() => handleTypeSelect(type.id)}
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
                  label="Campaign Title *"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., Luxury Resort Grand Opening"
                  required
                />

                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Describe your brand and the theme of the campaign..."
                />

                {/* ── 1st & 2nd: Campaign Images (Up to 3 pictures & Automatic Slideshow, no "Cloudinary") ── */}
                <div className="form-group campaign-images-uploader-group">
                  <div className="section-title-row">
                    <label className="form-label">Campaign Images ({formData.images.length}/3) *</label>
                    <span className="field-hint-inline">
                      {formData.images.length > 1
                        ? '✨ Automatic slideshow active for multiple pictures'
                        : 'Upload up to 3 pictures (at least 1 is compulsory).'}
                    </span>
                  </div>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                  />

                  {/* Images Grid */}
                  <div className="campaign-images-grid">
                    {formData.images.map((imgUrl, idx) => (
                      <div key={idx} className="campaign-image-slot uploaded">
                        <img src={imgUrl} alt={`Upload ${idx + 1}`} className="slot-thumb" />
                        <div className="slot-badge">
                          {idx === 0 ? 'Cover Photo' : `Slide ${idx + 1}`}
                        </div>
                        <div className="slot-actions">
                          {idx > 0 && (
                            <button
                              type="button"
                              className="slot-action-btn cover-btn"
                              onClick={() => setCoverImage(idx)}
                              title="Make Cover Photo"
                            >
                              Set Cover
                            </button>
                          )}
                          <button
                            type="button"
                            className="slot-action-btn delete-btn"
                            onClick={() => removeImage(idx)}
                            title="Remove Picture"
                            aria-label={`Remove picture ${idx + 1}`}
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {formData.images.length < 3 && (
                      <button
                        type="button"
                        className="campaign-image-add-btn"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploadingImage}
                      >
                        {isUploadingImage ? (
                          <div className="upload-loading-content">
                            <span className="material-symbols-outlined spin-icon">progress_activity</span>
                            <span>Uploading...</span>
                          </div>
                        ) : (
                          <div className="upload-empty-content">
                            <FiUploadCloud size={24} className="upload-cloud-icon" />
                            <span className="upload-add-title">
                              + Add Picture ({formData.images.length + 1}/3)
                            </span>
                            <span className="upload-add-sub">
                              {formData.images.length === 0 ? 'Cover Picture' : 'Slide Picture'}
                            </span>
                          </div>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Auto Slideshow Live Preview when > 1 image */}
                  {formData.images.length > 1 && (
                    <div className="campaign-slideshow-preview-card">
                      <div className="slideshow-preview-header">
                        <span className="slideshow-preview-tag">LIVE PREVIEW</span>
                        <span className="slideshow-preview-title">Automatic Slideshow (as seen by creators)</span>
                      </div>
                      <div className="slideshow-preview-frame">
                        <CampaignImageSlideshow
                          images={formData.images}
                          alt={formData.title || 'Campaign preview'}
                          showBadge={true}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Input
                  label="Slogan / Tagline"
                  value={formData.slogan}
                  onChange={(e) => updateField('slogan', e.target.value)}
                  placeholder="e.g., Best fitness gym in Neotown, Gollahalli"
                />

                {/* ── 3rd: Location (State, City, Exact Venue Address vs Online/None) ── */}
                <div className="form-group campaign-location-group">
                  <label className="form-label">Location</label>
                  <p className="field-hint">
                    Set whether this is a physical venue (store, gym, cafe) for map discovery, or an online campaign.
                  </p>

                  <div className="venue-type-toggle">
                    <button
                      type="button"
                      className={`venue-toggle-btn ${!formData.isOnlineVenue ? 'active' : ''}`}
                      onClick={() => toggleVenueType(false)}
                    >
                      <FiMapPin size={16} />
                      <span>Physical Store / Venue</span>
                    </button>
                    <button
                      type="button"
                      className={`venue-toggle-btn ${formData.isOnlineVenue ? 'active' : ''}`}
                      onClick={() => toggleVenueType(true)}
                    >
                      <FiGlobe size={16} />
                      <span>Online / Digital Campaign</span>
                    </button>
                  </div>

                  {formData.isOnlineVenue ? (
                    <div className="online-location-notice">
                      <FiGlobe size={20} className="notice-icon text-ginger" />
                      <div>
                        <h5 className="notice-title">Online Campaign — Location set to "None"</h5>
                        <p className="notice-desc">
                          Creators from anywhere can submit content for this campaign. It will not be pinned to a physical radar map location.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="physical-location-fields">
                      <div className="location-row-selects">
                        {/* State selector */}
                        <div className="location-select-field">
                          <label className="sub-label">State</label>
                          <select
                            className="location-select"
                            value={formData.locationState}
                            onChange={(e) => updateLocationState(e.target.value)}
                          >
                            {Object.keys(INDIAN_STATES_AND_CITIES).map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* City selector */}
                        <div className="location-select-field">
                          <label className="sub-label">City</label>
                          <select
                            className="location-select"
                            value={formData.locationCity}
                            onChange={(e) => updateLocationCity(e.target.value)}
                          >
                            {(INDIAN_STATES_AND_CITIES[formData.locationState] || []).map((ct) => (
                              <option key={ct} value={ct}>
                                {ct}
                              </option>
                            ))}
                            <option value="Other">Other / Custom City...</option>
                          </select>
                        </div>
                      </div>

                      {/* Custom City input if 'Other' */}
                      {formData.locationCity === 'Other' && (
                        <Input
                          label="Custom City Name"
                          placeholder="e.g., Hosur, Whitefield, etc."
                          value={formData.locationCustomCity}
                          onChange={(e) => updateLocationCustomCity(e.target.value)}
                        />
                      )}

                      {/* Exact Venue Address */}
                      <Input
                        label="Exact Venue Location / Street Address"
                        placeholder="e.g., GOLLAHALLI Main Road, Opp. Wipro Gate, Electronic City"
                        value={formData.locationExact}
                        onChange={(e) => updateLocationExact(e.target.value)}
                      />
                      <p className="field-hint-small">
                        📍 Combined map location: <strong className="text-ginger">{formData.location || 'Please specify address'}</strong>
                      </p>
                    </div>
                  )}
                </div>

                {/* ── 4th: Deadline box & option REMOVED completely! ── */}

                <Textarea
                  label="Video Requirements *"
                  value={formData.videoRequirements}
                  onChange={(e) => updateField('videoRequirements', e.target.value)}
                  placeholder="Detail must-include guidelines, hashtags, or required talking points..."
                  required
                />

                {/* ── 5th: Keywords & Tags (Auto-starts with #, no double ##) ── */}
                <div className="form-group">
                  <label className="form-label">Keywords & Tags</label>
                  <p className="field-hint">
                    Type keywords for creators to find your campaign. Automatically formatted with hashtags.
                  </p>
                  <div className="keyword-input-row">
                    <Input
                      value={formData.keywordInput}
                      onChange={(e) => handleKeywordChange(e.target.value)}
                      placeholder="#fitness, #gym, #viral..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addKeyword();
                        }
                      }}
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
                    {SOCIAL_PLATFORMS.map((p) => {
                      const isActive = formData.platforms.includes(p.id);
                      const iconSrc = getSocialIcon(p.id);
                      return (
                        <button
                          type="button"
                          key={p.id}
                          className={`platform-chip ${isActive ? 'active' : ''}`}
                          onClick={() => togglePlatform(p.id)}
                        >
                          <span className={`platform-chip-indicator ${isActive ? 'active' : ''}`} />
                          {iconSrc && (
                            <img
                              src={iconSrc}
                              alt={p.name}
                              className="platform-chip-icon"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <span>{p.name}</span>
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
                <p className="step-subtitle">
                  {formData.type === 'hybrid'
                    ? 'Configure any combination of Cash, Discount, and Bonus/Gift tiers'
                    : formData.type === 'discount'
                    ? 'Define progressive discounts unlocked by creator video views'
                    : 'Define prize pools, verification rules, and payout tiers'}
                </p>
              </div>

              <div className="form-fields">
                {(formData.type === 'pool' || formData.type === 'hybrid') && (
                  <Input
                    label={formData.type === 'hybrid' ? 'Prize Pool Amount (₹) (Optional)' : 'Prize Pool Amount (₹) *'}
                    type="number"
                    min="0"
                    value={formData.prizePool}
                    onChange={(e) => updateField('prizePool', e.target.value)}
                    placeholder={formData.type === 'hybrid' ? 'e.g., 50000 (Optional for hybrid)' : 'e.g., 100000'}
                    required={formData.type === 'pool'}
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

                {/* ════════════════════════════════════════════════════════════════ */}
                {/* ── 1ST TIER IN EVERY CAMPAIGN: DIRECT DISCOUNT TIER (GOLD) ─── */}
                {/* ════════════════════════════════════════════════════════════════ */}
                <div className="form-group direct-discount-section">
                  <div className="tiers-section-header direct-discount-section-header">
                    <div className="gold-header-badge-row">
                      <span className="gold-header-star">✨</span>
                      <label className="form-label gold-section-title">Direct Discount Tiers</label>
                      <span className="gold-section-pill">1st Tier in Every Campaign</span>
                    </div>
                    <p className="field-hint gold-section-desc">
                      Reward creators instantly with exclusive discounts for specific actions. Choose from 4 fixed terms — each term can only be used once (max 4 tiers). Set your custom reward for each action.
                    </p>
                  </div>

                  <div className="tiers-builder gold-tiers-builder">
                    {formData.directDiscountTiers.length === 0 && (
                      <div className="gold-empty-notice">
                        <span>⚠️ At least 1 Direct Discount Tier is compulsory. Click below to add a tier.</span>
                      </div>
                    )}

                    {formData.directDiscountTiers.map((tier, idx) => (
                      <div key={idx} className="tier-card gold-tier-card">
                        <div className="tier-card-header gold-tier-card-header">
                          <div className="gold-card-title-group">
                            <span className="tier-badge gold-tier-badge">
                              ✨ Direct Discount Tier {idx + 1}
                            </span>
                            <span className="gold-instant-tag">Instant Action Perk</span>
                          </div>
                          <button
                            type="button"
                            className="tier-delete-btn gold-tier-delete-btn"
                            onClick={() => removeDirectDiscountTier(idx)}
                            title="Remove direct discount tier"
                            aria-label={`Remove direct discount tier ${idx + 1}`}
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>

                        <div className="tier-inputs-grid gold-inputs-grid">
                          <div className="gold-select-group">
                            <label className="gold-field-label">Action Requirement (Term)</label>
                            <select
                              className="gold-tier-select"
                              value={tier.term}
                              onChange={(e) => updateDirectDiscountTier(idx, 'term', e.target.value)}
                            >
                              {DIRECT_DISCOUNT_TERMS.map((opt) => {
                                const isUsedElsewhere = formData.directDiscountTiers.some(
                                  (t, i) => i !== idx && t.term === opt.label
                                );
                                return (
                                  <option
                                    key={opt.id}
                                    value={opt.label}
                                    disabled={isUsedElsewhere}
                                  >
                                    {opt.icon} {opt.label} {isUsedElsewhere ? '(Already selected)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div className="tier-arrow-indicator gold-arrow-indicator">
                            <FiArrowRight size={18} />
                          </div>

                          <div className="gold-reward-group">
                            <Input
                              label="Reward / Discount (Set by you)"
                              type="text"
                              value={tier.reward}
                              onChange={(e) => updateDirectDiscountTier(idx, 'reward', e.target.value)}
                              placeholder="e.g., 20% Off, Flat ₹150 Off, Free Appetizer"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {formData.directDiscountTiers.length < 4 ? (
                      <button
                        type="button"
                        className={`tier-add-btn gold-tier-add-btn ${!isLastDirectDiscountTierFilled ? 'tier-add-btn-disabled' : ''}`}
                        onClick={addDirectDiscountTier}
                        title={!isLastDirectDiscountTierFilled ? "Fill current direct discount tier reward to unlock adding another" : undefined}
                      >
                        <FiPlus size={16} />
                        <span>{formData.directDiscountTiers.length > 0 ? `Add Another Direct Discount Tier (${formData.directDiscountTiers.length}/4)` : '+ Add Direct Discount Tier'}</span>
                      </button>
                    ) : (
                      <div className="gold-max-alert">
                        <span>✨ All 4 direct discount action tiers configured (Maximum reached)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── PRIZE POOL ONLY: Payout Tiers ── */}
                {formData.type === 'pool' && (
                  <div className="form-group">
                    <div className="tiers-section-header">
                      <label className="form-label">Payout Tiers</label>
                      <p className="field-hint">Creators receive higher payouts as their videos achieve more verified views.</p>
                    </div>

                    <div className="tiers-builder">
                      {formData.cashTiers.map((tier, idx) => (
                        <div key={idx} className="tier-card">
                          <div className="tier-card-header">
                            <span className="tier-badge">Tier {idx + 1}</span>
                            <button
                              type="button"
                              className="tier-delete-btn"
                              onClick={() => removeCashTier(idx)}
                              title="Remove tier"
                              aria-label={`Remove tier ${idx + 1}`}
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                          <div className="tier-inputs-grid">
                            <Input
                              label="Min. Views"
                              type="number"
                              min="0"
                              value={tier.minViews}
                              onChange={(e) => updateCashTier(idx, 'minViews', e.target.value)}
                              placeholder="e.g., 1000"
                            />
                            <div className="tier-arrow-indicator">
                              <FiArrowRight size={18} />
                            </div>
                            <Input
                              label="Payout (₹)"
                              type="number"
                              min="0"
                              value={tier.amount}
                              onChange={(e) => updateCashTier(idx, 'amount', e.target.value)}
                              placeholder="e.g., 1000"
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        className={`tier-add-btn ${!isLastCashTierFilled ? 'tier-add-btn-disabled' : ''}`}
                        onClick={addCashTier}
                        title={!isLastCashTierFilled ? 'Fill current cash tier to unlock adding another' : undefined}
                      >
                        <FiPlus size={16} />
                        <span>{formData.cashTiers.length > 0 ? 'Add Another Cash Tier' : '+ Add Cash Payout Tier'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ── DISCOUNT OFFER ONLY: Discount Tiers ── */}
                {formData.type === 'discount' && (
                  <div className="form-group">
                    <div className="tiers-section-header">
                      <label className="form-label">Discount Tiers</label>
                      <p className="field-hint">Set progressive discounts unlocked as creator videos reach view milestones.</p>
                    </div>

                    <div className="tiers-builder">
                      {formData.discountTiers.map((tier, idx) => (
                        <div key={idx} className="tier-card">
                          <div className="tier-card-header">
                            <span className="tier-badge">Tier {idx + 1}</span>
                            <button
                              type="button"
                              className="tier-delete-btn"
                              onClick={() => removeDiscountTier(idx)}
                              title="Remove tier"
                              aria-label={`Remove tier ${idx + 1}`}
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                          <div className="tier-inputs-grid">
                            <Input
                              label="Discount (%)"
                              type="number"
                              min="1"
                              max="100"
                              value={tier.amount}
                              onChange={(e) => updateDiscountTier(idx, 'amount', e.target.value)}
                              placeholder="e.g., 15"
                            />
                            <div className="tier-arrow-indicator">
                              <FiArrowRight size={18} />
                            </div>
                            <Input
                              label="Min. Views"
                              type="number"
                              min="0"
                              value={tier.minViews}
                              onChange={(e) => updateDiscountTier(idx, 'minViews', e.target.value)}
                              placeholder="e.g., 1000"
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        className={`tier-add-btn ${!isLastDiscountTierFilled ? 'tier-add-btn-disabled' : ''}`}
                        onClick={addDiscountTier}
                        title={!isLastDiscountTierFilled ? 'Fill current discount tier to unlock adding another' : undefined}
                      >
                        <FiPlus size={16} />
                        <span>{formData.discountTiers.length > 0 ? 'Add Another Discount Tier' : '+ Add Discount Tier'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ── HYBRID ONLY: 3 TIER TYPES (Views:Pay, Discount:Views, Views:Gifts) ── */}
                {formData.type === 'hybrid' && (
                  <div className="hybrid-tiers-container">
                    {/* 1st: Views : Pay */}
                    <div className="form-group hybrid-tier-section">
                      <div className="tiers-section-header">
                        <label className="form-label">1. Cash Payout Tiers (Views → Pay)</label>
                        <p className="field-hint">Pay creators cash when their videos reach view milestones.</p>
                      </div>

                      <div className="tiers-builder">
                        {formData.cashTiers.map((tier, idx) => (
                          <div key={idx} className="tier-card">
                            <div className="tier-card-header">
                              <span className="tier-badge">Cash Tier {idx + 1}</span>
                              <button
                                type="button"
                                className="tier-delete-btn"
                                onClick={() => removeCashTier(idx)}
                                title="Remove tier"
                                aria-label={`Remove cash tier ${idx + 1}`}
                              >
                                <FiTrash2 size={15} />
                              </button>
                            </div>
                            <div className="tier-inputs-grid">
                              <Input
                                label="Min. Views"
                                type="number"
                                min="0"
                                value={tier.minViews}
                                onChange={(e) => updateCashTier(idx, 'minViews', e.target.value)}
                                placeholder="e.g., 1000"
                              />
                              <div className="tier-arrow-indicator">
                                <FiArrowRight size={18} />
                              </div>
                              <Input
                                label="Payout (₹)"
                                type="number"
                                min="0"
                                value={tier.amount}
                                onChange={(e) => updateCashTier(idx, 'amount', e.target.value)}
                                placeholder="e.g., 1000"
                              />
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          className={`tier-add-btn ${!isLastCashTierFilled ? 'tier-add-btn-disabled' : ''}`}
                          onClick={addCashTier}
                          title={!isLastCashTierFilled ? 'Fill current cash tier to unlock adding another' : undefined}
                        >
                          <FiPlus size={16} />
                          <span>{formData.cashTiers.length > 0 ? 'Add Another Cash Tier' : '+ Add Cash Payout Tier'}</span>
                        </button>
                      </div>
                    </div>

                    {/* 2nd: Discount : Views */}
                    <div className="form-group hybrid-tier-section">
                      <div className="tiers-section-header">
                        <label className="form-label">2. Discount Tiers (Discount → Views)</label>
                        <p className="field-hint">Progressive discounts unlocked as creator videos reach view milestones.</p>
                      </div>

                      <div className="tiers-builder">
                        {formData.discountTiers.map((tier, idx) => (
                          <div key={idx} className="tier-card">
                            <div className="tier-card-header">
                              <span className="tier-badge">Discount Tier {idx + 1}</span>
                              <button
                                type="button"
                                className="tier-delete-btn"
                                onClick={() => removeDiscountTier(idx)}
                                title="Remove tier"
                                aria-label={`Remove discount tier ${idx + 1}`}
                              >
                                <FiTrash2 size={15} />
                              </button>
                            </div>
                            <div className="tier-inputs-grid">
                              <Input
                                label="Discount (%)"
                                type="number"
                                min="1"
                                max="100"
                                value={tier.amount}
                                onChange={(e) => updateDiscountTier(idx, 'amount', e.target.value)}
                                placeholder="e.g., 15"
                              />
                              <div className="tier-arrow-indicator">
                                <FiArrowRight size={18} />
                              </div>
                              <Input
                                label="Min. Views"
                                type="number"
                                min="0"
                                value={tier.minViews}
                                onChange={(e) => updateDiscountTier(idx, 'minViews', e.target.value)}
                                placeholder="e.g., 1000"
                              />
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          className={`tier-add-btn ${!isLastDiscountTierFilled ? 'tier-add-btn-disabled' : ''}`}
                          onClick={addDiscountTier}
                          title={!isLastDiscountTierFilled ? 'Fill current discount tier to unlock adding another' : undefined}
                        >
                          <FiPlus size={16} />
                          <span>{formData.discountTiers.length > 0 ? 'Add Another Discount Tier' : '+ Add Discount Tier'}</span>
                        </button>
                      </div>
                    </div>

                    {/* 3rd: Views : Gifts / Custom Tasks */}
                    <div className="form-group hybrid-tier-section">
                      <div className="tiers-section-header">
                        <label className="form-label">3. Bonus & Gift Tiers (Views Milestone or Custom Tasks)</label>
                        <p className="field-hint">Give physical gifts, perks, or custom rewards when views reach milestone or creators complete custom tasks (e.g., Come visit my gym → Get 15% off).</p>
                      </div>

                      <div className="tiers-builder">
                        {formData.giftTiers.map((tier, idx) => {
                          const isTextTier = tier.type === 'text';
                          return (
                            <div key={idx} className="tier-card">
                              <div className="tier-card-header">
                                <div className="tier-header-left">
                                  <span className="tier-badge">Gift Tier {idx + 1}</span>
                                  <div className="tier-mode-toggle">
                                    <button
                                      type="button"
                                      className={`tier-mode-btn ${!isTextTier ? 'active' : ''}`}
                                      onClick={() => updateGiftTier(idx, 'type', 'views')}
                                    >
                                      👁️ Views Milestone
                                    </button>
                                    <button
                                      type="button"
                                      className={`tier-mode-btn ${isTextTier ? 'active' : ''}`}
                                      onClick={() => updateGiftTier(idx, 'type', 'text')}
                                    >
                                      📝 Custom Task (Text-Text)
                                    </button>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="tier-delete-btn"
                                  onClick={() => removeGiftTier(idx)}
                                  title="Remove tier"
                                  aria-label={`Remove gift tier ${idx + 1}`}
                                >
                                  <FiTrash2 size={15} />
                                </button>
                              </div>
                              <div className="tier-inputs-grid">
                                {!isTextTier ? (
                                  <Input
                                    label="Min. Views"
                                    type="number"
                                    min="0"
                                    value={tier.minViews || ''}
                                    onChange={(e) => updateGiftTier(idx, 'minViews', e.target.value)}
                                    placeholder="e.g., 10000"
                                  />
                                ) : (
                                  <Input
                                    label="Requirement / Task (Text)"
                                    type="text"
                                    value={tier.condition || ''}
                                    onChange={(e) => updateGiftTier(idx, 'condition', e.target.value)}
                                    placeholder="e.g., Come visit my gym"
                                  />
                                )}
                                <div className="tier-arrow-indicator">
                                  <FiArrowRight size={18} />
                                </div>
                                <Input
                                  label={!isTextTier ? "Gift / Reward Description" : "Reward / Perk (Text)"}
                                  type="text"
                                  value={tier.gift || ''}
                                  onChange={(e) => updateGiftTier(idx, 'gift', e.target.value)}
                                  placeholder={!isTextTier ? "e.g., Smart Watch, Hoodie, Merch" : "e.g., 15% Off coupon, Free trial"}
                                />
                              </div>
                            </div>
                          );
                        })}

                        <div className="tier-add-buttons-row">
                          <button
                            type="button"
                            className={`tier-add-btn tier-add-half ${!isLastGiftTierFilled ? 'tier-add-btn-disabled' : ''}`}
                            onClick={() => addGiftTier('views')}
                            title={!isLastGiftTierFilled ? 'Fill current gift tier to unlock adding another' : undefined}
                          >
                            <FiPlus size={16} />
                            <span>+ Add Views Milestone</span>
                          </button>
                          <button
                            type="button"
                            className={`tier-add-btn tier-add-half tier-add-task ${!isLastGiftTierFilled ? 'tier-add-btn-disabled' : ''}`}
                            onClick={() => addGiftTier('text')}
                            title={!isLastGiftTierFilled ? 'Fill current gift tier to unlock adding another' : undefined}
                          >
                            <FiPlus size={16} />
                            <span>+ Add Custom Task (Text-Text)</span>
                          </button>
                        </div>
                      </div>
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
                  {/* Campaign Image(s) Slideshow Banner */}
                  {formData.images.length > 0 && (
                    <div className="review-slideshow-banner">
                      <CampaignImageSlideshow
                        images={formData.images}
                        alt={formData.title || 'Campaign preview'}
                        showBadge={formData.images.length > 1}
                      />
                    </div>
                  )}

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
                      <span className="review-value">
                        {formData.isOnlineVenue || formData.location === 'None'
                          ? '🌐 Online Campaign (None)'
                          : `📍 ${formData.location || 'Not specified'}`}
                      </span>
                    </div>

                    <div className="review-row">
                      <span className="review-label">Campaign Pictures</span>
                      <span className="review-value">
                        {formData.images.length > 1
                          ? `${formData.images.length} Pictures (Automatic Slideshow)`
                          : formData.images.length === 1
                          ? '1 Picture'
                          : 'None'}
                      </span>
                    </div>

                    {/* ── Direct Discount Tiers (1st in Review) ── */}
                    {formData.directDiscountTiers.some((t) => t.reward?.trim()) && (
                      <div className="review-row gold-review-row">
                        <div className="gold-review-header">
                          <span className="gold-review-badge">✨ DIRECT DISCOUNT TIERS</span>
                          <span className="gold-review-subtag">1st Tier • Instant Perks</span>
                        </div>
                        <div className="gold-review-list">
                          {formData.directDiscountTiers
                            .filter((t) => t.reward?.trim())
                            .map((t, idx) => (
                              <div key={idx} className="gold-review-item">
                                <span className="gold-review-term">
                                  {DIRECT_DISCOUNT_TERMS.find((d) => d.label === t.term)?.icon || '📌'}{' '}
                                  {t.term}
                                </span>
                                <span className="gold-review-arrow">→</span>
                                <span className="gold-review-reward">{t.reward}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {formData.type === 'pool' && (
                      <>
                        <div className="review-row">
                          <span className="review-label">Prize Pool</span>
                          <span className="review-value prize-highlight">₹{Number(formData.prizePool || 0).toLocaleString()}</span>
                        </div>
                        {formData.cashTiers.filter((t) => t.minViews?.trim() && t.amount?.trim()).length > 0 && (
                          <div className="review-row">
                            <span className="review-label">Cash Tiers</span>
                            <span className="review-value">
                              {formData.cashTiers
                                .filter((t) => t.minViews?.trim() && t.amount?.trim())
                                .map((t) => `₹${Number(t.amount || 0).toLocaleString()} (${Number(t.minViews || 0).toLocaleString()} views)`)
                                .join(', ')}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {formData.type === 'discount' && (
                      <>
                        <div className="review-row">
                          <span className="review-label">Campaign Type</span>
                          <span className="review-value prize-highlight">Discount Offer</span>
                        </div>
                        {formData.discountTiers.filter((t) => t.minViews?.trim() && t.amount?.trim()).length > 0 && (
                          <div className="review-row">
                            <span className="review-label">Discount Tiers</span>
                            <span className="review-value text-ginger font-semibold">
                              {formData.discountTiers
                                .filter((t) => t.minViews?.trim() && t.amount?.trim())
                                .map((t) => `${t.amount}% (${Number(t.minViews || 0).toLocaleString()} views)`)
                                .join(', ')}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {formData.type === 'hybrid' && (
                      <>
                        <div className="review-row">
                          <span className="review-label">Campaign Type</span>
                          <span className="review-value prize-highlight">Hybrid Rewards</span>
                        </div>
                        {Number(formData.prizePool) > 0 && (
                          <div className="review-row">
                            <span className="review-label">Prize Pool</span>
                            <span className="review-value font-semibold">₹{Number(formData.prizePool).toLocaleString()}</span>
                          </div>
                        )}
                        {formData.cashTiers.filter((t) => t.minViews?.trim() && t.amount?.trim()).length > 0 && (
                          <div className="review-row">
                            <span className="review-label">Cash Tiers (Views:Pay)</span>
                            <span className="review-value font-semibold">
                              {formData.cashTiers
                                .filter((t) => t.minViews?.trim() && t.amount?.trim())
                                .map((t) => `₹${Number(t.amount || 0).toLocaleString()} (${Number(t.minViews || 0).toLocaleString()} views)`)
                                .join(', ')}
                            </span>
                          </div>
                        )}
                        {formData.discountTiers.filter((t) => t.minViews?.trim() && t.amount?.trim()).length > 0 && (
                          <div className="review-row">
                            <span className="review-label">Discount Tiers (Discount:Views)</span>
                            <span className="review-value text-ginger font-semibold">
                              {formData.discountTiers
                                .filter((t) => t.minViews?.trim() && t.amount?.trim())
                                .map((t) => `${t.amount}% (${Number(t.minViews || 0).toLocaleString()} views)`)
                                .join(', ')}
                            </span>
                          </div>
                        )}
                        {formData.giftTiers.filter((t) => t.gift?.trim() && (t.type === 'views' ? t.minViews?.trim() : t.condition?.trim())).length > 0 && (
                          <div className="review-row">
                            <span className="review-label">Bonus / Gift Tiers</span>
                            <span className="review-value font-semibold">
                              {formData.giftTiers
                                .filter((t) => t.gift?.trim() && (t.type === 'views' ? t.minViews?.trim() : t.condition?.trim()))
                                .map((t) =>
                                  t.type === 'text'
                                    ? `🎁 ${t.gift} ("${t.condition}")`
                                    : `🎁 ${t.gift} (${Number(t.minViews || 0).toLocaleString()} views)`
                                )
                                .join(', ')}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="review-row">
                      <span className="review-label">Verification Window</span>
                      <span className="review-value">{formData.verificationDays} days</span>
                    </div>
                    <div className="review-row">
                      <span className="review-label">Platforms</span>
                      <span className="review-value">
                        {formData.platforms.map((pid) => SOCIAL_PLATFORMS.find((sp) => sp.id === pid)?.name || pid).join(', ') || 'All Platforms'}
                      </span>
                    </div>

                    {formData.keywords.length > 0 && (
                      <div className="review-row">
                        <span className="review-label">Keywords & Tags</span>
                        <span className="review-value" style={{ color: 'var(--ginger-400, #ff8433)', fontWeight: 600 }}>
                          {formData.keywords.map((kw) => `#${kw}`).join(' ')}
                        </span>
                      </div>
                    )}
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
              onClick={handleNextStep}
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
