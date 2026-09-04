// ═══════════════════════════════════════════════════════════
// GINGER — Campaign Store (Zustand)
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import type { Campaign, CampaignFilters, Submission, SlideshowItem } from '../types/campaign.types';
import { supabase } from '../lib/supabase';
import { generateVoucherCode } from '../utils/voucherHelpers';

interface CampaignState {
  campaigns: Campaign[];
  filteredCampaigns: Campaign[];
  slideshows: SlideshowItem[];
  selectedCampaign: Campaign | null;
  mySubmissions: Submission[];
  myCreatedCampaigns: Campaign[];
  filters: CampaignFilters;
  isLoading: boolean;
  isSubmitting: boolean;
  savedCampaignIds: string[];
  error: string | null;

  // Actions
  fetchCampaigns: () => Promise<void>;
  fetchCampaignById: (id: string) => Promise<void>;
  createCampaign: (campaign: Partial<Campaign>) => Promise<void>;
  submitContent: (campaignId: string, url: string, metadata: any) => Promise<void>;
  toggleSavedCampaign: (campaignId: string, userId: string) => Promise<void>;
  fetchSavedCampaigns: (userId: string) => Promise<void>;
  fetchMySubmissions: (userId: string) => Promise<void>;
  setSelectedCampaign: (campaign: Campaign | null) => void;
  setFilters: (filters: Partial<CampaignFilters>) => void;
  applyFilters: () => void;
  raiseDispute: (submissionId: string) => Promise<void>;
  fetchMyCreatedCampaigns: (userId: string) => Promise<void>;
  flagSubmissionByAdvertiser: (submissionId: string) => Promise<void>;
  approveSubmissionByAdvertiser: (submissionId: string) => Promise<void>;
  approveDirectDiscountSubmission: (submissionId: string, customDiscount?: number) => Promise<string>;
  submitCampaignToAdmin: (campaignId: string) => Promise<void>;
  
  // Realtime Subscriptions
  subscribeToCampaigns: (userId: string) => void;
  unsubscribeFromCampaigns: () => void;
}

let campaignChannel: ReturnType<typeof supabase.channel> | null = null;

