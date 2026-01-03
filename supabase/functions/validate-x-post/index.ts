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
// Returns null for special paths like /i/status which don't contain the real username
const extractUsernameFromUrl = (url: string): string | null => {
  // Pattern: https://x.com/username/status/... or https://twitter.com/username/status/...
  const match = url.match(/(?:x\.com|twitter\.com)\/([^\/]+)\/status/i);
  if (!match) return null;
  
  const username = match[1].toLowerCase();
  
  // Handle special X paths that don't contain actual usernames:
  // - /i/status/... (logged-in user view, no username in URL)
  // - /intent/... (intent links)
  // - /share/... (share links)
  const specialPaths = ['i', 'intent', 'share', 'home', 'explore', 'search', 'notifications', 'messages'];
  if (specialPaths.includes(username)) {
    return null; // Will require API verification instead
  }
  
  return username;
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

    // Check 2: Daily limit - max 2 qualified posts per user per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const { data: todayApproved, error: dailyLimitError } = await supabase
      .from('social_submissions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .gte('created_at', todayStart.toISOString());

    if (!dailyLimitError && todayApproved && todayApproved.length >= 2) {
      await supabase
        .from('social_submissions')
        .update({ status: 'rejected' })
        .eq('id', submissionId);

      console.log(`Daily limit reached for user ${userId}: ${todayApproved.length} approved posts today`);
      return new Response(
        JSON.stringify({ 
          qualified: false, 
          reason: 'You have reached the daily limit of 2 qualified posts. Try again tomorrow!'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check 3: Get user's connected X profile username
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
    
    // If URL uses special path (like x.com/i/status/...), we'll verify via API instead
    const needsApiVerification = !postUsername;
    
    // If we got a username from URL, verify it matches the connected account
    if (postUsername && postUsername !== connectedUsername) {
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
          const errorText = await tweetResponse.text();
          console.error('Twitter API error:', errorText);
          
          // Check if rate limited - if so, we'll trust URL ownership verification
          if (tweetResponse.status === 429) {
            console.log('Twitter API rate limited, trusting URL ownership verification');
          }
        }
      } catch (error) {
        console.error('Error fetching tweet:', error);
      }
    }

    // If we successfully fetched tweet content, verify it contains required terms
    if (fetchSuccess && tweetText) {
      const textToCheck = tweetText.toLowerCase();
      const hasRequiredTerm = REQUIRED_TERMS.some(term => 
        textToCheck.includes(term.toLowerCase())
      );

      if (hasRequiredTerm) {
        // Qualified - update submission as approved
        await supabase
          .from('social_submissions')
          .update({ status: 'approved', reviewed_at: new Date().toISOString() })
          .eq('id', submissionId);

        console.log('Post approved with verified content containing keywords');
        return new Response(
          JSON.stringify({ 
            qualified: true, 
            message: 'Post qualifies for ARXON rewards!',
            verified: true,
            ownershipVerified: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Content verified but no keywords found
        await supabase
          .from('social_submissions')
          .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
          .eq('id', submissionId);

        console.log('Post rejected - no required keywords found in verified content');
        return new Response(
          JSON.stringify({ 
            qualified: false, 
            reason: 'Post must mention @arxonarx, #arxon, #arxonmining, or #arxonchain to qualify for rewards',
            verified: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // FALLBACK: If we couldn't fetch tweet content (rate limited, no token, etc.)
    // Check if URL ownership was verified or if we need API verification
    if (needsApiVerification) {
      // URL didn't contain username (e.g., x.com/i/status/...) and API failed
      // We cannot verify ownership, so reject with helpful message
      await supabase
        .from('social_submissions')
        .update({ status: 'rejected' })
        .eq('id', submissionId);

      console.log(`Cannot verify ownership for special URL format: ${postUrl}`);
      return new Response(
        JSON.stringify({ 
          qualified: false, 
          reason: 'Could not verify post ownership. Please use a direct post link (e.g., x.com/yourusername/status/...) instead of the shortened URL.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // URL ownership matched connected account - APPROVE with trust
    console.log(`Approving post with URL ownership verification only (API unavailable). User: @${connectedUsername}`);
    
    await supabase
      .from('social_submissions')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', submissionId);

    return new Response(
      JSON.stringify({ 
        qualified: true, 
        message: 'Post approved! Ownership verified.',
        verified: false,
        ownershipVerified: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error validating post:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});