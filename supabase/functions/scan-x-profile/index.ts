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

interface Tweet {
  id: string
  text: string
  public_metrics: {
    retweet_count: number
    reply_count: number
    like_count: number
    quote_count: number
  }
  created_at: string
}

interface TwitterResponse {
  data?: Tweet[]
  meta?: {
    result_count: number
    next_token?: string
  }
  errors?: any[]
}

const QUALIFIED_HASHTAGS = ['#arxonmining', '#arxon', '#arxonchain']
const QUALIFIED_MENTIONS = ['@arxonarx']

function isQualifiedTweet(text: string): boolean {
  const lowerText = text.toLowerCase()
  return (
    QUALIFIED_HASHTAGS.some(tag => lowerText.includes(tag.toLowerCase())) ||
    QUALIFIED_MENTIONS.some(mention => lowerText.includes(mention.toLowerCase()))
  )
}

function calculateBoost(qualifiedPosts: number, avgEngagement: number, hasViralPost: boolean): number {
  let boost = 0
  
  // Base boost from number of posts
  if (qualifiedPosts >= 5) {
    boost = avgEngagement >= 50 ? 800 : 500
  } else if (qualifiedPosts >= 3) {
    boost = 300
  } else if (qualifiedPosts >= 1) {
    boost = 100
  }
  
  // Extra bonus for viral post (500+ engagement)
  if (hasViralPost) {
    boost += 200
  }
  
  return boost
}

// Calculate ARX-P reward based on engagement
function calculateArxPReward(engagement: number): number {
  if (engagement >= 1000) return 500
  if (engagement >= 500) return 250
  if (engagement >= 100) return 100
  if (engagement >= 50) return 50
  if (engagement >= 10) return 25
  return 10 // Minimum reward for any qualified post
}

// Calculate boost reward based on engagement
function calculateBoostReward(engagement: number): number {
  if (engagement >= 1000) return 50
  if (engagement >= 500) return 25
  if (engagement >= 100) return 10
  if (engagement >= 50) return 5
  return 2 // Minimum boost for any qualified post
}

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
      console.log('Twitter API rate limited on user lookup - proceeding with cached data')
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

async function fetchUserTweets(userId: string, bearerToken: string, startTime?: string): Promise<{ tweets: Tweet[], rateLimited: boolean }> {
  // Get tweets from the last 24 hours for daily boost
  const defaultStartTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const timeParam = startTime || defaultStartTime
  
  const tweetsResponse = await fetch(
    `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&start_time=${timeParam}&tweet.fields=public_metrics,created_at`,
    {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      },
    }
  )

  if (!tweetsResponse.ok) {
    const errorText = await tweetsResponse.text()
    console.error('Failed to fetch tweets:', errorText)
    
    // Check if it's a rate limit error (429) or usage cap exceeded
    if (tweetsResponse.status === 429 || errorText.includes('UsageCapExceeded')) {
      console.log('Twitter API rate limited - proceeding with default values')
      return { tweets: [], rateLimited: true }
    }
    
    throw new Error(`Failed to fetch tweets: ${tweetsResponse.status}`)
  }

  const tweetsData: TwitterResponse = await tweetsResponse.json()
  return { tweets: tweetsData.data || [], rateLimited: false }
}

