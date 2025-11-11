<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSocket } from '../composables/useSocket';
import ChatSidebar from '../components/ChatSidebar.vue';
import ProfileSettings from '../components/ProfileSettings.vue';

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

const router = useRouter();
//join chat remove
const { messages, isConnected, joinConversation, leaveConversation, sendMessage, setOnMessageCallback } = useSocket();

const currentUser = ref('');
const currentUserId = ref('');
const recipient = ref('');
const recipientId = ref('');
const activeConversationId = ref(''); // Store active conversation ID
const newMessage = ref('');
const showProfileDropdown = ref(false);
const showProfileSettings = ref(false);
const conversations = ref<ApiConversation[]>([]);
const isLoadingConversations = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

// Auto-scroll to bottom when messages change
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// Watch for new messages and auto-scroll
watch(() => messages.value.length, () => {
  scrollToBottom();
});

// Fetch conversations from API
const fetchConversations = async () => {
  if (!currentUserId.value) return;
  
  isLoadingConversations.value = true;
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(
      `http://localhost:3000/api/v1/chat/conversations?userId=${currentUserId.value}&limit=20`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const payload = await response.json();
      // Unwrap payload if ResponseTransformInterceptor wraps responses in { data }
      const list = Array.isArray(payload) ? payload : (payload?.data ?? []);
      conversations.value = list;
      console.log('Conversations loaded:', conversations.value);
    } else {
      console.error('Failed to fetch conversations:', response.statusText);
    }
  } catch (error) {
    console.error('Error fetching conversations:', error);
  } finally {
    isLoadingConversations.value = false;
  }
};

