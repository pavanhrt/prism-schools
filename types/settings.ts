export interface SchoolSettings {
  id: 1;
  school_name: string;
  student_id_prefix: string;
  admission_prefix: string;
  staff_id_prefix: string;
  invoice_prefix: string;
  receipt_prefix: string;
  expense_prefix: string;
  short_name: string | null;
  tagline: string;
  description: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  hero_eyebrow: string;
  hero_tagline: string;
  hero_title: string;
  hero_description: string;
  hero_primary_cta_label: string;
  hero_primary_cta_url: string;
  hero_secondary_cta_label: string;
  hero_secondary_cta_url: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  website_url: string | null;
  address_line: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  google_maps_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface WebsiteProgram { id: string; title: string; slug: string; level: string | null; headline: string | null; short_description: string | null; description: string | null; icon: string | null; image_url: string | null; display_order: number; is_active: boolean; created_at: string; updated_at: string; }
export interface WebsiteService { id: string; title: string; slug: string; short_description: string | null; description: string | null; icon: string | null; visual_type: string | null; visual_asset_url: string | null; display_order: number; is_active: boolean; created_at: string; updated_at: string; }
export interface WebsiteFeature { id: string; title: string; description: string; icon: string | null; display_order: number; is_active: boolean; created_at: string; updated_at: string; }
export interface WebsiteAdminConfig { settings: SchoolSettings; programs: WebsiteProgram[]; services: WebsiteService[]; features: WebsiteFeature[]; }
