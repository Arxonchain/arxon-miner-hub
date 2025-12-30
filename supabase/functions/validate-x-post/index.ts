import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Required terms for a qualified ARXON post
const REQUIRED_TERMS = [
  '@arxonarx',
  '#arxon',
  '#arxonmining', 
  '#arxonchain',
  'arxon'
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId, postUrl } = await req.json();

    if (!submissionId || !postUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing submissionId or postUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract tweet ID from URL
    const tweetIdMatch = postUrl.match(/status\/(\d+)/);
    if (!tweetIdMatch) {
      // Update submission as rejected
      await supabase
        .from('social_submissions')
        .update({ status: 'rejected' })
        .eq('id', submissionId);

      return new Response(
        JSON.stringify({ qualified: false, reason: 'Invalid post URL format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tweetId = tweetIdMatch[1];
    const bearerToken = Deno.env.get('X_BEARER_TOKEN');

    let tweetText = '';
    let fetchSuccess = false;

    // Try to fetch tweet content if we have a bearer token
    if (bearerToken) {
      try {
        const tweetResponse = await fetch(
          `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=text`,
          {
            headers: {
              'Authorization': `Bearer ${bearerToken}`,
            },
          }
        );

        if (tweetResponse.ok) {
          const tweetData = await tweetResponse.json();
          tweetText = tweetData.data?.text || '';
          fetchSuccess = true;
          console.log('Tweet content fetched:', tweetText);
        } else {
          console.error('Twitter API error:', await tweetResponse.text());
        }
      } catch (error) {
        console.error('Error fetching tweet:', error);
      }
    }

    // If we couldn't fetch the tweet, check the URL itself for hints
    // This is a fallback - not ideal but better than nothing
    const textToCheck = fetchSuccess ? tweetText.toLowerCase() : postUrl.toLowerCase();

    // Check if the content contains any required terms
    const hasRequiredTerm = REQUIRED_TERMS.some(term => 
      textToCheck.includes(term.toLowerCase())
    );

    if (hasRequiredTerm) {
      // Qualified - update submission as approved
      await supabase
        .from('social_submissions')
        .update({ status: 'approved' })
        .eq('id', submissionId);

      return new Response(
        JSON.stringify({ 
          qualified: true, 
          message: 'Post qualifies for ARXON rewards!',
          verified: fetchSuccess 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Not qualified - update submission as rejected
      await supabase
        .from('social_submissions')
        .update({ status: 'rejected' })
        .eq('id', submissionId);

      return new Response(
        JSON.stringify({ 
          qualified: false, 
          reason: 'Post must mention @arxonarx, #arxon, #arxonmining, or #arxonchain to qualify for rewards',
          verified: fetchSuccess
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error validating post:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});