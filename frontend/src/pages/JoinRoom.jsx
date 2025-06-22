import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomAPI } from '../services/api';
import { User, UserCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const JoinRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [userType, setUserType] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    const validateRoom = async () => {
      if (!roomId) {
        navigate('/');
        return;
      }

      try {
        const response = await roomAPI.getRoomDetails(roomId);
        setRoomData(response.data);
      } catch (error) {
        toast.error('Room not found');
        navigate('/');
        return;
      } finally {
        setValidating(false);
      }
    };

    validateRoom();
  }, [roomId, navigate]);

  const handleJoinRoom = async () => {
    if (!userType || !userName.trim()) {
      toast.error('Please select role and enter name');
      return;
    }

    try {
      setLoading(true);
      
      const response = await roomAPI.joinRoom(roomId, {
        userType,
        userName: userName.trim()
      });

      navigate(`/room/${roomId}`, {
        state: { 
          userType: response.data?.userType || userType, 
          userName: response.data?.userName || userName.trim() 
        }
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Validating room...</p>
        </div>
      </div>
    );
  }

  const isInterviewerTaken = roomData?.interviewer?.connected;
  const isCandidateTaken = roomData?.candidate?.connected;
  const isRoomEnded = roomData?.status === 'ended';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Join Interview Room
          </h1>
          <p className="text-gray-600">
            Room ID: <span className="font-mono font-semibold">{roomId}</span>
          </p>
          {isRoomEnded && (
            <div className="mt-4 bg-red-100 border border-red-200 rounded-lg p-4">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-red-800 mb-2">Interview Has Ended</h2>
                <p className="text-red-600 text-sm">
                  This interview room is no longer active. You cannot join an ended interview.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Go Back to Home
                </button>
              </div>
            </div>
          )}
        </div>

        {!isRoomEnded && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setUserType('interviewer')}
                disabled={isInterviewerTaken}
                className={`p-4 border rounded-lg text-left ${
                  userType === 'interviewer'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300'
                } ${isInterviewerTaken ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <UserCheck className="w-6 h-6 text-primary-600 mb-2" />
                <div className="font-semibold">Interviewer</div>
                <div className="text-xs text-gray-500">
                  {isInterviewerTaken ? 'Taken' : 'Can upload files'}
                </div>
              </button>

              <button
                onClick={() => setUserType('candidate')}
                disabled={isCandidateTaken}
                className={`p-4 border rounded-lg text-left ${
                  userType === 'candidate'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300'
                } ${isCandidateTaken ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <User className="w-6 h-6 text-green-600 mb-2" />
                <div className="font-semibold">Candidate</div>
                <div className="text-xs text-gray-500">
                  {isCandidateTaken ? 'Taken' : 'Being interviewed'}
                </div>
              </button>
            </div>
          </div>

          {/* Name Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              maxLength={30}
            />
          </div>

          {/* Join Button */}
          <button
            onClick={handleJoinRoom}
            disabled={loading || !userType || !userName.trim()}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Joining...' : 'Join Interview Room'}
          </button>
          </div>
        )}

        {/* Room Status */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Room Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={`font-semibold ${
                isRoomEnded ? 'text-red-600' : 
                roomData?.status === 'active' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {isRoomEnded ? 'Ended' : 
                 roomData?.status === 'active' ? 'In Progress' : 'Waiting'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Interviewer:</span>
              <span className={isInterviewerTaken ? 'text-green-600' : 'text-gray-500'}>
                {isInterviewerTaken ? roomData.interviewer.userName : 'Available'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Candidate:</span>
              <span className={isCandidateTaken ? 'text-green-600' : 'text-gray-500'}>
                {isCandidateTaken ? roomData.candidate.userName : 'Available'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom; 