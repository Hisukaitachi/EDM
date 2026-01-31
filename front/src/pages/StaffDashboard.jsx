import React, { useEffect, useState } from 'react';
import { Bell, RefreshCw, AlertCircle, Package, ShoppingCart, PlusCircle, FileText, X } from 'react-feather';
import StaffSidebar from '../components/StaffSidebar';
import requestService from '../services/requestService';
import authService from '../services/authService';
import dataMapper from '../utils/dataMapper';

const StaffDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [stats, setStats] = useState({
    myItemsCount: 0,
    pendingRequests: 0,
    approvedRequests: 0
  });
  
  const [myRequests, setMyRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const user = authService.getStoredUser();

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      setError(null);

      // Only fetch staff's own requests
      const myRequestsRes = await requestService.getMyRequests();

      // Map requests
      const mappedRequests = dataMapper.mapStockRequestList(myRequestsRes.data || []);
      setMyRequests(mappedRequests);

      // Calculate stats from requests
      const pendingCount = mappedRequests.filter(req => 
        req.status?.toLowerCase() === 'pending'
      ).length;
      
      const approvedCount = mappedRequests.filter(req => 
        req.status?.toLowerCase() === 'approved' || 
        req.status?.toLowerCase() === 'completed'
      ).length;
      
      // Count unique items received
      const receivedItems = new Set();
      mappedRequests.forEach(req => {
        if (req.status?.toLowerCase() === 'approved' || 
            req.status?.toLowerCase() === 'completed') {
          receivedItems.add(req.inventoryId || req.productName);
        }
      });
      
      setStats({
        myItemsCount: receivedItems.size,
        pendingRequests: pendingCount,
        approvedRequests: approvedCount
      });

    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100 font-sans">
      <StaffSidebar />

      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Staff Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, <span className="font-semibold text-blue-600">{user?.fullName || user?.username}</span>!</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="p-2 rounded-lg hover:bg-white hover:shadow-md transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={refreshing ? 'animate-spin' : ''} size={20} />
            </button>
            <div className="relative cursor-pointer hover:scale-110 transition">
              <Bell className="text-gray-500 hover:text-blue-600 transition" />
              {stats.pendingRequests > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {stats.pendingRequests}
                </span>
              )}
            </div>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="text-red-600 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <button 
                onClick={() => fetchDashboardData(true)}
                className="text-red-600 text-sm underline mt-2 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg overflow-hidden text-white mb-8 hover:shadow-xl transition">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.fullName || user?.username}!</h2>
            <p className="mb-6 text-blue-100">
              You have <strong className="text-white">{stats.pendingRequests}</strong> pending request{stats.pendingRequests !== 1 ? 's' : ''} and <strong className="text-white">{stats.myItemsCount}</strong> item{stats.myItemsCount !== 1 ? 's' : ''} in your inventory.
            </p>
            <button 
              onClick={() => window.location.href = '/staff/inventory'}
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition shadow-md hover:shadow-lg"
            >
              View My Inventory
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <Package size={28} />
              </div>
            </div>
            <h3 className="text-4xl font-bold mb-1">{stats.myItemsCount}</h3>
            <p className="text-blue-100 text-sm font-medium">My Items</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <AlertCircle size={28} />
              </div>
              {stats.pendingRequests > 0 && (
                <div className="animate-pulse">
                  <AlertCircle className="text-yellow-100" size={20} />
                </div>
              )}
            </div>
            <h3 className="text-4xl font-bold mb-1">{stats.pendingRequests}</h3>
            <p className="text-yellow-100 text-sm font-medium">Pending Requests</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <ShoppingCart size={28} />
              </div>
            </div>
            <h3 className="text-4xl font-bold mb-1">{stats.approvedRequests}</h3>
            <p className="text-green-100 text-sm font-medium">Approved Requests</p>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button 
            onClick={() => window.location.href = '/staff/request-stock'}
            className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center justify-center hover:bg-blue-50 transition hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="p-4 rounded-full bg-blue-100 text-blue-600 mb-4">
              <PlusCircle size={32} />
            </div>
            <span className="font-semibold text-lg text-gray-800">New Request</span>
            <span className="text-sm text-gray-500 mt-1">Create a stock request</span>
          </button>

          <button 
            onClick={() => window.location.href = '/staff/my-requests'}
            className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center justify-center hover:bg-purple-50 transition hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="p-4 rounded-full bg-purple-100 text-purple-600 mb-4">
              <FileText size={32} />
            </div>
            <span className="font-semibold text-lg text-gray-800">My Requests</span>
            <span className="text-sm text-gray-500 mt-1">View all requests</span>
          </button>

          <button 
            onClick={() => window.location.href = '/staff/inventory'}
            className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center justify-center hover:bg-green-50 transition hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="p-4 rounded-full bg-green-100 text-green-600 mb-4">
              <Package size={32} />
            </div>
            <span className="font-semibold text-lg text-gray-800">My Inventory</span>
            <span className="text-sm text-gray-500 mt-1">View your items</span>
          </button>
        </section>

        {/* Recent Requests */}
        <section className="bg-white rounded-lg shadow-lg overflow-hidden mb-8 hover:shadow-xl transition">
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-gray-800">Your Recent Requests</h3>
                <p className="text-sm text-gray-600 mt-1">Track the status of your stock requests</p>
              </div>
              {myRequests.length > 5 && (
                <a href="/staff/my-requests" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All →
                </a>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Request ID', 'Product', 'Quantity', 'Date', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myRequests.length > 0 ? myRequests.slice(0, 5).map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.code || `#${req.id}`}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{req.productName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{req.quantityRequested}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusColor(req.status)}`}>
                        {req.status?.charAt(0).toUpperCase() + req.status?.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button 
                        onClick={() => handleViewRequest(req)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">No requests yet</p>
                        <p className="text-sm mt-1">Create your first stock request to get started!</p>
                        <button 
                          onClick={() => window.location.href = '/staff/request-stock'}
                          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Create Request
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Request Stock CTA */}
        <section className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
          <div className="p-6 border-b bg-white bg-opacity-50">
            <h3 className="font-bold text-lg text-gray-800">Need More Items?</h3>
            <p className="text-sm text-gray-600 mt-1">Submit a stock request to get items from the warehouse</p>
          </div>
          <div className="p-8 text-center">
            <div className="inline-block p-6 bg-blue-100 rounded-full mb-4">
              <Package size={64} className="text-blue-600" />
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2">Request Stock from Warehouse</h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Browse available items in the warehouse and submit a request to add them to your inventory.
            </p>
            <button 
              onClick={() => window.location.href = '/staff/request-stock'}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-md hover:shadow-lg"
            >
              Request Stock Now
            </button>
          </div>
        </section>

        {/* Request Details Modal */}
        {showRequestModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowRequestModal(false)}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
                <button 
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Request ID</p>
                    <p className="font-semibold text-gray-900">{selectedRequest.code || `#${selectedRequest.id}`}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status?.charAt(0).toUpperCase() + selectedRequest.status?.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Product</p>
                    <p className="font-semibold text-gray-900">{selectedRequest.productName}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Quantity Requested</p>
                    <p className="font-semibold text-blue-600 text-xl">{selectedRequest.quantityRequested}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Date Requested</p>
                    <p className="font-semibold text-gray-900">
                      {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </p>
                  </div>
                  {selectedRequest.approvalDate && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">
                        {selectedRequest.status?.toLowerCase() === 'rejected' ? 'Rejection Date' : 'Approval Date'}
                      </p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedRequest.approvalDate).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
                
                {selectedRequest.reason && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-medium mb-2">Your Request Reason</p>
                    <p className="text-gray-900">{selectedRequest.reason}</p>
                  </div>
                )}
                
                {selectedRequest.approvedBy && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-medium mb-1">
                      {selectedRequest.status?.toLowerCase() === 'rejected' ? 'Rejected By' : 'Approved By'}
                    </p>
                    <p className="font-semibold text-gray-900">{selectedRequest.approvedBy}</p>
                  </div>
                )}
                
                {selectedRequest.approvalNotes && (
                  <div className={`p-4 rounded-lg ${
                    selectedRequest.status?.toLowerCase() === 'rejected' ? 'bg-red-50' : 'bg-green-50'
                  }`}>
                    <p className="text-sm text-gray-600 font-medium mb-2">
                      {selectedRequest.status?.toLowerCase() === 'rejected' ? 'Rejection Notes' : 'Admin Notes'}
                    </p>
                    <p className="text-gray-900">{selectedRequest.approvalNotes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowRequestModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffDashboard;