import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FaUsers, FaUserShield, FaUserCheck, FaUserTimes, FaSearch, FaFilter, FaIdCard, FaCamera } from 'react-icons/fa';
import FaceVerificationManagement from '../components/admin/FaceVerificationManagement';

const AdminPanel = () => {
    const { user } = useAuth();
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [activeTab, setActiveTab] = useState('volunteers'); // 'volunteers' or 'face-verifications'

    useEffect(() => {
        if (user?.role !== 'admin') {
            window.location.href = '/dashboard';
            return;
        }
        if (activeTab === 'volunteers') {
            fetchVolunteers();
        }
    }, [activeTab]);

    const fetchVolunteers = async () => {
        try {
            const response = await api.get('/admin/volunteers');
            if (response.data.success) {
                setVolunteers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching volunteers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (volunteerId) => {
        try {
            const response = await api.post(`/admin/volunteers/${volunteerId}/approve`);
            if (response.data.success) {
                fetchVolunteers();
            }
        } catch (error) {
            console.error('Error approving volunteer:', error);
        }
    };

    const handleReject = async (volunteerId, reason) => {
        try {
            const response = await api.post(`/admin/volunteers/${volunteerId}/reject`, { reason });
            if (response.data.success) {
                fetchVolunteers();
            }
        } catch (error) {
            console.error('Error rejecting volunteer:', error);
        }
    };

    const filteredVolunteers = volunteers.filter(volunteer => {
        const matchesSearch = volunteer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            volunteer.phone?.includes(searchTerm) ||
                            volunteer.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filterStatus === 'all' || volunteer.volunteerStatus === filterStatus;
        
        return matchesSearch && matchesFilter;
    });

    if (loading && activeTab === 'volunteers') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading volunteers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-red-600">Admin Panel</h1>
                <button 
                    onClick={() => window.location.href = '/dashboard'}
                    className="text-gray-600 hover:text-red-600 font-medium"
                >
                    Back to Dashboard
                </button>
            </nav>

            <main className="container mx-auto px-4 py-8">
                {/* Tab Navigation */}
                <div className="bg-white rounded-xl shadow p-6 mb-6">
                    <div className="flex border-b">
                        <button
                            className={`py-2 px-4 font-medium text-sm ${
                                activeTab === 'volunteers'
                                    ? 'border-b-2 border-red-600 text-red-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            onClick={() => setActiveTab('volunteers')}
                        >
                            Volunteer Applications
                        </button>
                        <button
                            className={`py-2 px-4 font-medium text-sm ${
                                activeTab === 'face-verifications'
                                    ? 'border-b-2 border-red-600 text-red-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            onClick={() => setActiveTab('face-verifications')}
                        >
                            Face Verification
                        </button>
                    </div>
                </div>

                {/* Content based on active tab */}
                {activeTab === 'volunteers' && (
                    <div className="bg-white rounded-xl shadow p-6 mb-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Volunteer Applications</h2>
                            
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search volunteers..."
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
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div className="flex items-center">
                                    <FaUsers className="text-blue-500 text-2xl mr-3" />
                                    <div>
                                        <p className="text-2xl font-bold text-blue-700">{volunteers.length}</p>
                                        <p className="text-sm text-blue-600">Total Applications</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                <div className="flex items-center">
                                    <FaUserShield className="text-yellow-500 text-2xl mr-3" />
                                    <div>
                                        <p className="text-2xl font-bold text-yellow-700">
                                            {volunteers.filter(v => v.volunteerStatus === 'pending').length}
                                        </p>
                                        <p className="text-sm text-yellow-600">Pending Review</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                <div className="flex items-center">
                                    <FaUserCheck className="text-green-500 text-2xl mr-3" />
                                    <div>
                                        <p className="text-2xl font-bold text-green-700">
                                            {volunteers.filter(v => v.volunteerStatus === 'approved').length}
                                        </p>
                                        <p className="text-sm text-green-600">Approved</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                <div className="flex items-center">
                                    <FaUserTimes className="text-red-500 text-2xl mr-3" />
                                    <div>
                                        <p className="text-2xl font-bold text-red-700">
                                            {volunteers.filter(v => v.volunteerStatus === 'rejected').length}
                                        </p>
                                        <p className="text-sm text-red-600">Rejected</p>
                                    </div>
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredVolunteers.map((volunteer) => (
                                        <tr key={volunteer._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{volunteer.name || 'N/A'}</div>
                                                    <div className="text-sm text-gray-500">ID: {volunteer._id.slice(-6)}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{volunteer.phone || 'N/A'}</div>
                                                <div className="text-sm text-gray-500">{volunteer.email || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    volunteer.volunteerStatus === 'approved' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : volunteer.volunteerStatus === 'pending' 
                                                            ? 'bg-yellow-100 text-yellow-800' 
                                                            : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {volunteer.volunteerStatus?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="space-y-1">
                                                    {volunteer.governmentIdImage && (
                                                        <a 
                                                            href={volunteer.governmentIdImage} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 block flex items-center"
                                                        >
                                                            <FaIdCard className="mr-1" /> View ID
                                                        </a>
                                                    )}
                                                    {volunteer.selfieImage && (
                                                        <a 
                                                            href={volunteer.selfieImage} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 block flex items-center"
                                                        >
                                                            <FaCamera className="mr-1" /> View Selfie
                                                        </a>
                                                    )}
                                                    {volunteer.faceVerification && (
                                                        <div className="mt-1">
                                                            <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full inline-block ${
                                                                volunteer.faceVerification.status === 'verified' 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : volunteer.faceVerification.status === 'pending' 
                                                                        ? 'bg-yellow-100 text-yellow-800' 
                                                                        : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                Face: {volunteer.faceVerification.status?.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {volunteer.volunteerStatus === 'pending' && (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleApprove(volunteer._id)}
                                                            className="text-green-600 hover:text-green-900 font-medium"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const reason = prompt('Enter rejection reason:');
                                                                if (reason) handleReject(volunteer._id, reason);
                                                            }}
                                                            className="text-red-600 hover:text-red-900 font-medium"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {volunteer.volunteerStatus === 'rejected' && volunteer.rejectionReason && (
                                                    <div className="text-xs text-gray-500 max-w-xs">
                                                        Reason: {volunteer.rejectionReason}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            {filteredVolunteers.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">No volunteers found matching your criteria</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'face-verifications' && (
                    <FaceVerificationManagement />
                )}
            </main>
        </div>
    );
};

export default AdminPanel;