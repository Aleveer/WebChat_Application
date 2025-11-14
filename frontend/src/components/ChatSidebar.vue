<script setup lang="ts">
import { computed, ref } from 'vue';
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

interface Props {
  messages: Message[];
  currentUser: string;
  currentUserId?: string;
  activeConversationId?: string;
  isConnected: boolean;
  showProfileDropdown: boolean;
  apiConversations?: ApiConversation[];
}

interface ConversationPreview {
  conversationId: string;
  type: 'direct' | 'group';
  name: string;
  subtitle?: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  chatInfo: ApiConversation['chatInfo'];
  source: ApiConversation;
}

interface User {
  _id: string;
  username: string;
  phone?: string;
  photo?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  selectConversation: [conversation: ApiConversation];
  startNewChat: [user: User];
  toggleProfile: [];
  logout: [];
  goToProfile: [];
  createGroup: [];
  closeConversation: [conversationId: string];
}>();

const searchQuery = ref('');
const searchResults = ref<User[]>([]);
const isSearching = ref(false);
const showSearchResults = ref(false);

const userInitials = computed(() => {
  return props.currentUser ? props.currentUser.charAt(0).toUpperCase() : '?';
});

const displayConversations = computed<ConversationPreview[]>(() => {
  if (props.apiConversations && props.apiConversations.length > 0) {
    return [...props.apiConversations]
      .sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      })
      .map((conv) => {
        const name = conv.type === 'group'
          ? conv.chatInfo.name || 'Nhóm chưa đặt tên'
          : conv.chatInfo.username || 'Người dùng';
        const lastMessage = conv.lastMessage?.content || 'Chưa có tin nhắn';
        const lastTimestamp = conv.lastMessage?.createdAt || conv.lastMessageAt;
        const unread = conv.unreadCount
          ? typeof conv.unreadCount === 'number'
            ? conv.unreadCount
            : props.currentUserId
              ? conv.unreadCount[props.currentUserId] || 0
              : 0
          : 0;

        return {
          conversationId: conv.conversationId,
          type: conv.type,
          name,
          subtitle: conv.type === 'group' ? 'Nhóm' : conv.chatInfo.status,
          lastMessage,
          timestamp: lastTimestamp ? new Date(lastTimestamp) : new Date(0),
          unreadCount: unread,
          chatInfo: conv.chatInfo,
          source: conv,
        };
      });
  }

  const conversationMap = new Map<string, ConversationPreview>();

  props.messages.forEach((msg) => {
    const otherUser = msg.from === props.currentUser ? msg.to : msg.from;
    const existing = conversationMap.get(otherUser);
    const msgTime = new Date(msg.timestamp);

    if (!existing || existing.timestamp.getTime() < msgTime.getTime()) {
      conversationMap.set(otherUser, {
        conversationId: otherUser,
        type: 'direct',
        name: otherUser,
        lastMessage: msg.content,
        timestamp: msgTime,
        unreadCount: 0,
        chatInfo: { username: otherUser },
        source: {
          conversationId: otherUser,
          type: 'direct',
          chatInfo: { username: otherUser },
          lastMessage: {
            content: msg.content,
            createdAt: msgTime.toISOString(),
          },
        },
      } as ConversationPreview);
    }
  });

  return Array.from(conversationMap.values()).sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );
});

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes}p`; 
  if (hours < 24) return `${hours}g`;
  if (days < 7) return `${days}n`;
  return date.toLocaleDateString();
};

const truncateMessage = (text: string, maxLength: number = 30) => {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

const getLastMessagePreview = (conv: ConversationPreview) => {
  const lastMessage = conv.source?.lastMessage;
  if (!lastMessage) {
    return conv.lastMessage || 'Chưa có tin nhắn';
  }
  if (lastMessage.isDeleted) {
    return 'This message has been deleted';
  }
  if (lastMessage.attachmentType === 'image') {
    return '🖼️ Đã gửi một hình ảnh';
  }
  if (lastMessage.attachmentType === 'audio') {
    return '🎙️ Tin nhắn thoại';
  }
  if (lastMessage.attachmentType === 'file') {
    return `📎 ${lastMessage.content || 'Tệp đính kèm'}`;
  }
  return lastMessage.content || 'Tin nhắn trống';
};

const selectConversation = (conversation: ConversationPreview) => {
  emit('selectConversation', conversation.source);
  searchQuery.value = '';
  showSearchResults.value = false;
};

const closeConversation = (conversationId: string) => {
  emit('closeConversation', conversationId);
};

const searchUsers = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    showSearchResults.value = false;
    return;
  }

  isSearching.value = true;
  showSearchResults.value = true;

  try {
    const token = localStorage.getItem('access_token');

    if (!token || token === 'undefined' || token === 'null') {
      searchResults.value = [];
      isSearching.value = false;
      return;
    }

    const response = await fetch(
      `http://localhost:3000/api/v1/users/search?q=${encodeURIComponent(searchQuery.value)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.ok) {
      const users = await response.json();
      const userList = users.data || users;
      searchResults.value = userList.filter(
        (u: User) => u.username !== props.currentUser,
      );
    } else {
      searchResults.value = [];
    }
  } catch (error) {
    console.error('Search error:', error);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
};

