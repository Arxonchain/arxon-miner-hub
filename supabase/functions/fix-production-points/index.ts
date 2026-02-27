import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const prodUrl = Deno.env.get('PROD_SUPABASE_URL')!
    const prodKey = Deno.env.get('PROD_SUPABASE_SERVICE_ROLE_KEY')!
    console.log(`Connecting to production: ${prodUrl?.substring(0, 30)}...`)
    console.log(`Key starts with: ${prodKey?.substring(0, 20)}...`)
    const supabase = createClient(prodUrl, prodKey)
    
    // Quick connection test
    const { data: testData, error: testError } = await supabase.from('profiles').select('user_id').limit(1)
    console.log(`Connection test: ${testError ? 'FAILED: ' + testError.message : 'OK, found ' + (testData?.length || 0) + ' profiles'}`)

    const body = await req.json().catch(() => ({}))
    const { username, fix_triggers, dry_run = true } = body

    const results: any[] = []
    const errors: any[] = []

    // Step 1: If fix_triggers requested, update the validate function via raw SQL
    if (fix_triggers) {
      // We can't run DDL via JS client, but we CAN use the postgrest rpc if available
      // Instead, let's just focus on data reconciliation
      results.push({ step: 'fix_triggers', message: 'Trigger fixes must be run via SQL Editor - see instructions below' })
    }

    // Step 2: Get users to reconcile
    let usersQuery = supabase.from('user_points').select('user_id')
    
    if (username) {
      // Find user by username first
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, username')
        .ilike('username', `%${username}%`)
      
      if (!profile || profile.length === 0) {
        return new Response(
          JSON.stringify({ error: `User "${username}" not found` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const userIds = profile.map((p: any) => p.user_id)
      usersQuery = usersQuery.in('user_id', userIds)
      results.push({ step: 'found_users', users: profile.map((p: any) => p.username) })
    }

    const { data: users, error: usersError } = await usersQuery.order('user_id').limit(1000)
    if (usersError) throw usersError

    console.log(`Processing ${users?.length || 0} users...`)

    let fixed = 0
    let skipped = 0
    const details: any[] = []

    for (const u of users || []) {
      try {
        const userId = u.user_id

        // Fetch all source data in parallel
        const [
          currentPoints,
          miningData,
          taskData,
          checkinData,
          socialData,
          referralData,
          arenaEarningsData,
          arenaVotesData,
        ] = await Promise.all([
          supabase.from('user_points').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('mining_sessions').select('arx_mined').eq('user_id', userId).eq('is_active', false),
          supabase.from('user_tasks').select('points_awarded').eq('user_id', userId).eq('status', 'completed'),
          supabase.from('daily_checkins').select('points_awarded').eq('user_id', userId),
          supabase.from('social_submissions').select('points_awarded').eq('user_id', userId).eq('status', 'approved'),
          supabase.from('referrals').select('points_awarded').eq('referrer_id', userId),
          supabase.from('arena_earnings').select('total_earned, stake_amount, is_winner').eq('user_id', userId),
          supabase.from('arena_votes').select('power_spent').eq('user_id', userId),
        ])

        const current = currentPoints.data
        if (!current) continue

        // Compute correct values from source tables
        const computedMining = Math.floor(
          (miningData.data || []).reduce((sum: number, s: any) => sum + Number(s.arx_mined || 0), 0)
        )

        const computedTask = Math.floor(
          (taskData.data || []).reduce((sum: number, t: any) => sum + Number(t.points_awarded || 0), 0) +
          (checkinData.data || []).reduce((sum: number, c: any) => sum + Number(c.points_awarded || 0), 0)
        )

        // Social = approved social submissions + arena NET PROFIT (earned - staked for winners)
        const socialFromSubmissions = (socialData.data || []).reduce(
          (sum: number, s: any) => sum + Number(s.points_awarded || 0), 0
        )
        const arenaNetProfit = (arenaEarningsData.data || []).reduce(
          (sum: number, e: any) => {
            if (e.is_winner) {
              return sum + Math.max(0, Number(e.total_earned || 0) - Number(e.stake_amount || 0))
            }
            return sum // losers get 0 net
          }, 0
        )
        const computedSocial = Math.floor(socialFromSubmissions + arenaNetProfit)

        const computedReferral = Math.floor(
          (referralData.data || []).reduce((sum: number, r: any) => sum + Number(r.points_awarded || 100), 0)
        )

        // Total arena stakes (deductions that already happened)
        const totalArenaStaked = Math.floor(
          (arenaVotesData.data || []).reduce((sum: number, v: any) => sum + Number(v.power_spent || 0), 0)
        )

        // The correct balance = all earnings - all stakes
        const totalEarned = computedMining + computedTask + computedSocial + computedReferral
        const correctTotal = Math.max(0, totalEarned - totalArenaStaked)

        // Distribute the arena deduction across categories (mining first, then task, then social, then referral)
        let remaining = totalArenaStaked
        let finalMining = computedMining
        let finalTask = computedTask
        let finalSocial = computedSocial
        let finalReferral = computedReferral

        // Deduct from mining first
        if (remaining > 0 && finalMining > 0) {
          const deduct = Math.min(remaining, finalMining)
          finalMining -= deduct
          remaining -= deduct
        }
        // Then task
        if (remaining > 0 && finalTask > 0) {
          const deduct = Math.min(remaining, finalTask)
          finalTask -= deduct
          remaining -= deduct
        }
        // Then social
        if (remaining > 0 && finalSocial > 0) {
          const deduct = Math.min(remaining, finalSocial)
          finalSocial -= deduct
          remaining -= deduct
        }
        // Then referral
        if (remaining > 0 && finalReferral > 0) {
          const deduct = Math.min(remaining, finalReferral)
          finalReferral -= deduct
          remaining -= deduct
        }

        const finalTotal = finalMining + finalTask + finalSocial + finalReferral

        const storedTotal = Math.floor(Number(current.total_points || 0))
        const diff = finalTotal - storedTotal

        // Only fix if there's a meaningful difference (> 1 point)
        if (Math.abs(diff) <= 1) {
          skipped++
          if (username) {
            details.push({
              userId,
              action: 'no_change',
              stored: { mining: Number(current.mining_points), task: Number(current.task_points), social: Number(current.social_points), referral: Number(current.referral_points), total: storedTotal },
              computed: { mining: finalMining, task: finalTask, social: finalSocial, referral: finalReferral, total: finalTotal },
              sources: { rawMining: computedMining, rawTask: computedTask, rawSocial: computedSocial, rawReferral: computedReferral, arenaNetProfit: Math.floor(arenaNetProfit), arenaStaked: totalArenaStaked },
            })
          }
          continue
        }

        if (dry_run) {
          details.push({
            userId,
            action: 'would_fix',
            diff,
            stored: { mining: Number(current.mining_points), task: Number(current.task_points), social: Number(current.social_points), referral: Number(current.referral_points), total: storedTotal },
            correct: { mining: finalMining, task: finalTask, social: finalSocial, referral: finalReferral, total: finalTotal },
            sources: { rawMining: computedMining, rawTask: computedTask, rawSocial: computedSocial, rawReferral: computedReferral, arenaNetProfit: Math.floor(arenaNetProfit), arenaStaked: totalArenaStaked },
          })
        } else {
          // APPLY THE FIX
          const { error: updateError } = await supabase
            .from('user_points')
            .update({
              mining_points: finalMining,
              task_points: finalTask,
              social_points: finalSocial,
              referral_points: finalReferral,
              total_points: finalTotal,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)

          if (updateError) {
            errors.push({ userId, error: updateError.message })
          } else {
            fixed++
            details.push({
              userId,
              action: 'fixed',
              diff,
              before: storedTotal,
              after: finalTotal,
              breakdown: { mining: finalMining, task: finalTask, social: finalSocial, referral: finalReferral },
            })
          }
        }
      } catch (userError: any) {
        errors.push({ userId: u.user_id, error: userError.message })
      }
    }

    const triggerFixSQL = `
-- RUN THIS IN YOUR PRODUCTION SUPABASE SQL EDITOR (lgytumkuqflksbcukjek)
-- Step 1: Raise caps in validate trigger
CREATE OR REPLACE FUNCTION public.validate_user_points_integrity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_allow_decrease BOOLEAN := (current_user = 'postgres' OR current_user = 'service_role')
    OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role));
BEGIN
  IF TG_OP = 'UPDATE' AND NOT v_allow_decrease THEN
    IF NEW.mining_points < OLD.mining_points THEN NEW.mining_points := OLD.mining_points; END IF;
    IF NEW.task_points < OLD.task_points THEN NEW.task_points := OLD.task_points; END IF;
    IF NEW.social_points < OLD.social_points THEN NEW.social_points := OLD.social_points; END IF;
    IF NEW.referral_points < OLD.referral_points THEN NEW.referral_points := OLD.referral_points; END IF;
  END IF;
  NEW.mining_points := LEAST(GREATEST(COALESCE(NEW.mining_points, 0), 0), 1000000000);
  NEW.task_points := LEAST(GREATEST(COALESCE(NEW.task_points, 0), 0), 1000000000);
  NEW.social_points := LEAST(GREATEST(COALESCE(NEW.social_points, 0), 0), 1000000000);
  NEW.referral_points := LEAST(GREATEST(COALESCE(NEW.referral_points, 0), 0), 1000000000);
  NEW.total_points := NEW.mining_points + NEW.task_points + NEW.social_points + NEW.referral_points;
  RETURN NEW;
END; $$;

-- Step 2: Fix arena vote deduction to use categories
CREATE OR REPLACE FUNCTION public.handle_arena_vote()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_m NUMERIC; v_t NUMERIC; v_s NUMERIC; v_r NUMERIC; v_rem NUMERIC;
BEGIN
  SELECT mining_points, task_points, social_points, referral_points
  INTO v_m, v_t, v_s, v_r FROM user_points WHERE user_id = NEW.user_id;
  v_rem := NEW.power_spent;
  IF v_rem > 0 AND v_m > 0 THEN
    IF v_m >= v_rem THEN v_m := v_m - v_rem; v_rem := 0;
    ELSE v_rem := v_rem - v_m; v_m := 0; END IF;
  END IF;
  IF v_rem > 0 AND v_t > 0 THEN
    IF v_t >= v_rem THEN v_t := v_t - v_rem; v_rem := 0;
    ELSE v_rem := v_rem - v_t; v_t := 0; END IF;
  END IF;
  IF v_rem > 0 AND v_s > 0 THEN
    IF v_s >= v_rem THEN v_s := v_s - v_rem; v_rem := 0;
    ELSE v_rem := v_rem - v_s; v_s := 0; END IF;
  END IF;
  IF v_rem > 0 AND v_r > 0 THEN
    IF v_r >= v_rem THEN v_r := v_r - v_rem; v_rem := 0;
    ELSE v_rem := v_rem - v_r; v_r := 0; END IF;
  END IF;
  UPDATE user_points SET mining_points=v_m, task_points=v_t, social_points=v_s, referral_points=v_r, updated_at=now()
  WHERE user_id = NEW.user_id;
  IF NEW.side = 'a' THEN
    UPDATE arena_battles SET side_a_power = side_a_power + NEW.power_spent, total_participants = COALESCE(total_participants,0)+1 WHERE id = NEW.battle_id;
  ELSIF NEW.side = 'b' THEN
    UPDATE arena_battles SET side_b_power = side_b_power + NEW.power_spent, total_participants = COALESCE(total_participants,0)+1 WHERE id = NEW.battle_id;
  ELSIF NEW.side = 'c' THEN
    UPDATE arena_battles SET side_c_power = COALESCE(side_c_power,0) + NEW.power_spent, total_participants = COALESCE(total_participants,0)+1 WHERE id = NEW.battle_id;
  END IF;
  RETURN NEW;
END; $$;
`

    return new Response(
      JSON.stringify({
        success: true,
        dry_run,
        total_users: users?.length || 0,
        fixed,
        skipped,
        errors: errors.length,
        details,
        error_details: errors.length > 0 ? errors : undefined,
        trigger_fix_sql: fix_triggers ? triggerFixSQL : undefined,
        message: dry_run 
          ? 'DRY RUN complete. Call again with dry_run=false to apply fixes.'
          : `Fixed ${fixed} users, skipped ${skipped}, ${errors.length} errors.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Fix error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
