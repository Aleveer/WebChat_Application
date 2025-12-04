<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import 'emoji-picker-element';
import { useRouter } from 'vue-router';
import { useSocket } from '../composables/useSocket';
import ChatSidebar from '../components/ChatSidebar.vue';
import ProfileSettings from '../components/ProfileSettings.vue';
import GroupMembersPanel from '../components/GroupMembersPanel.vue';
import CreateGroupModal from '../components/CreateGroupModal.vue';
import type { Message } from '../types/message';

interface ApiConversation {
  conversationId: string;
  type: 'direct' | 'group';
  chatInfo: {
    userId?: string;
    username?: string;
    groupId?: string;
    name?: string;
    avatar?: string;
    status?: string;
    lastSeen?: string;
  };
  lastMessage?: {
    content?: string;
    senderId?: string;
    senderName?: string;
    createdAt?: string;
    type?: string;
    attachmentUrl?: string | null;
    attachmentType?: string | null;
    metadata?: Record<string, any> | null;
    isDeleted?: boolean;
    isEdited?: boolean;
  };
  unreadCount?: Record<string, number> | number;
  lastMessageAt?: string;
}

interface SelectedConversation {
  id?: string;
  type: 'direct' | 'group';
  name: string;
  chatInfo: ApiConversation['chatInfo'];
  groupId?: string;
  userId?: string;
  isNew?: boolean;
}

interface PopulatedUser {
  _id: string;
  username?: string;
  full_name?: string;
  email?: string;
  photo?: string;
}

interface GroupMember {
  user_id: PopulatedUser | string;
  is_admin: boolean;
  removed_at?: string | null;
  joined_at?: string;
}

interface GroupDetails {
  _id: string;
  name: string;
  members: GroupMember[];
  conversation_id?: string | { _id: string };
}

// Đồng bộ với logic trong `useSocket.ts` để URL file/ảnh luôn trỏ đúng API backend
const API_BASE_URL =
  'https://ds7bs8n0h6.execute-api.ap-southeast-2.amazonaws.com/api/v1';

const resolveFileUrl = (url?: string | null) => {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  return `${API_BASE_URL}${
    trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  }`.replace(/([^:]\/)\/+/g, '$1');
};

const getAttachmentFileName = (msg: Message) => {
  const fallbackFromUrl = msg.attachmentUrl
    ? decodeURIComponent(msg.attachmentUrl.split('/').pop() || '')
    : '';
  return (
    msg.metadata?.fileName ||
    (msg.metadata as any)?.file_name ||
    (msg.metadata as any)?.original_name ||
    (msg.metadata as any)?.name ||
    (msg.metadata as any)?.filename ||
    fallbackFromUrl
  );
};

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(
    sizes.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const router = useRouter();
const {
  messages,
  isConnected,
  socket,
  joinConversation,
  leaveConversation,
  setOnMessageCallback,
} = useSocket();

const currentUser = ref('');
const currentUserId = ref('');
const selectedConversation = ref<SelectedConversation | null>(null);
const activeConversationRaw = ref<ApiConversation | null>(null);
const activeConversationId = ref('');
const newMessage = ref('');
const showProfileDropdown = ref(false);
const showProfileSettings = ref(false);
const conversations = ref<ApiConversation[]>([]);
const hiddenConversations = ref<Set<string>>(new Set());
const isLoadingConversations = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const activeGroup = ref<GroupDetails | null>(null);
const isLoadingGroup = ref(false);
const showCreateGroupModal = ref(false);
const groupActionLoading = ref(false);
const editingMessageId = ref<string | null>(null);
const editMessageContent = ref('');
const hoveredMessageId = ref<string | null>(null);
const openMessageMenuId = ref<string | null>(null);
const emojiPickerVisible = ref(false);
const emojiPickerRef = ref<HTMLElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isUploadingAttachment = ref(false);
const pendingFileAttachments = ref<
  {
    id: string;
    file: File;
    url: string | null;
    type: 'image' | 'file';
    size: number;
    name: string;
  }[]
>([]);
const attachmentError = ref('');
const isRecording = ref(false);
const isPaused = ref(false);
const recordingDuration = ref(0);
const recordingError = ref('');
const pendingRecording = ref<{ blob: Blob; url: string; fileName: string } | null>(null);
const imagePreview = ref<{
  visible: boolean;
  url: string;
  fileName?: string;
  description?: string;
}>({ visible: false, url: '' });
let mediaRecorder: MediaRecorder | null = null;
let recordingTimer: number | null = null;
let recordedChunks: Blob[] = [];

const userInitials = computed(() =>
  currentUser.value ? currentUser.value.charAt(0).toUpperCase() : '?',
);

const conversationMessages = computed(() => {
  if (!activeConversationId.value) return [];
  return messages.value.filter(
    (msg) => msg.conversationId === activeConversationId.value,
  );
});

const hasConversations = computed(
  () => conversations.value.length > 0 || conversationMessages.value.length > 0,
);

const conversationTitle = computed(
  () => selectedConversation.value?.name ?? '',
);

const isGroupConversation = computed(
  () => selectedConversation.value?.type === 'group',
);

const isCurrentUserGroupAdmin = computed(() => {
  if (!activeGroup.value || !currentUserId.value) return false;
  return activeGroup.value.members.some((member) => {
    const memberId =
      typeof member.user_id === 'string'
        ? member.user_id
        : member.user_id?._id;
    return (
      memberId === currentUserId.value &&
      member.is_admin &&
      (member.removed_at === null || member.removed_at === undefined)
    );
  });
});

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop =
        messagesContainer.value.scrollHeight;
    }
  });
};

const formatTime = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

watch(
  () => messages.value.length,
  () => {
    scrollToBottom();
  },
);

const authorizedFetch = async (
  input: RequestInfo,
  init: RequestInit = {},
) => {
  const token = localStorage.getItem('access_token');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(input, {
    ...init,
    headers,
  });
};

const fetchConversations = async () => {
  if (!currentUserId.value) return;

  isLoadingConversations.value = true;
  try {
    const response = await authorizedFetch(
      `/api/chat/conversations?userId=${currentUserId.value}&limit=50`,
    );
    if (response.ok) {
      const payload = await response.json();
      const list = Array.isArray(payload) ? payload : payload?.data ?? [];
      conversations.value = list.filter(
        (conv) => !hiddenConversations.value.has(conv.conversationId),
      );
    }
  } catch (error) {
    console.error('Error fetching conversations:', error);
  } finally {
    isLoadingConversations.value = false;
  }
};

