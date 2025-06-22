const crypto = require("crypto");

const generateRoomId = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
};

const generateMessageId = () => {
  return crypto.randomUUID();
};

const generateFileId = () => {
  return crypto.randomUUID();
};

module.exports = {
  generateRoomId,
  generateMessageId,
  generateFileId,
};
