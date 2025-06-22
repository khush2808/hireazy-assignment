const Joi = require("joi");
const { VALIDATION_PATTERNS } = require("../utils/constants");

// Validation schemas
const schemas = {
  createRoom: Joi.object({
    // No body needed for room creation
  }),

  joinRoom: Joi.object({
    userType: Joi.string().valid("interviewer", "candidate").required(),
    userName: Joi.string().pattern(VALIDATION_PATTERNS.USERNAME).required(),
  }),

  sendMessage: Joi.object({
    message: Joi.string().max(1000).required(),
  }),

  roomId: Joi.object({
    roomId: Joi.string().pattern(VALIDATION_PATTERNS.ROOM_ID).required(),
  }),
};

// Generic validation middleware
const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property]);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    next();
  };
};

// Specific validation middleware functions
const validateCreateRoom = validate(schemas.createRoom);
const validateJoinRoom = validate(schemas.joinRoom);
const validateSendMessage = validate(schemas.sendMessage);
const validateRoomId = validate(schemas.roomId, "params");

module.exports = {
  validate,
  validateCreateRoom,
  validateJoinRoom,
  validateSendMessage,
  validateRoomId,
};
