// Database types generated from Supabase schema
// These types match the database schema exactly

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      polls: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          expires_at: string | null;
          is_active: boolean;
          allow_multiple_votes: boolean;
          is_anonymous: boolean;
          qr_code_url: string | null;
          total_votes: number;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
          allow_multiple_votes?: boolean;
          is_anonymous?: boolean;
          qr_code_url?: string | null;
          total_votes?: number;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
          allow_multiple_votes?: boolean;
          is_anonymous?: boolean;
          qr_code_url?: string | null;
          total_votes?: number;
        };
      };
      poll_options: {
        Row: {
          id: string;
          poll_id: string;
          text: string;
          votes_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          text: string;
          votes_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          poll_id?: string;
          text?: string;
          votes_count?: number;
          created_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          poll_id: string;
          option_id: string;
          user_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          option_id: string;
          user_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          poll_id?: string;
          option_id?: string;
          user_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      poll_views: {
        Row: {
          id: string;
          poll_id: string;
          user_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          user_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          poll_id?: string;
          user_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          viewed_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_poll_results: {
        Args: {
          poll_uuid: string;
        };
        Returns: {
          option_id: string;
          option_text: string;
          votes_count: number;
          percentage: number;
        }[];
      };
      user_has_voted: {
        Args: {
          poll_uuid: string;
          user_uuid: string;
        };
        Returns: boolean;
      };
      get_user_votes: {
        Args: {
          poll_uuid: string;
          user_uuid: string;
        };
        Returns: {
          option_id: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Poll = Database['public']['Tables']['polls']['Row'];
export type PollOption = Database['public']['Tables']['poll_options']['Row'];
export type Vote = Database['public']['Tables']['votes']['Row'];
export type PollView = Database['public']['Tables']['poll_views']['Row'];

export type InsertProfile = Database['public']['Tables']['profiles']['Insert'];
export type InsertPoll = Database['public']['Tables']['polls']['Insert'];
export type InsertPollOption = Database['public']['Tables']['poll_options']['Insert'];
export type InsertVote = Database['public']['Tables']['votes']['Insert'];
export type InsertPollView = Database['public']['Tables']['poll_views']['Insert'];

export type UpdateProfile = Database['public']['Tables']['profiles']['Update'];
export type UpdatePoll = Database['public']['Tables']['polls']['Update'];
export type UpdatePollOption = Database['public']['Tables']['poll_options']['Update'];
export type UpdateVote = Database['public']['Tables']['votes']['Update'];
export type UpdatePollView = Database['public']['Tables']['poll_views']['Update'];

// Function return types
export type PollResults = Database['public']['Functions']['get_poll_results']['Returns'];
export type UserVotes = Database['public']['Functions']['get_user_votes']['Returns'];

// Extended types with relationships (for frontend use)
export interface PollWithOptions extends Poll {
  poll_options: PollOption[];
  profiles: Profile;
}

export interface PollWithResults extends Poll {
  poll_options: (PollOption & { percentage: number })[];
  profiles: Profile;
  user_votes?: string[]; // Option IDs the current user voted for
}

export interface VoteWithDetails extends Vote {
  poll_options: PollOption;
  polls: Poll;
}
