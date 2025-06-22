const express = require("express");
const { getChatHistory } = require("../controllers/messageController");
const { validateRoomId } = require("../middleware/validation");

const router = express.Router();

// Get chat history for a room
router.get("/:roomId", validateRoomId, getChatHistory);

module.exports = router;
