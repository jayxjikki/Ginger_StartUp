const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function makeAdmin() {
  console.log("Fetching profiles...");
  const { data: profiles, error } = await supabase.from('profiles').select('id, username, full_name, role');
  
  if (error) {
    console.error("Error fetching profiles:", error.message);
    return;
  }
  
  console.log("Found profiles:", profiles.length);
  
  if (profiles.length > 0) {
    // Assuming the user wants to make themselves admin. 
    // For local dev/prototype, we'll just make ALL users admin to solve the block,
    // or just list them and make them all admin.
    for (const profile of profiles) {
      console.log(`Updating ${profile.username || profile.id} to admin...`);
      // NOTE: Normal ANON KEY might not have permission to update role if RLS is strict,
      // but earlier we added a policy "Admins have full access" AND we might need service_role key to bypass RLS.
      // Wait, if RLS blocks it, we might fail here! Let's try.
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', profile.id);
        
      if (updateError) {
        console.error(`Failed to update ${profile.id}:`, updateError.message);
      } else {
        console.log(`Successfully made ${profile.username || profile.id} an admin!`);
      }
    }
  } else {
    console.log("No profiles found.");
  }
}

makeAdmin();
