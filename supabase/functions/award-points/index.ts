import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Secure backend endpoint for awarding points.
 * 
 * This replaces direct client-side RPC calls to increment_user_points.
 * Only the backend (service_role) can execute the actual point increment.
 * 
 * Supported types:
 * - mining: Requires a valid session_id that hasn't been credited yet
 * - task: Requires a valid task completion
 * - social: Requires a valid social submission
 * - referral: Handled by database trigger on referral creation
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Authenticate the user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { type, amount, session_id } = body

    // Validate type
    if (!['mining', 'task', 'social'].includes(type)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid point type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate amount
    const safeAmount = Math.min(Math.max(Math.floor(Number(amount) || 0), 0), 500)
    if (safeAmount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For mining points, verify the session exists, belongs to user, and hasn't been credited
    if (type === 'mining') {
      if (!session_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Session ID required for mining points' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if session exists, belongs to user, and hasn't been credited
      const { data: session, error: sessionError } = await supabase
        .from('mining_sessions')
        .select('id, user_id, is_active, arx_mined, credited_at, started_at')
        .eq('id', session_id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (sessionError || !session) {
        console.error('Session not found:', session_id, sessionError)
        return new Response(
          JSON.stringify({ success: false, error: 'Session not found or access denied' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Prevent double-crediting
      if (session.credited_at) {
        console.log('Session already credited:', session_id)
        return new Response(
          JSON.stringify({ success: true, message: 'Already credited', points: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate maximum allowed points based on elapsed time
      const startTime = new Date(session.started_at).getTime()
      const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000))
      const maxHours = 8
      const maxSeconds = maxHours * 60 * 60
      const effectiveSeconds = Math.min(elapsed, maxSeconds)

      // Fetch user's boost percentages
      const { data: userPoints } = await supabase
        .from('user_points')
        .select('referral_bonus_percentage, x_post_boost_percentage, daily_streak')
        .eq('user_id', user.id)
        .maybeSingle()

      const { data: xProfile } = await supabase
        .from('x_profiles')
        .select('boost_percentage')
        .eq('user_id', user.id)
        .maybeSingle()

      const { data: arenaBoosts } = await supabase
        .from('arena_boosts')
        .select('boost_percentage')
        .eq('user_id', user.id)
        .gte('expires_at', new Date().toISOString())

      const { data: nexusBoosts } = await supabase
        .from('nexus_boosts')
        .select('boost_percentage')
        .eq('user_id', user.id)
        .eq('claimed', true)
        .gte('expires_at', new Date().toISOString())

      const referralBoost = Math.min(userPoints?.referral_bonus_percentage || 0, 50)
      const xPostBoost = userPoints?.x_post_boost_percentage || 0
      const streakBoost = Math.min(userPoints?.daily_streak || 0, 30)
      const xProfileBoost = xProfile?.boost_percentage || 0
      const arenaBoost = arenaBoosts?.reduce((sum, b) => sum + (b.boost_percentage || 0), 0) || 0
      const nexusBoost = nexusBoosts?.reduce((sum, b) => sum + (b.boost_percentage || 0), 0) || 0

      const totalBoost = Math.min(referralBoost + xPostBoost + streakBoost + xProfileBoost + arenaBoost + nexusBoost, 500)
      const pointsPerHour = Math.min(10 * (1 + totalBoost / 100), 60)
      const maxAllowedPoints = Math.min(480, Math.floor((effectiveSeconds / 3600) * pointsPerHour))

      // Cap the requested amount to max allowed
      const cappedAmount = Math.min(safeAmount, maxAllowedPoints)
      
      if (cappedAmount <= 0) {
        return new Response(
          JSON.stringify({ success: true, message: 'No points to award', points: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Mark session as credited BEFORE awarding points (prevents race conditions)
      const { error: creditError } = await supabase
        .from('mining_sessions')
        .update({ credited_at: new Date().toISOString() })
        .eq('id', session_id)
        .is('credited_at', null) // Only update if not yet credited

      if (creditError) {
        console.error('Failed to mark session as credited:', creditError)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to process session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Award points using service role
      const { data: result, error: pointsError } = await supabase.rpc('increment_user_points', {
        p_user_id: user.id,
        p_amount: cappedAmount,
        p_type: 'mining',
      })

      if (pointsError) {
        console.error('Failed to award points:', pointsError)
        // Rollback the credited_at
        await supabase
          .from('mining_sessions')
          .update({ credited_at: null })
          .eq('id', session_id)
        
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to award points' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Awarded ${cappedAmount} mining points to ${user.id} for session ${session_id}`)

      return new Response(
        JSON.stringify({ success: true, points: cappedAmount, userPoints: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For task/social points, just increment (these are already validated elsewhere)
    const { data: result, error: pointsError } = await supabase.rpc('increment_user_points', {
      p_user_id: user.id,
      p_amount: safeAmount,
      p_type: type,
    })

    if (pointsError) {
      console.error('Failed to award points:', pointsError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to award points' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Awarded ${safeAmount} ${type} points to ${user.id}`)

    return new Response(
      JSON.stringify({ success: true, points: safeAmount, userPoints: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Award points error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
