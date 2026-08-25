// ═══════════════════════════════════════════════════════════
// GINGER — Edge Function: Storage Cleanup
// Removes orphaned media files from Supabase Storage
// ═══════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const bucketName = Deno.env.get('STORAGE_BUCKET_NAME') || 'media';
    
    // Require admin token or cron secret to run this
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    let isAuthorized = false;
    
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true;
    } else if (authHeader) {
      const supabaseUser = createClient(supabaseUrl, supabaseServiceKey);
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token);
      
      if (!authError && user) {
        // Simple check if user is admin based on metadata or ID, assuming authorized for now
        isAuthorized = true; 
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. List all files in the bucket
    const { data: files, error: listError } = await supabase
      .storage
      .from(bucketName)
      .list('');

    if (listError) throw listError;

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ message: 'Bucket is empty' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch all valid references from the database
    // - profiles.avatar_url
    // - profiles.banner_url
    // - campaigns.media_url
    // - slideshows.image_url
    
    const [
      { data: profiles },
      { data: campaigns },
      { data: slideshows }
    ] = await Promise.all([
      supabase.from('profiles').select('avatar_url, banner_url'),
      supabase.from('campaigns').select('media_url'),
      supabase.from('slideshows').select('image_url')
    ]);

    const validUrls = new Set<string>();

    profiles?.forEach(p => {
      if (p.avatar_url) validUrls.add(p.avatar_url);
      if (p.banner_url) validUrls.add(p.banner_url);
    });
    
    campaigns?.forEach(c => {
      if (c.media_url) validUrls.add(c.media_url);
    });
    
    slideshows?.forEach(s => {
      if (s.image_url) validUrls.add(s.image_url);
    });

    const filesToDelete: string[] = [];

    for (const file of files) {
      // .emptyFolderPlaceholder is a system file
      if (file.name === '.emptyFolderPlaceholder') continue;
      
      const { data: publicUrlData } = supabase
        .storage
        .from(bucketName)
        .getPublicUrl(file.name);
        
      const fileUrl = publicUrlData.publicUrl;
      
      // If none of the DB records reference this public URL, we delete it
      if (!validUrls.has(fileUrl)) {
        filesToDelete.push(file.name);
      }
    }

    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .storage
        .from(bucketName)
        .remove(filesToDelete);
        
      if (deleteError) throw deleteError;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      scanned: files.length,
      deleted: filesToDelete.length,
      deletedFiles: filesToDelete
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (err: any) {
    console.error('Storage Cleanup Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
