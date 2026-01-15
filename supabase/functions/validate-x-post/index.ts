import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// X Social Yapping feature has been DISABLED
// Users can still connect their X account for identity verification
// but no rewards are given for posting X URLs anymore

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Feature disabled - return immediately
  return new Response(
    JSON.stringify({ 
      qualified: false, 
      reason: 'X Social Yapping rewards have been disabled. Connect your X account on the X Profile page instead.',
      disabled: true
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
});
