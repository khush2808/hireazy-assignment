const { SOCKET_EVENTS, USER_TYPES } = require("../utils/constants");
const Room = require("../models/Room");
const Message = require("../models/Message");
const { generateMessageId } = require("../utils/generateRoomId");

const socketConfig = (io) => {
  const activeConnections = new Map();

  io.on("connection", (socket) => {
    console.log(`New socket connection: ${socket.id}`);

    socket.on(SOCKET_EVENTS.JOIN_ROOM, async (data) => {
      try {
        const { roomId, userType, userName } = data;
        console.log(`JOIN_ROOM event received:`, {
          roomId,
          userType,
          userName,
          socketId: socket.id,
        });

        // Validate input
        if (!roomId || !userType || !userName) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: "Missing required fields",
          });
          return;
        }

        if (!Object.values(USER_TYPES).includes(userType)) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: "Invalid user type" });
          return;
        }

        // Find the room
        let room = await Room.findOne({ roomId });
        if (!room) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: "Room not found" });
          return;
        }

        console.log(`Room state before update:`, {
          interviewer: {
            connected: room.interviewer.connected,
            userName: room.interviewer.userName,
          },
          candidate: {
            connected: room.candidate.connected,
            userName: room.candidate.userName,
          },
        });

        // Check if user type is already taken by someone else
        if (
          userType === USER_TYPES.INTERVIEWER &&
          room.interviewer.connected &&
          room.interviewer.userName !== userName
        ) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: "Interviewer already connected",
          });
          return;
        }

        if (
          userType === USER_TYPES.CANDIDATE &&
          room.candidate.connected &&
          room.candidate.userName !== userName
        ) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: "Candidate already connected",
          });
          return;
        }

        // Store if user was already connected (before update)
        const wasAlreadyConnected = room[userType].connected;

        // Update room with socket connection (if not already connected via REST)
        const updateData = {
          [`${userType}.socketId`]: socket.id,
        };

        // Only update connection status if not already connected
        if (!room[userType].connected) {
          updateData[`${userType}.connected`] = true;
          updateData[`${userType}.userName`] = userName;
          updateData[`${userType}.joinedAt`] = new Date();
        }

        room = await Room.findOneAndUpdate({ roomId }, updateData, {
          new: true,
        });

        // Join socket room
        socket.join(roomId);

        // Remove any existing connections for this user in this room (prevent duplicates)
        for (const [
          existingSocketId,
          existingConnection,
        ] of activeConnections.entries()) {
          if (
            existingConnection.roomId === roomId &&
            existingConnection.userType === userType &&
            existingConnection.userName === userName
          ) {
            console.log(
              `Removing duplicate connection for socket ${existingSocketId}`
            );
            activeConnections.delete(existingSocketId);
          }
        }

        activeConnections.set(socket.id, { roomId, userType, userName });
        console.log(`activeConnections.set called for socket ${socket.id}:`, {
          roomId,
          userType,
          userName,
        });
        console.log(`Total active connections:`, activeConnections.size);

        // Notify all users in the room
        socket.to(roomId).emit(SOCKET_EVENTS.USER_JOINED, {
          userName,
          userType,
          timestamp: new Date(),
        });

        // Send room status to all users
        io.to(roomId).emit(SOCKET_EVENTS.ROOM_STATUS, {
          interviewerPresent: room.interviewer.connected,
          candidatePresent: room.candidate.connected,
          interviewerName: room.interviewer.userName,
          candidateName: room.candidate.userName,
          status: room.status,
        });

        // Create system message only if user wasn't already connected via REST
        if (!wasAlreadyConnected) {
          const systemMessage = new Message({
            messageId: generateMessageId(),
            roomId,
            userName: "System",
            userType: userType,
            message: `${userName} joined as ${userType}`,
            messageType: "system",
          });

          await systemMessage.save();

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
          `${userName} joined room ${roomId} as ${userType} (socket connected)`
        );
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit(SOCKET_EVENTS.ERROR, { message: "Failed to join room" });
      }
    });

    socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (data) => {
      try {
        const { message } = data;
        const connectionInfo = activeConnections.get(socket.id);

        if (!connectionInfo) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: "Not connected to any room",
          });
          return;
        }

        if (!message || message.trim().length === 0) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: "Message cannot be empty",
          });
          return;
        }

        const { roomId, userType, userName } = connectionInfo;

        // Create message
        const newMessage = new Message({
          messageId: generateMessageId(),
          roomId,
          userName,
          userType,
          message: message.trim(),
          messageType: "text",
        });

        await newMessage.save();

        // Broadcast message to all users in room
        io.to(roomId).emit(SOCKET_EVENTS.NEW_MESSAGE, {
          messageId: newMessage.messageId,
          userName,
          userType,
          message: newMessage.message,
          messageType: "text",
          timestamp: newMessage.timestamp,
        });

        console.log(`Message from ${userName} in room ${roomId}`);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit(SOCKET_EVENTS.ERROR, { message: "Failed to send message" });
      }
    });

    // Handle typing indicators
    socket.on(SOCKET_EVENTS.TYPING_START, () => {
      const connectionInfo = activeConnections.get(socket.id);
      if (connectionInfo) {
        socket.to(connectionInfo.roomId).emit(SOCKET_EVENTS.TYPING_INDICATOR, {
          userName: connectionInfo.userName,
          userType: connectionInfo.userType,
          isTyping: true,
        });
      }
    });

    socket.on(SOCKET_EVENTS.TYPING_STOP, () => {
      const connectionInfo = activeConnections.get(socket.id);
      if (connectionInfo) {
        socket.to(connectionInfo.roomId).emit(SOCKET_EVENTS.TYPING_INDICATOR, {
          userName: connectionInfo.userName,
          userType: connectionInfo.userType,
          isTyping: false,
        });
      }
    });

    // Handle interview start (interviewer only)
    socket.on(SOCKET_EVENTS.START_INTERVIEW, async () => {
      try {
        console.log(`START_INTERVIEW event received from socket ${socket.id}`);
        const connectionInfo = activeConnections.get(socket.id);
        console.log(
          `Looking up activeConnections for socket ${socket.id}:`,
          connectionInfo
        );
        console.log(
          `All active connections:`,
          Array.from(activeConnections.entries())
        );

        if (!connectionInfo) {
          console.log(`❌ No connection info found for socket ${socket.id}`);

          // Try to find any interviewer connection in activeConnections as fallback
          let interviewerConnection = null;
          for (const [socketId, conn] of activeConnections.entries()) {
            if (conn.userType === USER_TYPES.INTERVIEWER) {
              interviewerConnection = conn;
              console.log(`Found fallback interviewer connection:`, {
                socketId,
                conn,
              });
              break;
            }
          }

          if (!interviewerConnection) {
            socket.emit(SOCKET_EVENTS.ERROR, {
              message: "Not connected to any room",
            });
            return;
          }

          // Use the fallback connection info
          console.log(
            `Using fallback interviewer connection for START_INTERVIEW`
          );
          connectionInfo = interviewerConnection;
        }

        if (connectionInfo.userType !== USER_TYPES.INTERVIEWER) {
          console.log(
            `User ${connectionInfo.userName} is ${connectionInfo.userType}, not interviewer`
          );
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: "Only interviewer can start interview",
          });
          return;
        }

        const { roomId } = connectionInfo;

        // Update room status
        const room = await Room.findOneAndUpdate(
          { roomId },
          {
            status: "active",
            interviewStartedAt: new Date(),
          },
          { new: true }
        );

        if (!room) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: "Room not found" });
          return;
        }

        // Notify all users
        io.to(roomId).emit(SOCKET_EVENTS.INTERVIEW_STARTED, {
          timestamp: room.interviewStartedAt,
        });

        console.log(`Interview started in room ${roomId}`);
      } catch (error) {
        console.error("Error starting interview:", error);
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: "Failed to start interview",
        });
      }
    });

    // Handle interview end (interviewer only)
    socket.on(SOCKET_EVENTS.END_INTERVIEW, async () => {
      try {
        console.log(`END_INTERVIEW event received from socket ${socket.id}`);
        const connectionInfo = activeConnections.get(socket.id);
        console.log(
          `Looking up activeConnections for socket ${socket.id}:`,
          connectionInfo
        );

        if (!connectionInfo) {
          console.log(`No connection info found for socket ${socket.id}`);

          // Try to find any interviewer connection in activeConnections as fallback
          let interviewerConnection = null;
          for (const [socketId, conn] of activeConnections.entries()) {
            if (conn.userType === USER_TYPES.INTERVIEWER) {
              interviewerConnection = conn;
              console.log(`Found fallback interviewer connection:`, {
                socketId,
                conn,
              });
              break;
            }
          }

          if (!interviewerConnection) {
            socket.emit(SOCKET_EVENTS.ERROR, {
              message: "Not connected to any room",
            });
            return;
          }

          // Use the fallback connection info
          console.log(
            `Using fallback interviewer connection for END_INTERVIEW`
          );
          connectionInfo = interviewerConnection;
        }

        if (connectionInfo.userType !== USER_TYPES.INTERVIEWER) {
          console.log(
            `User ${connectionInfo.userName} is ${connectionInfo.userType}, not interviewer`
          );
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: "Only interviewer can end interview",
          });
          return;
        }

        const { roomId } = connectionInfo;

        // Update room status
        const room = await Room.findOneAndUpdate(
          { roomId },
          {
            status: "ended",
            interviewEndedAt: new Date(),
          },
          { new: true }
        );

        if (!room) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: "Room not found" });
          return;
        }

        // Calculate duration
        const duration = room.interviewStartedAt
          ? room.interviewEndedAt.getTime() - room.interviewStartedAt.getTime()
          : null;

        // Notify all users
        io.to(roomId).emit(SOCKET_EVENTS.INTERVIEW_ENDED, {
          timestamp: room.interviewEndedAt,
          duration,
        });

        console.log(`Interview ended in room ${roomId}`);
      } catch (error) {
        console.error("Error ending interview:", error);
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: "Failed to end interview",
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      try {
        const connectionInfo = activeConnections.get(socket.id);

        if (connectionInfo) {
          const { roomId, userType, userName } = connectionInfo;

          // Update room to mark user as disconnected
          await Room.findOneAndUpdate(
            { roomId },
            {
              [`${userType}.connected`]: false,
              [`${userType}.socketId`]: null,
            }
          );

          // Notify other users
          socket.to(roomId).emit(SOCKET_EVENTS.USER_LEFT, {
            userName,
            userType,
            timestamp: new Date(),
          });

          // Update room status
          const room = await Room.findOne({ roomId });
          if (room) {
            socket.to(roomId).emit(SOCKET_EVENTS.ROOM_STATUS, {
              interviewerPresent: room.interviewer.connected,
              candidatePresent: room.candidate.connected,
              interviewerName: room.interviewer.userName,
              candidateName: room.candidate.userName,
              status: room.status,
            });
          }

          // Remove from active connections
          activeConnections.delete(socket.id);

          console.log(`${userName} left room ${roomId}`);
        }

        console.log(`Socket disconnected: ${socket.id}`);
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    });
  });

  return io;
};

module.exports = socketConfig;
