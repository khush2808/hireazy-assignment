# Hireazy - Interview Simulation Room

> **Note About Commits:**  
> This project was developed in a private repository and was later cloned to this public repo.  
> That is why you will find only one commit in the history.

A full-stack web application for conducting mock interviews with real-time chat, file sharing, and interview controls. Built as part of the Hireazy assignment to demonstrate technical skills and product thinking.

---

## Features

### Core Functionality

- **Two-User Roles**: Interviewer and Candidate with distinct permissions
- **Real-time Chat**: Instant messaging with typing indicators
- **File Upload**: PDF and TXT file sharing (Interviewer only)
- **Interview Controls**: Start/end interview sessions
- **Room Management**: Create and join interview rooms with unique IDs

### Bonus Features

- **Modern UI/UX**: Clean, responsive design with Tailwind CSS
- **Real-time Notifications**: Toast notifications for all actions
- **Connection Status**: Visual indicators for socket connection
- **User Presence**: Live user status and activity indicators
- **Responsive Design**: Works on desktop and mobile

---

## Tech Stack

### Backend

- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database and ODM
- **Socket.io** - Real-time bidirectional communication
- **Multer** - File upload handling
- **Joi** - Request validation
- **Helmet** + **CORS** - Security middleware

### Frontend

- **React 18** + **Vite** - Modern React with fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

---

## 🔮 Features in Consideration



1. **Cloud File Storage via AWS S3**  
   Store uploaded files securely in the cloud for better scalability and reliability. *(Work in progress in a separate development branch.)*

2. **AI-Powered Interview Summaries**  
   Automatically generate post-interview summaries using AI and store them for future reference.

3. **Interview Scheduling & Email Integration**  
   Enable users to schedule interviews and send email reminders, including AI-generated summaries post-interview.

4. **Video and Audio Calling Support**  
   Add real-time video/audio communication to simulate a more realistic interview environment.

5. **Collaborative Code Editor(low priority)**  
   Embed a real-time code editor for technical interviews with live collaboration and syntax highlighting (similar to hackerrank).
   
6.**Implement a proper auth mechanism + email functionality**
   might use clerk or could do it on my own as well. then implement mailing functionality using nodemailer.

---
