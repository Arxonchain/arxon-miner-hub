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

async function fetchUserTweets(username: string, bearerToken: string): Promise<Tweet[]> {
  // First get user ID
  const userResponse = await fetch(
    `https://api.twitter.com/2/users/by/username/${username}`,
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

  const userId = userData.data.id

  // Get tweets from the last 24 hours
  const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  const tweetsResponse = await fetch(
    `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&start_time=${startTime}&tweet.fields=public_metrics,created_at`,
    {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      },
    }
  )

  if (!tweetsResponse.ok) {
    const errorText = await tweetsResponse.text()
    console.error('Failed to fetch tweets:', errorText)
    throw new Error(`Failed to fetch tweets: ${tweetsResponse.status}`)
  }

  const tweetsData: TwitterResponse = await tweetsResponse.json()
  return tweetsData.data || []
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
    const { username, profileUrl } = body

    if (!username) {
      throw new Error('Username is required')
    }

    console.log(`Scanning tweets for @${username}`)

    // Fetch recent tweets
    const tweets = await fetchUserTweets(username, bearerToken)
    console.log(`Found ${tweets.length} tweets in last 24 hours`)

    // Filter qualified tweets
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