// Fetch historical tweets (paged, up to a cap)
async function fetchHistoricalTweets(
  userId: string,
  bearerToken: string,
  maxPages = 5
): Promise<{ tweets: Tweet[]; rateLimited: boolean }> {
  const allTweets: Tweet[] = []
  let nextToken: string | undefined

  for (let page = 0; page < maxPages; page++) {
    const url = new URL(`https://api.twitter.com/2/users/${userId}/tweets`)
    url.searchParams.set('max_results', '100')
    url.searchParams.set('tweet.fields', 'public_metrics,created_at')
    if (nextToken) url.searchParams.set('pagination_token', nextToken)

    const tweetsResponse = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    })

    if (!tweetsResponse.ok) {
      const errorText = await tweetsResponse.text()
      console.error('Failed to fetch historical tweets:', errorText)

      if (tweetsResponse.status === 429 || errorText.includes('UsageCapExceeded')) {
        console.log('Twitter API rate limited for historical tweets')
        return { tweets: [], rateLimited: true }
      }

      throw new Error(`Failed to fetch historical tweets: ${tweetsResponse.status}`)
    }

    const tweetsData: TwitterResponse = await tweetsResponse.json()
    const batch = tweetsData.data || []
    allTweets.push(...batch)

    nextToken = tweetsData.meta?.next_token
    if (!nextToken) break
  }

  return { tweets: allTweets, rateLimited: false }
}