const handleSearchInput = () => {
  if (searchQuery.value.trim()) {
    searchUsers();
  } else {
    searchResults.value = [];
    showSearchResults.value = false;
  }
};

const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  showSearchResults.value = false;
};

const startChatWithUser = (user: User) => {
  emit('startNewChat', user);
  searchQuery.value = '';
  showSearchResults.value = false;
};
</script>

<template>
  <div class="sidebar">
    <div class="sidebar-top">
      <div class="sidebar-header">
        <h3>💬 Chats</h3>
        <div class="header-actions">
          <button class="create-group" @click="emit('createGroup')">
            ➕ Nhóm
          </button>
          <div class="profile-menu">
            <button @click="emit('toggleProfile')" class="profile-avatar" :title="currentUser">
              <span class="avatar-text">{{ userInitials }}</span>
              <span :class="['status-indicator', isConnected ? 'connected' : 'disconnected']"></span>
            </button>

            <div v-if="showProfileDropdown" class="dropdown-menu">
              <div class="dropdown-header">
                <div class="dropdown-avatar">{{ userInitials }}</div>
                <div class="dropdown-user-info">
                  <div class="dropdown-username">{{ currentUser }}</div>
                  <div class="dropdown-status">
                    <span :class="['status-dot', isConnected ? 'connected' : 'disconnected']"></span>
                    <span>{{ isConnected ? 'Đang online' : 'Ngoại tuyến' }}</span>
                  </div>
                </div>
              </div>

              <div class="dropdown-divider"></div>

              <button @click="emit('goToProfile')" class="dropdown-item">
                <span class="item-icon">👤</span>
                <span>Cài đặt tài khoản</span>
              </button>

              <div class="dropdown-divider"></div>

              <button @click="emit('logout')" class="dropdown-item logout">
                <span class="item-icon">🚪</span>
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="search-container">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            @input="handleSearchInput"
            type="text"
            placeholder="Tìm kiếm người dùng..."
            class="search-input"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="clear-search-btn"
            title="Xóa"
          >
            ✕
          </button>
        </div>

        <div v-if="showSearchResults" class="search-results">
          <div v-if="isSearching" class="search-loading">
            <span>Đang tìm...</span>
          </div>
          <div v-else-if="searchResults.length === 0" class="no-results">
            <span>Không tìm thấy người dùng</span>
          </div>
          <div v-else class="results-list">
            <div
              v-for="user in searchResults"
              :key="user._id"
              class="search-result-item"
              @click="startChatWithUser(user)"
            >
              <div class="result-avatar">
                {{ user.username.charAt(0).toUpperCase() }}
              </div>
              <div class="result-info">
                <div class="result-name">{{ user.username }}</div>
                <div v-if="user.phone" class="result-phone">
                  {{ user.phone }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="conversations-list">
      <div
        v-for="conv in displayConversations"
        :key="conv.conversationId"
        :class="['conversation-item', { active: conv.conversationId === activeConversationId }]"
      >
        <button
          v-if="conv.conversationId === activeConversationId"
          class="conversation-close-btn"
          type="button"
          @click.stop="closeConversation(conv.conversationId)"
          title="Đóng cuộc trò chuyện"
        >
          ×
        </button>
        <div class="conversation-avatar">
          {{ conv.name.charAt(0).toUpperCase() }}
        </div>
        <div class="conversation-info" @click="selectConversation(conv)">
          <div class="conversation-header">
            <span class="conversation-name">{{ conv.name }}</span>
            <span class="conversation-time">{{ formatTime(conv.timestamp) }}</span>
          </div>
          <div class="conversation-preview">
            {{ truncateMessage(getLastMessagePreview(conv)) }}
          </div>
        </div>
        <div v-if="conv.unreadCount > 0" class="unread-badge">
          {{ conv.unreadCount }}
        </div>
      </div>

      <div v-if="displayConversations.length === 0" class="no-conversations">
        <p>💬 Chưa có cuộc trò chuyện</p>
        <p class="hint">Tạo nhóm hoặc tìm bạn bè để bắt đầu</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  width: 480px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-top {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header {
  padding: 0.75rem 1.25rem 0.5rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  min-height: 48px;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.create-group {
  padding: 0.35rem 0.75rem;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  font-size: 0.85rem;
  cursor: pointer;
  font-weight: 600;
}

.create-group:hover {
  background: rgba(255, 255, 255, 0.4);
}

.profile-menu {
  position: relative;
}

.profile-avatar {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
}

.profile-avatar:hover {
  transform: scale(1.08);
  background: rgba(255, 255, 255, 0.4);
}

.avatar-text {
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
}

.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #667eea;
}

.status-indicator.connected {
  background: #10b981;
}

.status-indicator.disconnected {
  background: #ef4444;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  min-width: 260px;
  z-index: 1000;
  animation: dropdownSlide 0.2s ease-out;
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
}

.dropdown-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.dropdown-user-info {
  flex: 1;
  min-width: 0;
}

.dropdown-username {
  font-weight: 600;
  color: #111827;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.connected {
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.status-dot.disconnected {
  background: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.dropdown-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 0.5rem 0;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.9rem;
  color: #374151;
  text-align: left;
}

.dropdown-item:hover {
  background: #f3f4f6;
}

.dropdown-item.logout {
  color: #dc2626;
}

.dropdown-item.logout:hover {
  background: #fee2e2;
}

.item-icon {
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
}

.search-container {
  position: relative;
  padding: 0 1.25rem 0.75rem 1.25rem;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.875rem;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 0.625rem 2.5rem 0.625rem 2.5rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  font-size: 0.85rem;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  backdrop-filter: blur(10px);
}

.search-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.25);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.clear-search-btn {
  position: absolute;
  right: 0.625rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  color: white;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.clear-search-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.search-results {
  position: absolute;
  top: 100%;
  left: 1.25rem;
  right: 1.25rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.15);
  max-height: 280px;
  overflow-y: auto;
  z-index: 10;
  margin-top: 0.5rem;
}

.search-loading,
.no-results {
  padding: 1.5rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

.search-loading span {
  display: inline-block;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.results-list {
  padding: 0.5rem 0;
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
  gap: 0.75rem;
}

.search-result-item:hover {
  background: #f3f4f6;
}

.result-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-weight: 600;
  color: #111827;
  font-size: 0.9rem;
  margin-bottom: 0.125rem;
}

.result-phone {
  font-size: 0.75rem;
  color: #6b7280;
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.2s;
  position: relative;
}

.conversation-item:hover {
  background: #f9fafb;
}

.conversation-item.active {
  background: #ede9fe;
  border-left: 3px solid #667eea;
}

.conversation-close-btn {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  border: none;
  background: transparent;
  font-size: 1.1rem;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.conversation-close-btn:hover {
  color: #dc2626;
}

.conversation-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-right: 1rem;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.conversation-name {
  font-weight: 600;
  color: #111827;
  font-size: 0.9375rem;
}

.conversation-time {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
}

.conversation-preview {
  font-size: 0.875rem;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unread-badge {
  background: #667eea;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
  margin-left: 0.5rem;
}

.no-conversations {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  color: #9ca3af;
  text-align: center;
  min-height: 200px;
}

.no-conversations p {
  margin: 0.25rem 0;
  font-size: 0.95rem;
}

.hint {
  font-size: 0.85rem;
  opacity: 0.75;
}
</style>
