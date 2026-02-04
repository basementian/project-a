export interface UserProfile {
  id: string;
  phone?: string;
  phone_verified: boolean;
  display_name?: string;
  avatar_url?: string;
  average_rating: number;
  total_ratings: number;
  created_at: string;
}

export interface Rating {
  id: string;
  dip_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  created_at: string;
}
