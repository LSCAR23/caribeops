export interface Business {
  id: number;
  category_id: number;
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
  created_at: string;
  updated_at: string;
}
