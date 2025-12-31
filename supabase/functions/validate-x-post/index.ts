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

// Extract username from X/Twitter URL
const extractUsernameFromUrl = (url: string): string | null => {
  // Pattern: https://x.com/username/status/... or https://twitter.com/username/status/...
  const match = url.match(/(?:x\.com|twitter\.com)\/([^\/]+)\/status/i);
  return match ? match[1].toLowerCase() : null;
};

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

    // Get the submission to find the user_id
    const { data: submission, error: submissionError } = await supabase
      .from('social_submissions')
      .select('user_id')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      console.error('Error fetching submission:', submissionError);
      return new Response(
        JSON.stringify({ qualified: false, reason: 'Submission not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = submission.user_id;

    // Check 1: Has this URL been used by ANY user before (prevent reuse across all users)?
    const { data: existingUrl, error: existingUrlError } = await supabase
      .from('social_submissions')
      .select('id, user_id, status')
      .eq('post_url', postUrl)
      .neq('id', submissionId) // Exclude current submission
      .limit(1);

    if (!existingUrlError && existingUrl && existingUrl.length > 0) {
      // URL has been used before - reject
      await supabase
        .from('social_submissions')
        .update({ status: 'rejected' })
        .eq('id', submissionId);

      console.log('Duplicate URL detected:', postUrl);
      return new Response(
        JSON.stringify({ 
          qualified: false, 
          reason: 'This post link has already been used. Each post can only be claimed once.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check 2: Get user's connected X profile username
    const { data: xProfile, error: xProfileError } = await supabase
      .from('x_profiles')
      .select('username')
      .eq('user_id', userId)
      .single();

    if (xProfileError || !xProfile) {
      // No X profile connected - reject
      await supabase
        .from('social_submissions')
        .update({ status: 'rejected' })
        .eq('id', submissionId);

      console.log('No X profile connected for user:', userId);
      return new Response(
        JSON.stringify({ 
          qualified: false, 
          reason: 'Please connect your X account first before submitting posts'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const connectedUsername = xProfile.username.toLowerCase();

    // Check 3: Extract username from post URL and verify ownership
    const postUsername = extractUsernameFromUrl(postUrl);
    
    if (!postUsername) {
      await supabase
        .from('social_submissions')
        .update({ status: 'rejected' })
        .eq('id', submissionId);

      return new Response(
        JSON.stringify({ qualified: false, reason: 'Invalid post URL format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the post is from the user's connected X account
    if (postUsername !== connectedUsername) {
      await supabase
        .from('social_submissions')
        .update({ status: 'rejected' })
        .eq('id', submissionId);

      console.log(`Post ownership mismatch: post from @${postUsername}, user connected as @${connectedUsername}`);
      return new Response(
        JSON.stringify({ 
          qualified: false, 
          reason: `This post is from @${postUsername}, but your connected account is @${connectedUsername}. You can only submit your own posts.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract tweet ID from URL
    const tweetIdMatch = postUrl.match(/status\/(\d+)/);
    if (!tweetIdMatch) {
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
          `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=text,author_id&expansions=author_id&user.fields=username`,
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
          
          // Extra verification: check author username from API response
          const authorUsername = tweetData.includes?.users?.[0]?.username?.toLowerCase();
          if (authorUsername && authorUsername !== connectedUsername) {
            await supabase
              .from('social_submissions')
              .update({ status: 'rejected' })
              .eq('id', submissionId);

            console.log(`API verified ownership mismatch: tweet by @${authorUsername}, user is @${connectedUsername}`);
            return new Response(
              JSON.stringify({ 
                qualified: false, 
                reason: `This post belongs to @${authorUsername}, not your connected account @${connectedUsername}.`
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          console.log('Tweet content fetched and ownership verified:', tweetText);
        } else {
          console.error('Twitter API error:', await tweetResponse.text());
        }
      } catch (error) {
        console.error('Error fetching tweet:', error);
      }
    }

    // If we couldn't fetch the tweet, check the URL itself for hints
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
          verified: fetchSuccess,
          ownershipVerified: true
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