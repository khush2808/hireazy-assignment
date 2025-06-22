// User types
const USER_TYPES = {
  INTERVIEWER: "interviewer",
  CANDIDATE: "candidate",
};

// Room status
const ROOM_STATUS = {
  WAITING: "waiting",
  ACTIVE: "active",
  ENDED: "ended",
};

// Message types
const MESSAGE_TYPES = {
  TEXT: "text",
  SYSTEM: "system",
};

// Socket events
const SOCKET_EVENTS = {
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
const FILE_CONSTRAINTS = {
  MAX_SIZE_MB: 10,
  ALLOWED_TYPES: ["application/pdf", "text/plain"],
  ALLOWED_EXTENSIONS: [".pdf", ".txt"],
};

// Validation patterns
const VALIDATION_PATTERNS = {
  ROOM_ID: /^[A-Z0-9]{8}$/,
  USERNAME: /^[a-zA-Z0-9\s]{1,30}$/,
};

module.exports = {
  USER_TYPES,
  ROOM_STATUS,
  MESSAGE_TYPES,
  SOCKET_EVENTS,
  FILE_CONSTRAINTS,
  VALIDATION_PATTERNS,
};
