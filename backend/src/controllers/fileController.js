const File = require("../models/File");
const Room = require("../models/Room");
const fs = require("fs").promises;
const path = require("path");
const { generateFileId } = require("../utils/generateRoomId");
const { SOCKET_EVENTS } = require("../utils/constants");

// Upload file (interviewer only)
const uploadFile = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userType, userName } = req.body;
    const io = req.app.get("socketio"); // Get socket.io instance

    // Validate room exists
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Check if user is interviewer
    if (userType !== "interviewer") {
      return res.status(403).json({
        success: false,
        error: "Only interviewers can upload files",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    // Create file record
    const fileRecord = new File({
      fileId: req.fileId, // Set by multer middleware
      roomId,
      originalName: req.file.originalname,
      fileName: req.filename, // Set by multer middleware
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: userName,
    });

    await fileRecord.save();

    const fileData = {
      fileId: fileRecord.fileId,
      originalName: fileRecord.originalName,
      fileName: fileRecord.fileName,
      fileSize: fileRecord.fileSize,
      mimeType: fileRecord.mimeType,
      uploadedBy: fileRecord.uploadedBy,
      uploadedAt: fileRecord.uploadedAt,
    };

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: fileData,
    });

    // Emit socket event to all users in the room
    if (io) {
      io.to(roomId).emit(SOCKET_EVENTS.FILE_UPLOADED, fileData);
    }

    console.log(`File uploaded: ${fileRecord.originalName} in room ${roomId}`);
  } catch (error) {
    console.error("Error uploading file:", error);

    // Clean up uploaded file if database save failed
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error("Error cleaning up uploaded file:", unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      error: "Failed to upload file",
    });
  }
};

// Get files for a room
const getRoomFiles = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Validate room exists
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Get files
    const files = await File.find({ roomId })
      .sort({ uploadedAt: -1 })
      .select("-filePath -__v -updatedAt");

    res.json({
      success: true,
      data: { files },
    });
  } catch (error) {
    console.error("Error getting room files:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get room files",
    });
  }
};

// Download/view file
const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    // Find file record
    const file = await File.findOne({ fileId });
    if (!file) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    // Set appropriate headers
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Length", file.fileSize);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${file.originalName}"`
    );

    // Stream file
    const fileStream = require("fs").createReadStream(file.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to download file",
    });
  }
};

// Delete file (interviewer only)
const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { userType } = req.body;
    const io = req.app.get("socketio"); // Get socket.io instance

    // Find file record
    const file = await File.findOne({ fileId });
    if (!file) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    // Check if user is interviewer
    if (userType !== "interviewer") {
      return res.status(403).json({
        success: false,
        error: "Only interviewer can delete files",
      });
    }

    // Delete file from disk
    try {
      await fs.unlink(file.filePath);
    } catch (unlinkError) {
      console.warn("File not found on disk:", unlinkError.message);
    }

    // Delete file record from database
    await File.findOneAndDelete({ fileId });

    res.json({
      success: true,
      message: "File deleted successfully",
    });

    // Emit socket event to all users in the room
    if (io) {
      io.to(file.roomId).emit(SOCKET_EVENTS.FILE_DELETED, {
        fileId: file.fileId,
        originalName: file.originalName,
      });
    }

    console.log(`🗑️ File deleted: ${file.originalName} (${file.fileId})`);
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete file",
    });
  }
};

module.exports = {
  uploadFile,
  getRoomFiles,
  downloadFile,
  deleteFile,
};
