import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomAPI } from '../services/api';
import { Users, Plus, Video } from 'lucide-react';
import toast from 'react-hot-toast';

const HomePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roomId, setRoomId] = useState('');

  const handleCreateRoom = async () => {
    try {
      setLoading(true);
      const response = await roomAPI.createRoom();
      const newRoomId = response.data.roomId;
      
      toast.success(`Room created: ${newRoomId}`);
      navigate(`/join/${newRoomId}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      toast.error('Please enter a room ID');
      return;
    }
    
    if (!/^[A-Z0-9]{8}$/.test(roomId.trim())) {
      toast.error('Room ID must be 8 characters');
      return;
    }

    navigate(`/join/${roomId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Video className="w-12 h-12 text-primary-600" />
            <h1 className="text-4xl font-bold text-gray-900">Hireazy</h1>
          </div>
          <p className="text-xl text-gray-600">
            Practice interviews with real-time chat and file sharing
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create Room */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <Plus className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Create Interview Room</h3>
              <p className="text-gray-600 mb-6">
                Start a new session as the interviewer
              </p>
              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </div>

          {/* Join Room */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Join Interview Room</h3>
              <p className="text-gray-600 mb-6">
                Enter a room ID to join an existing session
              </p>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Room ID (8 characters)"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border rounded-lg text-center font-mono"
                  maxLength={8}
                />
                <button
                  onClick={handleJoinRoom}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
                >
                  Join Room
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 