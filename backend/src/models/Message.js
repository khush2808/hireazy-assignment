const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      enum: ["interviewer", "candidate"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    messageType: {
      type: String,
      enum: ["text", "system"],
      default: "text",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ roomId: 1, timestamp: 1 });

messageSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
