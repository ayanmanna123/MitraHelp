import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
    FaUsers, 
    FaUserShield, 
    FaUserCheck, 
    FaUserTimes, 
    FaSearch, 
    FaFilter, 
    FaIdCard, 
    FaCamera,
    FaChartBar,
    FaBell,
    FaCog,
    FaUserSlash,
    FaUserPlus,
    FaAmbulance,
    FaMapMarkerAlt,
    FaClock,
    FaCheckCircle,
    FaTimesCircle,
    FaExclamationTriangle
} from 'react-icons/fa';
import FaceVerificationManagement from '../components/admin/FaceVerificationManagement';

const AdminPanel = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    
    // Dashboard data
    const [dashboardData, setDashboardData] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [configData, setConfigData] = useState(null);
    
    // User management data
    const [users, setUsers] = useState([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [userFilterRole, setUserFilterRole] = useState('all');
    const [userFilterStatus, setUserFilterStatus] = useState('all');
    const [userPage, setUserPage] = useState(1);
    
    // Emergency monitoring data
    const [emergencyData, setEmergencyData] = useState(null);
    
    useEffect(() => {
        if (user?.role !== 'admin') {
            window.location.href = '/dashboard';
            return;
        }
        
        switch (activeTab) {
            case 'dashboard':
                fetchDashboardData();
                break;
            case 'users':
                fetchUsers();
                break;
            case 'emergencies':
                fetchEmergencyDashboard();
                break;
            case 'analytics':
                fetchAnalytics();
                break;
            case 'config':
                fetchConfig();
                break;
            default:
                break;
        }
    }, [activeTab, userPage, userSearchTerm, userFilterRole, userFilterStatus]);

    const fetchDashboardData = async () => {
        try {
            const [volunteersRes, emergenciesRes] = await Promise.all([
                api.get('/admin/volunteers'),
                api.get('/admin/emergencies/dashboard')
            ]);
            
            if (volunteersRes.data.success && emergenciesRes.data.success) {
                setDashboardData({
                    volunteers: volunteersRes.data.data,
                    emergencies: emergenciesRes.data.data
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/users', {
                params: {
                    page: userPage,
                    search: userSearchTerm,
                    role: userFilterRole,
                    status: userFilterStatus
                }
            });
            
            if (response.data.success) {
                setUsers(response.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmergencyDashboard = async () => {
        try {
            const response = await api.get('/admin/emergencies/dashboard');
            if (response.data.success) {
                setEmergencyData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching emergency dashboard:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const response = await api.get('/admin/analytics');
            if (response.data.success) {
                setAnalyticsData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const fetchConfig = async () => {
        try {
            const response = await api.get('/admin/config');
            if (response.data.success) {
                setConfigData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        }
    };

    const handleBlockUser = async (userId, block) => {
        try {
            const response = await api.put(`/admin/users/${userId}/block`, { blocked: block });
            if (response.data.success) {
                fetchUsers();
            }
        } catch (error) {
            console.error('Error blocking user:', error);
        }
    };

    const handleApproveVolunteer = async (volunteerId) => {
        try {
            const response = await api.post(`/admin/volunteers/${volunteerId}/approve`);
            if (response.data.success) {
                fetchDashboardData();
            }
        } catch (error) {
            console.error('Error approving volunteer:', error);
        }
    };

    const handleRejectVolunteer = async (volunteerId, reason) => {
        try {
            const response = await api.post(`/admin/volunteers/${volunteerId}/reject`, { reason });
            if (response.data.success) {
                fetchDashboardData();
            }
        } catch (error) {
            console.error('Error rejecting volunteer:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'Searching': return 'bg-blue-100 text-blue-800';
            case 'Accepted': return 'bg-purple-100 text-purple-800';
            case 'On The Way': return 'bg-indigo-100 text-indigo-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (!dashboardData && activeTab === 'dashboard') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
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
                {/* Navigation Tabs */}
                <div className="bg-white rounded-xl shadow p-6 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: FaChartBar },
                            { id: 'users', label: 'User Management', icon: FaUsers },
                            { id: 'volunteers', label: 'Volunteer Applications', icon: FaUserShield },
                            { id: 'face-verifications', label: 'Face Verification', icon: FaIdCard },
                            { id: 'emergencies', label: 'Emergency Monitoring', icon: FaAmbulance },
                            { id: 'analytics', label: 'Analytics', icon: FaBell },
                            { id: 'config', label: 'System Config', icon: FaCog }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                className={`flex items-center gap-2 py-2 px-4 font-medium text-sm rounded-lg transition ${
                                    activeTab === tab.id
                                        ? 'bg-red-600 text-white'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                }`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <tab.icon className="text-sm" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && dashboardData && (
                    <div className="space-y-6">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow">
                                <div className="flex items-center">
                                    <FaUsers className="text-blue-500 text-3xl mr-4" />
                                    <div>
                                        <p className="text-2xl font-bold text-gray-800">
                                            {dashboardData.volunteers?.length || 0}
                                        </p>
                                        <p className="text-sm text-gray-600">Total Users</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-xl shadow">
                                <div className="flex items-center">
                                    <FaAmbulance className="text-red-500 text-3xl mr-4" />
                                    <div>
                                        <p className="text-2xl font-bold text-gray-800">
                                            {dashboardData.emergencies?.statistics?.totalEmergencies || 0}
                                        </p>
                                        <p className="text-sm text-gray-600">Total Emergencies</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-xl shadow">
                                <div className="flex items-center">
                                    <FaUserShield className="text-green-500 text-3xl mr-4" />
                                    <div>
                                        <p className="text-2xl font-bold text-gray-800">
                                            {dashboardData.volunteers?.filter(v => v.volunteerStatus === 'approved').length || 0}
                                        </p>
                                        <p className="text-sm text-gray-600">Approved Volunteers</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-xl shadow">
                                <div className="flex items-center">
                                    <FaClock className="text-yellow-500 text-3xl mr-4" />
                                    <div>
                                        <p className="text-2xl font-bold text-gray-800">
                                            {dashboardData.emergencies?.statistics?.avgResponseTime || 0}m
                                        </p>
                                        <p className="text-sm text-gray-600">Avg Response Time</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl shadow p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Emergencies</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requester</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {dashboardData.emergencies?.recentEmergencies?.slice(0, 5).map(emergency => (
                                            <tr key={emergency._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                    {emergency.type}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(emergency.status)}`}>
                                                        {emergency.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {emergency.requester?.name || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {new Date(emergency.createdAt).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* User Management Tab */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                            
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={userSearchTerm}
                                        onChange={(e) => setUserSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none w-full md:w-64"
                                    />
                                </div>
                                
                                <select
                                    value={userFilterRole}
                                    onChange={(e) => setUserFilterRole(e.target.value)}
                                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white w-full md:w-40"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="user">Users</option>
                                    <option value="volunteer">Volunteers</option>
                                    <option value="admin">Admins</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading users...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.data?.map(user => (
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
                                                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                        user.role === 'volunteer' ? 'bg-green-100 text-green-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {user.role?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        user.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {user.isAvailable ? 'ACTIVE' : 'BLOCKED'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {user.role !== 'admin' && (
                                                        <button
                                                            onClick={() => handleBlockUser(user._id, user.isAvailable)}
                                                            className={`flex items-center gap-1 ${
                                                                user.isAvailable 
                                                                    ? 'text-red-600 hover:text-red-900' 
                                                                    : 'text-green-600 hover:text-green-900'
                                                            }`}
                                                        >
                                                            {user.isAvailable ? (
                                                                <>
                                                                    <FaUserSlash className="text-xs" /> Block
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <FaUserPlus className="text-xs" /> Unblock
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                
                                {/* Pagination */}
                                {users.pagination && (
                                    <div className="flex items-center justify-between mt-6">
                                        <div className="text-sm text-gray-700">
                                            Showing page {users.pagination.currentPage} of {users.pagination.totalPages}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setUserPage(prev => Math.max(prev - 1, 1))}
                                                disabled={!users.pagination.hasPrev}
                                                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => setUserPage(prev => prev + 1)}
                                                disabled={!users.pagination.hasNext}
                                                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Volunteer Applications Tab */}
                {activeTab === 'volunteers' && (
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Volunteer Applications</h2>
                        
                        {dashboardData?.volunteers && (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dashboardData.volunteers.map(volunteer => (
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
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(volunteer.volunteerStatus)}`}>
                                                        {volunteer.volunteerStatus?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {volunteer.volunteerStatus === 'pending' && (
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleApproveVolunteer(volunteer._id)}
                                                                className="text-green-600 hover:text-green-900 font-medium"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const reason = prompt('Enter rejection reason:');
                                                                    if (reason) handleRejectVolunteer(volunteer._id, reason);
                                                                }}
                                                                className="text-red-600 hover:text-red-900 font-medium"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Face Verification Tab */}
                {activeTab === 'face-verifications' && (
                    <FaceVerificationManagement />
                )}

                {/* Emergency Monitoring Tab */}
                {activeTab === 'emergencies' && emergencyData && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Emergency Monitoring</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <div className="flex items-center">
                                        <FaAmbulance className="text-blue-500 text-2xl mr-3" />
                                        <div>
                                            <p className="text-2xl font-bold text-blue-700">{emergencyData.statistics?.totalEmergencies}</p>
                                            <p className="text-sm text-blue-600">Total Emergencies</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                    <div className="flex items-center">
                                        <FaCheckCircle className="text-green-500 text-2xl mr-3" />
                                        <div>
                                            <p className="text-2xl font-bold text-green-700">{emergencyData.statistics?.todayEmergencies}</p>
                                            <p className="text-sm text-green-600">Today</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                    <div className="flex items-center">
                                        <FaClock className="text-yellow-500 text-2xl mr-3" />
                                        <div>
                                            <p className="text-2xl font-bold text-yellow-700">{emergencyData.statistics?.avgResponseTime}m</p>
                                            <p className="text-sm text-yellow-600">Avg Response</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                    <div className="flex items-center">
                                        <FaMapMarkerAlt className="text-purple-500 text-2xl mr-3" />
                                        <div>
                                            <p className="text-2xl font-bold text-purple-700">{emergencyData.statusBreakdown?.length || 0}</p>
                                            <p className="text-sm text-purple-600">Active Statuses</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Distribution</h3>
                                    <div className="space-y-2">
                                        {emergencyData.statusBreakdown?.map(item => (
                                            <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                                <span className="font-medium">{item._id}</span>
                                                <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold">
                                                    {item.count}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Types</h3>
                                    <div className="space-y-2">
                                        {emergencyData.typeBreakdown?.map(item => (
                                            <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                                <span className="font-medium">{item._id}</span>
                                                <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold">
                                                    {item.count}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && analyticsData && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">System Analytics</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-blue-700">{analyticsData.userStats?.totalUsers}</p>
                                        <p className="text-sm text-blue-600">Total Users</p>
                                    </div>
                                </div>
                                
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-green-700">{analyticsData.userStats?.totalVolunteers}</p>
                                        <p className="text-sm text-green-600">Volunteers</p>
                                    </div>
                                </div>
                                
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-yellow-700">{analyticsData.emergencyStats?.today}</p>
                                        <p className="text-sm text-yellow-600">Emergencies Today</p>
                                    </div>
                                </div>
                                
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-purple-700">{analyticsData.volunteerStats?.pending}</p>
                                        <p className="text-sm text-purple-600">Pending Apps</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-gray-800 mb-3">User Growth</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>Today:</span>
                                            <span className="font-medium">{analyticsData.userStats?.newUsersToday}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>This Week:</span>
                                            <span className="font-medium">{analyticsData.userStats?.newUsersWeek}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-gray-800 mb-3">Emergency Statistics</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>This Week:</span>
                                            <span className="font-medium">{analyticsData.emergencyStats?.week}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>This Month:</span>
                                            <span className="font-medium">{analyticsData.emergencyStats?.month}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* System Configuration Tab */}
                {activeTab === 'config' && configData && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">System Configuration</h2>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800">System Information</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Name:</span>
                                            <span className="font-medium">{configData.system?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Version:</span>
                                            <span className="font-medium">{configData.system?.version}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Environment:</span>
                                            <span className="font-medium">{configData.system?.environment}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Features</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        {Object.entries(configData.features || {}).map(([feature, enabled]) => (
                                            <div key={feature} className="flex justify-between items-center">
                                                <span className="text-gray-600 capitalize">
                                                    {feature.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    enabled 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {enabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">System Limits</h3>
                                <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {Object.entries(configData.limits || {}).map(([limit, value]) => (
                                        <div key={limit} className="text-center">
                                            <p className="text-2xl font-bold text-gray-700">{value}</p>
                                            <p className="text-sm text-gray-600 capitalize">
                                                {limit.replace(/([A-Z])/g, ' $1').trim()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminPanel;