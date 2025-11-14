import { ref, onUnmounted } from "vue";
import { io, Socket } from "socket.io-client";
import type { Message } from "../types/message";

const API_BASE_URL =
  ((import.meta as any)?.env?.VITE_API_BASE_URL?.replace?.(/\/$/, "")) ||
  "http://localhost:3000";

const resolveFileUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

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

  socket.on("receiveMessage", (message: any) => {
    console.log("Received message:", message);
    const conversationType =
      message.conversationType ||
      message.conversation_type ||
      (message.groupId ? "group" : undefined) ||
      "direct";
    const normalized: Message = {
      ...(message as Message),
      timestamp: message.timestamp
        ? new Date(message.timestamp)
        : new Date(),
      attachmentUrl: resolveFileUrl(
        message.attachmentUrl || message.attachment_url || null
      ),
      attachmentType: message.attachmentType || message.attachment_type,
      messageType: message.messageType || message.type || "text",
      conversationType,
      isDeleted: message.isDeleted ?? false,
      isEdited: message.isEdited ?? false,
      senderId:
        typeof message.senderId === "object"
          ? message.senderId?._id || message.senderId?.id
          : message.senderId,
    };
    normalized.type = normalized.conversationType;
    normalized.content = normalized.isDeleted ? "" : normalized.content || "";
    // Check if message already exists (to prevent duplicates)
    const exists = messages.value.some((msg) => msg.id === normalized.id);
    if (!exists) {
      messages.value.push(normalized);
    }

    // Call the callback if registered (for conversation list refresh)
    if (onMessageCallback) {
      onMessageCallback(normalized);
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
    socket,
    //joinChat,
    joinConversation,
    leaveConversation,
    sendMessage,
    setOnMessageCallback,
  };
}
