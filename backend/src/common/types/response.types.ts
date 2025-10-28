// Response types for standardized API responses

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    phone_number: string;
    username?: string;
    email?: string;
  };
}

export interface UserResponse {
  id: string;
  phone_number: string;
  full_name: string;
  username?: string;
  email?: string;
  profile_photo?: string;
  created_at: Date;
  updated_at: Date;
}

export interface GroupResponse {
  id: string;
  name: string;
  description?: string;
  members: Array<{
    user_id: string;
    is_admin: boolean;
    joined_at: Date;
  }>;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface MessageResponse {
  id: string;
  sender_id: string;
  receiver_type: 'user' | 'group';
  receiver_id: string;
  text: string;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FileResponse {
  id: string;
  original_name: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  uploaded_by: string;
  created_at: Date;
}

export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  content: string;
  sender: string;
  recipient: string;
  is_read: boolean;
  created_at: Date;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: unknown;
  timestamp: string;
  path: string;
  method: string;
  requestId: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}
