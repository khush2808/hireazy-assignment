import { io } from "socket.io-client";
import { API_BASE_URL, SOCKET_EVENTS, UI_CONFIG } from "../utils/constants";

class SocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = UI_CONFIG.RECONNECT_ATTEMPTS;
    this.reconnectDelay = UI_CONFIG.RECONNECT_DELAY;
    this.isConnecting = false;
    this.connectionPromise = null;
  }

  // Setup socket connection
  connect() {
    // If already connected, return existing socket
    if (this.socket?.connected) {
      console.log("Socket already connected:", this.socket.id);
      return this.socket;
    }

    // If already in process of connecting, return the promise
    if (this.isConnecting && this.connectionPromise) {
      console.log("Connection already in progress...");
      return this.connectionPromise;
    }

    // If socket exists but not connected, disconnect first
    if (this.socket && !this.socket.connected) {
      console.log("Cleaning up existing disconnected socket");
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnecting = true;
    console.log("Connecting to socket server...");

    this.connectionPromise = new Promise((resolve, reject) => {
      this.socket = io(API_BASE_URL, {
        transports: ["websocket", "polling"],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 10000,
        forceNew: false, // Don't force new connections
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.setupEventHandlers();

      // Resolve promise when connected
      this.socket.on("connect", () => {
        this.isConnecting = false;
        this.connectionPromise = null;
        resolve(this.socket);
      });

      // Reject promise on connection error
      this.socket.on("connect_error", (error) => {
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      });
    });

    return this.connectionPromise;
  }

  // Setup socket event handlers
  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      this.isConnecting = false;
      this.connectionPromise = null;

      // Only auto-reconnect for server-side disconnections
      if (reason === "io server disconnect" || reason === "transport error") {
        this.handleReconnect();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      this.isConnecting = false;
      this.connectionPromise = null;
      this.handleReconnect();
    });

    this.socket.on(SOCKET_EVENTS.ERROR, (error) => {
      console.error("Socket error:", error);
    });
  }

  // Handle reconnection logic
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    if (this.isConnecting) {
      console.log("Reconnection already in progress...");
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      if (!this.socket?.connected && !this.isConnecting) {
        this.connect();
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  // Join room
  joinRoom(roomData) {
    if (!this.socket?.connected) {
      throw new Error("Socket not connected");
    }

    console.log("Joining room:", roomData);
    this.socket.emit(SOCKET_EVENTS.JOIN_ROOM, roomData);
  }

  // Send message
  sendMessage(message) {
    if (!this.socket?.connected) {
      throw new Error("Socket not connected");
    }

    this.socket.emit(SOCKET_EVENTS.SEND_MESSAGE, { message });
  }

  // Start typing
  startTyping() {
    if (!this.socket?.connected) return;
    this.socket.emit(SOCKET_EVENTS.TYPING_START);
  }

  // Stop typing
  stopTyping() {
    if (!this.socket?.connected) return;
    this.socket.emit(SOCKET_EVENTS.TYPING_STOP);
  }

  // Start interview
  startInterview() {
    if (!this.socket?.connected) {
      throw new Error("Socket not connected");
    }
    this.socket.emit(SOCKET_EVENTS.START_INTERVIEW);
  }

  // End interview
  endInterview() {
    if (!this.socket?.connected) {
      throw new Error("Socket not connected");
    }
    this.socket.emit(SOCKET_EVENTS.END_INTERVIEW);
  }

  // Event listeners
  on(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      console.log("Disconnecting socket...");
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
