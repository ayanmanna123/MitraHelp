import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaCheck, FaTimes, FaIdCard, FaCamera } from 'react-icons/fa';
import api from '../../services/api';

const FaceVerificationManagement = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchFaceVerifications();
  }, []);

  const fetchFaceVerifications = async () => {
    try {
      const response = await api.get('/admin/face-verifications');
      if (response.data.success) {
        setVerifications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching face verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      const response = await api.put(`/admin/face-verification/${userId}`, {
        status: 'verified'
      });
      if (response.data.success) {
        fetchFaceVerifications(); // Refresh the list
      }
    } catch (error) {
      console.error('Error approving face verification:', error);
    }
  };

  const handleReject = async (userId, reason) => {
    try {
      const response = await api.put(`/admin/face-verification/${userId}`, {
        status: 'rejected',
        adminNotes: reason
      });
      if (response.data.success) {
        fetchFaceVerifications(); // Refresh the list
      }
    } catch (error) {
      console.error('Error rejecting face verification:', error);
    }
  };

  const filteredVerifications = verifications.filter(verification => {
    const matchesSearch = verification.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        verification.phone?.includes(searchTerm) ||
                        verification.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || verification.faceVerification?.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading face verifications...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Face Verification Requests</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search verifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none w-full md:w-64"
            />
          </div>
          
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none appearance-none bg-white w-full md:w-40"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredVerifications.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">ID: {user._id.slice(-6)}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.phone || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{user.email || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.faceVerification?.status === 'verified' 
                      ? 'bg-green-100 text-green-800' 
                      : user.faceVerification?.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                  }`}>
                    {user.faceVerification?.status?.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="space-y-1">
                    {user.faceVerification?.governmentIdImage && (
                      <a 
                        href={user.faceVerification.governmentIdImage} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <FaIdCard className="text-xs" /> View ID
                      </a>
                    )}
                    {user.faceVerification?.selfieImage && (
                      <a 
                        href={user.faceVerification.selfieImage} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <FaCamera className="text-xs" /> View Selfie
                      </a>
                    )}
                    {user.faceVerification?.matchScore && (
                      <div className="text-xs text-gray-600">
                        Match Score: {(user.faceVerification.matchScore * 100).toFixed(2)}%
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.faceVerification?.submittedAt 
                    ? new Date(user.faceVerification.submittedAt).toLocaleDateString() 
                    : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {user.faceVerification?.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(user._id)}
                        className="text-green-600 hover:text-green-900 font-medium flex items-center gap-1"
                      >
                        <FaCheck className="text-xs" /> Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Enter rejection reason:');
                          if (reason) handleReject(user._id, reason);
                        }}
                        className="text-red-600 hover:text-red-900 font-medium flex items-center gap-1"
                      >
                        <FaTimes className="text-xs" /> Reject
                      </button>
                    </div>
                  )}
                  {user.faceVerification?.status === 'rejected' && user.faceVerification.adminNotes && (
                    <div className="text-xs text-gray-500 max-w-xs">
                      Reason: {user.faceVerification.adminNotes}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredVerifications.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No face verification requests found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceVerificationManagement;