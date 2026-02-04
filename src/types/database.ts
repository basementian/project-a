export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      dips: {
        Row: {
          id: string;
          type: 'seat' | 'desk' | 'queue' | 'charger' | 'other';
          location: unknown;
          available_until: string;
          price: number;
          access_method: 'code' | 'qr' | 'physical_handoff' | 'meet_confirm';
          rules: string | null;
          status: 'active' | 'claimed' | 'expired' | 'completed';
          owner_id: string;
          claimer_id: string | null;
          access_instructions: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          type: 'seat' | 'desk' | 'queue' | 'charger' | 'other';
          location: string;
          available_until: string;
          price: number;
          access_method: 'code' | 'qr' | 'physical_handoff' | 'meet_confirm';
          rules?: string | null;
          status?: 'active' | 'claimed' | 'expired' | 'completed';
          owner_id: string;
          claimer_id?: string | null;
          access_instructions?: string | null;
        };
        Update: {
          type?: 'seat' | 'desk' | 'queue' | 'charger' | 'other';
          location?: string;
          available_until?: string;
          price?: number;
          access_method?: 'code' | 'qr' | 'physical_handoff' | 'meet_confirm';
          rules?: string | null;
          status?: 'active' | 'claimed' | 'expired' | 'completed';
          owner_id?: string;
          claimer_id?: string | null;
          access_instructions?: string | null;
          completed_at?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          phone: string | null;
          phone_verified: boolean;
          display_name: string | null;
          avatar_url: string | null;
          average_rating: number;
          total_ratings: number;
          created_at: string;
        };
        Insert: {
          id: string;
          phone?: string | null;
          phone_verified?: boolean;
          display_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          phone?: string | null;
          phone_verified?: boolean;
          display_name?: string | null;
          avatar_url?: string | null;
          average_rating?: number;
          total_ratings?: number;
        };
      };
      ratings: {
        Row: {
          id: string;
          dip_id: string;
          rater_id: string;
          rated_id: string;
          score: number;
          created_at: string;
        };
        Insert: {
          dip_id: string;
          rater_id: string;
          rated_id: string;
          score: number;
        };
        Update: {
          score?: number;
        };
      };
      reports: {
        Row: {
          id: string;
          dip_id: string;
          reporter_id: string;
          reason: string;
          created_at: string;
        };
        Insert: {
          dip_id: string;
          reporter_id: string;
          reason: string;
        };
        Update: {
          reason?: string;
        };
      };
    };
    Functions: {
      nearby_dips: {
        Args: { user_lat: number; user_lng: number; radius_meters: number };
        Returns: {
          id: string;
          type: 'seat' | 'desk' | 'queue' | 'charger' | 'other';
          lat: number;
          lng: number;
          available_until: string;
          price: number;
          access_method: 'code' | 'qr' | 'physical_handoff' | 'meet_confirm';
          rules: string | null;
          status: 'active' | 'claimed' | 'expired' | 'completed';
          owner_id: string;
          claimer_id: string | null;
          access_instructions: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          distance: number;
        }[];
      };
      user_has_active_dip: {
        Args: { user_uuid: string };
        Returns: boolean;
      };
      update_user_rating: {
        Args: { target_user_id: string };
        Returns: undefined;
      };
      claim_dip: {
        Args: { p_dip_id: string; p_user_lat: number; p_user_lng: number };
        Returns: {
          id: string;
          type: 'seat' | 'desk' | 'queue' | 'charger' | 'other';
          lat: number;
          lng: number;
          available_until: string;
          price: number;
          access_method: 'code' | 'qr' | 'physical_handoff' | 'meet_confirm';
          rules: string | null;
          status: 'active' | 'claimed' | 'expired' | 'completed';
          owner_id: string;
          claimer_id: string | null;
          access_instructions: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        }[];
      };
    };
  };
}
