export interface Message {
  id: string;
  conversationId: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  type?: "direct" | "group";
  conversationType?: "direct" | "group";
  messageType?: "text" | "image" | "file" | "audio" | "video" | "emoji";
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  metadata?: {
    mimeType?: string;
    fileSize?: number;
    fileId?: string;
    fileName?: string;
    [key: string]: any;
  };
  groupId?: string;
  isDeleted?: boolean;
  isEdited?: boolean;
  editedAt?: Date;
  senderId?: string;
}
