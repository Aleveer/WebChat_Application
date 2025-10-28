// Metadata types for flexible data storage
export type Metadata = Record<string, unknown>;
export type FileMetadata = Record<string, unknown>;
export type NotificationMetadata = Record<string, unknown>;
export type AnalyticsMetadata = Record<string, unknown>;

// Specific metadata structures
export interface FileMetadataStructure {
  width?: number;
  height?: number;
  duration?: number;
  tags?: string[];
  description?: string;
  custom_fields?: Record<string, unknown>;
}

export interface NotificationMetadataStructure {
  group_id?: string;
  message_preview?: string;
  sender_info?: Record<string, unknown>;
  action_url?: string;
  custom_data?: Record<string, unknown>;
}

export interface AnalyticsMetadataStructure {
  browser?: string;
  os?: string;
  device?: string;
  location?: string;
  event_source?: string;
  custom_properties?: Record<string, unknown>;
}
