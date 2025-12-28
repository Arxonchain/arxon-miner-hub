import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting battle resolution check...");

    // Find ended battles that haven't been resolved
    const { data: endedBattles, error: battlesError } = await supabase
      .from("arena_battles")
      .select("*")
      .eq("is_active", true)
      .lt("ends_at", new Date().toISOString());

    if (battlesError) {
      throw new Error(`Error fetching battles: ${battlesError.message}`);
    }

    if (!endedBattles || endedBattles.length === 0) {
      console.log("No battles to resolve");
      return new Response(JSON.stringify({ message: "No battles to resolve" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${endedBattles.length} battles to resolve`);

    for (const battle of endedBattles) {
      console.log(`Resolving battle: ${battle.title}`);

      // Determine winner
      const winnerSide = battle.side_a_power > battle.side_b_power ? "a" : 
                         battle.side_b_power > battle.side_a_power ? "b" : null;

      // Update battle as resolved
      await supabase
        .from("arena_battles")
        .update({
          is_active: false,
          winner_side: winnerSide,
        })
        .eq("id", battle.id);

      if (winnerSide) {
        // Get all winning votes
        const { data: winningVotes, error: votesError } = await supabase
          .from("arena_votes")
          .select("user_id, power_spent")
          .eq("battle_id", battle.id)
          .eq("side", winnerSide);

        if (votesError) {
          console.error(`Error fetching votes: ${votesError.message}`);
          continue;
        }

        console.log(`Found ${winningVotes?.length || 0} winning votes`);

        // Award boosts to winners
        const boostExpiry = new Date();
        boostExpiry.setDate(boostExpiry.getDate() + 7);

        for (const vote of winningVotes || []) {
          // Insert arena boost
          await supabase
            .from("arena_boosts")
            .upsert({
              user_id: vote.user_id,
              battle_id: battle.id,
              boost_percentage: battle.winner_boost_percentage,
              expires_at: boostExpiry.toISOString(),
            });

          // Award badge
          const sideName = winnerSide === "a" ? battle.side_a_name : battle.side_b_name;
          await supabase.from("user_badges").insert({
            user_id: vote.user_id,
            badge_type: "winner",
            badge_name: `${sideName} Champion`,
            description: `Voted for the winning side in "${battle.title}"`,
            battle_id: battle.id,
          });
        }

        // Award top voter badge
        if (winningVotes && winningVotes.length > 0) {
          const topVoter = winningVotes.reduce((max, vote) => 
            vote.power_spent > max.power_spent ? vote : max
          );

          await supabase.from("user_badges").insert({
            user_id: topVoter.user_id,
            badge_type: "legend",
            badge_name: "Arena Legend",
            description: `Top voter in "${battle.title}"`,
            battle_id: battle.id,
          });
        }
      }

      console.log(`Battle "${battle.title}" resolved. Winner: ${winnerSide || "Tie"}`);
    }

    return new Response(
      JSON.stringify({ 
        message: "Battle resolution complete", 
        resolved: endedBattles.length 
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
