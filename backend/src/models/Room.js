const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["waiting", "active", "ended"],
      default: "waiting",
    },
    interviewer: {
      connected: {
        type: Boolean,
        default: false,
      },
      userName: {
        type: String,
        default: null,
      },
      joinedAt: {
        type: Date,
        default: null,
      },
      socketId: {
        type: String,
        default: null,
      },
    },
    candidate: {
      connected: {
        type: Boolean,
        default: false,
      },
      userName: {
        type: String,
        default: null,
      },
      joinedAt: {
        type: Date,
        default: null,
      },
      socketId: {
        type: String,
        default: null,
      },
    },
    interviewStartedAt: {
      type: Date,
      default: null,
    },
    interviewEndedAt: {
      type: Date,
      default: null,
    },
    settings: {
      allowFileUpload: {
        type: Boolean,
        default: true,
      },
      maxFileSizeMB: {
        type: Number,
        default: 10,
      },
    },
  },
  {
    timestamps: true,
  }
);

roomSchema.index({ createdAt: 1 });
roomSchema.index({ status: 1 });

// Virtual for interview duration
roomSchema.virtual("interviewDuration").get(function () {
  if (this.interviewStartedAt && this.interviewEndedAt) {
    return this.interviewEndedAt.getTime() - this.interviewStartedAt.getTime();
  }
  return null;
});

// Method to check if room is full
roomSchema.methods.isFull = function () {
  return this.interviewer.connected && this.candidate.connected;
};

// Method to get active users count
roomSchema.methods.getActiveUsersCount = function () {
  let count = 0;
  if (this.interviewer.connected) count++;
  if (this.candidate.connected) count++;
  return count;
};

module.exports = mongoose.model("Room", roomSchema);
