export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          message: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message?: string
          title?: string
        }
        Relationships: []
      }
      arena_battles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          id: string
          is_active: boolean
          side_a_color: string
          side_a_image: string | null
          side_a_name: string
          side_a_power: number
          side_b_color: string
          side_b_image: string | null
          side_b_name: string
          side_b_power: number
          starts_at: string
          title: string
          winner_boost_percentage: number
          winner_side: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          side_a_color?: string
          side_a_image?: string | null
          side_a_name: string
          side_a_power?: number
          side_b_color?: string
          side_b_image?: string | null
          side_b_name: string
          side_b_power?: number
          starts_at?: string
          title: string
          winner_boost_percentage?: number
          winner_side?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          side_a_color?: string
          side_a_image?: string | null
          side_a_name?: string
          side_a_power?: number
          side_b_color?: string
          side_b_image?: string | null
          side_b_name?: string
          side_b_power?: number
          starts_at?: string
          title?: string
          winner_boost_percentage?: number
          winner_side?: string | null
        }
        Relationships: []
      }
      arena_boosts: {
        Row: {
          battle_id: string
          boost_percentage: number
          created_at: string
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          battle_id: string
          boost_percentage: number
          created_at?: string
          expires_at: string
          id?: string
          user_id: string
        }
        Update: {
          battle_id?: string
          boost_percentage?: number
          created_at?: string
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_boosts_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "arena_battles"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_votes: {
        Row: {
          battle_id: string
          created_at: string
          id: string
          locked_until: string
          power_spent: number
          side: string
          user_id: string
        }
        Insert: {
          battle_id: string
          created_at?: string
          id?: string
          locked_until?: string
          power_spent: number
          side: string
          user_id: string
        }
        Update: {
          battle_id?: string
          created_at?: string
          id?: string
          locked_until?: string
          power_spent?: number
          side?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_votes_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "arena_battles"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          claimed_amount: number
          created_at: string
          eligible_amount: number
          id: string
          last_active: string
          proof_status: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          claimed_amount?: number
          created_at?: string
          eligible_amount?: number
          id?: string
          last_active?: string
          proof_status?: string
          user_id: string
          wallet_address: string
        }
        Update: {
          claimed_amount?: number
          created_at?: string
          eligible_amount?: number
          id?: string
          last_active?: string
          proof_status?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          id: string
          points_awarded: number
          streak_day: number
          user_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string
          id?: string
          points_awarded?: number
          streak_day?: number
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          id?: string
          points_awarded?: number
          streak_day?: number
          user_id?: string
        }
        Relationships: []
      }
      founder_allocations: {
        Row: {
          allocation_percentage: number
          claimed_amount: number
          created_at: string
          id: string
          name: string
          next_unlock_date: string | null
          notes: string | null
          total_allocation: number
          vesting_type: string
          wallet_address: string
        }
        Insert: {
          allocation_percentage: number
          claimed_amount?: number
          created_at?: string
          id?: string
          name: string
          next_unlock_date?: string | null
          notes?: string | null
          total_allocation: number
          vesting_type?: string
          wallet_address: string
        }
        Update: {
          allocation_percentage?: number
          claimed_amount?: number
          created_at?: string
          id?: string
          name?: string
          next_unlock_date?: string | null
          notes?: string | null
          total_allocation?: number
          vesting_type?: string
          wallet_address?: string
        }
        Relationships: []
      }
      mining_sessions: {
        Row: {
          arx_mined: number
          ended_at: string | null
          id: string
          is_active: boolean
          started_at: string
          user_id: string
        }
        Insert: {
          arx_mined?: number
          ended_at?: string | null
          id?: string
          is_active?: boolean
          started_at?: string
          user_id: string
        }
        Update: {
          arx_mined?: number
          ended_at?: string | null
          id?: string
          is_active?: boolean
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mining_settings: {
        Row: {
          arena_public_access: boolean
          block_reward: number
          claiming_enabled: boolean
          consensus_mode: string
          id: string
          public_mining_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          arena_public_access?: boolean
          block_reward?: number
          claiming_enabled?: boolean
          consensus_mode?: string
          id?: string
          public_mining_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          arena_public_access?: boolean
          block_reward?: number
          claiming_enabled?: boolean
          consensus_mode?: string
          id?: string
          public_mining_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          referral_code: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          referral_code?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          referral_code?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          points_awarded: number
          referral_code_used: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_awarded?: number
          referral_code_used: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_awarded?: number
          referral_code_used?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      social_submissions: {
        Row: {
          created_at: string
          id: string
          platform: string
          points_awarded: number
          post_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          points_awarded?: number
          post_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          points_awarded?: number
          post_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          external_url: string | null
          id: string
          is_active: boolean
          max_completions: number | null
          points_reward: number
          task_type: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          is_active?: boolean
          max_completions?: number | null
          points_reward?: number
          task_type?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          is_active?: boolean
          max_completions?: number | null
          points_reward?: number
          task_type?: string
          title?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_name: string
          badge_type: string
          battle_id: string | null
          description: string | null
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_name: string
          badge_type: string
          battle_id?: string | null
          description?: string | null
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_name?: string
          badge_type?: string
          battle_id?: string | null
          description?: string | null
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "arena_battles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          created_at: string
          daily_streak: number
          id: string
          last_checkin_date: string | null
          mining_points: number
          referral_bonus_percentage: number
          referral_points: number
          social_points: number
          task_points: number
          total_points: number
          updated_at: string
          user_id: string
          x_post_boost_percentage: number
        }
        Insert: {
          created_at?: string
          daily_streak?: number
          id?: string
          last_checkin_date?: string | null
          mining_points?: number
          referral_bonus_percentage?: number
          referral_points?: number
          social_points?: number
          task_points?: number
          total_points?: number
          updated_at?: string
          user_id: string
          x_post_boost_percentage?: number
        }
        Update: {
          created_at?: string
          daily_streak?: number
          id?: string
          last_checkin_date?: string | null
          mining_points?: number
          referral_bonus_percentage?: number
          referral_points?: number
          social_points?: number
          task_points?: number
          total_points?: number
          updated_at?: string
          user_id?: string
          x_post_boost_percentage?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          points_awarded: number
          proof_url: string | null
          status: string
          task_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          points_awarded?: number
          proof_url?: string | null
          status?: string
          task_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          points_awarded?: number
          proof_url?: string | null
          status?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallets: {
        Row: {
          connected_at: string
          id: string
          is_primary: boolean
          user_id: string
          wallet_address: string
          wallet_type: string
        }
        Insert: {
          connected_at?: string
          id?: string
          is_primary?: boolean
          user_id: string
          wallet_address: string
          wallet_type?: string
        }
        Update: {
          connected_at?: string
          id?: string
          is_primary?: boolean
          user_id?: string
          wallet_address?: string
          wallet_type?: string
        }
        Relationships: []
      }
      whitelist: {
        Row: {
          added_at: string
          eligible: boolean
          id: string
          merkle_proof: string | null
          wallet_address: string
        }
        Insert: {
          added_at?: string
          eligible?: boolean
          id?: string
          merkle_proof?: string | null
          wallet_address: string
        }
        Update: {
          added_at?: string
          eligible?: boolean
          id?: string
          merkle_proof?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      x_post_rewards: {
        Row: {
          arx_p_reward: number
          boost_reward: number
          created_at: string
          id: string
          like_count: number
          quote_count: number
          reply_count: number
          retweet_count: number
          total_engagement: number
          tweet_created_at: string | null
          tweet_id: string
          tweet_text: string
          user_id: string
          x_profile_id: string
        }
        Insert: {
          arx_p_reward?: number
          boost_reward?: number
          created_at?: string
          id?: string
          like_count?: number
          quote_count?: number
          reply_count?: number
          retweet_count?: number
          total_engagement?: number
          tweet_created_at?: string | null
          tweet_id: string
          tweet_text: string
          user_id: string
          x_profile_id: string
        }
        Update: {
          arx_p_reward?: number
          boost_reward?: number
          created_at?: string
          id?: string
          like_count?: number
          quote_count?: number
          reply_count?: number
          retweet_count?: number
          total_engagement?: number
          tweet_created_at?: string | null
          tweet_id?: string
          tweet_text?: string
          user_id?: string
          x_profile_id?: string
        }
        Relationships: []
      }
      x_profiles: {
        Row: {
          average_engagement: number
          boost_percentage: number
          created_at: string
          historical_arx_p_total: number
          historical_boost_total: number
          historical_posts_count: number
          historical_scanned: boolean
          id: string
          last_scanned_at: string | null
          profile_url: string
          qualified_posts_today: number
          updated_at: string
          user_id: string
          username: string
          viral_bonus: boolean
        }
        Insert: {
          average_engagement?: number
          boost_percentage?: number
          created_at?: string
          historical_arx_p_total?: number
          historical_boost_total?: number
          historical_posts_count?: number
          historical_scanned?: boolean
          id?: string
          last_scanned_at?: string | null
          profile_url: string
          qualified_posts_today?: number
          updated_at?: string
          user_id: string
          username: string
          viral_bonus?: boolean
        }
        Update: {
          average_engagement?: number
          boost_percentage?: number
          created_at?: string
          historical_arx_p_total?: number
          historical_boost_total?: number
          historical_posts_count?: number
          historical_scanned?: boolean
          id?: string
          last_scanned_at?: string | null
          profile_url?: string
          qualified_posts_today?: number
          updated_at?: string
          user_id?: string
          username?: string
          viral_bonus?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_code: { Args: never; Returns: string }
      get_arena_participation: {
        Args: { p_battle_id: string }
        Returns: {
          avatar_url: string
          battle_id: string
          created_at: string
          power_spent: number
          user_id: string
          username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
