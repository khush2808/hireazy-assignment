import { useEffect, useRef, useState, useCallback } from "react";
import socketService from "../services/socket";
import { SOCKET_EVENTS } from "../utils/constants";

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const mountedRef = useRef(true);
  const connectionInitialized = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    // Prevent multiple connections in React StrictMode
    if (connectionInitialized.current) {
      console.log("Socket connection already setup");
      return;
    }

    connectionInitialized.current = true;

    // Connect to socket
    const connectSocket = async () => {
      try {
        console.log("Setting up socket connection...");
        const socket = await socketService.connect();
        socketRef.current = socket;

        // Setup connection status handlers
        const handleConnect = () => {
          if (!mountedRef.current) return;
          console.log("Socket connected");
          setIsConnected(true);
          setError(null);
        };

        const handleDisconnect = (reason) => {
          if (!mountedRef.current) return;
          console.log("Socket disconnected:", reason);
          setIsConnected(false);

          // Only set error for unexpected disconnections
          if (
            reason === "io server disconnect" ||
            reason === "transport error"
          ) {
            setError("Connection lost. Attempting to reconnect...");
          }
        };

        const handleConnectError = (error) => {
          if (!mountedRef.current) return;
          console.error("Socket connection error:", error);
          setError(error.message || "Failed to connect to server");
          setIsConnected(false);
        };

        const handleError = (error) => {
          if (!mountedRef.current) return;
          console.error("Socket error:", error);
          setError(error.message || "Socket error occurred");
        };

        const handleReconnect = () => {
          if (!mountedRef.current) return;
          console.log("Socket reconnecting...");
          setError("Reconnecting...");
        };

        // Register event handlers
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);
        socket.on("reconnecting", handleReconnect);
        socket.on(SOCKET_EVENTS.ERROR, handleError);

        // Set initial connected state if already connected
        if (socket.connected) {
          setIsConnected(true);
          setError(null);
        }

        // Store cleanup function
        socketRef.current._cleanup = () => {
          socket.off("connect", handleConnect);
          socket.off("disconnect", handleDisconnect);
          socket.off("connect_error", handleConnectError);
          socket.off("reconnecting", handleReconnect);
          socket.off(SOCKET_EVENTS.ERROR, handleError);
        };
      } catch (error) {
        console.error("Failed to setup socket:", error);
        setError(error.message || "Failed to connect");
        setIsConnected(false);
      }
    };

    connectSocket();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      if (socketRef.current?._cleanup) {
        socketRef.current._cleanup();
      }
    };
  }, []); // Empty dependency array to run only once

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      connectionInitialized.current = false;
    };
  }, []);

  // Wait for connection helper
  const waitForConnection = useCallback((timeout = 5000) => {
    return new Promise((resolve, reject) => {
      if (socketRef.current?.connected) {
        resolve(true);
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, timeout);

      const checkConnection = () => {
        if (socketRef.current?.connected) {
          clearTimeout(timeoutId);
          resolve(true);
        } else {
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    socketService,
    waitForConnection,
  };
};
