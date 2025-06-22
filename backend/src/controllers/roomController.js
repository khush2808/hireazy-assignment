const Room = require("../models/Room");
const Message = require("../models/Message");
const { generateRoomId } = require("../utils/generateRoomId");
const { ROOM_STATUS, SOCKET_EVENTS } = require("../utils/constants");

const createRoom = async (req, res) => {
  try {
    let roomId;
    let existingRoom;

    // Generate unique room ID
    do {
      roomId = generateRoomId();
      existingRoom = await Room.findOne({ roomId });
    } while (existingRoom);

    // Create new room
    const room = new Room({
      roomId,
      status: ROOM_STATUS.WAITING,
    });

    await room.save();

    res.status(201).json({
      success: true,
      data: {
        roomId: room.roomId,
        status: room.status,
        createdAt: room.createdAt,
      },
    });

    console.log(`New room created: ${roomId}`);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create room",
    });
  }
};

const getRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Prepare response data
    const responseData = {
      roomId: room.roomId,
      status: room.status,
      createdAt: room.createdAt,
      interviewStartedAt: room.interviewStartedAt,
      interviewEndedAt: room.interviewEndedAt,
      interviewer: {
        connected: room.interviewer.connected,
        userName: room.interviewer.userName,
        joinedAt: room.interviewer.joinedAt,
      },
      candidate: {
        connected: room.candidate.connected,
        userName: room.candidate.userName,
        joinedAt: room.candidate.joinedAt,
      },
      settings: room.settings,
    };

    // Add interview duration if available
    if (room.interviewDuration) {
      responseData.interviewDuration = room.interviewDuration;
    }

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error getting room details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get room details",
    });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userType, userName } = req.body;
    const io = req.app.get("socketio"); // Get socket.io instance

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    if (room.status === ROOM_STATUS.ENDED) {
      return res.status(400).json({
        success: false,
        error: "Interview has already ended",
      });
    }

    if (userType === "interviewer" && room.interviewer.connected) {
      return res.status(400).json({
        success: false,
        error: "Interviewer already connected",
      });
    }

    if (userType === "candidate" && room.candidate.connected) {
      return res.status(400).json({
        success: false,
        error: "Candidate already connected",
      });
    }

    // Actually join the user to the room (mark as connected)
    const updateData = {
      [`${userType}.connected`]: true,
      [`${userType}.userName`]: userName,
      [`${userType}.joinedAt`]: new Date(),
    };

    const updatedRoom = await Room.findOneAndUpdate({ roomId }, updateData, {
      new: true,
    });

    // Create system message for joining
    const systemMessage = new Message({
      messageId: generateRoomId(),
      roomId,
      userName: "System",
      userType: userType,
      message: `${userName} joined as ${userType}`,
      messageType: "system",
    });

    await systemMessage.save();

    // Emit socket events to notify all users in the room
    if (io) {
      // Notify all users that a new user joined
      io.to(roomId).emit(SOCKET_EVENTS.USER_JOINED, {
        userName,
        userType,
        timestamp: new Date(),
      });

      // Broadcast updated room status with user names
      io.to(roomId).emit(SOCKET_EVENTS.ROOM_STATUS, {
        interviewerPresent: updatedRoom.interviewer.connected,
        candidatePresent: updatedRoom.candidate.connected,
        interviewerName: updatedRoom.interviewer.userName,
        candidateName: updatedRoom.candidate.userName,
        status: updatedRoom.status,
      });

      // Broadcast system message
      io.to(roomId).emit(SOCKET_EVENTS.NEW_MESSAGE, {
        messageId: systemMessage.messageId,
        userName: "System",
        userType: "system",
        message: systemMessage.message,
        messageType: "system",
        timestamp: systemMessage.timestamp,
      });
    }

    console.log(
      `${userName} joined room ${roomId} as ${userType} via REST API`
    );

    res.json({
      success: true,
      message: "Successfully joined room",
      data: {
        roomId: updatedRoom.roomId,
        status: updatedRoom.status,
        userType,
        userName,
        joinedAt: updateData[`${userType}.joinedAt`],
        availableSlots: {
          interviewer: !updatedRoom.interviewer.connected,
          candidate: !updatedRoom.candidate.connected,
        },
      },
    });
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({
      success: false,
      error: "Failed to join room",
    });
  }
};

// End interview (interviewer only)
const endInterview = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    if (room.status === ROOM_STATUS.ENDED) {
      return res.status(400).json({
        success: false,
        error: "Interview has already ended",
      });
    }

    // Update room status
    room.status = ROOM_STATUS.ENDED;
    room.interviewEndedAt = new Date();

    await room.save();

    // Calculate duration if interview was started
    let duration = null;
    if (room.interviewStartedAt) {
      duration =
        room.interviewEndedAt.getTime() - room.interviewStartedAt.getTime();
    }

    res.json({
      success: true,
      message: "Interview ended successfully",
      data: {
        roomId: room.roomId,
        status: room.status,
        endedAt: room.interviewEndedAt,
        duration,
      },
    });

    console.log(`🏁 Interview ended in room ${roomId}`);
  } catch (error) {
    console.error("Error ending interview:", error);
    res.status(500).json({
      success: false,
      error: "Failed to end interview",
    });
  }
};

module.exports = {
  createRoom,
  getRoomDetails,
  joinRoom,
  endInterview,
};
