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
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: string;
    type: string;
  };
  unreadCount: Record<string, number>;
  lastMessageAt: string;
}

interface Props {
  messages: Message[];
  currentUser: string;
  currentUserId?: string;
  activeRecipient: string;
  isConnected: boolean;
  showProfileDropdown: boolean;
  apiConversations?: ApiConversation[];
}

interface Conversation {
  username: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
}

interface User {
  _id: string;
  username: string;
  phone?: string;
  photo?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  selectConversation: [username: string];
  startNewChat: [user: User]; // New event for starting chat with search result
  toggleProfile: [];
  logout: [];
  goToProfile: [];
}>();

const searchQuery = ref('');
const searchResults = ref<User[]>([]);
const isSearching = ref(false);
const showSearchResults = ref(false);

// Get user initials for avatar
const userInitials = computed(() => {
  return props.currentUser ? props.currentUser.charAt(0).toUpperCase() : '?';
});

// Group messages by conversation partners OR use API conversations
const conversations = computed(() => {
  // If we have API conversations, use them
  if (props.apiConversations && props.apiConversations.length > 0) {
    return props.apiConversations.map(conv => ({
      username: conv.chatInfo.username || conv.chatInfo.name || 'Unknown',
      lastMessage: conv.lastMessage.content,
      timestamp: new Date(conv.lastMessageAt),
      unreadCount: props.currentUserId ? (conv.unreadCount[props.currentUserId] || 0) : 0,
      avatar: conv.chatInfo.avatar,
      status: conv.chatInfo.status,
      type: conv.type,
    }));
  }

  // Fallback to deriving from messages (legacy behavior)
  const conversationMap = new Map<string, Conversation>();

  props.messages.forEach((msg) => {
    // Determine the other person in the conversation
    const otherUser = msg.from === props.currentUser ? msg.to : msg.from;
    
    const existing = conversationMap.get(otherUser);
    const msgTime = new Date(msg.timestamp);

    if (!existing || new Date(existing.timestamp) < msgTime) {
      conversationMap.set(otherUser, {
        username: otherUser,
        lastMessage: msg.content,
        timestamp: msgTime,
        unreadCount: 0, // TODO: Implement unread count
      });
    }
  });

  // Convert to array and sort by most recent
  return Array.from(conversationMap.values()).sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
});

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const truncateMessage = (text: string, maxLength: number = 30) => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const selectConversation = (username: string) => {
  emit('selectConversation', username);
  // Clear search after selecting
  searchQuery.value = '';
  showSearchResults.value = false;
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
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const users = await response.json();
      // Handle wrapped response from ResponseTransformInterceptor
      const userList = users.data || users;
      // Filter out current user from results
      searchResults.value = userList.filter((u: User) => u.username !== props.currentUser);
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
  // Debounce search
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
  // Emit with full user object so ChatView can create conversation
  emit('startNewChat', user);
  // Clear search
  searchQuery.value = '';
  showSearchResults.value = false;
};
</script>

<template>
  <div class="sidebar">
    <!-- Combined Header Section -->
    <div class="sidebar-top">
      <div class="sidebar-header">
        <h3>💬 Chats</h3>
        <div class="header-actions">
          <!-- Profile Avatar Button -->
          <div class="profile-menu">
            <button @click="emit('toggleProfile')" class="profile-avatar" :title="currentUser">
              <span class="avatar-text">{{ userInitials }}</span>
              <span :class="['status-indicator', isConnected ? 'connected' : 'disconnected']"></span>
            </button>
            
            <!-- Profile Dropdown -->
            <div v-if="showProfileDropdown" class="dropdown-menu">
              <div class="dropdown-header">
                <div class="dropdown-avatar">{{ userInitials }}</div>
                <div class="dropdown-user-info">
                  <div class="dropdown-username">{{ currentUser }}</div>
                  <div class="dropdown-status">
                    <span :class="['status-dot', isConnected ? 'connected' : 'disconnected']"></span>
                    <span>{{ isConnected ? 'Connected' : 'Disconnected' }}</span>
                  </div>
                </div>
              </div>
              
              <div class="dropdown-divider"></div>
              
              <button @click="emit('goToProfile')" class="dropdown-item">
                <span class="item-icon">👤</span>
                <span>Profile Settings</span>
              </button>
              
              <div class="dropdown-divider"></div>
              
              <button @click="emit('logout')" class="dropdown-item logout">
                <span class="item-icon">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="search-container">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            @input="handleSearchInput"
            type="text"
            placeholder="Search users..."
            class="search-input"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="clear-search-btn"
            title="Clear search"
          >
            ✕
          </button>
        </div>

        <!-- Search Results Dropdown -->
        <div v-if="showSearchResults" class="search-results">
          <div v-if="isSearching" class="search-loading">
            <span>🔄 Searching...</span>
          </div>
          <div v-else-if="searchResults.length === 0" class="no-results">
            <span>No users found</span>
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

    <!-- Conversations List -->
    <div class="conversations-list">
      <div
        v-for="conv in conversations"
        :key="conv.username"
        :class="['conversation-item', { active: conv.username === activeRecipient }]"
        @click="selectConversation(conv.username)"
      >
        <div class="conversation-avatar">
          {{ conv.username.charAt(0).toUpperCase() }}
        </div>
        <div class="conversation-info">
          <div class="conversation-header">
            <span class="conversation-name">{{ conv.username }}</span>
            <span class="conversation-time">{{ formatTime(conv.timestamp) }}</span>
          </div>
          <div class="conversation-preview">
            {{ truncateMessage(conv.lastMessage) }}
          </div>
        </div>
        <div v-if="conv.unreadCount > 0" class="unread-badge">
          {{ conv.unreadCount }}
        </div>
      </div>

      <div v-if="conversations.length === 0" class="no-conversations">
        <p>💬 No conversations yet</p>
        <p class="hint">Start chatting to see conversations here</p>
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

/* Combined Top Section */
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

.conversation-count {
  background: rgba(255, 255, 255, 0.25);
  padding: 0.2rem 0.55rem;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
  line-height: 1.2;
}

/* Profile Menu in Sidebar */
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
  border-color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-text {
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  line-height: 1;
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

/* Dropdown Menu */
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

/* Search Bar Styles */
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

/* Search Results Dropdown */
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

/* Conversations List */
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