function extractTweetIdFromUrl(url: string): string | null {
  const match = url.match(/status\/(\d+)/i)
  return match?.[1] ?? null
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
    const { username, profileUrl, isInitialConnect, forceHistorical } = body

    if (!username) {
      throw new Error('Username is required')
    }

    console.log(`Scanning tweets for @${username}, initial connect: ${isInitialConnect}, remaining: ${rateLimit.remaining}`)

    // Fetch user data including profile image
    const userData = await fetchUserData(username, bearerToken)
    
    // If rate limited on user lookup, return cached/default data without error
    if (userData.rateLimited || !userData.id) {
      console.log('Rate limited - using cached profile data')
      
      // Just update last_scanned_at timestamp
      await supabase
        .from('x_profiles')
        .upsert({
          user_id: user.id,
          username: username,
          profile_url: profileUrl || `https://x.com/${username}`,
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
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    console.log(`User ID: ${userData.id}, Profile Image: ${userData.profileImageUrl}`)

    // Fetch recent tweets (handles rate limits gracefully)
    const { tweets, rateLimited } = await fetchUserTweets(userData.id, bearerToken)
    console.log(`Found ${tweets.length} tweets in last 24 hours${rateLimited ? ' (rate limited)' : ''}`)

    // Filter qualified tweets for daily boost
    const qualifiedTweets = tweets.filter(tweet => isQualifiedTweet(tweet.text))
    console.log(`Found ${qualifiedTweets.length} qualified tweets`)

    // Calculate metrics (max 5 posts count)
    const qualifiedPostsToday = Math.min(qualifiedTweets.length, 5)
    
    let totalEngagement = 0
    let hasViralPost = false

    qualifiedTweets.forEach(tweet => {
      const engagement = 
        tweet.public_metrics.like_count + 
        tweet.public_metrics.retweet_count + 
        tweet.public_metrics.reply_count +
        tweet.public_metrics.quote_count
      
      totalEngagement += engagement
      
      if (engagement >= 500) {
        hasViralPost = true
      }
    })

    const avgEngagement = qualifiedTweets.length > 0 
      ? Math.round(totalEngagement / qualifiedTweets.length) 
      : 0

    const boostPercentage = calculateBoost(qualifiedPostsToday, avgEngagement, hasViralPost)

    console.log(`Boost calculation: ${qualifiedPostsToday} posts, ${avgEngagement} avg eng, viral: ${hasViralPost} = ${boostPercentage}%`)

    // Upsert the profile data
    const { data: xProfile, error: upsertError } = await supabase
      .from('x_profiles')
      .upsert({
        user_id: user.id,
        username: username,
        profile_url: profileUrl || `https://x.com/${username}`,
        boost_percentage: boostPercentage,
        qualified_posts_today: qualifiedPostsToday,
        average_engagement: avgEngagement,
        viral_bonus: hasViralPost,
        last_scanned_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Failed to upsert x_profile:', upsertError)
      throw new Error('Failed to save profile data')
    }

    // Reward processing: always detect qualified tweets and keep rewards/boost/points in sync
    // - Adds/updates x_post_rewards for any qualified tweet found
    // - Increments user_points by the delta for tweets that were NOT already manually claimed via social_submissions
    // - Keeps x_profiles "historical" totals and avg engagement up-to-date

    let historicalRewards: any[] = []
    let deltaArxP = 0
    let deltaBoost = 0

    // Determine whether we should attempt a historical scan in this run
    const shouldRunHistorical = Boolean(forceHistorical) || Boolean(isInitialConnect) || !xProfile.historical_scanned

    // Fetch historical tweets only when needed
    let qualifiedHistoricalTweets: Tweet[] = []
    let histRateLimited = false

    if (shouldRunHistorical) {
      console.log('Attempting historical tweet scan...')
      const { tweets: historicalTweets, rateLimited: histLimited } = await fetchHistoricalTweets(userData.id!, bearerToken, 5)
      histRateLimited = histLimited
      console.log(`Found ${historicalTweets.length} historical tweets${histRateLimited ? ' (rate limited)' : ''}`)
      qualifiedHistoricalTweets = historicalTweets.filter((tweet) => isQualifiedTweet(tweet.text))
      console.log(`Found ${qualifiedHistoricalTweets.length} qualified historical tweets`)
    }

    // Merge qualified tweets (recent + historical) without duplicates
    const tweetsToProcessMap = new Map<string, Tweet>()
    qualifiedTweets.forEach((t) => tweetsToProcessMap.set(t.id, t))
    qualifiedHistoricalTweets.forEach((t) => tweetsToProcessMap.set(t.id, t))
    const tweetsToProcess = Array.from(tweetsToProcessMap.values())

    // Build a set of tweet IDs already rewarded via manual URL submissions
    const { data: approvedSubmissions } = await supabase
      .from('social_submissions')
      .select('post_url, points_awarded, status')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .gt('points_awarded', 0)

    const manuallyRewardedTweetIds = new Set<string>()
    ;(approvedSubmissions || []).forEach((s: any) => {
      const tid = extractTweetIdFromUrl(String(s.post_url || ''))
      if (tid) manuallyRewardedTweetIds.add(tid)
    })

    // Fetch existing rewards for these tweets so we can compute deltas safely
    const tweetIds = tweetsToProcess.map((t) => t.id)
    const { data: existingRewardsRows } = tweetIds.length
      ? await supabase
          .from('x_post_rewards')
          .select('tweet_id, arx_p_reward, boost_reward')
          .eq('user_id', user.id)
          .in('tweet_id', tweetIds)
      : { data: [] as any[] }

    const existingRewardByTweetId = new Map<string, { arx: number; boost: number }>()
    ;(existingRewardsRows || []).forEach((r: any) => {
      existingRewardByTweetId.set(String(r.tweet_id), {
        arx: Number(r.arx_p_reward || 0),
        boost: Number(r.boost_reward || 0),
      })
    })

    // Upsert rewards for every qualified tweet
    for (const tweet of tweetsToProcess) {
      const engagement =
        tweet.public_metrics.like_count +
        tweet.public_metrics.retweet_count +
        tweet.public_metrics.reply_count +
        tweet.public_metrics.quote_count

      const newArxPReward = calculateArxPReward(engagement)
      const newBoostReward = calculateBoostReward(engagement)

      const old = existingRewardByTweetId.get(tweet.id) || { arx: 0, boost: 0 }
      const isManuallyRewarded = manuallyRewardedTweetIds.has(tweet.id)

      // Only pay out deltas for tweets not already rewarded through manual submissions
      if (!isManuallyRewarded) {
        deltaArxP += newArxPReward - old.arx
        deltaBoost += newBoostReward - old.boost
      }

      const { error: rewardError } = await supabase
        .from('x_post_rewards')
        .upsert(
          {
            user_id: user.id,
            x_profile_id: xProfile.id,
            tweet_id: tweet.id,
            tweet_text: tweet.text.substring(0, 500),
            like_count: tweet.public_metrics.like_count,
            retweet_count: tweet.public_metrics.retweet_count,
            reply_count: tweet.public_metrics.reply_count,
            quote_count: tweet.public_metrics.quote_count,
            total_engagement: engagement,
            arx_p_reward: newArxPReward,
            boost_reward: newBoostReward,
            tweet_created_at: tweet.created_at,
          },
          { onConflict: 'user_id,tweet_id' }
        )

      if (rewardError) {
        console.error('Failed to upsert reward:', rewardError)
      } else if (shouldRunHistorical) {
        historicalRewards.push({
          tweetId: tweet.id,
          text: tweet.text.substring(0, 100) + (tweet.text.length > 100 ? '...' : ''),
          engagement,
          arxPReward: newArxPReward,
          boostReward: newBoostReward,
          createdAt: tweet.created_at,
        })
      }
    }

    // Update X profile totals from stored rewards
    const { data: allRewardsRows, error: allRewardsError } = await supabase
      .from('x_post_rewards')
      .select('total_engagement, arx_p_reward, boost_reward')
      .eq('x_profile_id', xProfile.id)

    if (allRewardsError) {
      console.error('Failed to load reward aggregates:', allRewardsError)
    } else {
      const rows = allRewardsRows || []
      const postsCount = rows.length
      const totalArxP = rows.reduce((sum: number, r: any) => sum + Number(r.arx_p_reward || 0), 0)
      const totalBoost = rows.reduce((sum: number, r: any) => sum + Number(r.boost_reward || 0), 0)
      const totalEngagement = rows.reduce((sum: number, r: any) => sum + Number(r.total_engagement || 0), 0)
      const avgEng = postsCount > 0 ? Math.round(totalEngagement / postsCount) : 0
      const hasViral = rows.some((r: any) => Number(r.total_engagement || 0) >= 500)

      const historicalScanSucceeded = shouldRunHistorical ? !histRateLimited : xProfile.historical_scanned

      const { error: updateError } = await supabase
        .from('x_profiles')
        .update({
          historical_posts_count: postsCount,
          historical_arx_p_total: totalArxP,
          historical_boost_total: totalBoost,
          historical_scanned: Boolean(historicalScanSucceeded),
          average_engagement: avgEng,
          viral_bonus: hasViral,
        })
        .eq('id', xProfile.id)

      if (updateError) {
        console.error('Failed to update X profile aggregates:', updateError)
      }

      // Apply point/boost deltas to user_points
      if (deltaArxP !== 0 || deltaBoost !== 0) {
        const { data: existingPoints } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (existingPoints) {
          const nextSocial = Math.max(0, Number(existingPoints.social_points || 0) + deltaArxP)
          const nextTotal = Math.max(0, Number(existingPoints.total_points || 0) + deltaArxP)
          const nextBoost = Math.max(0, Number(existingPoints.x_post_boost_percentage || 0) + deltaBoost)

          await supabase
            .from('user_points')
            .update({
              social_points: nextSocial,
              total_points: nextTotal,
              x_post_boost_percentage: nextBoost,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
        } else {
          await supabase.from('user_points').insert({
            user_id: user.id,
            social_points: Math.max(0, deltaArxP),
            total_points: Math.max(0, deltaArxP),
            x_post_boost_percentage: Math.max(0, deltaBoost),
          })
        }

        console.log(`Auto rewards applied: Δ${deltaArxP} ARX-P, Δ${deltaBoost}% boost (manual-claimed tweets excluded)`) 
      }
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
          boostPercentage,
          qualifiedPostsToday,
          avgEngagement,
          viralBonus: hasViralPost,
          lastScanned: new Date().toISOString(),
          profileImageUrl: userData.profileImageUrl,
          rateLimited,
          // Historical rewards data
          historicalRewards: shouldRunHistorical ? historicalRewards : undefined,
          message: rateLimited
            ? 'Profile connected! Tweet scanning temporarily unavailable due to API limits. Boost will update when limits reset.'
            : undefined,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error scanning X profile:', error)
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