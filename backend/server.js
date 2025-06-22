const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");
const fs = require("fs");

// Import configurations and routes
const connectDB = require("./src/config/database");
const socketConfig = require("./src/config/socket");
const errorHandler = require("./src/middleware/errorHandler");

// Import routes
const roomRoutes = require("./src/routes/rooms");
const fileRoutes = require("./src/routes/files");
const messageRoutes = require("./src/routes/messages");

// Load environment variables
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
  "https://hireazy-app.vercel.app",
  "https://hireazy-tau.vercel.app",
  "http://localhost:5173",
];

const io = socketIo(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
  },
});

// Connect to MongoDB
connectDB();

const uploadsDir = process.env.UPLOAD_PATH || "./uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Make socket.io instance available to controllers
app.set("socketio", io);

// Serve static files (uploaded files)
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/api/rooms", roomRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/messages", messageRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Socket.io configuration
socketConfig(io);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Upload directory: ${uploadsDir}`);
});