const fetchGroupDetails = async (groupId?: string) => {
  if (!groupId) {
    activeGroup.value = null;
    return;
  }
  isLoadingGroup.value = true;
  try {
    const response = await authorizedFetch(
      `/api/groups/${groupId}`,
    );
    if (response.ok) {
      const payload = await response.json();
      activeGroup.value = payload?.data ?? payload;
    }
  } catch (error) {
    console.error('Error fetching group details:', error);
    activeGroup.value = null;
  } finally {
    isLoadingGroup.value = false;
  }
};

const loadMessagesFromAPI = async (
  conversationId: string,
  conversationType: 'direct' | 'group',
) => {
  try {
    const response = await authorizedFetch(
      `/api/chat/messages/${conversationId}?limit=100`,
    );
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    const payload = await response.json();
    const result = payload?.data ?? payload;
    const targetName = selectedConversation.value?.name ?? '';

    const mappedMessages: Message[] = (result?.messages || []).map(
      (msg: any) => {
        const sender = msg.senderId;
        const senderId =
          typeof sender === 'object' && sender
            ? (sender._id?.toString() || sender.toString())
            : sender?.toString?.() || '';
        const senderName =
          (typeof sender === 'object' && sender?.username) ||
          (senderId === currentUserId.value ? currentUser.value : targetName) ||
          senderId;
        const attachmentUrl = resolveFileUrl(
          msg.attachmentUrl || msg.attachment_url || null,
        );
        const attachmentType =
          msg.attachmentType || msg.attachment_type || undefined;
        const messageType = msg.messageType || msg.type || 'text';
        const metadata =
          msg.metadata && typeof msg.metadata === 'object'
            ? {
                ...msg.metadata,
                fileName:
                  msg.metadata.fileName ||
                  msg.metadata.original_name ||
                  msg.metadata.file_name ||
                  msg.metadata.name ||
                  msg.metadata.filename ||
                  undefined,
              }
            : undefined;

        return {
          id: msg._id || msg.id,
          conversationId,
          type: conversationType,
          conversationType,
          from: senderName,
          to: conversationType === 'group' ? targetName : targetName,
          content: msg.isDeleted ? '' : (msg.text || msg.content || ''),
          timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          groupId:
            conversationType === 'group'
              ? selectedConversation.value?.groupId
              : undefined,
          messageType,
          attachmentUrl,
          attachmentType,
          metadata,
          isDeleted: msg.isDeleted || false,
          isEdited: msg.isEdited || false,
          editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined,
          senderId: senderId,
        };
      },
    );

    const remaining = messages.value.filter(
      (message) => message.conversationId !== conversationId,
    );
    messages.value = [...remaining, ...mappedMessages];
    scrollToBottom();
  } catch (error) {
    console.error('Error loading messages:', error);
  }
};

const handleSelectConversation = async (conversation: ApiConversation) => {
  if (hiddenConversations.value.has(conversation.conversationId)) {
    const updatedHidden = new Set(hiddenConversations.value);
    updatedHidden.delete(conversation.conversationId);
    hiddenConversations.value = updatedHidden;
  }
  activeConversationRaw.value = conversation;
  selectedConversation.value = {
    id: conversation.conversationId,
    type: conversation.type,
    name:
      conversation.type === 'group'
        ? conversation.chatInfo.name || 'Nhóm chưa đặt tên'
        : conversation.chatInfo.username || 'Người dùng',
    chatInfo: conversation.chatInfo,
    groupId: conversation.chatInfo.groupId,
    userId: conversation.chatInfo.userId,
    isNew: false,
  };

  if (activeConversationId.value) {
    leaveConversation(activeConversationId.value);
  }

  activeConversationId.value = conversation.conversationId;
  joinConversation(conversation.conversationId);
  await loadMessagesFromAPI(
    conversation.conversationId,
    conversation.type,
  );

  if (conversation.type === 'group') {
    await fetchGroupDetails(conversation.chatInfo.groupId);
  } else {
    activeGroup.value = null;
  }
};

const startNewChat = (user: {
  _id: string;
  username: string;
  phone?: string;
  photo?: string;
}) => {
  if (activeConversationId.value) {
    leaveConversation(activeConversationId.value);
  }
  activeConversationId.value = '';
  activeConversationRaw.value = null;
  activeGroup.value = null;
  selectedConversation.value = {
    type: 'direct',
    name: user.username,
    chatInfo: { username: user.username, userId: user._id },
    userId: user._id,
    isNew: true,
  };
  newMessage.value = '';
};

type MessageSendPayload = {
  content: string;
  type?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  metadata?: Record<string, any>;
};

