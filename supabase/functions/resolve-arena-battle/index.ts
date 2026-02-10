import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Simplified Reward System:
 * - Total Pool = Prize Pool (admin set) + All Stakes (winners + losers)
 * - Winners share the ENTIRE pool proportionally with 200% bonus applied
 * - Losers get NOTHING (full risk, full reward)
 * - Rewards are CAPPED to total pool (no over-distribution)
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const manualWinner = body.winner_side; // 'a', 'b', or 'c'
    const battleId = body.battle_id;

    console.log("Starting battle resolution...", { manualWinner, battleId });

    let battlesToResolve;

    if (battleId && manualWinner) {
      // Manual resolution: allow resolving any active battle (not just ended ones)
      const { data, error } = await supabase
        .from("arena_battles")
        .select("*")
        .eq("id", battleId)
        .is("winner_side", null)
        .single();

      if (error || !data) {
        throw new Error(`Battle not found or already resolved: ${error?.message}`);
      }
      battlesToResolve = [{ ...data, verified_winner: manualWinner }];
    } else {
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

      const sideAPower = Number(battle.side_a_power) || 0;
      const sideBPower = Number(battle.side_b_power) || 0;
      const sideCPower = Number(battle.side_c_power) || 0;
      const hasSideC = !!battle.side_c_name;

      // Determine winner
      let winnerSide: string | null = null;
      if (battle.verified_winner) {
        winnerSide = battle.verified_winner;
      } else if (hasSideC) {
        if (sideAPower > sideBPower && sideAPower > sideCPower) {
          winnerSide = "a";
        } else if (sideBPower > sideAPower && sideBPower > sideCPower) {
          winnerSide = "b";
        } else if (sideCPower > sideAPower && sideCPower > sideBPower) {
          winnerSide = "c";
        } else if (sideAPower >= sideBPower && sideAPower >= sideCPower && sideAPower > 0) {
          winnerSide = "a";
        } else if (sideBPower > 0) {
          winnerSide = "b";
        } else if (sideCPower > 0) {
          winnerSide = "c";
        }
      } else {
        if (sideAPower > sideBPower) {
          winnerSide = "a";
        } else if (sideBPower > sideAPower) {
          winnerSide = "b";
        }
      }

      // Calculate pools
      let winningPool = 0;
      let losingPool = 0;

      if (winnerSide === "a") {
        winningPool = sideAPower;
        losingPool = sideBPower + sideCPower;
      } else if (winnerSide === "b") {
        winningPool = sideBPower;
        losingPool = sideAPower + sideCPower;
      } else if (winnerSide === "c") {
        winningPool = sideCPower;
        losingPool = sideAPower + sideBPower;
      }

      // Prize pool and bonus percentage from admin settings
      const prizePool = Number(battle.prize_pool) || 0;
      const bonusPercentage = Number(battle.bonus_percentage) || 200;

      // TOTAL POOL = Admin Prize Pool + All Stakes (winners + losers)
      const totalStakes = sideAPower + sideBPower + sideCPower;
      const TOTAL_POOL = prizePool + totalStakes;

      const winnerSideName = winnerSide === "a" ? battle.side_a_name : 
                             winnerSide === "c" ? (battle.side_c_name || "Draw") : 
                             battle.side_b_name;

      console.log(`Winner: ${winnerSide} (${winnerSideName})`);
      console.log(`Prize Pool: ${prizePool}, Total Stakes: ${totalStakes}, TOTAL POOL: ${TOTAL_POOL}`);
      console.log(`Winning Pool: ${winningPool}, Losing Pool: ${losingPool}, Bonus %: ${bonusPercentage}`);

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
        // Get all votes
        const { data: allVotes, error: votesError } = await supabase
          .from("arena_votes")
          .select("user_id, power_spent, side, early_stake_multiplier, created_at")
          .eq("battle_id", battle.id);

        if (votesError) {
          console.error(`Error fetching votes: ${votesError.message}`);
          continue;
        }

        const winningVotes = (allVotes || []).filter(v => v.side === winnerSide);
        const losingVotes = (allVotes || []).filter(v => v.side !== winnerSide);

        console.log(`Winners: ${winningVotes.length}, Losers: ${losingVotes.length}`);

        // First pass: Calculate each winner's weighted share
        // Weight = stake * early_multiplier * (1 + bonus%/100)
        let totalWeight = 0;
        const winnerWeights: { vote: typeof winningVotes[0]; weight: number; earlyMultiplier: number }[] = [];

        for (const vote of winningVotes) {
          const earlyMultiplier = Number(vote.early_stake_multiplier) || 1.0;
          // Weight includes early multiplier and bonus percentage
          const weight = vote.power_spent * earlyMultiplier * (1 + bonusPercentage / 100);
          winnerWeights.push({ vote, weight, earlyMultiplier });
          totalWeight += weight;
          console.log(`User ${vote.user_id}: Stake ${vote.power_spent}, Early ${earlyMultiplier.toFixed(2)}x, Weight ${weight.toFixed(0)}`);
        }

        let totalRewardsDistributed = 0;

        // Second pass: Distribute TOTAL_POOL proportionally by weight (capped to pool)
        for (const { vote, weight, earlyMultiplier } of winnerWeights) {
          // Get win streak
          const { data: memberData } = await supabase
            .from("arena_members")
            .select("current_win_streak, best_win_streak, total_wins")
            .eq("user_id", vote.user_id)
            .single();

          const currentStreak = (memberData?.current_win_streak || 0) + 1;
          const bestStreak = Math.max(currentStreak, memberData?.best_win_streak || 0);

          // Streak bonus: 3+ = 25%, 5+ = 50%, 10+ = 100%
          let streakBonusPercent = 0;
          if (currentStreak >= 10) streakBonusPercent = 100;
          else if (currentStreak >= 5) streakBonusPercent = 50;
          else if (currentStreak >= 3) streakBonusPercent = 25;

          // User's share of TOTAL POOL based on their weight
          const baseReward = totalWeight > 0 ? (weight / totalWeight) * TOTAL_POOL : 0;
          
          // Apply streak bonus
          const streakBonus = baseReward * (streakBonusPercent / 100);
          let totalReward = baseReward + streakBonus;

          // CRITICAL: Cap total distributed to TOTAL_POOL
          const remainingPool = TOTAL_POOL - totalRewardsDistributed;
          if (totalReward > remainingPool) {
            totalReward = remainingPool;
          }

          totalRewardsDistributed += totalReward;

          console.log(`User ${vote.user_id}: Base ${baseReward.toFixed(0)}, Streak ${streakBonusPercent}%, Total ${totalReward.toFixed(0)}`);

          // Update member stats
          await supabase
            .from("arena_members")
            .update({
              current_win_streak: currentStreak,
              best_win_streak: bestStreak,
              total_wins: (memberData?.total_wins || 0) + 1,
            })
            .eq("user_id", vote.user_id);

          // Record staking reward
          await supabase.from("arena_staking_rewards").insert({
            battle_id: battle.id,
            user_id: vote.user_id,
            original_stake: vote.power_spent,
            multiplier: totalReward / vote.power_spent,
            stake_return: 0, // No separate stake return - all included in total
            loser_pool_share: totalReward,
            total_reward: totalReward,
            is_winner: true,
          });

          // Record earnings
          await supabase.from("arena_earnings").insert({
            battle_id: battle.id,
            user_id: vote.user_id,
            stake_amount: vote.power_spent,
            bonus_earned: totalReward - vote.power_spent,
            pool_share_earned: totalReward,
            streak_bonus: streakBonus,
            total_earned: totalReward,
            is_winner: true,
          });

          // Credit points (500 cap per RPC call)
          let remainingReward = Math.ceil(totalReward);
          while (remainingReward > 0) {
            const increment = Math.min(remainingReward, 500);
            await supabase.rpc("increment_user_points", {
              p_user_id: vote.user_id,
              p_amount: increment,
              p_type: "mining",
            });
            remainingReward -= 500;
          }

          // Award winner badge
          const streakText = currentStreak >= 3 ? ` 🔥 ${currentStreak}-Win Streak!` : "";
          await supabase.from("user_badges").insert({
            user_id: vote.user_id,
            badge_type: "winner",
            badge_name: `${winnerSideName} Champion`,
            description: `Won ${Math.round(totalReward)} ARX-P in "${battle.title}"${streakText}`,
            battle_id: battle.id,
          });

          // Extended boost
          const boostExpiry = new Date();
          boostExpiry.setDate(boostExpiry.getDate() + 7);
          
          await supabase.from("arena_boosts").upsert({
            user_id: vote.user_id,
            battle_id: battle.id,
            boost_percentage: 25,
            expires_at: boostExpiry.toISOString(),
          });
        }

        // Process losers - reset streak, they get NOTHING
        for (const vote of losingVotes) {
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

          const loserSideName = vote.side === "a" ? battle.side_a_name : 
                                vote.side === "c" ? (battle.side_c_name || "Draw") : 
                                battle.side_b_name;
          await supabase.from("user_badges").insert({
            user_id: vote.user_id,
            badge_type: "participant",
            badge_name: `${loserSideName} Warrior`,
            description: `Staked ${vote.power_spent} ARX-P on ${loserSideName} in "${battle.title}"`,
            battle_id: battle.id,
          });
        }

        // Update battle with total distributed
        await supabase
          .from("arena_battles")
          .update({
            losing_pool_distributed: true,
            total_rewards_distributed: totalRewardsDistributed,
          })
          .eq("id", battle.id);

        // Award legend badge to top winner
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
          winnerName: winnerSideName,
          winnersCount: winningVotes.length,
          losersCount: losingVotes.length,
          totalPool: TOTAL_POOL,
          totalDistributed: totalRewardsDistributed,
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
