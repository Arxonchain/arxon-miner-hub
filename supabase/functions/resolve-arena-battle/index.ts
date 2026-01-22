import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * New Reward System:
 * - Winners get their original stake back
 * - Dynamic multiplier (2x to 5x) based on pool ratio
 * - Winners share the ENTIRE losing pool proportionally
 * - Losers get NOTHING back (full risk, full reward)
 * 
 * Multiplier calculation:
 * - If winners had more stake (favorites): multiplier = 2 + (losing/winning) * 3 (max 5x)
 * - If winners had less stake (underdogs): multiplier = 5x (max)
 */
function calculateMultiplier(winningPool: number, losingPool: number): number {
  const MIN_MULTIPLIER = 2.0;
  const MAX_MULTIPLIER = 5.0;

  if (winningPool <= 0) return MIN_MULTIPLIER;
  
  if (winningPool >= losingPool) {
    // Favorites won - lower multiplier
    const ratio = losingPool / winningPool;
    return Math.min(MIN_MULTIPLIER + (ratio * (MAX_MULTIPLIER - MIN_MULTIPLIER)), MAX_MULTIPLIER);
  } else {
    // Underdogs won - maximum multiplier
    return MAX_MULTIPLIER;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is a manual resolution with specified winner
    const body = await req.json().catch(() => ({}));
    const manualWinner = body.winner_side; // 'a' or 'b' for admin-verified outcomes
    const battleId = body.battle_id;

    console.log("Starting battle resolution check...", { manualWinner, battleId });

    let battlesToResolve;

    if (battleId && manualWinner) {
      // Manual resolution for specific battle with verified outcome
      const { data, error } = await supabase
        .from("arena_battles")
        .select("*")
        .eq("id", battleId)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        throw new Error(`Battle not found or already resolved: ${error?.message}`);
      }
      battlesToResolve = [{ ...data, verified_winner: manualWinner }];
    } else {
      // Auto-resolution for ended battles (fallback to pool-based winner)
      const { data, error } = await supabase
        .from("arena_battles")
        .select("*")
        .eq("is_active", true)
        .lt("ends_at", new Date().toISOString());

      if (error) throw new Error(`Error fetching battles: ${error.message}`);
      battlesToResolve = data || [];
    }

    if (battlesToResolve.length === 0) {
      console.log("No battles to resolve");
      return new Response(JSON.stringify({ message: "No battles to resolve" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${battlesToResolve.length} battles to resolve`);

    const results = [];

    for (const battle of battlesToResolve) {
      console.log(`Resolving battle: ${battle.title}`);

      // Determine winner - use verified winner if provided, otherwise use pool sizes
      const winnerSide = battle.verified_winner || 
        (battle.side_a_power > battle.side_b_power ? "a" : 
         battle.side_b_power > battle.side_a_power ? "b" : null);

      // Calculate pools
      const winningPool = winnerSide === "a" ? battle.side_a_power : battle.side_b_power;
      const losingPool = winnerSide === "a" ? battle.side_b_power : battle.side_a_power;
      
      // Get admin-set prize pool and bonus percentage
      const prizePool = Number(battle.prize_pool) || 0;
      const bonusPercentage = Number(battle.bonus_percentage) || 200; // Default 200%

      // Calculate multiplier
      const multiplier = winnerSide ? calculateMultiplier(winningPool, losingPool) : 0;

      console.log(`Winner: ${winnerSide}, Winning Pool: ${winningPool}, Losing Pool: ${losingPool}, Prize Pool: ${prizePool}, Multiplier: ${multiplier}x`);

      // Update battle as resolved
      await supabase
        .from("arena_battles")
        .update({
          is_active: false,
          winner_side: winnerSide,
          outcome_verified: !!battle.verified_winner,
          outcome_verified_at: battle.verified_winner ? new Date().toISOString() : null,
        })
        .eq("id", battle.id);

      if (winnerSide) {
        // Get all votes for this battle
        const { data: allVotes, error: votesError } = await supabase
          .from("arena_votes")
          .select("user_id, power_spent, side")
          .eq("battle_id", battle.id);

        if (votesError) {
          console.error(`Error fetching votes: ${votesError.message}`);
          continue;
        }

        const winningVotes = (allVotes || []).filter(v => v.side === winnerSide);
        const losingVotes = (allVotes || []).filter(v => v.side !== winnerSide);
        const allParticipants = allVotes || [];

        console.log(`Winners: ${winningVotes.length}, Losers: ${losingVotes.length}, Total Participants: ${allParticipants.length}`);

        let totalRewardsDistributed = 0;
        let prizePoolDistributed = 0;

        // Prize pool distribution: Winners get bonus % of their stake FROM the pool
        // The pool is fixed (e.g., 100k), bonus % determines how much of stake as bonus
        // If total requested bonuses exceed pool, scale down proportionally
        
        console.log(`Prize Pool: ${prizePool}, Bonus %: ${bonusPercentage}%, Winners: ${winningVotes.length}`);

        // First pass: Calculate each winner's requested bonus (stake * bonus%)
        const winnerBonusRequests: { vote: typeof winningVotes[0]; requestedBonus: number }[] = [];
        let totalRequestedBonus = 0;

        for (const vote of winningVotes) {
          // Each winner's bonus = their stake * (bonusPercentage / 100)
          const requestedBonus = vote.power_spent * (bonusPercentage / 100);
          winnerBonusRequests.push({ vote, requestedBonus });
          totalRequestedBonus += requestedBonus;
        }

        // Calculate scale factor: if total requests exceed pool, scale down
        const scaleFactor = totalRequestedBonus > prizePool && totalRequestedBonus > 0
          ? prizePool / totalRequestedBonus
          : 1;

        console.log(`Total requested bonus: ${totalRequestedBonus}, Scale factor: ${scaleFactor}`);

        // Second pass: Process winners with scaled bonuses
        for (const { vote, requestedBonus } of winnerBonusRequests) {
          // Get current win streak for this user
          const { data: memberData } = await supabase
            .from("arena_members")
            .select("current_win_streak, best_win_streak")
            .eq("user_id", vote.user_id)
            .single();

          const currentStreak = (memberData?.current_win_streak || 0) + 1;
          const bestStreak = Math.max(currentStreak, memberData?.best_win_streak || 0);

          // Calculate streak bonus (3+ wins = 25%, 5+ = 50%, 10+ = 100%)
          let streakBonusPercent = 0;
          if (currentStreak >= 10) {
            streakBonusPercent = 100;
          } else if (currentStreak >= 5) {
            streakBonusPercent = 50;
          } else if (currentStreak >= 3) {
            streakBonusPercent = 25;
          }

          const stakeReturn = vote.power_spent; // Original stake back
          const stakeBonus = vote.power_spent * (multiplier - 1); // Multiplier bonus
          const loserPoolShare = winningPool > 0 
            ? (vote.power_spent / winningPool) * losingPool 
            : 0;
          
          // Winner's prize pool share = their requested bonus * scale factor
          // This ensures we never exceed the total prize pool
          const winnerPrizeShare = requestedBonus * scaleFactor;
          
          // Apply streak bonus to total earnings
          const baseReward = stakeReturn + stakeBonus + loserPoolShare + winnerPrizeShare;
          const streakBonus = baseReward * (streakBonusPercent / 100);
          const totalReward = baseReward + streakBonus;
          
          prizePoolDistributed += winnerPrizeShare;
          totalRewardsDistributed += totalReward;

          console.log(`User ${vote.user_id}: Streak ${currentStreak}, Bonus ${streakBonusPercent}%, Reward ${totalReward}`);

          // Update win streak
          await supabase
            .from("arena_members")
            .update({
              current_win_streak: currentStreak,
              best_win_streak: bestStreak,
              total_wins: (memberData as any)?.total_wins ? (memberData as any).total_wins + 1 : 1,
            })
            .eq("user_id", vote.user_id);

          // Record the reward with streak bonus and prize pool share
          await supabase.from("arena_staking_rewards").insert({
            battle_id: battle.id,
            user_id: vote.user_id,
            original_stake: vote.power_spent,
            multiplier: multiplier,
            stake_return: stakeReturn,
            loser_pool_share: loserPoolShare + winnerPrizeShare,
            total_reward: totalReward,
            is_winner: true,
          });

          // Record in arena_earnings with streak bonus and prize pool
          await supabase.from("arena_earnings").insert({
            battle_id: battle.id,
            user_id: vote.user_id,
            stake_amount: vote.power_spent,
            bonus_earned: stakeBonus + winnerPrizeShare,
            pool_share_earned: loserPoolShare,
            streak_bonus: streakBonus,
            total_earned: totalReward,
            is_winner: true,
          });

          // Add ARX-P back to winner's balance
          await supabase.rpc("increment_user_points", {
            p_user_id: vote.user_id,
            p_amount: Math.min(totalReward, 500),
            p_type: "mining",
          });

          // For large rewards, we need multiple increments (RPC has 500 cap)
          let remainingReward = totalReward - 500;
          while (remainingReward > 0) {
            const increment = Math.min(remainingReward, 500);
            await supabase.rpc("increment_user_points", {
              p_user_id: vote.user_id,
              p_amount: increment,
              p_type: "mining",
            });
            remainingReward -= 500;
          }

          // Award winner badge with streak info
          const sideName = winnerSide === "a" ? battle.side_a_name : battle.side_b_name;
          const streakText = currentStreak >= 3 ? ` 🔥 ${currentStreak}-Win Streak!` : "";
          await supabase.from("user_badges").insert({
            user_id: vote.user_id,
            badge_type: "winner",
            badge_name: `${sideName} Champion`,
            description: `Won ${Math.round(totalReward)} ARX-P in "${battle.title}" (${multiplier.toFixed(1)}x return)${streakText}`,
            battle_id: battle.id,
          });

          // Extended arena boost for 7 days post-win
          const boostExpiry = new Date();
          boostExpiry.setDate(boostExpiry.getDate() + 7);
          
          await supabase.from("arena_boosts").upsert({
            user_id: vote.user_id,
            battle_id: battle.id,
            boost_percentage: 25, // 25% boost for 7 more days after winning
            expires_at: boostExpiry.toISOString(),
          });
        }

        // Process losers - reset their streak, they only keep the instant mining boost (applied by trigger)
        // NO points returned - full risk, full reward system
        for (const vote of losingVotes) {
          // Reset win streak
          await supabase
            .from("arena_members")
            .update({ current_win_streak: 0 })
            .eq("user_id", vote.user_id);

          await supabase.from("arena_staking_rewards").insert({
            battle_id: battle.id,
            user_id: vote.user_id,
            original_stake: vote.power_spent,
            multiplier: 0,
            stake_return: 0,
            loser_pool_share: 0,
            total_reward: 0,
            is_winner: false,
          });

          // Record loss in arena_earnings (zero earnings)
          await supabase.from("arena_earnings").insert({
            battle_id: battle.id,
            user_id: vote.user_id,
            stake_amount: vote.power_spent,
            bonus_earned: 0,
            pool_share_earned: 0,
            streak_bonus: 0,
            total_earned: 0,
            is_winner: false,
          });

          // Award participation badge (losers still get a badge for participating)
          const sideName = winnerSide === "a" ? battle.side_b_name : battle.side_a_name;
          await supabase.from("user_badges").insert({
            user_id: vote.user_id,
            badge_type: "participant",
            badge_name: `${sideName} Warrior`,
            description: `Staked ${vote.power_spent} ARX-P on ${sideName} in "${battle.title}" (Mining boost active!)`,
            battle_id: battle.id,
          });
        }

        // Update battle with total rewards distributed including prize pool
        await supabase
          .from("arena_battles")
          .update({
            losing_pool_distributed: true,
            total_rewards_distributed: totalRewardsDistributed + prizePoolDistributed,
          })
          .eq("id", battle.id);

        // Award Arena Legend badge to top winner
        if (winningVotes.length > 0) {
          const topVoter = winningVotes.reduce((max, vote) =>
            vote.power_spent > max.power_spent ? vote : max
          );

          await supabase.from("user_badges").insert({
            user_id: topVoter.user_id,
            badge_type: "legend",
            badge_name: "Arena Legend",
            description: `Top stake in "${battle.title}"`,
            battle_id: battle.id,
          });
        }

        results.push({
          battle: battle.title,
          winner: winnerSide,
          multiplier: multiplier,
          winnersCount: winningVotes.length,
          losersCount: losingVotes.length,
          totalDistributed: totalRewardsDistributed,
          prizePoolDistributed: prizePoolDistributed,
        });
      }

      console.log(`Battle "${battle.title}" resolved. Winner: ${winnerSide || "Tie"}`);
    }

    return new Response(
      JSON.stringify({
        message: "Battle resolution complete",
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in resolve-arena-battle:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
