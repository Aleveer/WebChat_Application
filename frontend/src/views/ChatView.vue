<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
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

const router = useRouter();
const {
  messages,
  isConnected,
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
const isLoadingConversations = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const activeGroup = ref<GroupDetails | null>(null);
const isLoadingGroup = ref(false);
const showCreateGroupModal = ref(false);
const groupActionLoading = ref(false);

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
      `http://localhost:3000/api/v1/chat/conversations?userId=${currentUserId.value}&limit=50`,
    );
    if (response.ok) {
      const payload = await response.json();
      const list = Array.isArray(payload) ? payload : payload?.data ?? [];
      conversations.value = list;
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
      `http://localhost:3000/api/v1/groups/${groupId}`,
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
      `http://localhost:3000/api/v1/chat/messages/${conversationId}?limit=100`,
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
            ? sender._id
            : sender?.toString?.() || '';
        const senderName =
          (typeof sender === 'object' && sender?.username) ||
          (senderId === currentUserId.value ? currentUser.value : targetName) ||
          senderId;

        return {
          id: msg._id || msg.id,
          conversationId,
          type: conversationType,
          from: senderName,
          to: conversationType === 'group' ? targetName : targetName,
          content: msg.text || msg.content || '',
          timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          groupId:
            conversationType === 'group'
              ? selectedConversation.value?.groupId
              : undefined,
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

const send = async () => {
  if (!newMessage.value.trim() || !selectedConversation.value) {
    return;
  }

  const content = newMessage.value.trim();
  newMessage.value = '';

  try {
    if (selectedConversation.value.id) {
      const response = await authorizedFetch(
        'http://localhost:3000/api/v1/chat/message',
        {
          method: 'POST',
          body: JSON.stringify({
            senderId: currentUserId.value,
            conversationId: selectedConversation.value.id,
            content,
            type: 'text',
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      const payload = await response.json();
      const result = payload?.data ?? payload;

      const message: Message = {
        id:
          (result.message && (result.message._id || result.message.id)) ||
          Date.now().toString(),
        conversationId: selectedConversation.value.id,
        type: selectedConversation.value.type,
        from: currentUser.value,
        to: selectedConversation.value.name,
        content,
        timestamp: new Date(
          (result.message && result.message.createdAt) || Date.now(),
        ),
        groupId: selectedConversation.value.groupId,
      };

      if (!messages.value.some((msg) => msg.id === message.id)) {
        messages.value.push(message);
      }
      scrollToBottom();
      await fetchConversations();
    } else if (selectedConversation.value.type === 'direct') {
      const response = await authorizedFetch(
        'http://localhost:3000/api/v1/chat/message-new',
        {
          method: 'POST',
          body: JSON.stringify({
            senderId: currentUserId.value,
            receiverId: selectedConversation.value.userId,
            content,
            type: 'text',
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const payload = await response.json();
      const result = payload?.data ?? payload;
      const conversationId = result.conversationId;

      selectedConversation.value.id = conversationId;
      activeConversationId.value = conversationId;
      joinConversation(conversationId);

      const message: Message = {
        id:
          (result.message && (result.message._id || result.message.id)) ||
          Date.now().toString(),
        conversationId,
        type: 'direct',
        from: currentUser.value,
        to: selectedConversation.value.name,
        content,
        timestamp: new Date(
          (result.message && result.message.createdAt) || Date.now(),
        ),
      };

      messages.value.push(message);
      scrollToBottom();
      await fetchConversations();
    } else {
      throw new Error('Conversation is missing identifier');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    newMessage.value = content;
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
      'http://localhost:3000/api/v1/groups',
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
    `http://localhost:3000/api/v1/groups/${selectedConversation.value.groupId}/members`,
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
    `http://localhost:3000/api/v1/groups/${selectedConversation.value.groupId}/admin`,
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
    `http://localhost:3000/api/v1/groups/${selectedConversation.value.groupId}`,
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

const handleDeleteGroup = async () => {
  if (!selectedConversation.value?.groupId) return;
  const confirmDelete = confirm(
    'Bạn chắc chắn muốn xoá nhóm này? Tất cả tin nhắn sẽ bị xoá.',
  );
  if (!confirmDelete) return;

  try {
    groupActionLoading.value = true;
    const response = await authorizedFetch(
      `http://localhost:3000/api/v1/groups/${selectedConversation.value.groupId}`,
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

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-menu')) {
      closeDropdown();
    }
  });
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
        </div>

        <div class="messages-container" ref="messagesContainer">
          <div
            v-for="msg in conversationMessages"
            :key="msg.id"
            :class="['message', msg.from === currentUser ? 'sent' : 'received']"
          >
            <div class="message-content">
              <div class="message-header">
                <strong>{{ msg.from }}</strong>
                <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
              </div>
              <p>{{ msg.content }}</p>
            </div>
          </div>
        </div>

        <div class="input-container">
          <input
            v-model="newMessage"
            @keyup.enter="send"
            type="text"
            placeholder="Nhập tin nhắn..."
            :disabled="!selectedConversation"
          />
          <button @click="send" :disabled="!selectedConversation || !newMessage.trim()">Gửi</button>
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
}

.chat-recipient-header {
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
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

.input-container {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: white;
  border-top: 1px solid #e5e7eb;
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
</style>
