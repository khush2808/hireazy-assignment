const express = require("express");
const {
  createRoom,
  getRoomDetails,
  joinRoom,
  endInterview,
} = require("../controllers/roomController");
const { validateRoomId } = require("../middleware/validation");

const router = express.Router();

// Create a new room
router.post("/", createRoom);

// Get room details
router.get("/:roomId", validateRoomId, getRoomDetails);

// Join a room (for web interface)
router.post("/:roomId/join", validateRoomId, joinRoom);

// End interview (DELETE acts as ending)
router.delete("/:roomId", validateRoomId, endInterview);

module.exports = router;
