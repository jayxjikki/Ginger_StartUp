import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth header' }), { headers: corsHeaders, status: 401 });
    }

    // Initialize regular client to verify the user token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: corsHeaders, status: 401 });
    }

    const userId = user.id;

    // Initialize admin client to perform the deletion
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Delete user's profile and related data (Cascade should handle most, but we can do it explicitly)
    // Actually, profiles table handles cascade on delete, and social_links, media_kits etc handle cascade on profile delete.
    const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', userId);
    if (profileError) {
      console.error('Error deleting profile:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to delete profile data' }), { headers: corsHeaders, status: 500 });
    }

    // 2. Delete auth user (This removes them from auth.users)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      return new Response(JSON.stringify({ error: 'Failed to delete user account' }), { headers: corsHeaders, status: 500 });
    }

    return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