// Fetch message history from API
const loadMessagesFromAPI = async (conversationId: string) => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(
      `http://localhost:3000/api/v1/chat/messages/${conversationId}?limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const payload = await response.json();
      const result = payload?.data ?? payload;
      console.log('Messages loaded from API:', result);
      
            // Map server messages to client Message interface { id, from, to, content, timestamp }
      const mappedMessages = (result?.messages || []).map((msg: any) => {
        // Server returns: _id, senderId (populated object), receiverId (populated object), text, createdAt
        const senderId = msg.senderId;
        const receiverId = msg.receiverId;
        
        // Map to usernames using known currentUser/recipient when API sends only ObjectIds
        const senderUsername =
          typeof senderId === 'object' && senderId
            ? (senderId.username || '')
            : (senderId === currentUserId.value ? currentUser.value : recipient.value);
        const receiverUsername =
          typeof receiverId === 'object' && receiverId
            ? (receiverId.username || '')
            : (receiverId === currentUserId.value ? currentUser.value : recipient.value);
        
        return {
          id: msg._id || msg.id,
          from: senderUsername,
          to: receiverUsername,
          content: msg.text || msg.content || '',
          timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
        };
      });
      
      messages.value.splice(0, messages.value.length, ...mappedMessages);

      console.log('Mapped messages:', mappedMessages);
      scrollToBottom();
      return result;
    } else {
      console.error('Failed to fetch messages:', response.statusText);
      messages.value = [];
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    messages.value = [];
  }
};

// Filter messages for current conversation
const conversationMessages = computed(() => {
  if (!recipient.value) return [];
  const filtered = messages.value.filter(
    (msg) =>
      (msg.from === currentUser.value && msg.to === recipient.value) ||
      (msg.from === recipient.value && msg.to === currentUser.value)
  );
  
  console.log('✅ Filtered messages:', filtered.length, filtered);
  
  return filtered;
});

// Check if there are any conversations
const hasConversations = computed(() => {
  return conversations.value.length > 0 || messages.value.length > 0;
});

// Get user initials for avatar
const userInitials = computed(() => {
  return currentUser.value ? currentUser.value.charAt(0).toUpperCase() : '?';
});

// Format time without seconds (HH:MM format)
const formatTime = (timestamp: Date) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const send = async () => {
  if (!newMessage.value.trim()) return;

  const messageContent = newMessage.value;
  newMessage.value = ''; // Clear input immediately for better UX

  try {
    const token = localStorage.getItem('access_token');
    
    // If no activeConversationId (new conversation), we need to create it via the API
    // The server will find or create the conversation
    const payload: any = {
      senderId: currentUserId.value,
      content: messageContent,
      type: 'text',
    };
    
    if (activeConversationId.value) {
      // Existing conversation - use conversationId
      payload.conversationId = activeConversationId.value;
    } else {
      // New conversation - need to send to a specific user
      // We'll search for the user first to get their ID
      if (!recipientId.value && recipient.value) {
        // Search for user to get their ID
        const searchResponse = await fetch(
          `http://localhost:3000/api/v1/users/search?q=${encodeURIComponent(recipient.value)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        
        if (searchResponse.ok) {
          const payloadUsers = await searchResponse.json();
          const users = Array.isArray(payloadUsers) ? payloadUsers : (payloadUsers?.data ?? []);
          const targetUser = users.find((u: any) => u.username === recipient.value);
          if (targetUser) {
            recipientId.value = targetUser._id;
          } else {
            console.error('User not found');
            newMessage.value = messageContent; // Restore message
            return;
          }
        }
      }
      
      // For new conversations, we need a different endpoint that accepts receiverId
      // Let's create a temporary conversation first by sending the receiverId
      // The server sendMessage will create the conversation
      const createResponse = await fetch('http://localhost:3000/api/v1/chat/message-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderId: currentUserId.value,
          receiverId: recipientId.value,
          content: messageContent,
          type: 'text',
        }),
      });
      
      if (createResponse.ok) {
        const payloadCreated = await createResponse.json();
        const result = payloadCreated?.data ?? payloadCreated;
        console.log('New conversation created:', result);
        
        // Set the conversationId and join the room
        activeConversationId.value = result.conversationId;
        joinConversation(result.conversationId);
        
        // Add message to UI immediately
        const newMsg = {
          id: (result.message && (result.message._id || result.message.id)) || Date.now().toString(),
          from: currentUser.value,
          to: recipient.value,
          content: messageContent,
          timestamp: new Date((result.message && result.message.createdAt) || Date.now()),
        };
        
        messages.value.push(newMsg);
        scrollToBottom();
        
        // Refresh conversations to show this new conversation
        await fetchConversations();
      } else {
        console.error('Failed to create conversation:', createResponse.statusText);
        newMessage.value = messageContent; // Restore message
      }
      return;
    }
    
    const response = await fetch('http://localhost:3000/api/v1/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const payloadRes = await response.json();
      const result = payloadRes?.data ?? payloadRes;
      console.log('Message sent:', result);
      
      // Add message to UI immediately for real-time display
      const newMsg = {
        id: (result.message && (result.message._id || result.message.id)) || Date.now().toString(),
        from: currentUser.value,
        to: recipient.value,
        content: messageContent,
        timestamp: new Date((result.message && result.message.createdAt) || Date.now()),
      };
      
      // Check if message doesn't already exist (avoid duplicates)
      const exists = messages.value.some(msg => msg.id === newMsg.id);
      if (!exists) {
        messages.value.push(newMsg);
        scrollToBottom();
      }
      // Refresh conversations to update last message in sidebar
      await fetchConversations();
    } else {
      console.error('Failed to send message:', response.statusText);
      // Restore message content if failed
      newMessage.value = messageContent;
    }
  } catch (error) {
    console.error('Error sending message:', error);
    // Restore message content if failed
    newMessage.value = messageContent;
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

const selectConversation = async (username: string) => {
  recipient.value = username;
  
  // Try to get conversation data from API conversations
  const conv = conversations.value.find(c => c.chatInfo.username === username);
  if (conv) {
    recipientId.value = conv.chatInfo.userId || '';
    
    // Leave previous conversation room if exists
    if (activeConversationId.value) {
      leaveConversation(activeConversationId.value);
    }
    
    activeConversationId.value = conv.conversationId;
    console.log('Selected existing conversation:', activeConversationId.value);
    
    // Join the conversation room via WebSocket
    console.log('Join conversation:');
    joinConversation(conv.conversationId);
    
    // Load message history from API
    await loadMessagesFromAPI(conv.conversationId);
  } else {
    // New conversation - no conversationId yet, will be created when first message is sent
    console.log('New conversation with:', username);
    
    // Clear messages for new conversation
    messages.value = [];
    
    // Leave previous conversation room if exists
    if (activeConversationId.value) {
      leaveConversation(activeConversationId.value);
    }
    
    // Clear active conversation ID - will be set when first message is sent
    activeConversationId.value = '';
    
    // Try to find the user ID from search or fetch user info
    // For now, we'll set it when sending the first message
    recipientId.value = '';
  }
};

// Handle starting new chat from search results
const startNewChat = async (user: { _id: string; username: string; phone?: string; photo?: string }) => {
  recipient.value = user.username;
  recipientId.value = user._id;
  
  // Clear messages for new conversation
  messages.value = [];
  
  // Leave previous conversation room if exists
  if (activeConversationId.value) {
    leaveConversation(activeConversationId.value);
  }
  
  // Check if conversation already exists in the list
  const existingConv = conversations.value.find(c => c.chatInfo.userId === user._id);
  if (existingConv) {
    // Use existing conversation
    activeConversationId.value = existingConv.conversationId;
    joinConversation(existingConv.conversationId);
    await loadMessagesFromAPI(existingConv.conversationId);
  } else {
    // New conversation - create it by sending first message or wait for user to send
    // For now, just set the recipient and wait for user to send message
    activeConversationId.value = '';
    console.log(`Ready to start new conversation with ${user.username} (${user._id})`);
  }
};

const promptNewChat = () => {
  const recipientName = prompt('Enter username to chat with:');
  if (recipientName && recipientName.trim()) {
    recipient.value = recipientName.trim();
    // Note: For new chats, we need to send a message first to create the conversation
    // Then the conversation will appear in the list
  }
};

onMounted(async () => {
  // Check authentication - TEMPORARILY DISABLED FOR TESTING
  const token = localStorage.getItem('access_token');
  const username = localStorage.getItem('username');
  
  // Uncomment to enable authentication check
  // if (!token || !username) {
  //   router.push('/login');
  //   return;
  // }
  
  if (username) {
    currentUser.value = username;
    //joinChat(username);
  }

  // Get user ID from token payload
  if (token) {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3 && tokenParts[1]) {
        const payload = JSON.parse(atob(tokenParts[1]));
        currentUserId.value = payload.sub;
        console.log('Current user ID:', currentUserId.value);
        
        // Fetch conversations from API
        await fetchConversations();
      }
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  }

  // Register callback to refresh conversation list when new message arrives
  setOnMessageCallback(async (message) => {
    console.log('New message received, refreshing conversation list...');
    await fetchConversations();
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
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
        :activeRecipient="recipient"
        :isConnected="isConnected"
        :showProfileDropdown="showProfileDropdown"
        :apiConversations="conversations"
        @selectConversation="selectConversation"
        @startNewChat="startNewChat"
        @toggleProfile="toggleProfileDropdown"
        @logout="logout"
        @goToProfile="goToProfile"
      />

      <!-- Show empty state if no conversations, otherwise show chat panel -->
      <div v-if="!hasConversations && !recipient" class="empty-state">
        <div class="empty-content">
          <div class="empty-icon">💬</div>
          <h3>No conversations yet</h3>
          <p>Start a conversation by clicking the button below</p>
          <button @click="promptNewChat" class="new-chat-btn">
            ➕ Start New Chat
          </button>
        </div>
      </div>

      <!-- Show welcome message if conversations exist but none selected -->
      <div v-else-if="!recipient" class="no-chat-selected">
        <div class="welcome-content">
          <h3>👋 Welcome back, {{ currentUser }}!</h3>
          <p>Select a conversation from the sidebar or start a new one</p>
          <button @click="promptNewChat" class="new-chat-input">
            ➕ New Chat
          </button>
        </div>
      </div>

      <!-- Chat messages panel -->
      <div v-else class="chat-container">
        <div class="chat-recipient-header">
          <div class="recipient-info">
            <div class="recipient-avatar">{{ recipient.charAt(0).toUpperCase() }}</div>
            <h3>{{ recipient }}</h3>
          </div>
        </div>

        <div class="messages-container" ref="messagesContainer">
          <div
            v-for="(msg, index) in conversationMessages"
            :key="index"
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
            placeholder="Type a message..."
          />
          <button @click="send" :disabled="!newMessage.trim()">Send</button>
        </div>
      </div>
    </div>

    <!-- Profile Settings Modal -->
    <ProfileSettings
      v-if="showProfileSettings"
      :currentUserId="currentUserId"
      @close="closeProfileSettings"
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

/* Chat Layout */
.chat-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: 100vh;
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
