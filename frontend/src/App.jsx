import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import JoinRoom from './pages/JoinRoom'
import InterviewRoom from './pages/InterviewRoom'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/join/:roomId?" element={<JoinRoom />} />
        <Route path="/room/:roomId" element={<InterviewRoom />} />
      </Routes>
    </div>
  )
}

export default App 