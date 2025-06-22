import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { useSocket } from '../hooks/useSocket';
import { messageAPI, fileAPI } from '../services/api';
import { SOCKET_EVENTS, ROOM_STATUS, USER_TYPES } from '../utils/constants';
import { 
  Send, 
  Paperclip, 
  Users, 
  Play, 
  Square, 
  Download,
  Trash2,
  ArrowLeft,
  Circle
} from 'lucide-react';
import toast from 'react-hot-toast';

const InterviewRoom = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useSocket();
  

  const { userType, userName } = location.state || {};
  
  const {
    roomData,
    roomStatus,
    users,
    loading: roomLoading,
    error: roomError,
    isConnected,
    joinRoom,
    startInterview,
    endInterview
  } = useRoom(roomId, { userType, userName });

  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  // File state
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Join room on mount
  useEffect(() => {
    if (!userType || !userName) {
      console.log("Missing user data, redirecting to join page");
      navigate(`/join/${roomId}`);
      return;
    }

    console.log("Attempting to join room via socket...", { userType, userName, roomId });

    let hasJoined = false;

    // Function to join via socket
    const joinViaSocket = () => {
      if (hasJoined) {
        console.log("Already joined room, skipping duplicate join");
        return true;
      }

      if (socket && socket.connected) {
        console.log("Socket is connected, emitting JOIN_ROOM");
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, {
          roomId,
          userType,
          userName,
        });
        hasJoined = true;
        return true;
      } else {
        console.log("Socket not ready:", { 
          hasSocket: !!socket, 
          isConnected: socket?.connected 
        });
        return false;
      }
    };

    // Try to join immediately if socket is ready
    if (joinViaSocket()) {
      return;
    }

    // If socket not ready, set up a listener for when it connects
    let timeoutRef = null;
    
    if (socket) {
      const handleConnect = () => {
        console.log("Socket connected, now joining room");
        joinViaSocket();
      };

      socket.on('connect', handleConnect);

      // Single timeout instead of interval to prevent spam
      timeoutRef = setTimeout(() => {
        if (!hasJoined && socket?.connected) {
          joinViaSocket();
        }
      }, 2000);

      // Return cleanup function
      return () => {
        socket.off('connect', handleConnect);
        if (timeoutRef) {
          clearTimeout(timeoutRef);
        }
      };
    }

    // Return empty cleanup function if no socket
    return () => {};
  }, [userType, userName, roomId, socket, navigate]);


  useEffect(() => {
    const fetchData = async () => {
      if (!roomId) return;

      try {
        console.log("Fetching initial room data...");
        

        const messagesResponse = await messageAPI.getChatHistory(roomId);
        setMessages(messagesResponse.data?.messages || []);


        const filesResponse = await fileAPI.getRoomFiles(roomId);
        setFiles(filesResponse.data?.files || []);
        
        console.log("Initial data loaded");
      } catch (error) {
        console.error('Error fetching initial data:', error);
        // Don't show error toast for initial data fetch failures
        // as the user might not be joined yet
      }
    };

    fetchData();
  }, [roomId, isConnected]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      setMessages(prev => [...prev, data]);
      scrollToBottom();
    };

    const handleTypingIndicator = (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.userName);
        } else {
          newSet.delete(data.userName);
        }
        return newSet;
      });
    };

    const handleFileUploaded = (data) => {
      setFiles(prev => [data, ...prev]);
      toast.success(`File uploaded: ${data.originalName}`);
    };

    const handleFileDeleted = (data) => {
      setFiles(prev => prev.filter(file => file.fileId !== data.fileId));
      toast.info(`File deleted: ${data.originalName}`);
    };

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
    socket.on(SOCKET_EVENTS.TYPING_INDICATOR, handleTypingIndicator);
    socket.on(SOCKET_EVENTS.FILE_UPLOADED, handleFileUploaded);
    socket.on(SOCKET_EVENTS.FILE_DELETED, handleFileDeleted);

    return () => {
      socket.off(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
      socket.off(SOCKET_EVENTS.TYPING_INDICATOR, handleTypingIndicator);
      socket.off(SOCKET_EVENTS.FILE_UPLOADED, handleFileUploaded);
      socket.off(SOCKET_EVENTS.FILE_DELETED, handleFileDeleted);
    };
  }, [socket]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !isConnected) {
      if (!isConnected) {
        toast.error('Not connected to server');
      }
      return;
    }

    try {
      const messageText = newMessage.trim();
      socket.emit(SOCKET_EVENTS.SEND_MESSAGE, { message: messageText });
      setNewMessage('');
      stopTyping();
      console.log("Message sent:", messageText);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error('Failed to send message');
    }
  };

  // Typing handlers
  const handleTypingStart = () => {
    if (!socket || !isConnected || isTyping) return;
    
    try {
      socket.emit(SOCKET_EVENTS.TYPING_START);
      setIsTyping(true);
    } catch (error) {
      console.error("Failed to send typing start:", error);
    }
  };

  const stopTyping = () => {
    if (!socket || !isConnected || !isTyping) return;
    
    try {
      socket.emit(SOCKET_EVENTS.TYPING_STOP);
      setIsTyping(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error("Failed to send typing stop:", error);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (!isConnected) return;
    
    if (!isTyping) {
      handleTypingStart();
    }

    // Auto-stop typing after 1 second of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(stopTyping, 1000);
  };

  // File upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (userType !== USER_TYPES.INTERVIEWER) {
      toast.error('Only interviewers can upload files');
      return;
    }


    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF and TXT files are allowed');
      return;
    }

    
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      console.log("Uploading file:", file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userType', userType);
      formData.append('userName', userName);

      await fileAPI.uploadFile(roomId, formData);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success(`File uploaded: ${file.name}`);
      console.log("File uploaded");
    } catch (error) {
      console.error("File upload failed:", error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Delete file
  const handleDeleteFile = async (fileId) => {
    if (userType !== USER_TYPES.INTERVIEWER) {
      toast.error('Only interviewers can delete files');
      return;
    }

    try {
      console.log("Deleting file:", fileId);
      await fileAPI.deleteFile(fileId, { userType, userName });
      console.log("File deleted");
    } catch (error) {
      console.error("File deletion failed:", error);
      toast.error(error.message || 'Failed to delete file');
    }
  };

  if (roomLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we set up your interview room</p>
        </div>
      </div>
    );
  }

  if (roomError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Room Error</h2>
          <p className="text-red-600 mb-6">{roomError}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/join/${roomId}`)}
              className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Try Joining Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show connection warning if not connected
  const showConnectionWarning = !isConnected && !roomLoading;

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Connection Warning Banner */}
      {showConnectionWarning && (
        <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2">
          <div className="flex items-center justify-center space-x-2 text-yellow-800">
            <Circle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium">
              Connection lost. Attempting to reconnect...
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold">
                Interview Room: {roomId}
              </h1>
              <p className="text-sm text-gray-600">
                You are the {userType}: {userName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2 text-sm">
              <Circle className={`w-3 h-3 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
              <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Interview Controls */}
            {userType === USER_TYPES.INTERVIEWER && (
              <div className="flex space-x-2">
                {roomStatus === ROOM_STATUS.WAITING && (
                  <button
                    onClick={startInterview}
                    disabled={!isConnected}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Interview</span>
                  </button>
                )}
                {roomStatus === ROOM_STATUS.ACTIVE && (
                  <button
                    onClick={endInterview}
                    disabled={!isConnected}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Square className="w-4 h-4" />
                    <span>End Interview</span>
                  </button>
                )}
                {roomStatus === ROOM_STATUS.ENDED && (
                  <div className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                    <Square className="w-4 h-4" />
                    <span>Interview Ended</span>
                  </div>
                )}
              </div>
            )}

            {/* Status indicator for non-interviewers */}
            {userType !== USER_TYPES.INTERVIEWER && (
              <div className="flex space-x-2">
                {roomStatus === ROOM_STATUS.WAITING && (
                  <div className="bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                    <Circle className="w-4 h-4" />
                    <span>Waiting for interview to start</span>
                  </div>
                )}
                {roomStatus === ROOM_STATUS.ACTIVE && (
                  <div className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                    <Play className="w-4 h-4" />
                    <span>Interview in progress</span>
                  </div>
                )}
                {roomStatus === ROOM_STATUS.ENDED && (
                  <div className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                    <Square className="w-4 h-4" />
                    <span>Interview ended</span>
                  </div>
                )}
              </div>
            )}

            {/* User Status */}
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-600" />
              <div className="text-sm">
                <div className={`${users.interviewer.connected ? 'text-green-600' : 'text-gray-400'}`}>
                  Interviewer: {users.interviewer.userName || 'Waiting...'}
                </div>
                <div className={`${users.candidate.connected ? 'text-green-600' : 'text-gray-400'}`}>
                  Candidate: {users.candidate.userName || 'Waiting...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((message, index) => (
              <div
                key={message.messageId || index}
                className={`flex ${
                  message.userType === userType ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.messageType === 'system'
                      ? 'bg-gray-100 text-gray-600 text-center text-sm'
                      : message.userType === userType
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border'
                  }`}
                >
                  {message.messageType !== 'system' && (
                    <div className="text-xs font-semibold mb-1 opacity-75">
                      {message.userName}
                    </div>
                  )}
                  <div>{message.message}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-lg text-sm text-gray-600">
                  <div className="typing-dots">
                    {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing
                    <span>.</span><span>.</span><span>.</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setNewMessage('');
                    stopTyping();
                  }
                }}
                placeholder={isConnected ? "Type your message... (Press Enter to send)" : "Connecting..."}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!isConnected}
                maxLength={1000}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !isConnected}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={!isConnected ? "Not connected" : !newMessage.trim() ? "Enter a message" : "Send message"}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {!isConnected && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Messages will be sent when connection is restored
              </p>
            )}
          </div>
        </div>

        {/* Files Sidebar */}
        <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Files</h3>
              {userType === USER_TYPES.INTERVIEWER && (
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {uploading && (
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Uploading...</span>
                </div>
              </div>
            )}

            {files.map((file) => (
              <div key={file.fileId} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {file.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round(file.fileSize / 1024)} KB
                    </p>
                    <p className="text-xs text-gray-500">
                      by {file.uploadedBy}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <a
                      href={fileAPI.getDownloadUrl(file.fileId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    {userType === USER_TYPES.INTERVIEWER && (
                      <button
                        onClick={() => handleDeleteFile(file.fileId)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {files.length === 0 && !uploading && (
              <div className="text-center text-gray-500 py-8">
                <Paperclip className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No files uploaded yet</p>
                {userType === USER_TYPES.INTERVIEWER && (
                  <p className="text-sm">Click the paperclip icon to upload</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom; 