const defaultFilters: CampaignFilters = {
  search: '',
  location: '',
  type: '',
  minPayout: 0,
  maxPayout: 0,
  platform: '',
  category: '',
  sortBy: 'newest',
};

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  filteredCampaigns: [],
  slideshows: [],
  selectedCampaign: null,
  mySubmissions: [],
  myCreatedCampaigns: [],
  filters: defaultFilters,
  isLoading: false,
  isSubmitting: false,
  savedCampaignIds: [],
  error: null,

  fetchCampaigns: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const [campaignsRes, slideshowsRes] = await Promise.all([
        supabase
          .from('campaigns')
          .select(`
            *,
            advertiser:profiles(*),
            payout_tiers(*)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('slideshows')
          .select('*')
          .order('order_index', { ascending: true })
      ]);

      if (campaignsRes.error) throw campaignsRes.error;
      if (slideshowsRes.error) throw slideshowsRes.error;

      set({ 
        campaigns: campaignsRes.data as unknown as Campaign[], 
        filteredCampaigns: campaignsRes.data as unknown as Campaign[],
        slideshows: slideshowsRes.data as unknown as SlideshowItem[]
      });
      get().applyFilters();
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCampaignById: async (_id: string) => {
    // Implementation needed
  },

  createCampaign: async (campaign: Partial<Campaign>) => {
    try {
      const { payout_tiers, ...campaignData } = campaign;
      let insertPayload: any = { ...campaignData };

      // Ensure terms preserves the images array
      if (insertPayload.images && Array.isArray(insertPayload.images) && insertPayload.images.length > 0) {
        insertPayload.terms = {
          ...(typeof insertPayload.terms === 'object' && insertPayload.terms !== null ? insertPayload.terms : {}),
          images: insertPayload.images,
        };
      }

      let { data, error } = await supabase
        .from('campaigns')
        .insert([insertPayload])
        .select(`*, advertiser:profiles(*)`)
        .single();
        
      // If remote database doesn't have images column, fallback without top-level images
      if (
        error &&
        (error.message?.toLowerCase().includes('images') ||
         error.details?.toLowerCase().includes('images') ||
         error.code === '42703')
      ) {
        delete insertPayload.images;
        const retryRes = await supabase
          .from('campaigns')
          .insert([insertPayload])
          .select(`*, advertiser:profiles(*)`)
          .single();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) {
        console.error('Supabase error inserting campaign:', error);
        throw error;
      }
      const newCampaign = data as unknown as Campaign;
      if (!newCampaign.images && campaign.images) {
        newCampaign.images = campaign.images;
      }
      
      // Insert payout tiers if they exist
      if (payout_tiers && payout_tiers.length > 0) {
        const tiersToInsert = payout_tiers.map(tier => ({
          ...tier,
          campaign_id: newCampaign.id
        }));
        
        const { data: tiersData, error: tiersError } = await supabase
          .from('payout_tiers')
          .insert(tiersToInsert)
          .select('*');
          
        if (tiersError) throw tiersError;
        newCampaign.payout_tiers = tiersData as any;
      } else {
        newCampaign.payout_tiers = [];
      }
      
      set((state) => {
        const updated = [newCampaign, ...state.campaigns];
        return { campaigns: updated };
      });
      get().applyFilters();
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      throw err;
    }
  },

  setSelectedCampaign: (campaign) => set({ selectedCampaign: campaign }),

  fetchSavedCampaigns: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('saved_campaigns')
        .select('campaign_id')
        .eq('user_id', userId);
        
      if (error) throw error;
      
      set({ savedCampaignIds: data ? data.map((d: any) => d.campaign_id) : [] });
    } catch (error: any) {
      console.error('Error fetching saved campaigns:', error);
    }
  },

  fetchMySubmissions: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          campaign:campaigns(
            *,
            advertiser:profiles(*)
          )
        `)
        .eq('creator_id', userId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      set({ mySubmissions: data as unknown as Submission[] });
    } catch (err: any) {
      console.error('Error fetching my submissions:', err);
    }
  },

  toggleSavedCampaign: async (campaignId: string, userId: string) => {
    const { savedCampaignIds } = get();
    const isSaved = savedCampaignIds.includes(campaignId);
    
    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_campaigns')
          .delete()
          .eq('user_id', userId)
          .eq('campaign_id', campaignId);
          
        if (error) throw error;
        set({ savedCampaignIds: savedCampaignIds.filter(id => id !== campaignId) });
      } else {
        const { error } = await supabase
          .from('saved_campaigns')
          .insert([{ user_id: userId, campaign_id: campaignId }]);
          
        if (error) throw error;
        set({ savedCampaignIds: [...savedCampaignIds, campaignId] });
      }
    } catch (error: any) {
      console.error('Error toggling saved campaign:', error);
      throw error;
    }
  },

  submitContent: async (campaignId: string, url: string, metadata: any) => {
    set({ isSubmitting: true });
    try {
      // Dummy simulate network
      await new Promise(r => setTimeout(r, 1500));
      console.log('Submitted', { campaignId, url, metadata });
    } catch (err) {
      console.error(err);
    } finally {
      set({ isSubmitting: false });
    }
  },

  raiseDispute: async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status: 'disputed' })
        .eq('id', submissionId);
      
      if (error) throw error;
      
      // Update local state
      set((state) => ({
        mySubmissions: state.mySubmissions.map(sub => 
          sub.id === submissionId ? { ...sub, status: 'disputed' } : sub
        )
      }));
    } catch (error) {
      console.error('Error raising dispute:', error);
      throw error;
    }
  },

  fetchMyCreatedCampaigns: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          advertiser:profiles!campaigns_advertiser_id_fkey(*),
          submissions(*)
        `)
        .eq('advertiser_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map submissions nested data appropriately
      const campaignsWithSubmissions = await Promise.all((data as any[]).map(async (c) => {
        // Fetch creator profiles for each submission to display in the UI
        const submissionsWithProfiles = await Promise.all((c.submissions || []).map(async (sub: any) => {
          const { data: creatorData } = await supabase.from('profiles').select('*').eq('id', sub.creator_id).single();
          return { ...sub, creator: creatorData };
        }));
        return { ...c, submissions: submissionsWithProfiles };
      }));

      set({ myCreatedCampaigns: campaignsWithSubmissions as unknown as Campaign[] });
    } catch (err: any) {
      console.error('Error fetching created campaigns:', err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  flagSubmissionByAdvertiser: async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status: 'flagged' })
        .eq('id', submissionId);
      
      if (error) throw error;

      // Update local state for myCreatedCampaigns
      set((state) => ({
        myCreatedCampaigns: state.myCreatedCampaigns.map(campaign => ({
          ...campaign,
          submissions: (campaign.submissions as any[] || []).map(sub => 
            sub.id === submissionId ? { ...sub, status: 'flagged' } : sub
          )
        }))
      }));
    } catch (error) {
      console.error('Error flagging submission:', error);
      throw error;
    }
  },

  approveSubmissionByAdvertiser: async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status: 'verified' })
        .eq('id', submissionId);
      
      if (error) throw error;

      // Update local state for myCreatedCampaigns
      set((state) => ({
        myCreatedCampaigns: state.myCreatedCampaigns.map(campaign => ({
          ...campaign,
          submissions: (campaign.submissions as any[] || []).map(sub => 
            sub.id === submissionId ? { ...sub, status: 'verified' } : sub
          )
        }))
      }));
    } catch (error) {
      console.error('Error approving submission by advertiser:', error);
      throw error;
    }
  },

  approveDirectDiscountSubmission: async (submissionId: string, customDiscount?: number) => {
    try {
      // 1. Fetch submission details
      let sub: any = null;
      const { data: subData, error: fetchErr } = await supabase
        .from('submissions')
        .select('*, campaign:campaigns(*), creator:profiles(*)')
        .eq('id', submissionId)
        .single();

      if (fetchErr || !subData) {
        const { data: fallbackSub, error: fallbackErr } = await supabase
          .from('submissions')
          .select('*')
          .eq('id', submissionId)
          .single();
        if (fallbackErr || !fallbackSub) throw fetchErr || fallbackErr || new Error('Submission not found');
        sub = fallbackSub;
      } else {
        sub = subData;
      }

      // 2. Generate unique voucher code
      const voucherCode = generateVoucherCode();
      const discountPercent = customDiscount && customDiscount > 0 
        ? customDiscount 
        : (sub.campaign?.payout_tiers?.[0]?.payout_amount || 15);
      const now = new Date().toISOString();

      // 3. Update submission: only owner approval needed! Status becomes verified/approved
      const updateData = {
        status: 'verified',
        voucher_code: voucherCode,
        voucher_status: 'active',
        discount_percent: discountPercent,
        verified_at: now
      };

      const { error: updateErr } = await supabase
        .from('submissions')
        .update(updateData)
        .eq('id', submissionId);

      if (updateErr) {
        // Fallback without voucher fields if DB column not migrated yet
        console.warn('Fallback update without voucher columns:', updateErr);
        await supabase
          .from('submissions')
          .update({ status: 'verified', verified_at: now })
          .eq('id', submissionId);
      }

      // 4. Send notification to Creator (user)
      if (sub.creator_id) {
        await supabase.from('notifications').insert({
          user_id: sub.creator_id,
          actor_id: sub.campaign?.advertiser_id || null,
          type: 'system',
          entity_id: sub.campaign_id,
          content: `🎟️ Direct Discount Voucher Approved! Code: ${voucherCode} for campaign "${sub.campaign?.title || 'Campaign'}" (${discountPercent}% OFF). Check your Joined Campaigns or use the calculator to check your savings!`
        });
      }

      // 5. Send notification to Owner
      const ownerId = sub.campaign?.advertiser_id;
      if (ownerId) {
        const creatorHandle = sub.creator?.username ? `@${sub.creator.username}` : 'the creator';
        await supabase.from('notifications').insert({
          user_id: ownerId,
          actor_id: sub.creator_id || null,
          type: 'system',
          entity_id: sub.campaign_id,
          content: `🎟️ Voucher Issued: ${voucherCode} for ${creatorHandle} on "${sub.campaign?.title || 'Campaign'}" (${discountPercent}% OFF). You can verify or redeem this voucher code anytime.`
        });
      }

      // 6. Update local state
      set((state) => ({
        myCreatedCampaigns: state.myCreatedCampaigns.map(campaign => ({
          ...campaign,
          submissions: (campaign.submissions as any[] || []).map(s =>
            s.id === submissionId
              ? {
                  ...s,
                  status: 'verified',
                  voucher_code: voucherCode,
                  voucher_status: 'active',
                  discount_percent: discountPercent,
                  verified_at: now
                }
              : s
          )
        }))
      }));

      return voucherCode;
    } catch (error) {
      console.error('Error approving direct discount submission:', error);
      throw error;
    }
  },

  submitCampaignToAdmin: async (campaignId: string) => {
    try {
      // Using 'paused' as the status to represent 'pending_admin_approval' 
      // without needing to alter database constraints.
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'paused' })
        .eq('id', campaignId);
        
      if (error) throw error;

      set((state) => ({
        myCreatedCampaigns: state.myCreatedCampaigns.map(c => 
          c.id === campaignId ? { ...c, status: 'paused' } : c
        )
      }));
    } catch (error) {
      console.error('Error submitting campaign to admin:', error);
      throw error;
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().applyFilters();
  },

  applyFilters: () => {
    const { campaigns, filters } = get();
    let result = [...campaigns];

    // Search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          (c.keywords && c.keywords.some((k) => k.toLowerCase().includes(query)))
      );
    }

    // Location filter
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      result = result.filter((c) => c.location?.toLowerCase().includes(loc));
    }

    // Type filter
    if (filters.type) {
      result = result.filter((c) => c.type === filters.type);
    }

    // Platform filter
    if (filters.platform) {
      result = result.filter((c) => c.required_platforms && c.required_platforms.includes(filters.platform));
    }

    // Sort
    switch (filters.sortBy) {
      case 'highest_pool':
        result.sort((a, b) => b.prize_pool - a.prize_pool);
        break;
      case 'ending_soon':
        result.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
        break;
      case 'most_submissions':
        result.sort((a, b) => (b.submission_count ?? 0) - (a.submission_count ?? 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    set({ filteredCampaigns: result });
  },

  subscribeToCampaigns: (userId: string) => {
    if (campaignChannel) return;
    
    campaignChannel = supabase.channel('public:submissions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'submissions', filter: `creator_id=eq.${userId}` },
        () => {
           // Refetch submissions to update statuses instantly
           get().fetchMySubmissions(userId);
        }
      )
      .subscribe();
  },

  unsubscribeFromCampaigns: () => {
    if (campaignChannel) {
      supabase.removeChannel(campaignChannel);
      campaignChannel = null;
    }
  }
}));
