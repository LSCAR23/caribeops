import type { Review } from "@/types/review";

export interface Business {
  id: string;
  category_id: string;
  category_name: string | null;
  name: string;
  description: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  website: string | null;
  phone: string;
  average_rating: number | string | null;
  owner?: { name: string; email: string } | null;
  amenities?: string[];
  reviews?: Review[];
  created_at: string;
  updated_at: string;
}
