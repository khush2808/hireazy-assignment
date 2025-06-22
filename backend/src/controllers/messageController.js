const Message = require("../models/Message");
const Room = require("../models/Room");

// Get chat history for a room
const getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get messages with pagination
    const messages = await Message.find({ roomId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v");

    // Get total count for pagination info
    const totalMessages = await Message.countDocuments({ roomId });
    const totalPages = Math.ceil(totalMessages / limit);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          currentPage: page,
          totalPages,
          totalMessages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error getting chat history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get chat history",
    });
  }
};

module.exports = {
  getChatHistory,
};