const sendMessagePayload = async ({
  content,
  type = 'text',
  attachmentUrl,
  attachmentType,
  metadata,
}: MessageSendPayload) => {
  if (!selectedConversation.value) {
    throw new Error('Chưa chọn cuộc trò chuyện');
  }

  const fallbackFileName =
    metadata?.fileName ||
    (metadata as any)?.original_name ||
    (metadata as any)?.file_name ||
    (metadata as any)?.name ||
    (metadata as any)?.filename ||
    (attachmentUrl ? decodeURIComponent(attachmentUrl.split('/').pop() || '') : '');

  let sanitizedContent =
    typeof content === 'string' ? content.trim() : '';

  if (!sanitizedContent) {
    if (attachmentType === 'audio') {
      sanitizedContent = 'Voice message';
    } else if (attachmentType) {
      sanitizedContent = fallbackFileName || 'Attachment';
    }
  }

  const baseBody: Record<string, any> = {
    senderId: currentUserId.value,
    content: sanitizedContent,
    type,
  };

  if (attachmentUrl) baseBody.attachmentUrl = attachmentUrl;
  if (attachmentType) baseBody.attachmentType = attachmentType;
  if (metadata) baseBody.metadata = metadata;

  let response: Response;
  if (selectedConversation.value.id) {
    response = await authorizedFetch(
      '/api/chat/message',
      {
        method: 'POST',
        body: JSON.stringify({
          ...baseBody,
          conversationId: selectedConversation.value.id,
        }),
      },
    );
  } else if (
    selectedConversation.value.type === 'direct' &&
    selectedConversation.value.userId
  ) {
    response = await authorizedFetch(
      '/api/chat/message-new',
      {
        method: 'POST',
        body: JSON.stringify({
          ...baseBody,
          receiverId: selectedConversation.value.userId,
        }),
      },
    );
  } else {
    throw new Error('Conversation is missing identifier');
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to send message');
  }

  const payload = await response.json();
  const result = payload?.data ?? payload;
  const responseMessage = result.message ?? result;
  const conversationId =
    responseMessage.conversationId ||
    selectedConversation.value.id ||
    result.conversationId;

  if (!selectedConversation.value.id && conversationId) {
    selectedConversation.value.id = conversationId;
    activeConversationId.value = conversationId;
    joinConversation(conversationId);
  }

  const normalizedMetadata =
    (responseMessage?.metadata && typeof responseMessage.metadata === 'object'
      ? { ...responseMessage.metadata }
      : metadata
        ? { ...metadata }
        : undefined) || undefined;

  if (normalizedMetadata && !normalizedMetadata.fileName) {
    normalizedMetadata.fileName =
      normalizedMetadata.fileName ||
      normalizedMetadata.original_name ||
      normalizedMetadata.file_name ||
      normalizedMetadata.name ||
      normalizedMetadata.filename;
  }

  const normalizedMessage: Message = {
    id:
      (responseMessage && (responseMessage._id || responseMessage.id)) ||
      Date.now().toString(),
    conversationId: conversationId,
    type: selectedConversation.value?.type || 'direct',
    conversationType: selectedConversation.value?.type || 'direct',
    from: currentUser.value,
    to: selectedConversation.value?.name || '',
    content:
      responseMessage?.isDeleted && !attachmentUrl
        ? ''
        : responseMessage?.content || content,
    timestamp: new Date(
      responseMessage?.createdAt ||
        responseMessage?.timestamp ||
        Date.now(),
    ),
    groupId: selectedConversation.value?.groupId,
    senderId: currentUserId.value,
    messageType:
      responseMessage?.messageType ||
      responseMessage?.type ||
      type ||
      'text',
    attachmentUrl: resolveFileUrl(
      responseMessage?.attachmentUrl || attachmentUrl || null,
    ),
    attachmentType:
      responseMessage?.attachmentType || attachmentType || undefined,
    metadata: normalizedMetadata,
    isDeleted: responseMessage?.isDeleted || false,
    isEdited: responseMessage?.isEdited || false,
    editedAt: responseMessage?.editedAt
      ? new Date(responseMessage.editedAt)
      : undefined,
  };

  if (!messages.value.some((msg) => msg.id === normalizedMessage.id)) {
    messages.value.push(normalizedMessage);
  }
  scrollToBottom();
  await fetchConversations();
};

const send = async () => {
  const hasAttachments = pendingFileAttachments.value.length > 0;
  const content = newMessage.value.trim();

  if (!selectedConversation.value) return;
  if (!content && !hasAttachments) return;

  try {
    if (hasAttachments && content) {
      await sendMessagePayload({ content, type: 'text' });
    }

    if (hasAttachments) {
      for (const attachment of pendingFileAttachments.value) {
        await processAttachment(attachment.file, attachment.type, '');
        if (attachment.url) {
          URL.revokeObjectURL(attachment.url);
        }
      }
      pendingFileAttachments.value = [];
      attachmentError.value = '';
    } else if (content) {
      await sendMessagePayload({ content, type: 'text' });
    }

    newMessage.value = '';
  } catch (error) {
    console.error('Error sending message:', error);
    if (!hasAttachments) {
      newMessage.value = content;
    }
  }
};

const toggleEmojiPicker = () => {
  emojiPickerVisible.value = !emojiPickerVisible.value;
};

const handleEmojiSelect = (event: CustomEvent) => {
  const emoji =
    (event.detail && (event.detail.unicode || event.detail.emoji)) || '';
  if (!emoji) return;
  newMessage.value += emoji;
};

const triggerFileSelect = () => {
  fileInputRef.value?.click();
};

const ATTACHMENT_SIZE_LIMIT = 50 * 1024 * 1024;

const totalAttachmentSize = computed(() =>
  pendingFileAttachments.value.reduce((sum, item) => sum + item.size, 0),
);

const canAddAttachment = (fileSize: number) => {
  return totalAttachmentSize.value + fileSize <= ATTACHMENT_SIZE_LIMIT;
};

const removeAttachment = (id: string) => {
  const index = pendingFileAttachments.value.findIndex((item) => item.id === id);
  if (index !== -1) {
    const [removed] = pendingFileAttachments.value.splice(index, 1);
    if (removed.url) {
      URL.revokeObjectURL(removed.url);
    }
  }
  if (totalAttachmentSize.value <= ATTACHMENT_SIZE_LIMIT) {
    attachmentError.value = '';
  }
};

const downloadAttachment = (msg: Message) => {
  if (!msg.attachmentUrl) return;
  const filename = getAttachmentFileName(msg) || 'attachment';
  const link = document.createElement('a');
  link.href = msg.attachmentUrl;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const openImagePreview = (msg: Message) => {
  if (!msg.attachmentUrl) return;
  imagePreview.value = {
    visible: true,
    url: msg.attachmentUrl,
    fileName: getAttachmentFileName(msg),
    description: msg.content,
  };
};

const closeImagePreview = () => {
  imagePreview.value = { visible: false, url: '' };
};

const uploadAttachment = async (file: File) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Thiếu token xác thực');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Upload failed');
  }

  const payload = await response.json();
  return payload?.data ?? payload;
};

const processAttachment = async (
  file: File,
  forcedType?: 'audio' | 'image' | 'file',
  providedDescription?: string,
) => {
  if (!selectedConversation.value) return;

  try {
    isUploadingAttachment.value = true;
    const uploaded = await uploadAttachment(file);
    const normalizedAttachmentType =
      forcedType ||
      (uploaded?.file_type === 'image'
        ? 'image'
        : uploaded?.file_type === 'audio'
          ? 'audio'
          : 'file');
    let description = '';

    if (providedDescription !== undefined) {
      description = providedDescription;
    } else if (normalizedAttachmentType !== 'audio') {
      const userDescription = window.prompt(
        'Nhập mô tả cho tệp của bạn (có thể bỏ trống):',
        '',
      );
      description = userDescription?.trim() ?? '';
    }

    const fileName = uploaded?.original_name || file.name;

    await sendMessagePayload({
      content:
        normalizedAttachmentType === 'audio' ? '' : description,
      type:
        normalizedAttachmentType === 'audio'
          ? 'audio'
          : normalizedAttachmentType === 'image'
            ? 'image'
            : 'file',
      attachmentUrl: uploaded?.file_url,
      attachmentType: normalizedAttachmentType,
      metadata: {
        mimeType: uploaded?.mime_type || file.type,
        fileSize: uploaded?.file_size || file.size,
        fileId: uploaded?._id,
        fileName,
      },
    });
  } catch (error) {
    console.error('Attachment upload failed:', error);
    alert('Không thể tải tệp lên. Vui lòng thử lại.');
  } finally {
    isUploadingAttachment.value = false;
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  }
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  Array.from(files).forEach((file) => {
    const type = file.type.startsWith('image/') ? 'image' : 'file';
    if (!canAddAttachment(file.size)) {
      attachmentError.value =
        'Tổng dung lượng tệp đính kèm phải nhỏ hơn 50MB. Vui lòng xóa bớt tệp.';
      return;
    }

    const url = type === 'image' ? URL.createObjectURL(file) : null;
    pendingFileAttachments.value.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      url,
      type,
      size: file.size,
      name: file.name,
    });
    attachmentError.value = '';
  });

  target.value = '';
};

