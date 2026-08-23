// ═══════════════════════════════════════════════════════════
// GINGER — Campaign Store (Zustand)
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import type { Campaign, CampaignFilters, Submission, SlideshowItem } from '../types/campaign.types';
import { supabase } from '../lib/supabase';

interface CampaignState {
  campaigns: Campaign[];
  filteredCampaigns: Campaign[];
  slideshows: SlideshowItem[];
  selectedCampaign: Campaign | null;
  mySubmissions: Submission[];
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
  setSelectedCampaign: (campaign: Campaign | null) => void;
  setFilters: (filters: Partial<CampaignFilters>) => void;
  applyFilters: () => void;
}

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
      const { data, error } = await supabase
        .from('campaigns')
        .insert([campaignData])
        .select(`*, advertiser:profiles(*)`)
        .single();
        
      if (error) throw error;
      const newCampaign = data as unknown as Campaign;
      
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
}));
