<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useSocket } from '../composables/useSocket';
import ChatSidebar from './ChatSidebar.vue';

const { messages, isConnected, sendMessage } = useSocket();

const currentUser = ref('');
const recipient = ref('');
const newMessage = ref('');
const showLoginForm = ref(true);

// Filter messages for current conversation
const conversationMessages = computed(() => {
  return messages.value.filter(
    (msg) =>
      (msg.from === currentUser.value && msg.to === recipient.value) ||
      (msg.from === recipient.value && msg.to === currentUser.value)
  );
});

const login = () => {
  if (currentUser.value.trim()) {
    showLoginForm.value = false;
  }
};

const send = () => {
  if (newMessage.value.trim()) {
    sendMessage(currentUser.value, recipient.value, newMessage.value);
    newMessage.value = '';
  }
};

const logout = () => {
  showLoginForm.value = true;
  currentUser.value = '';
  recipient.value = '';
};

const selectConversation = (username: string) => {
  recipient.value = username;
};
</script>

<template>
  <!-- Login Form -->
  <div v-if="showLoginForm" class="login-container">
    <div class="login-form">
      <h2>🗨️ Chat App</h2>
      <p class="subtitle">Enter your details to start chatting</p>
      
      <div class="form-group">
        <label>Your Username</label>
        <input
          v-model="currentUser"
          @keyup.enter="login"
          placeholder="e.g., Alice"
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label>Chat with (optional - can select from sidebar)</label>
        <input
          v-model="recipient"
          @keyup.enter="login"
          placeholder="e.g., Bob"
          class="form-input"
        />
      </div>
      
      <button @click="login" class="login-btn">
        Start Chatting
      </button>
    </div>
  </div>

  <!-- Chat Interface -->
  <div v-else class="chat-layout">
    <!-- Sidebar -->
    <ChatSidebar
      :messages="messages"
      :currentUser="currentUser"
      :activeRecipient="recipient"
      :isConnected="isConnected"
      :showProfileDropdown="false"
      @selectConversation="selectConversation"
    />

    <!-- Main Chat Area -->
    <div class="chat-container">
      <!-- Show placeholder if no recipient selected -->
      <div v-if="!recipient" class="no-chat-selected">
        <div class="no-chat-content">
          <h2>💬 Welcome to Chat App</h2>
          <p>Select a conversation from the sidebar to start chatting</p>
          <p class="hint">or enter a username in the field below to start a new chat</p>
          <input
            v-model="recipient"
            placeholder="Enter username to chat with..."
            class="new-chat-input"
          />
        </div>
      </div>

      <!-- Chat interface when recipient is selected -->
      <template v-else>
        <div class="chat-header">
          <div class="header-content">
            <div>
              <h2>{{ recipient }}</h2>
              <span class="status" :class="{ connected: isConnected, disconnected: !isConnected }">
                {{ isConnected ? '🟢 Online' : '🔴 Offline' }}
              </span>
            </div>
            <div class="user-actions">
              <span class="current-user">You: {{ currentUser }}</span>
              <button @click="logout" class="logout-btn">Logout</button>
            </div>
          </div>
        </div>

        <div class="messages-container">
          <div
            v-for="msg in conversationMessages"
            :key="msg.id"
            :class="['message', msg.from === currentUser ? 'sent' : 'received']"
          >
            <div class="message-header">
              <strong>{{ msg.from === currentUser ? 'You' : msg.from }}</strong>
              <span class="timestamp">{{ new Date(msg.timestamp).toLocaleTimeString() }}</span>
            </div>
            <div class="message-content">{{ msg.content }}</div>
          </div>
          <div v-if="conversationMessages.length === 0" class="empty-state">
            No messages yet. Say hi to {{ recipient }}! 👋
          </div>
        </div>

        <div class="input-area">
          <input
            v-model="newMessage"
            @keyup.enter="send"
            :placeholder="`Message ${recipient}...`"
            :disabled="!isConnected"
          />
          <button @click="send" :disabled="!isConnected || !newMessage.trim()">
            Send
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Login Form Styles */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

/* Chat Layout with Sidebar */
.chat-layout {
  display: flex;
  height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
  background: #f5f5f5;
}

.login-form {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-form h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 2rem;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: #666;
  margin: 0 0 2rem 0;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-input {
  width: 100%;
  padding: 0.875rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.login-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

.login-btn:active {
  transform: translateY(0);
}

/* Chat Container Styles */
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

/* No Chat Selected State */
.no-chat-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.no-chat-content {
  text-align: center;
  padding: 3rem;
  max-width: 500px;
}

.no-chat-content h2 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.no-chat-content p {
  color: #666;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.no-chat-content .hint {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 1.5rem;
}

.new-chat-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #667eea;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s;
  background: white;
}

.new-chat-input:focus {
  outline: none;
  border-color: #764ba2;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h2 {
  margin: 0 0 0.3rem 0;
  font-size: 1.5rem;
}

.status {
  font-size: 0.85rem;
  font-weight: 500;
}

.connected {
  color: #4ade80;
}

.disconnected {
  color: #fca5a5;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.current-user {
  font-size: 0.9rem;
  opacity: 0.9;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #f9fafb;
}

.message {
  margin-bottom: 1rem;
  padding: 0.8rem 1rem;
  border-radius: 12px;
  max-width: 70%;
  animation: slideIn 0.3s ease-out;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.sent {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-left: auto;
  text-align: right;
  border-bottom-right-radius: 4px;
}

.message.received {
  background: white;
  color: #333;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 4px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.4rem;
  font-size: 0.85rem;
}

.message.sent .message-header {
  opacity: 0.9;
}

.message.received .message-header strong {
  color: #667eea;
}

.timestamp {
  opacity: 0.7;
  font-size: 0.75rem;
}

.message-content {
  word-wrap: break-word;
  line-height: 1.5;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 3rem;
  font-style: italic;
}

.input-area {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.input-area input {
  flex: 1;
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 24px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.input-area input:focus {
  outline: none;
  border-color: #667eea;
}

.input-area button {
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

.input-area button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.input-area button:active:not(:disabled) {
  transform: translateY(0);
}

.input-area button:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