const startRecording = async () => {
  recordingError.value = '';
  pendingRecording.value = null;
  if (!navigator.mediaDevices?.getUserMedia) {
    recordingError.value = 'Trình duyệt không hỗ trợ ghi âm.';
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorder = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    recorder.onpause = () => {
      isPaused.value = true;
      if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
      }
    };

    recorder.onresume = () => {
      isPaused.value = false;
      recordingTimer = window.setInterval(() => {
        recordingDuration.value += 1;
      }, 1000);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      if (recordedChunks.length === 0) {
        recordedChunks = [];
        return;
      }

      const blob = new Blob(recordedChunks, { type: 'audio/webm' });
      recordedChunks = [];
      const fileName = `voice-${Date.now()}.webm`;
      const url = URL.createObjectURL(blob);
      pendingRecording.value = {
        blob,
        url,
        fileName,
      };
      recordingDuration.value = 0;
      mediaRecorder = null;
      isRecording.value = false;
      isPaused.value = false;
      if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
      }
    };

    recorder.start();
    isRecording.value = true;
    isPaused.value = false;
    recordingDuration.value = 0;
    recordingTimer = window.setInterval(() => {
      recordingDuration.value += 1;
    }, 1000);
  } catch (error: any) {
    console.error('Recording error:', error);
    recordingError.value =
      error?.message || 'Không thể khởi động ghi âm. Vui lòng thử lại.';
  }
};

const stopRecording = () => {
  if (!mediaRecorder) return;
  const state = mediaRecorder.state;
  if (state === 'inactive') return;
  mediaRecorder.stop();
  isRecording.value = false;
  isPaused.value = false;
  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }
};

const pauseRecording = () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.pause();
  }
};

const resumeRecording = () => {
  if (mediaRecorder && mediaRecorder.state === 'paused') {
    mediaRecorder.resume();
  }
};

const sendPendingRecording = async () => {
  if (!pendingRecording.value) return;
  try {
    const audioFile = new File(
      [pendingRecording.value.blob],
      pendingRecording.value.fileName,
      { type: pendingRecording.value.blob.type || 'audio/webm' },
    );
    await processAttachment(audioFile, 'audio');
  } finally {
    URL.revokeObjectURL(pendingRecording.value.url);
    pendingRecording.value = null;
  }
};

const cancelPendingRecording = () => {
  if (pendingRecording.value) {
    URL.revokeObjectURL(pendingRecording.value.url);
    pendingRecording.value = null;
  }
};

const logout = () => {
  showProfileDropdown.value = false;
  localStorage.removeItem('access_token');
  localStorage.removeItem('username');
  router.push('/login');
};

const toggleProfileDropdown = () => {
  showProfileDropdown.value = !showProfileDropdown.value;
};

const closeDropdown = () => {
  showProfileDropdown.value = false;
};

const goToProfile = () => {
  showProfileDropdown.value = false;
  showProfileSettings.value = true;
};

const closeProfileSettings = () => {
  showProfileSettings.value = false;
};

const openCreateGroupModal = () => {
  showCreateGroupModal.value = true;
};

const closeCreateGroupModal = () => {
  showCreateGroupModal.value = false;
};

const promptNewChat = () => {
  openCreateGroupModal();
};

const handleCreateGroup = async (payload: {
  name: string;
  memberIds: string[];
}) => {
  try {
    groupActionLoading.value = true;
    const memberSet = Array.from(
      new Set([...payload.memberIds, currentUserId.value]),
    );

    const response = await authorizedFetch(
      '/api/groups',
      {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name,
          members: memberSet.map((id) => ({
            user_id: id,
            is_admin: id === currentUserId.value,
          })),
        }),
      },
    );

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Failed to create group');
    }

    const data = await response.json();
    const group = data?.data ?? data;
    showCreateGroupModal.value = false;

    await fetchConversations();

    if (group?.conversation_id) {
      const conversationId =
        typeof group.conversation_id === 'string'
          ? group.conversation_id
          : group.conversation_id?._id;
      const newConversation: ApiConversation = {
        conversationId,
        type: 'group',
        chatInfo: {
          name: group.name,
          groupId: group._id,
        },
        lastMessage: {
          content: 'Nhóm vừa được tạo',
          senderId: currentUserId.value,
          senderName: currentUser.value,
          type: 'system',
        },
        unreadCount: {},
        lastMessageAt: new Date().toISOString(),
      };
      conversations.value = [newConversation, ...conversations.value];
      await handleSelectConversation(newConversation);
    }
  } catch (error: any) {
    console.error('Error creating group:', error);
    alert(error.message || 'Không thể tạo nhóm. Vui lòng thử lại.');
  } finally {
    groupActionLoading.value = false;
  }
};

const performGroupAction = async (
  endpoint: string,
  method: 'PATCH' | 'DELETE',
  body?: Record<string, unknown>,
) => {
  if (!selectedConversation.value?.groupId) return;
  try {
    groupActionLoading.value = true;
    const response = await authorizedFetch(endpoint, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Group action failed');
    }
    await fetchGroupDetails(selectedConversation.value.groupId);
    await fetchConversations();
  } catch (error: any) {
    console.error('Group action error:', error);
    alert(error.message || 'Thao tác thất bại');
  } finally {
    groupActionLoading.value = false;
  }
};

const handleKickMember = async (userId: string) => {
  if (!selectedConversation.value?.groupId) return;
  await performGroupAction(
    `/api/groups/${selectedConversation.value.groupId}/members`,
    'DELETE',
    { user_id: userId },
  );
};

const handleToggleAdmin = async (payload: {
  userId: string;
  isAdmin: boolean;
}) => {
  if (!selectedConversation.value?.groupId) return;
  await performGroupAction(
    `/api/groups/${selectedConversation.value.groupId}/admin`,
    'PATCH',
    {
      user_id: payload.userId,
      is_admin: payload.isAdmin,
    },
  );
};

