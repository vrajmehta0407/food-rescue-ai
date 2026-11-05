export type UserRole = 'donor' | 'recipient' | 'volunteer' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization_id?: string | null;
  organization?: Organization | null;
  is_active: boolean;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
  address: string;
  latitude?: number;
  longitude?: number;
  service_radius_km?: number;
  capacity_value: number;
  capacity_unit: string;
  handling_capabilities?: Record<string, boolean>;
  contact_email?: string;
  contact_phone?: string;
}

export type ListingStatus = 
  | 'draft' 
  | 'available' 
  | 'reserved' 
  | 'pickup_scheduled' 
  | 'picked_up' 
  | 'delivered' 
  | 'completed' 
  | 'cancelled' 
  | 'expired';

export interface SurplusListing {
  id: string;
  donor_organization_id: string;
  title: string;
  food_category: string;
  description?: string;
  quantity_value: number;
  quantity_unit: string;
  prepared_at?: string;
  best_before_at?: string;
  pickup_deadline_at: string;
  storage_requirement: 'ambient' | 'refrigerated' | 'frozen' | 'hot_holding';
  allergens: string[];
  dietary_tags: string[];
  status: ListingStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  donor_organization?: Organization;
}

export interface ReasonCode {
  code: string;
  label: string;
}

export interface MatchRecommendation {
  id: string;
  listing_id: string;
  recipient_organization_id: string;
  recipient_organization_name: string;
  recipient_organization_address: string;
  eligibility_status: string;
  score: number;
  reason_codes: ReasonCode[];
  model_version: string;
  created_at: string;
}

export interface DonationMatch {
  id: string;
  listing_id: string;
  recipient_organization_id: string;
  recipient_organization_name?: string;
  donor_organization_name?: string;
  status: 'suggested' | 'accepted' | 'declined' | 'scheduled' | 'completed' | 'cancelled';
  accepted_at?: string;
  pickup_window_start?: string;
  pickup_window_end?: string;
  assigned_volunteer_id?: string;
  assigned_volunteer_name?: string;
  listing?: SurplusListing;
  created_at: string;
  updated_at: string;
}

export interface HandoffEvent {
  id: string;
  match_id: string;
  event_type: string;
  quantity_value?: number;
  quantity_unit?: string;
  occurred_at: string;
  notes?: string;
  actor_user_id?: string;
  actor_user_name?: string;
}

export interface ForecastPoint {
  date: string;
  day_name: string;
  predicted_quantity: number;
  lower_bound: number;
  upper_bound: number;
  confidence_level: number;
  factors: string[];
}

export interface ForecastResponse {
  organization_id: string;
  food_category: string;
  forecast_horizon_days: number;
  is_cold_start: boolean;
  cold_start_disclaimer?: string;
  baseline_model: string;
  candidate_model: string;
  model_version: string;
  historical_points_available: number;
  metrics_summary?: any;
  forecast: ForecastPoint[];
}

export interface ImpactMetrics {
  total_listings: number;
  active_listings: number;
  total_rescued_kg: number;
  total_meals_saved_estimate: number;
  co2e_avoided_kg_estimate: number;
  successful_rescue_rate_percent: number;
  average_match_time_minutes: number;
  expired_count: number;
  cancelled_count: number;
  completed_rescues_count: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  quantity_kg: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  rescued_kg: number;
  meals_estimate: number;
}

export interface AnalyticsSummary {
  metrics: ImpactMetrics;
  categories: CategoryBreakdown[];
  monthly_trends: MonthlyTrend[];
  methodology_notes: Record<string, string>;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  read_at?: string;
  created_at: string;
}

