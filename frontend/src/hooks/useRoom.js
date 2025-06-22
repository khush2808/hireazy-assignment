import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "./useSocket";
import { roomAPI } from "../services/api";
import { SOCKET_EVENTS, ROOM_STATUS } from "../utils/constants";
import toast from "react-hot-toast";

export const useRoom = (roomId, userData = null) => {
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [roomStatus, setRoomStatus] = useState(null);
  const [users, setUsers] = useState({
    interviewer: { connected: false, userName: null },
    candidate: { connected: false, userName: null },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userDataRef = useRef(null);
  const mountedRef = useRef(true);
  const joinAttemptRef = useRef(false);

  // Set user data if provided
  useEffect(() => {
    if (userData && userData.userType && userData.userName) {
      userDataRef.current = {
        userType: userData.userType,
        userName: userData.userName,
      };
    }
  }, [userData]);

  // Fetch room details
  const fetchRoomData = async () => {
    if (!roomId || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const response = await roomAPI.getRoomDetails(roomId);

      if (!mountedRef.current) return;

      setRoomData(response.data);
      setRoomStatus(response.data.status);
      setUsers({
        interviewer: response.data.interviewer || {
          connected: false,
          userName: null,
        },
        candidate: response.data.candidate || {
          connected: false,
          userName: null,
        },
      });
    } catch (err) {
      if (!mountedRef.current) return;

      const errorMessage = err.message || "Failed to fetch room data";
      setError(errorMessage);
      console.error("Room fetch error:", err);

      // Only show toast if it's not a 404 (room not found)
      if (!err.message?.includes("not found")) {
        toast.error(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Join room
  const joinRoom = async (userType, userName) => {
    if (!userType || !userName?.trim()) {
      throw new Error("User type and name are required");
    }

    // Prevent duplicate join attempts
    if (joinAttemptRef.current) {
      console.log("Join attempt already in progress, skipping");
      return;
    }

    try {
      joinAttemptRef.current = true;
      // First, validate with API
      const response = await roomAPI.joinRoom(roomId, {
        userType,
        userName: userName.trim(),
      });

      // Store user data (use response data if available, fallback to provided data)
      userDataRef.current = {
        userType: response.data?.userType || userType,
        userName: response.data?.userName || userName.trim(),
      };

      // Wait for socket connection if not already connected
      if (!socket || !socket.connected) {
        console.log("Waiting for socket connection...");

        // Try to connect if not connected
        if (!socket) {
          const newSocket = socketService.connect();
          // Wait a bit for connection to setup
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Check if connected after waiting
        if (!socket || !socket.connected) {
          throw new Error(
            "Unable to setup socket connection. Please refresh and try again."
          );
        }
      }

      // Join via socket
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, {
        roomId,
        userType: userDataRef.current.userType,
        userName: userDataRef.current.userName,
      });

      // Reset join attempt flag on success
      setTimeout(() => {
        joinAttemptRef.current = false;
      }, 3000);

      return true;
    } catch (err) {
      // Reset join attempt flag on error
      joinAttemptRef.current = false;

      const errorMessage = err.message || "Failed to join room";
      console.error("Join room error:", err);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Start interview
  const startInterview = () => {
    console.log("Frontend startInterview called:", {
      userDataRef: userDataRef.current,
      userData: userData,
      socket: !!socket,
      connected: socket?.connected,
    });

    if (!socket || !socket.connected) {
      toast.error("Not connected to server");
      return;
    }

    if (userDataRef.current?.userType !== "interviewer") {
      console.log("Frontend: User is not interviewer:", {
        currentUserType: userDataRef.current?.userType,
        currentUserName: userDataRef.current?.userName,
        expectedType: "interviewer",
      });
      toast.error("Only interviewer can start the interview");
      return;
    }

    try {
      console.log(
        `Frontend: Sending START_INTERVIEW from socket ${socket.id}`,
        {
          userType: userDataRef.current?.userType,
          userName: userDataRef.current?.userName,
          socketConnected: socket.connected,
        }
      );

      socket.emit(SOCKET_EVENTS.START_INTERVIEW);
    } catch (err) {
      console.error("Start interview error:", err);
      toast.error("Failed to start interview");
    }
  };

  // End interview
  const endInterview = () => {
    console.log("Frontend endInterview called:", {
      userDataRef: userDataRef.current,
      userData: userData,
      socket: !!socket,
      connected: socket?.connected,
    });

    if (!socket || !isConnected) {
      toast.error("Not connected to server");
      return;
    }

    if (userDataRef.current?.userType !== "interviewer") {
      console.log("Frontend: User is not interviewer:", {
        currentUserType: userDataRef.current?.userType,
        currentUserName: userDataRef.current?.userName,
        expectedType: "interviewer",
      });
      toast.error("Only interviewer can end the interview");
      return;
    }

    try {
      console.log(`Frontend: Sending END_INTERVIEW from socket ${socket.id}`, {
        userType: userDataRef.current?.userType,
        userName: userDataRef.current?.userName,
        socketConnected: socket.connected,
      });

      socket.emit(SOCKET_EVENTS.END_INTERVIEW);
    } catch (err) {
      console.error("End interview error:", err);
      toast.error("Failed to end interview");
    }
  };

  // Setup socket event listeners
  useEffect(() => {
    if (!socket || !mountedRef.current) return;

    const handleUserJoined = (data) => {
      if (!mountedRef.current) return;

      setUsers((prev) => ({
        ...prev,
        [data.userType]: {
          connected: true,
          userName: data.userName,
        },
      }));

      // Only show toast if it's not the current user
      if (data.userName !== userDataRef.current?.userName) {
        toast.success(`${data.userName} joined as ${data.userType}`);
      }
    };

    const handleUserLeft = (data) => {
      if (!mountedRef.current) return;

      setUsers((prev) => ({
        ...prev,
        [data.userType]: {
          connected: false,
          userName: null,
        },
      }));

      toast.info(`${data.userName} left the room`);
    };

    const handleRoomStatus = (data) => {
      if (!mountedRef.current) return;
      setRoomStatus(data.status);

      // Update user information if provided
      if (
        data.interviewerName !== undefined ||
        data.candidateName !== undefined
      ) {
        setUsers((prev) => ({
          interviewer: {
            connected: data.interviewerPresent || prev.interviewer.connected,
            userName: data.interviewerName || prev.interviewer.userName,
          },
          candidate: {
            connected: data.candidatePresent || prev.candidate.connected,
            userName: data.candidateName || prev.candidate.userName,
          },
        }));
      }
    };

    const handleInterviewStarted = () => {
      if (!mountedRef.current) return;
      setRoomStatus(ROOM_STATUS.ACTIVE);
      toast.success("Interview has started!");
    };

    const handleInterviewEnded = (data) => {
      if (!mountedRef.current) return;

      console.log("Frontend: Interview ended", data);
      setRoomStatus(ROOM_STATUS.ENDED);

      // Show different messages for different users
      const currentUserType = userDataRef.current?.userType;
      if (currentUserType === "interviewer") {
        toast.success("Interview ended successfully!");
      } else {
        toast.info("Interview has ended");
      }

      // Navigate back to home after a short delay
      setTimeout(() => {
        console.log("Navigating to home page...");
        navigate("/");
      }, 2000); // 2-second delay to let user see the toast
    };

    const handleSocketError = (error) => {
      if (!mountedRef.current) return;
      console.error("Room socket error:", error);
      toast.error(error.message || "Connection error occurred");
    };

    // Register event listeners
    socket.on(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
    socket.on(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
    socket.on(SOCKET_EVENTS.ROOM_STATUS, handleRoomStatus);
    socket.on(SOCKET_EVENTS.INTERVIEW_STARTED, handleInterviewStarted);
    socket.on(SOCKET_EVENTS.INTERVIEW_ENDED, handleInterviewEnded);
    socket.on(SOCKET_EVENTS.ERROR, handleSocketError);

    // Cleanup
    return () => {
      socket.off(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
      socket.off(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
      socket.off(SOCKET_EVENTS.ROOM_STATUS, handleRoomStatus);
      socket.off(SOCKET_EVENTS.INTERVIEW_STARTED, handleInterviewStarted);
      socket.off(SOCKET_EVENTS.INTERVIEW_ENDED, handleInterviewEnded);
      socket.off(SOCKET_EVENTS.ERROR, handleSocketError);
    };
  }, [socket]);

  // Fetch room data on mount
  useEffect(() => {
    mountedRef.current = true;
    fetchRoomData();

    return () => {
      mountedRef.current = false;
    };
  }, [roomId]);

  return {
    roomData,
    roomStatus,
    users,
    loading,
    error,
    userType: userDataRef.current?.userType,
    userName: userDataRef.current?.userName,
    isConnected,
    joinRoom,
    startInterview,
    endInterview,
    refreshRoom: fetchRoomData,
  };
};
