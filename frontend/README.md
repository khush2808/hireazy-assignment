# Hireazy Frontend

## Overview

React frontend for the Hireazy Interview Simulation Room. Built with Vite, React, Tailwind CSS, and Socket.io for a modern and responsive user experience.

## Tech Stack

- **React 18** - UI library with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client for API requests
- **React Hot Toast** - Toast notifications
- **Lucide React** - Icon library

## Features

- **Room Management** - Create and join interview rooms
- **Role Selection** - Interviewer and Candidate modes
- **Real-time Chat** - Instant messaging with typing indicators
- **File Sharing** - Upload and share PDF/TXT files (Interviewer only)
- **Interview Controls** - Start/end interview sessions
- **Responsive Design** - Works on desktop and mobile
- **Toast Notifications** - User-friendly feedback
- **Real-time Updates** - Socket.io for instant synchronization

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running on `http://localhost:5000`

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment Configuration (Optional)**
   Create a `.env` file if you need to customize the API URL:

   ```
   VITE_API_URL=http://localhost:5000
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

   The app will start on `http://localhost:5173`

4. **Build for production**

   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

## Project Structure

```
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── components/          # Reusable UI components (future)
│   │   ├── useSocket.js     # Socket connection management
│   │   └── useRoom.js       # Room state management
│   ├── pages/               # Page components
│   │   ├── HomePage.jsx     # Landing page
│   │   ├── JoinRoom.jsx     # Room joining interface
│   │   └── InterviewRoom.jsx # Main interview interface
│   ├── services/            # API and service functions
│   │   ├── api.js           # HTTP API client
│   │   └── socket.js        # Socket.io service
│   ├── utils/               # Utility functions and constants
│   │   └── constants.js     # App constants and configurations
│   ├── App.jsx              # Main app component with routing
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles and Tailwind imports
├── index.html               # HTML template
├── package.json
├── tailwind.config.js       # Tailwind configuration
├── vite.config.js           # Vite configuration
└── postcss.config.js        # PostCSS configuration
```

## Key Components

### Pages

#### HomePage (`/`)

- Landing page with create/join room options
- Clean, modern interface with feature highlights
- Form validation for room ID input

#### JoinRoom (`/join/:roomId?`)

- Role selection (Interviewer/Candidate)
- Name input with validation
- Real-time room status display
- Automatic navigation on successful join

#### InterviewRoom (`/room/:roomId`)

- Main interview interface
- Real-time chat with typing indicators
- File upload/download sidebar
- Interview controls (Start/End)
- Connection status indicators
- User presence indicators

### Custom Hooks

#### useSocket

- Manages WebSocket connection lifecycle
- Handles connection status and errors
- Provides socket instance to components

#### useRoom

- Manages room state and user data
- Handles room joining and leaving
- Provides interview control functions
- Manages real-time room updates

### Services

#### API Service

- Centralized HTTP API client
- Request/response interceptors
- Error handling and message extraction
- Typed API methods for all endpoints

#### Socket Service

- Singleton Socket.io client
- Connection management and reconnection
- Event emission helpers
- Connection status tracking

## UI/UX Features

### Design System

- **Colors**: Primary blue theme with semantic colors
- **Typography**: Inter font family for clean readability
- **Spacing**: Consistent Tailwind spacing scale
- **Components**: Reusable button and input styles
- **Responsive**: Mobile-first responsive design

### Interactions

- **Hover Effects**: Subtle hover states on interactive elements
- **Loading States**: Spinners and disabled states during async operations
- **Animations**: Smooth transitions and typing indicator animations
- **Feedback**: Toast notifications for all user actions

## Real-time Features

### Socket Events Handled

- **Connection Management**: join_room, user_joined, user_left
- **Chat**: new_message, typing_indicator
- **Interview Control**: interview_started, interview_ended
- **File Operations**: file_uploaded, file_deleted
- **Room Updates**: room_status

### State Synchronization

- Real-time user presence
- Live message updates
- File list synchronization
- Interview status updates
- Typing indicators

## Error Handling

- **Network Errors**: Graceful handling of API failures
- **Socket Disconnection**: Automatic reconnection attempts
- **Validation Errors**: Client-side input validation
- **User Feedback**: Clear error messages via toast notifications

```

### Code Style

- ESLint configuration for code quality
- Prettier-compatible formatting
- Consistent component structure
- Custom hooks for reusable logic

## Future Features

- Screen sharing capability
- Audio/video calls
- Advanced file preview
- Message search functionality
- User authentication
- Interview recording
- Performance analytics
- Dark mode support




```
