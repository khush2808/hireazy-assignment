// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

// User types
export const USER_TYPES = {
  INTERVIEWER: "interviewer",
  CANDIDATE: "candidate",
};

// Room status
export const ROOM_STATUS = {
  WAITING: "waiting",
  ACTIVE: "active",
  ENDED: "ended",
};

// Socket events
export const SOCKET_EVENTS = {
  // Connection events
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  USER_JOINED: "user_joined",
  USER_LEFT: "user_left",
  ROOM_STATUS: "room_status",

  // Chat events
  SEND_MESSAGE: "send_message",
  NEW_MESSAGE: "new_message",
  TYPING_START: "typing_start",
  TYPING_STOP: "typing_stop",
  TYPING_INDICATOR: "typing_indicator",

  // Interview control events
  START_INTERVIEW: "start_interview",
  END_INTERVIEW: "end_interview",
  INTERVIEW_STARTED: "interview_started",
  INTERVIEW_ENDED: "interview_ended",

  // File events
  FILE_UPLOADED: "file_uploaded",
  FILE_DELETED: "file_deleted",

  // Error events
  ERROR: "error",
};

// File constraints
export const FILE_CONSTRAINTS = {
  MAX_SIZE_MB: 10,
  ALLOWED_TYPES: ["application/pdf", "text/plain"],
  ALLOWED_EXTENSIONS: [".pdf", ".txt"],
};

// API Endpoints
export const API_ENDPOINTS = {
  // Room endpoints
  ROOMS: "/api/rooms",
  ROOM_DETAILS: (roomId) => `/api/rooms/${roomId}`,
  JOIN_ROOM: (roomId) => `/api/rooms/${roomId}/join`,
  END_INTERVIEW: (roomId) => `/api/rooms/${roomId}`,

  // Message endpoints
  CHAT_HISTORY: (roomId) => `/api/messages/${roomId}`,

  // File endpoints
  UPLOAD_FILE: (roomId) => `/api/files/upload/${roomId}`,
  ROOM_FILES: (roomId) => `/api/files/room/${roomId}`,
  DOWNLOAD_FILE: (fileId) => `/api/files/${fileId}`,
  DELETE_FILE: (fileId) => `/api/files/${fileId}`,

  // Health check
  HEALTH: "/api/health",
};

// Validation patterns
export const VALIDATION_PATTERNS = {
  ROOM_ID: /^[A-Z0-9]{8}$/,
  USERNAME: /^[a-zA-Z0-9\s]{1,30}$/,
};

// UI Constants
export const UI_CONFIG = {
  MESSAGE_BATCH_SIZE: 50,
  TYPING_TIMEOUT: 1000,
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,
};
