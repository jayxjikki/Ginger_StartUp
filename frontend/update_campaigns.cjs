const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials in env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const realisticDescriptions = [
  "We're looking for creative creators to showcase our latest summer collection! Create an engaging 30-second Reel or TikTok highlighting the comfort and style of our activewear. Make sure to use the provided soundtrack and tag us. Top performing videos will be invited to a long-term partnership program.",
  "Promote our new energy drink on your channel! We need authentic taste tests and energy-boosting moments. Whether you're hitting the gym, studying late, or gaming, show how our drink powers your day. Minimum 50k views required to unlock the first payout tier.",
  "Join our exclusive travel campaign. If you love exploring hidden gems in your city, we want you to feature our travel app. Record a quick vlog of your favorite spot and demonstrate how easy it is to book experiences using our platform. Clear lighting and high-quality audio are a must.",
  "Calling all tech reviewers! We've just launched our premium noise-canceling headphones. Create an in-depth review or a quick unboxing video focusing on the sleek design and bass quality. Creators who hit the 100k views milestone will receive a free hardware upgrade next quarter.",
  "Help us spread the word about our eco-friendly skincare line! We want genuine reviews from creators who care about sustainability. Show your morning routine using our products and highlight the natural ingredients. Videos must be well-lit, aesthetically pleasing, and include the campaign hashtag."
];

async function run() {
  console.log("Fetching campaigns...");
  const { data: campaigns, error: fetchError } = await supabase.from('campaigns').select('id');
  
  if (fetchError) {
    console.error("Error fetching campaigns:", fetchError);
    return;
  }

  console.log(`Found ${campaigns.length} campaigns. Updating...`);

  let successCount = 0;
  for (let i = 0; i < campaigns.length; i++) {
    const campaign = campaigns[i];
    
    // Set end date to 15 to 45 days in the future
    const daysToAdd = Math.floor(Math.random() * 30) + 15;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysToAdd);
    
    // Pick a random realistic description
    const randomDesc = realisticDescriptions[Math.floor(Math.random() * realisticDescriptions.length)];

    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ 
        end_date: futureDate.toISOString(),
        description: randomDesc
      })
      .eq('id', campaign.id);

    if (updateError) {
      console.error(`Failed to update campaign ${campaign.id}:`, updateError);
    } else {
      successCount++;
    }
  }

  console.log(`✅ Successfully updated ${successCount}/${campaigns.length} campaigns!`);
}

run();
