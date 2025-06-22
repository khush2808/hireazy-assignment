# Hireazy Backend

## Overview

Backend server for the Hireazy Interview Simulation Room. Built with Node.js, Express, MongoDB, and Socket.io for real-time communication.

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.io** - Real-time bidirectional communication
- **Multer** - File upload handling
- **Joi** - Request validation

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy `.env.example` to `.env` and configure:

   ```bash
   cp .env.example .env
   ```

   Update the following variables:

   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/hireazy-interview
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   MAX_FILE_SIZE_MB=10
   UPLOAD_PATH=./uploads
   ```

3. **Start MongoDB**
   Make sure MongoDB is running on your system.

4. **Run the server**

   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Room Management

- `POST /api/rooms` - Create new interview room
- `GET /api/rooms/:roomId` - Get room details
- `POST /api/rooms/:roomId/join` - Validate room join request
- `DELETE /api/rooms/:roomId` - End interview
- `GET /api/rooms/:roomId/stats` - Get room statistics

### Messages

- `GET /api/messages/:roomId` - Get chat history
- `GET /api/messages/:roomId/recent` - Get recent messages
- `GET /api/messages/:roomId/search` - Search messages
- `GET /api/messages/:roomId/stats` - Get message statistics

### Files

- `POST /api/files/upload/:roomId` - Upload file (interviewer only)
- `GET /api/files/room/:roomId` - Get room files
- `GET /api/files/:fileId` - Download file
- `DELETE /api/files/:fileId` - Delete file (interviewer only)

### Health Check

- `GET /api/health` - Server health status

## WebSocket Events

### Client → Server

- `join_room` - Join interview room
- `send_message` - Send chat message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `start_interview` - Start interview (interviewer only)
- `end_interview` - End interview (interviewer only)

### Server → Client

- `user_joined` - User joined room
- `user_left` - User left room
- `room_status` - Room status update
- `new_message` - New chat message
- `typing_indicator` - Typing status
- `interview_started` - Interview started
- `interview_ended` - Interview ended
- `file_uploaded` - File uploaded
- `file_deleted` - File deleted
- `error` - Error occurred

## File Upload

- **Allowed types**: PDF, TXT
- **Max size**: 10MB (configurable)
- **Storage**: Local filesystem
- **Access**: Interviewer only for upload/delete

## Database Schema

### Room Collection

```javascript
{
  roomId: String (unique),
  status: 'waiting' | 'active' | 'ended',
  interviewer: {
    connected: Boolean,
    userName: String,
    joinedAt: Date,
    socketId: String
  },
  candidate: {
    connected: Boolean,
    userName: String,
    joinedAt: Date,
    socketId: String
  },
  interviewStartedAt: Date,
  interviewEndedAt: Date,
  settings: {
    allowFileUpload: Boolean,
    maxFileSizeMB: Number
  }
}
```

### Message Collection

```javascript
{
  messageId: String (unique),
  roomId: String,
  userName: String,
  userType: 'interviewer' | 'candidate',
  message: String,
  messageType: 'text' | 'system',
  timestamp: Date
}
```

### File Collection

```javascript
{
  fileId: String (unique),
  roomId: String,
  originalName: String,
  fileName: String,
  filePath: String,
  fileSize: Number,
  mimeType: String,
  uploadedBy: String,
  uploadedAt: Date
}
```

## Security Features

- Input validation with Joi
- File type and size restrictions
- CORS configuration
- Helmet security headers
- Error handling middleware

## Development

### Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   └── utils/           # Utility functions
├── uploads/             # File upload directory
├── server.js            # Entry point
└── package.json
```

### Running Tests

```bash
npm test
```

### Debugging

The server includes detailed logging. Check console output for:

- Connection events
- Room activities
- File operations
- Interview events
- Messages

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Frontend URL for CORS
- `MAX_FILE_SIZE_MB` - Maximum file size for uploads
- `UPLOAD_PATH` - Directory for file uploads
