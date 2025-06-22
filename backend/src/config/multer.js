const multer = require("multer");
const path = require("path");
const { generateFileId } = require("../utils/generateRoomId");
const { FILE_CONSTRAINTS } = require("../utils/constants");

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || "./uploads";
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const fileId = generateFileId();
    const ext = path.extname(file.originalname);
    const filename = `${fileId}${ext}`;

    // Store fileId and filename in request for later use
    req.fileId = fileId;
    req.filename = filename;

    cb(null, filename);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (!FILE_CONSTRAINTS.ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error("Only PDF and TXT files are allowed"), false);
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (!FILE_CONSTRAINTS.ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error("Only .pdf and .txt files are allowed"), false);
  }

  cb(null, true);
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_CONSTRAINTS.MAX_SIZE_MB * 1024 * 1024, // Convert MB to bytes
    files: 1, // Only one file at a time
  },
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: `File size too large. Maximum size is ${FILE_CONSTRAINTS.MAX_SIZE_MB}MB`,
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        error: "Only one file can be uploaded at a time",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        error: "Unexpected file field",
      });
    }
  }

  if (err.message) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  next(err);
};

module.exports = {
  upload,
  handleMulterError,
};
