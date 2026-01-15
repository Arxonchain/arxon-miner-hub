import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple in-memory rate limiter for this edge function
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MAX = 10; // 10 scans per minute per user
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  let entry = rateLimitStore.get(userId);
  
  // Reset window if expired or doesn't exist
  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    entry = { count: 0, windowStart: now };
    rateLimitStore.set(userId, entry);
  }
  
  const resetAt = entry.windowStart + RATE_LIMIT_WINDOW_MS;
  const retryAfterMs = Math.max(0, resetAt - now);
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, retryAfterMs };
  }
  
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, retryAfterMs };
}

// Fetch user data from X API to verify account exists and get profile image
async function fetchUserData(username: string, bearerToken: string): Promise<{ id: string | null, profileImageUrl: string | null, rateLimited: boolean }> {
  const userResponse = await fetch(
    `https://api.twitter.com/2/users/by/username/${username}?user.fields=profile_image_url`,
    {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      },
    }
  )

  if (!userResponse.ok) {
    const errorText = await userResponse.text()
    console.error('Failed to fetch user:', errorText)
    
    // Handle rate limit gracefully
    if (userResponse.status === 429 || errorText.includes('UsageCapExceeded') || errorText.includes('Too Many Requests')) {
      console.log('Twitter API rate limited on user lookup - proceeding with limited data')
      return { id: null, profileImageUrl: null, rateLimited: true }
    }
    
    throw new Error(`Failed to fetch user: ${userResponse.status}`)
  }

  const userData = await userResponse.json()
  if (!userData.data?.id) {
    throw new Error('User not found')
  }

  // Get the high-res version of profile image by replacing _normal with _400x400
  let profileImageUrl = userData.data.profile_image_url || null
  if (profileImageUrl) {
    profileImageUrl = profileImageUrl.replace('_normal', '_400x400')
  }

  return {
    id: userData.data.id,
    profileImageUrl,
    rateLimited: false
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const bearerToken = Deno.env.get('X_BEARER_TOKEN')
    if (!bearerToken) {
      throw new Error('X_BEARER_TOKEN not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Rate limit check - 10 scans per minute per user
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      console.log(`Rate limited user ${user.id}, retry after ${rateLimit.retryAfterMs}ms`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many scan requests. Please wait a moment.',
          retryAfterMs: rateLimit.retryAfterMs,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'Retry-After': String(Math.ceil(rateLimit.retryAfterMs / 1000)),
          },
        }
      );
    }

    const body = await req.json()
    const { username, profileUrl } = body

    if (!username) {
      throw new Error('Username is required')
    }

    console.log(`Connecting X profile @${username} for identity verification only (rewards disabled)`)

    // Fetch user data including profile image
    const userData = await fetchUserData(username, bearerToken)
    
    // If rate limited on user lookup, still save the profile connection
    if (userData.rateLimited || !userData.id) {
      console.log('Rate limited - saving basic profile connection')
      
      await supabase
        .from('x_profiles')
        .upsert({
          user_id: user.id,
          username: username,
          profile_url: profileUrl || `https://x.com/${username}`,
          boost_percentage: 0, // No boost rewards
          qualified_posts_today: 0,
          average_engagement: 0,
          viral_bonus: false,
          historical_scanned: true,
          historical_posts_count: 0,
          historical_arx_p_total: 0,
          historical_boost_total: 0,
          last_scanned_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
      
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            username,
            boostPercentage: 0,
            qualifiedPostsToday: 0,
            avgEngagement: 0,
            viralBonus: false,
            lastScanned: new Date().toISOString(),
            profileImageUrl: null,
            rateLimited: true,
            message: 'X account connected for identity verification. Engagement rewards are currently disabled.',
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    console.log(`User ID: ${userData.id}, Profile Image: ${userData.profileImageUrl}`)

    // Save profile connection WITHOUT scanning tweets or calculating rewards
    // Rewards system is disabled - this is identity verification only
    const { error: upsertError } = await supabase
      .from('x_profiles')
      .upsert({
        user_id: user.id,
        username: username,
        profile_url: profileUrl || `https://x.com/${username}`,
        boost_percentage: 0, // No boost rewards
        qualified_posts_today: 0,
        average_engagement: 0,
        viral_bonus: false,
        historical_scanned: true,
        historical_posts_count: 0,
        historical_arx_p_total: 0,
        historical_boost_total: 0,
        last_scanned_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })

    if (upsertError) {
      console.error('Failed to upsert x_profile:', upsertError)
      throw new Error('Failed to save profile data')
    }

    // Update user's profile avatar_url with X profile picture if they don't have one
    if (userData.profileImageUrl) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .maybeSingle()

      // Only update if no avatar set or it's already an X profile image
      if (!existingProfile?.avatar_url || existingProfile.avatar_url.includes('pbs.twimg.com')) {
        await supabase
          .from('profiles')
          .update({ 
            avatar_url: userData.profileImageUrl,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
        
        console.log('Updated user profile with X avatar')
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          username,
          boostPercentage: 0,
          qualifiedPostsToday: 0,
          avgEngagement: 0,
          viralBonus: false,
          lastScanned: new Date().toISOString(),
          profileImageUrl: userData.profileImageUrl,
          rateLimited: false,
          message: 'X account connected successfully! Your X profile is now linked to your ARXON account.',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error connecting X profile:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
