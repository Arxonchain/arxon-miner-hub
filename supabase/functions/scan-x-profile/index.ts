import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

async function fetchUserData(username: string, bearerToken: string): Promise<{ id: string, profileImageUrl: string | null }> {
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
    profileImageUrl
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

// Fetch historical tweets (all time, up to 100 due to API limits)
async function fetchHistoricalTweets(userId: string, bearerToken: string): Promise<{ tweets: Tweet[], rateLimited: boolean }> {
  const tweetsResponse = await fetch(
    `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=public_metrics,created_at`,
    {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      },
    }
  )

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
  return { tweets: tweetsData.data || [], rateLimited: false }
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

    const body = await req.json()
    const { username, profileUrl, isInitialConnect } = body

    if (!username) {
      throw new Error('Username is required')
    }

    console.log(`Scanning tweets for @${username}, initial connect: ${isInitialConnect}`)

    // Fetch user data including profile image
    const userData = await fetchUserData(username, bearerToken)
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

    // Process historical posts on initial connect
    let historicalRewards: any[] = []
    let historicalTotalArxP = 0
    let historicalTotalBoost = 0

    if (isInitialConnect && !xProfile.historical_scanned) {
      console.log('Processing historical posts for initial connect...')
      
      const { tweets: historicalTweets, rateLimited: histRateLimited } = await fetchHistoricalTweets(userData.id, bearerToken)
      console.log(`Found ${historicalTweets.length} historical tweets${histRateLimited ? ' (rate limited)' : ''}`)

      const qualifiedHistoricalTweets = historicalTweets.filter(tweet => isQualifiedTweet(tweet.text))
      console.log(`Found ${qualifiedHistoricalTweets.length} qualified historical tweets`)

      for (const tweet of qualifiedHistoricalTweets) {
        const engagement = 
          tweet.public_metrics.like_count + 
          tweet.public_metrics.retweet_count + 
          tweet.public_metrics.reply_count +
          tweet.public_metrics.quote_count

        const arxPReward = calculateArxPReward(engagement)
        const boostReward = calculateBoostReward(engagement)

        historicalTotalArxP += arxPReward
        historicalTotalBoost += boostReward

        // Insert into x_post_rewards (use service role to bypass RLS for inserts)
        const { error: rewardError } = await supabase
          .from('x_post_rewards')
          .upsert({
            user_id: user.id,
            x_profile_id: xProfile.id,
            tweet_id: tweet.id,
            tweet_text: tweet.text.substring(0, 500), // Limit text length
            like_count: tweet.public_metrics.like_count,
            retweet_count: tweet.public_metrics.retweet_count,
            reply_count: tweet.public_metrics.reply_count,
            quote_count: tweet.public_metrics.quote_count,
            total_engagement: engagement,
            arx_p_reward: arxPReward,
            boost_reward: boostReward,
            tweet_created_at: tweet.created_at,
          }, {
            onConflict: 'user_id,tweet_id'
          })

        if (rewardError) {
          console.error('Failed to insert reward:', rewardError)
        } else {
          historicalRewards.push({
            tweetId: tweet.id,
            text: tweet.text.substring(0, 100) + (tweet.text.length > 100 ? '...' : ''),
            engagement,
            arxPReward,
            boostReward,
            createdAt: tweet.created_at,
          })
        }
      }

      // Update x_profile with historical totals
      const { error: updateError } = await supabase
        .from('x_profiles')
        .update({
          historical_posts_count: qualifiedHistoricalTweets.length,
          historical_arx_p_total: historicalTotalArxP,
          historical_boost_total: historicalTotalBoost,
          historical_scanned: true,
        })
        .eq('id', xProfile.id)

      if (updateError) {
        console.error('Failed to update historical totals:', updateError)
      }

      // Add ARX-P rewards to user's points
      if (historicalTotalArxP > 0) {
        const { data: existingPoints } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (existingPoints) {
          await supabase
            .from('user_points')
            .update({
              social_points: existingPoints.social_points + historicalTotalArxP,
              total_points: existingPoints.total_points + historicalTotalArxP,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
        } else {
          await supabase
            .from('user_points')
            .insert({
              user_id: user.id,
              social_points: historicalTotalArxP,
              total_points: historicalTotalArxP,
            })
        }
        console.log(`Added ${historicalTotalArxP} ARX-P from historical posts`)
      }

      console.log(`Historical rewards processed: ${qualifiedHistoricalTweets.length} posts, ${historicalTotalArxP} ARX-P, ${historicalTotalBoost}% boost`)
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
          historicalRewards: isInitialConnect ? historicalRewards : undefined,
          historicalTotalArxP: isInitialConnect ? historicalTotalArxP : undefined,
          historicalTotalBoost: isInitialConnect ? historicalTotalBoost : undefined,
          historicalPostsCount: isInitialConnect ? historicalRewards.length : undefined,
          message: rateLimited 
            ? 'Profile connected! Tweet scanning temporarily unavailable due to API limits. Boost will update when limits reset.'
            : isInitialConnect && historicalRewards.length > 0
              ? `Found ${historicalRewards.length} prior ARXON posts! Rewarded ${historicalTotalArxP} ARX-P and ${historicalTotalBoost}% boost.`
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