const handleRenameGroup = async (newName: string) => {
  if (!selectedConversation.value?.groupId || !newName.trim()) return;
  await performGroupAction(
    `/api/groups/${selectedConversation.value.groupId}`,
    'PATCH',
    { name: newName.trim() },
  );
  if (selectedConversation.value) {
    selectedConversation.value.name = newName.trim();
  }
  if (activeConversationRaw.value?.chatInfo) {
    activeConversationRaw.value.chatInfo.name = newName.trim();
  }
};

const startEditMessage = (message: Message) => {
  if (message.senderId !== currentUserId.value || message.isDeleted) {
    return;
  }
  editingMessageId.value = message.id;
  editMessageContent.value = message.content;
  openMessageMenuId.value = null;
};

const cancelEdit = () => {
  editingMessageId.value = null;
  editMessageContent.value = '';
};

const saveEdit = async () => {
  if (!editingMessageId.value || !editMessageContent.value.trim()) {
    return;
  }

  try {
    const response = await authorizedFetch(
      `/api/chat/message/${editingMessageId.value}/edit`,
      {
        method: 'POST',
        body: JSON.stringify({
          senderId: currentUserId.value,
          content: editMessageContent.value.trim(),
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Failed to edit message');
    }

    const messageIndex = messages.value.findIndex(
      (msg) => msg.id === editingMessageId.value,
    );
    if (messageIndex !== -1) {
      messages.value[messageIndex].content = editMessageContent.value.trim();
      messages.value[messageIndex].isEdited = true;
      messages.value[messageIndex].editedAt = new Date();
    }

    cancelEdit();
  } catch (error) {
    console.error('Error editing message:', error);
    alert('Không thể chỉnh sửa tin nhắn. Vui lòng thử lại.');
  }
};

const handleDeleteMessage = async (messageId: string) => {
  if (!confirm('Bạn chắc chắn muốn xóa tin nhắn này?')) {
    return;
  }

  try {
    const response = await authorizedFetch(
      `/api/chat/message/${messageId}/delete`,
      {
        method: 'POST',
        body: JSON.stringify({
          senderId: currentUserId.value,
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Failed to delete message');
    }

    const messageIndex = messages.value.findIndex((msg) => msg.id === messageId);
    if (messageIndex !== -1) {
      messages.value[messageIndex].isDeleted = true;
      messages.value[messageIndex].content = '';
      messages.value[messageIndex].attachmentUrl = undefined;
      messages.value[messageIndex].attachmentType = undefined;
      messages.value[messageIndex].metadata = undefined;
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    alert('Không thể xóa tin nhắn. Vui lòng thử lại.');
  }
  openMessageMenuId.value = null;
};

const isMessageOwner = (message: Message) => {
  return message.senderId === currentUserId.value;
};

const toggleMessageMenu = (messageId: string) => {
  openMessageMenuId.value =
    openMessageMenuId.value === messageId ? null : messageId;
};

const handleDeleteGroup = async () => {
  if (!selectedConversation.value?.groupId) return;
  const confirmDelete = confirm(
    'Bạn chắc chắn muốn xoá nhóm này? Tất cả tin nhắn sẽ bị xoá.',
  );
  if (!confirmDelete) return;

  try {
    groupActionLoading.value = true;
    const response = await authorizedFetch(
      `/api/groups/${selectedConversation.value.groupId}`,
      { method: 'DELETE' },
    );
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Không thể xoá nhóm');
    }

    if (activeConversationId.value) {
      leaveConversation(activeConversationId.value);
    }
    const removedConversationId = activeConversationId.value;

    selectedConversation.value = null;
    activeConversationRaw.value = null;
    activeConversationId.value = '';
    activeGroup.value = null;
    messages.value = messages.value.filter(
      (msg) => msg.conversationId !== removedConversationId,
    );
    await fetchConversations();
  } catch (error: any) {
    console.error('Delete group failed:', error);
    alert(error.message || 'Không thể xoá nhóm');
  } finally {
    groupActionLoading.value = false;
  }
};

const closeActiveConversation = () => {
  if (activeConversationId.value) {
    leaveConversation(activeConversationId.value);
    const updatedHidden = new Set(hiddenConversations.value);
    updatedHidden.add(activeConversationId.value);
    hiddenConversations.value = updatedHidden;
    conversations.value = conversations.value.filter(
      (conv) => conv.conversationId !== activeConversationId.value,
    );
  }
  activeConversationId.value = '';
  selectedConversation.value = null;
  activeConversationRaw.value = null;
  activeGroup.value = null;
  pendingFileAttachments.value.forEach((item) => {
    if (item.url) {
      URL.revokeObjectURL(item.url);
    }
  });
  pendingFileAttachments.value = [];
  attachmentError.value = '';
  pendingRecording.value = null;
  emojiPickerVisible.value = false;
  openMessageMenuId.value = null;
};

const handleCloseConversation = (conversationId: string) => {
  if (conversationId === activeConversationId.value) {
    closeActiveConversation();
  }
};

const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.profile-menu')) {
    closeDropdown();
  }
  if (
    !target.closest('.emoji-picker-container') &&
    !target.closest('.emoji-toggle')
  ) {
    emojiPickerVisible.value = false;
  }
  if (
    !target.closest('.message-actions') &&
    !target.closest('.message-menu')
  ) {
    openMessageMenuId.value = null;
  }
};

onMounted(async () => {
  const token = localStorage.getItem('access_token');
  const username = localStorage.getItem('username');

  if (username) {
    currentUser.value = username;
  }

  if (token) {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3 && tokenParts[1]) {
        const payload = JSON.parse(atob(tokenParts[1]));
        currentUserId.value = payload.sub;
        await fetchConversations();
      }
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  }

  setOnMessageCallback(async (message) => {
    await fetchConversations();
    if (message.conversationId === activeConversationId.value) {
      scrollToBottom();
      if (isGroupConversation.value && selectedConversation.value?.groupId) {
        await fetchGroupDetails(selectedConversation.value.groupId);
      }
    }
  });

  // Listen for message updates (edit/delete)
  if (socket) {
    socket.on('messageUpdate', async (update: any) => {
      const messageIndex = messages.value.findIndex(
        (msg) => msg.id === update.id,
      );
      if (messageIndex !== -1) {
        if (update.isDeleted) {
          messages.value[messageIndex].isDeleted = true;
          messages.value[messageIndex].content = '';
          messages.value[messageIndex].attachmentUrl = undefined;
          messages.value[messageIndex].attachmentType = undefined;
          messages.value[messageIndex].metadata = undefined;
        } else if (update.isEdited) {
          messages.value[messageIndex].content = update.content;
          messages.value[messageIndex].isEdited = true;
          messages.value[messageIndex].editedAt = update.editedAt
            ? new Date(update.editedAt)
            : new Date();
        } else {
          if (update.attachmentUrl) {
            messages.value[messageIndex].attachmentUrl = resolveFileUrl(
              update.attachmentUrl,
            );
          }
          if (update.attachmentType) {
            messages.value[messageIndex].attachmentType = update.attachmentType;
          }
        }
      }
      await fetchConversations();
    });
  }

  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
  if (isRecording.value) {
    stopRecording();
  }
  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }
  if (pendingRecording.value) {
    URL.revokeObjectURL(pendingRecording.value.url);
    pendingRecording.value = null;
  }
  pendingFileAttachments.value.forEach((item) => {
    if (item.url) {
      URL.revokeObjectURL(item.url);
    }
  });
  pendingFileAttachments.value = [];
});
</script>

<template>
  <div class="chat-view">
    <div class="chat-layout">
      <ChatSidebar
        :messages="messages"
        :currentUser="currentUser"
        :currentUserId="currentUserId"
        :activeConversationId="activeConversationId"
        :isConnected="isConnected"
        :showProfileDropdown="showProfileDropdown"
        :apiConversations="conversations"
        @selectConversation="handleSelectConversation"
        @startNewChat="startNewChat"
        @toggleProfile="toggleProfileDropdown"
        @logout="logout"
        @goToProfile="goToProfile"
        @createGroup="openCreateGroupModal"
        @closeConversation="handleCloseConversation"
      />

      <div v-if="!hasConversations && !selectedConversation" class="empty-state">
        <div class="empty-content">
          <div class="empty-icon">💬</div>
          <h3>Chưa có cuộc trò chuyện</h3>
          <p>Bắt đầu bằng cách tạo nhóm hoặc tìm bạn bè</p>
          <button @click="promptNewChat" class="new-chat-btn">
            ➕ Tạo nhóm mới
          </button>
        </div>
      </div>

      <div v-else-if="!selectedConversation" class="no-chat-selected">
        <div class="welcome-content">
          <h3>👋 Chào mừng {{ currentUser }}!</h3>
          <p>Hãy chọn một cuộc trò chuyện hoặc tạo nhóm mới</p>
          <button @click="promptNewChat" class="new-chat-input">
            ➕ Tạo nhóm
          </button>
        </div>
      </div>

      <div v-else class="chat-container">
        <div class="chat-recipient-header">
          <div class="recipient-info">
            <div class="recipient-avatar">
              {{ conversationTitle.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h3>{{ conversationTitle }}</h3>
              <span v-if="isGroupConversation" class="recipient-subtitle">Nhóm chat</span>
            </div>
          </div>
          <button
            class="close-conversation-btn"
            type="button"
            @click="closeActiveConversation"
            title="Đóng cuộc trò chuyện"
          >
            ×
          </button>
        </div>

        <div class="messages-container" ref="messagesContainer">
          <div
            v-for="msg in conversationMessages"
            :key="msg.id"
            :class="[
              'message',
              msg.from === currentUser ? 'sent' : 'received',
              { deleted: msg.isDeleted }
            ]"
            @mouseenter="hoveredMessageId = msg.id"
            @mouseleave="hoveredMessageId = null"
          >
            <div
              class="message-content"
              :class="{ deleted: msg.isDeleted }"
            >
              <div class="message-header">
                <strong>{{ msg.from }}</strong>
                <div class="message-header-right">
                  <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
                  <span v-if="msg.isEdited" class="edited-badge">(edited)</span>
                  <div
                    v-if="hoveredMessageId === msg.id && isMessageOwner(msg) && !msg.isDeleted && editingMessageId !== msg.id"
                    class="message-actions"
                  >
                    <button
                      @click.stop="toggleMessageMenu(msg.id)"
                      class="action-btn menu-btn"
                      title="Tùy chọn"
                    >
                      ⋮
                    </button>
                    <div
                      v-if="openMessageMenuId === msg.id"
                      class="message-menu"
                    >
                      <button
                        class="message-menu-item"
                        @click.stop="startEditMessage(msg)"
                      >
                        Sửa
                      </button>
                      <button
                        class="message-menu-item delete"
                        @click.stop="handleDeleteMessage(msg.id)"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="editingMessageId === msg.id" class="edit-message-form">
                <input
                  v-model="editMessageContent"
                  @keyup.enter="saveEdit"
                  @keyup.esc="cancelEdit"
                  class="edit-input"
                  type="text"
                  autofocus
                />
                <div class="edit-actions">
                  <button @click="saveEdit" class="save-btn">Lưu</button>
                  <button @click="cancelEdit" class="cancel-btn">Hủy</button>
                </div>
              </div>
              <p v-else-if="msg.isDeleted" class="deleted-message">
                This message has been deleted
              </p>
              <div
                v-else-if="msg.attachmentType === 'image' && msg.attachmentUrl"
                class="attachment attachment-image"
              >
                <div class="attachment-text">
                  <p
                    v-if="msg.content"
                    class="attachment-description"
                  >
                    {{ msg.content }}
                  </p>
                  <p
                    v-if="getAttachmentFileName(msg)"
                    class="attachment-filename"
                  >
                    {{ getAttachmentFileName(msg) }}
                  </p>
                </div>
                <img
                  :src="msg.attachmentUrl"
                  :alt="msg.metadata?.fileName || 'Image'"
                  class="zoomable-image"
                  @click="openImagePreview(msg)"
                />
              </div>
              <div
                v-else-if="msg.attachmentType === 'audio' && msg.attachmentUrl"
                class="attachment attachment-audio"
              >
                <p class="attachment-description">
                  {{ msg.content || 'Tin nhắn thoại' }}
                </p>
                <audio :src="msg.attachmentUrl" controls></audio>
              </div>
              <div
                v-else-if="msg.attachmentUrl"
                class="attachment attachment-file"
              >
                <div class="attachment-text">
                  <p
                    v-if="msg.content"
                    class="attachment-description"
                  >
                    {{ msg.content }}
                  </p>
                  <p
                    v-if="getAttachmentFileName(msg)"
                    class="attachment-filename"
                  >
                    {{ getAttachmentFileName(msg) }}
                  </p>
                </div>
                <button
                  class="download-link"
                  type="button"
                  @click="downloadAttachment(msg)"
                >
                  📎 Tải {{ getAttachmentFileName(msg) || 'tệp' }}
                </button>
              </div>
              <p v-else>{{ msg.content }}</p>
            </div>
          </div>
        </div>

        <div
          v-if="emojiPickerVisible"
          class="emoji-picker-container"
          ref="emojiPickerRef"
        >
          <emoji-picker @emoji-click="handleEmojiSelect"></emoji-picker>
        </div>

        <input
          ref="fileInputRef"
          type="file"
          multiple
          class="file-input"
          @change="handleFileChange"
        />

        <div class="input-container">
          <div class="input-actions">
            <button
              class="icon-button emoji-toggle"
              type="button"
              @click="toggleEmojiPicker"
              title="Chèn emoji"
            >
              😊
            </button>
            <button
              class="icon-button"
              type="button"
              @click="triggerFileSelect"
              :disabled="isUploadingAttachment"
              title="Đính kèm tệp"
            >
              <span v-if="isUploadingAttachment">⏳</span>
              <span v-else>📎</span>
            </button>
            <template v-if="!isRecording && !pendingRecording">
              <button
                class="icon-button record-btn"
                type="button"
                @click="startRecording"
                title="Ghi âm"
              >
                🎙️
              </button>
            </template>
            <template v-else-if="isRecording">
              <div class="record-controls">
                <button
                  class="icon-button pause-btn"
                  type="button"
                  :class="{ recording: isRecording && !isPaused }"
                  @click="isPaused ? resumeRecording() : pauseRecording()"
                  :title="isPaused ? 'Tiếp tục' : 'Tạm ngưng'"
                >
                  {{ isPaused ? '▶️' : '⏸️' }}
                </button>
                <button
                  class="icon-button stop-btn"
                  type="button"
                  @click="stopRecording"
                  title="Dừng ghi âm"
                >
                  ⏹️
                </button>
              </div>
            </template>
            <template v-else>
              <div class="record-controls pending">
                <span>🎙️ Đã có bản ghi</span>
              </div>
            </template>
          </div>
          <input
            v-model="newMessage"
            @keyup.enter="send"
            type="text"
            placeholder="Nhập tin nhắn..."
            :disabled="!selectedConversation"
          />
          <button
            @click="send"
            :disabled="
              !selectedConversation ||
              (!newMessage.trim() && pendingFileAttachments.length === 0)
            "
          >
            Gửi
          </button>
        </div>
        <div
          v-if="pendingFileAttachments.length"
          class="attachments-preview"
        >
          <div class="attachments-header">
            <span>
              Tệp đính kèm ({{ pendingFileAttachments.length }}) ·
              {{ formatBytes(totalAttachmentSize) }} / {{ formatBytes(ATTACHMENT_SIZE_LIMIT) }}
            </span>
            <span v-if="attachmentError" class="attachment-warning">
              {{ attachmentError }}
            </span>
          </div>
          <div class="attachments-grid">
            <div
              v-for="item in pendingFileAttachments"
              :key="item.id"
              class="attachment-card pending-card"
            >
              <button
                class="remove-attachment"
                type="button"
                @click="removeAttachment(item.id)"
                title="Xóa tệp"
              >
                ×
              </button>
              <div class="attachment-thumb">
                <img
                  v-if="item.type === 'image' && item.url"
                  :src="item.url"
                  :alt="item.name"
                />
                <div v-else class="file-icon">📄</div>
              </div>
              <div class="attachment-card-info">
                <p class="file-name">{{ item.name }}</p>
                <p class="file-size">{{ formatBytes(item.size) }}</p>
              </div>
            </div>
          </div>
        </div>
        <div v-if="isRecording || recordingError" class="recording-status">
          <div class="recording-info">
            <span v-if="isRecording">
              🎙️ {{ isPaused ? 'Tạm dừng' : 'Đang ghi' }}... {{ recordingDuration }}s
            </span>
            <span v-else-if="recordingError">{{ recordingError }}</span>
          </div>
        </div>
        <div v-if="pendingRecording" class="pending-recording">
          <div class="recording-info">
            <span>🎧 Xem trước tin nhắn thoại</span>
          </div>
          <audio :src="pendingRecording.url" controls></audio>
          <div class="pending-actions">
            <button class="send-btn" type="button" @click="sendPendingRecording">
              Gửi
            </button>
            <button class="cancel-btn" type="button" @click="cancelPendingRecording">
              Hủy
            </button>
          </div>
        </div>
      </div>

      <GroupMembersPanel
        v-if="isGroupConversation && activeGroup"
        class="group-panel"
        :group="activeGroup"
        :current-user-id="currentUserId"
        :is-admin="isCurrentUserGroupAdmin"
        :loading="isLoadingGroup || groupActionLoading"
        @kick="handleKickMember"
        @toggle-admin="handleToggleAdmin"
        @rename="handleRenameGroup"
        @delete="handleDeleteGroup"
      />
    </div>

    <ProfileSettings
      v-if="showProfileSettings"
      :currentUserId="currentUserId"
      @close="closeProfileSettings"
    />

    <CreateGroupModal
      :visible="showCreateGroupModal"
      :current-user-id="currentUserId"
      :busy="groupActionLoading"
      @close="closeCreateGroupModal"
      @submit="handleCreateGroup"
    />

    <div
      v-if="imagePreview.visible"
      class="image-preview-modal"
      @click.self="closeImagePreview"
    >
      <div class="image-preview-content">
        <button class="close-preview" @click="closeImagePreview">×</button>
        <img :src="imagePreview.url" :alt="imagePreview.fileName || 'Image preview'" />
        <div class="image-preview-info">
          <p v-if="imagePreview.description" class="preview-description">
            {{ imagePreview.description }}
          </p>
          <p v-if="imagePreview.fileName" class="preview-filename">
            {{ imagePreview.fileName }}
          </p>
          <a
            :href="imagePreview.url"
            :download="imagePreview.fileName || 'image'"
            class="download-btn"
          >
            ⬇️ Tải xuống
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f2f5;
}

.chat-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: 100vh;
}

.group-panel {
  width: 320px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  margin: 1rem;
  border-radius: 12px;
}

.empty-content {
  text-align: center;
  padding: 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-content h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.empty-content p {
  margin: 0 0 1.5rem 0;
  color: #666;
  font-size: 1rem;
}

.new-chat-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.new-chat-btn:hover {
  transform: translateY(-2px);
}

.no-chat-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  margin: 1rem 1rem 1rem 0;
  border-radius: 12px;
}

.welcome-content {
  text-align: center;
  padding: 2rem;
}

.welcome-content h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.welcome-content p {
  margin: 0 0 1.5rem 0;
  color: #666;
}

.new-chat-input {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.new-chat-input:hover {
  transform: translateY(-2px);
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  margin: 1rem 1rem 1rem 0;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.chat-recipient-header {
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recipient-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.recipient-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.125rem;
}

.close-conversation-btn {
  border: none;
  background: #f3f4f6;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1.1rem;
  cursor: pointer;
  color: #4b5563;
  transition: background 0.2s, color 0.2s;
}

.close-conversation-btn:hover {
  background: #fee2e2;
  color: #b91c1c;
}

.recipient-info h3 {
  margin: 0;
  color: #333;
  font-size: 1.125rem;
}

.recipient-subtitle {
  color: #6b7280;
  font-size: 0.85rem;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #f9fafb;
}

.message {
  margin-bottom: 1rem;
  display: flex;
}

.message.sent {
  justify-content: flex-end;
}

.message.received {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
}

.message.sent .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message.received .message-content {
  background: white;
  color: #333;
  border: 1px solid #e5e7eb;
}

.message-content.deleted,
.message.sent .message-content.deleted,
.message.received .message-content.deleted {
  background: #fef2f2 !important;
  color: #9f1239 !important;
  border: 1px dashed #fecdd3 !important;
  font-style: italic;
}

.attachment {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.attachment img {
  max-width: 260px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.zoomable-image {
  cursor: zoom-in;
}

.attachment audio {
  width: 220px;
}

.attachment-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.attachment-description {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 500;
}

.attachment-filename {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.75;
  word-break: break-word;
}

.attachment-file a {
  color: inherit;
  text-decoration: none;
  font-weight: 600;
}

.message-actions {
  position: relative;
}

.menu-btn {
  font-size: 1rem;
}

.message-menu {
  position: absolute;
  top: 110%;
  right: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  min-width: 120px;
  z-index: 10;
}

.message-menu-item {
  background: none;
  border: none;
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}

.message-menu-item:hover {
  background: #f3f4f6;
}

.message-menu-item.delete {
  color: #dc2626;
}

.download-link {
  border: none;
  background: #eef2ff;
  color: #4338ca;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.download-link:hover {
  background: #e0e7ff;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
}

.message.sent .message-header {
  color: rgba(255, 255, 255, 0.9);
}

.message.received .message-header {
  color: #666;
}

.message-time {
  font-size: 0.7rem;
  opacity: 0.7;
}

.message-content p {
  margin: 0;
  word-wrap: break-word;
}

.message-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edited-badge {
  font-size: 0.7rem;
  opacity: 0.7;
  font-style: italic;
}

.message-actions {
  display: flex;
  gap: 0.25rem;
  margin-left: 0.5rem;
}

.action-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message.sent .action-btn {
  background: rgba(255, 255, 255, 0.2);
}

.message.sent .action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.message.received .action-btn {
  background: rgba(0, 0, 0, 0.05);
}

.message.received .action-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.edit-message-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.edit-input {
  padding: 0.5rem;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 0.95rem;
  width: 100%;
}

.edit-input:focus {
  outline: none;
  border-color: #764ba2;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.save-btn,
.cancel-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: transform 0.2s;
}

.save-btn {
  background: #667eea;
  color: white;
}

.save-btn:hover {
  background: #5568d3;
  transform: translateY(-1px);
}

.cancel-btn {
  background: #e5e7eb;
  color: #333;
}

.cancel-btn:hover {
  background: #d1d5db;
  transform: translateY(-1px);
}

.deleted-message {
  margin: 0;
  font-style: italic;
  opacity: 0.6;
  color: #999;
}

.input-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.icon-button {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, transform 0.2s;
}

.icon-button:hover:not(:disabled) {
  background: #e0e7ff;
  transform: translateY(-1px);
}

.icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-button.recording {
  background: #fee2e2;
  color: #dc2626;
}

.record-controls {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.record-controls.pending span {
  font-size: 0.8rem;
  color: #6b7280;
}

.input-container input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 24px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input-container input:focus {
  outline: none;
  border-color: #667eea;
}

.input-container button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s;
}

.input-container button:hover:not(:disabled) {
  transform: translateY(-2px);
}

.input-container button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  margin: 0 1.5rem 0.5rem;
}

.emoji-picker-container {
  position: absolute;
  bottom: 110px;
  left: 120px;
  z-index: 20;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.emoji-picker-container emoji-picker {
  width: 320px;
  max-width: 90vw;
  height: 360px;
}

.file-input {
  display: none;
}

.recording-status {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0.5rem 1.5rem;
  border-top: 1px solid #f3f4f6;
  background: #fff;
  font-size: 0.9rem;
  color: #dc2626;
}

.recording-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pending-recording {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem 1.25rem;
  border-top: 1px solid #f3f4f6;
  background: #fff;
}

.pending-recording audio {
  width: 100%;
}

.pending-actions {
  display: flex;
  gap: 0.5rem;
}

.pending-actions .send-btn,
.pending-actions .cancel-btn {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.pending-actions .send-btn {
  background: #4ade80;
  color: #0f172a;
}

.pending-actions .cancel-btn {
  background: #fee2e2;
  color: #b91c1c;
}

.attachments-preview {
  padding: 0.75rem 1.5rem 0;
  background: #fff;
  border-top: 1px solid #f3f4f6;
}

.attachments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.attachment-warning {
  color: #b91c1c;
  font-weight: 600;
}

.attachments-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
}

.attachment-card.pending-card {
  width: 140px;
  background: #f8fafc;
  border: 1px dashed #cbd5f5;
  border-radius: 12px;
  padding: 0.5rem;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.remove-attachment {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  border: none;
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
}

.attachment-thumb {
  width: 100%;
  height: 90px;
  border-radius: 10px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.attachment-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  font-size: 1.5rem;
}

.attachment-card-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.attachment-card-info .file-name {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  word-break: break-word;
}

.attachment-card-info .file-size {
  margin: 0;
  font-size: 0.75rem;
  color: #64748b;
}

.image-preview-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.image-preview-content {
  position: relative;
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.image-preview-content img {
  max-width: 80vw;
  max-height: 70vh;
  border-radius: 8px;
  object-fit: contain;
}

.close-preview {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  border: none;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 1.25rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
}

.image-preview-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.preview-description,
.preview-filename {
  margin: 0;
  font-size: 0.95rem;
}

.preview-filename {
  font-weight: 600;
}

.download-btn {
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: #667eea;
  color: white;
  font-weight: 600;
}
</style>
