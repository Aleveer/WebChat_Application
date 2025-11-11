import { ref, onUnmounted } from "vue";
import { io, Socket } from "socket.io-client";
import type { Message } from "../types/message";

export function useSocket() {
  // Include JWT in the socket handshake auth so the server can authenticate the socket
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const socket: Socket = io("http://localhost:3000", {
    auth: {
      token,
    },
  });
  const messages = ref<Message[]>([]);
  const isConnected = ref(false);

  // Callback for when a new message is received
  let onMessageCallback: ((message: Message) => void) | null = null;

  socket.on("connect", () => {
    console.log("Connected to server");
    isConnected.value = true;
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from server");
    isConnected.value = false;
  });

  socket.on("receiveMessage", (message: Message) => {
    console.log("Received message:", message);
    // Check if message already exists (to prevent duplicates)
    const exists = messages.value.some((msg) => msg.id === message.id);
    if (!exists) {
      messages.value.push(message);
    }

    // Call the callback if registered (for conversation list refresh)
    if (onMessageCallback) {
      onMessageCallback(message);
    }
  });

  const setOnMessageCallback = (callback: (message: Message) => void) => {
    onMessageCallback = callback;
  };

  // const joinChat = (username: string) => {
  //   socket.emit('join', username);
  // };

  const joinConversation = (conversationId: string) => {
    socket.emit("joinConversation", conversationId);
    console.log(`Joined conversation room: ${conversationId}`);
  };

  const leaveConversation = (conversationId: string) => {
    socket.emit("leaveConversation", conversationId);
    console.log(`Left conversation room: ${conversationId}`);
  };

  const sendMessage = (from: string, to: string, content: string) => {
    if (!content.trim()) return;

    socket.emit("sendMessage", {
      from,
      to,
      content,
    });
  };

  onUnmounted(() => {
    socket.disconnect();
  });

  return {
    messages,
    isConnected,
    //joinChat,
    joinConversation,
    leaveConversation,
    sendMessage,
    setOnMessageCallback,
  };
}
