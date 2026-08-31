// Enums
export enum ContentType {
  FEED = 'feed',
  REEL = 'reel',
  STORY = 'story',
  CAROUSEL = 'carousel',
}

export enum ContentStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed',
}

export enum InteractionStatus {
  NEW = 'new',
  AUTO_RESPONDED = 'auto_responded',
  PENDING_HUMAN = 'pending_human',
  RESOLVED = 'resolved',
}

export enum AutomationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAUSED = 'paused',
}

// Models
export interface InstagramAccount {
  id: string;
  organization_id: string;
  instagram_username: string;
  publora_channel_id?: string;
  zernio_profile_id?: string;
  meta_access_token_encrypted?: string;
  status: 'connected' | 'disconnected' | 'error';
  last_sync_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ContentBrief {
  id: string;
  account_id: string;
  type: ContentType;
  theme: string;
  caption: string;
  hashtags: string[];
  scheduled_at: Date;
  status: ContentStatus;
  created_by: string;
  approved_by?: string;
  approved_at?: Date;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ContentAsset {
  id: string;
  brief_id: string;
  account_id: string;
  publora_post_id?: string;
  publora_status?: string;
  published_url?: string;
  media_urls: string[];
  status: ContentStatus;
  error_message?: string;
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface BaseConhecimento {
  id: string;
  account_id: string;
  category: string;
  question: string;
  answer: string;
  confidence_threshold: number; // 0-1, e.g., 0.8
  active: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface InstagramInteraction {
  id: string;
  account_id: string;
  external_event_id: string; // unique por conta, evita duplicação
  sender_username: string;
  sender_name?: string;
  interaction_type: 'dm' | 'comment';
  content: string;
  status: InteractionStatus;
  auto_response?: string;
  base_conhecimento_id?: string;
  confidence_score?: number;
  assigned_to?: string; // Roberta ou outro
  chimagi_lead_id?: string; // Lead criado no CRM
  zernio_message_id?: string;
  meta_event_id?: string;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Automation {
  id: string;
  account_id: string;
  name: string;
  description?: string;
  trigger_type: 'keyword' | 'question' | 'comment_mention' | 'new_follower';
  trigger_pattern: string;
  action_type: 'respond_auto' | 'forward_to_human' | 'create_lead';
  response_template?: string;
  status: AutomationStatus;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface AutomationRun {
  id: string;
  automation_id: string;
  interaction_id: string;
  triggered_at: Date;
  action_executed: string;
  result: 'success' | 'failed' | 'manual_override';
  error?: string;
}

export interface ContentCampaign {
  id: string;
  account_id: string;
  name: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  theme: string;
  target_audience?: string;
  kpis?: Record<string, number>;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ContentCalendarItem {
  id: string;
  brief_id: string;
  campaign_id?: string;
  account_id: string;
  scheduled_at: Date;
  status: ContentStatus;
  order_index: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
