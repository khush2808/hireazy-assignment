const express = require("express");
const router = express.Router();
const {
  uploadFile,
  getRoomFiles,
  downloadFile,
  deleteFile,
} = require("../controllers/fileController");
const { upload, handleMulterError } = require("../config/multer");
const { validateRoomId } = require("../middleware/validation");

// Upload file to room (interviewer only)
router.post(
  "/upload/:roomId",
  validateRoomId,
  upload.single("file"),
  handleMulterError,
  uploadFile
);

// Get files for a room
router.get("/room/:roomId", validateRoomId, getRoomFiles);

// Download/view file
router.get("/:fileId", downloadFile);

// Delete file
router.delete("/:fileId", deleteFile);

module.exports = router;
