export interface Business {
  id: number;
  category_id: number;
  name: string;
  description: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  website: string | null;
  phone: string;
  created_at: string;
  updated_at: string;
}
