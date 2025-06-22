import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "../utils/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response.data;
  },
  (error) => {
    console.error("API Response Error:", error.response?.data || error.message);

    // Extract error message
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";

    return Promise.reject(new Error(errorMessage));
  }
);

// Room API
const roomAPI = {
  // Create a new room
  createRoom: () => api.post(API_ENDPOINTS.ROOMS),

  // Get room details
  getRoomDetails: (roomId) => api.get(API_ENDPOINTS.ROOM_DETAILS(roomId)),

  // Validate room join
  joinRoom: (roomId, userData) =>
    api.post(API_ENDPOINTS.JOIN_ROOM(roomId), userData),

  // End interview
  endInterview: (roomId) => api.delete(API_ENDPOINTS.END_INTERVIEW(roomId)),
};

// Message API methods
const messageAPI = {
  // Get chat history for a room
  getChatHistory: (roomId, params = {}) =>
    api.get(API_ENDPOINTS.CHAT_HISTORY(roomId), { params }),
};

// File API methods
export const fileAPI = {
  // Upload file
  uploadFile: (roomId, formData) => {
    return api.post(API_ENDPOINTS.UPLOAD_FILE(roomId), formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getRoomFiles: (roomId) => api.get(API_ENDPOINTS.ROOM_FILES(roomId)),

  // Delete file
  deleteFile: (fileId, userData) =>
    api.delete(API_ENDPOINTS.DELETE_FILE(fileId), { data: userData }),

  // Get download URL
  getDownloadUrl: (fileId) =>
    `${API_BASE_URL}${API_ENDPOINTS.DOWNLOAD_FILE(fileId)}`,
};

// Health check
export const healthAPI = {
  check: () => api.get(API_ENDPOINTS.HEALTH),
};

// Export the API modules
export { roomAPI, messageAPI };

export default api;
