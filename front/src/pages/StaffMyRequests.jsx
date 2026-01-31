import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, X, Clock, CheckCircle, XCircle, FileText } from 'react-feather';
import StaffSidebar from '../components/StaffSidebar';
import requestService from '../services/requestService';
import authService from '../services/authService';
import dataMapper from '../utils/dataMapper';

const StaffMyRequests = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [search, setSearch] = useState('');
  
  // Selected request for details modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const user = authService.getStoredUser();

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await requestService.getMyRequests();
      const mappedRequests = dataMapper.mapStockRequestList(response.data || []);
      
      // Sort by date (newest first)
      mappedRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setRequests(mappedRequests);
    } catch (err) {
      console.error('Requests fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load your requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = req.code?.toLowerCase().includes(search.toLowerCase()) ||
                         req.productName?.toLowerCase().includes(search.toLowerCase());
    
    const normalizedStatus = req.status?.charAt(0).toUpperCase() + req.status?.slice(1).toLowerCase();
    const matchesStatus = statusFilter === 'All Status' || normalizedStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
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

  const getStatusIcon = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'pending':
        return <Clock className="text-yellow-600" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return <FileText className="text-gray-600" size={20} />;
    }
  };

  const getRequestStats = () => {
    const total = requests.length;
    const pending = requests.filter(req => req.status?.toLowerCase() === 'pending').length;
    const approved = requests.filter(req => 
      req.status?.toLowerCase() === 'approved' || 
      req.status?.toLowerCase() === 'completed'
    ).length;
    const rejected = requests.filter(req => req.status?.toLowerCase() === 'rejected').length;
    return { total, pending, approved, rejected };
  };

  const stats = getRequestStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100 font-sans">
      <StaffSidebar />
      
      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Stock Requests</h1>
            <p className="text-gray-600">Track all your stock requests</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => window.location.href = '/staff/request-stock'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              New Request
            </button>
            <button 
              onClick={fetchMyRequests}
              className="p-2 rounded-lg hover:bg-gray-200 transition"
              title="Refresh"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="text-red-600 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <button 
                onClick={fetchMyRequests}
                className="text-red-600 text-sm underline mt-2 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-sm">Total Requests</p>
              <FileText className="text-blue-600" size={20} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-sm">Pending</p>
              <Clock className="text-yellow-600" size={20} />
            </div>
            <h3 className="text-2xl font-bold text-yellow-600">{stats.pending}</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-sm">Approved</p>
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <h3 className="text-2xl font-bold text-green-600">{stats.approved}</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-sm">Rejected</p>
              <XCircle className="text-red-600" size={20} />
            </div>
            <h3 className="text-2xl font-bold text-red-600">{stats.rejected}</h3>
          </div>
        </section>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Requests</label>
              <input 
                type="text" 
                placeholder="Search by request ID or product name..." 
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select 
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All Status</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Completed</option>
                <option>Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-semibold text-lg">Your Requests ({filteredRequests.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Request ID', 'Product', 'Quantity', 'Date Requested', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length > 0 ? filteredRequests.map((req) => {
                  const displayStatus = req.status?.charAt(0).toUpperCase() + req.status?.slice(1).toLowerCase();
                  
                  return (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.code || `#${req.id}`}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>
                          <p className="font-medium text-gray-900">{req.productName || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{req.quantityRequested}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(req.status)}
                          <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(req.status)}`}>
                            {displayStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          onClick={() => handleViewDetails(req)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <FileText className="mx-auto text-gray-400 mb-3" size={48} />
                      <p className="text-gray-500 font-medium">No requests found</p>
                      <p className="text-gray-400 text-sm mt-1">Create your first stock request to get started</p>
                      <button 
                        onClick={() => window.location.href = '/staff/request-stock'}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Create Request
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  {getStatusIcon(selectedRequest.status)}
                  <h2 className="text-xl font-bold ml-3">Request Details</h2>
                </div>
                <button onClick={() => setShowDetailsModal(false)}>
                  <X size={24} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              
              {/* Status Banner */}
              <div className={`p-4 rounded-lg mb-6 ${
                selectedRequest.status?.toLowerCase() === 'approved' || selectedRequest.status?.toLowerCase() === 'completed' 
                  ? 'bg-green-50 border border-green-200' :
                selectedRequest.status?.toLowerCase() === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  {getStatusIcon(selectedRequest.status)}
                  <div className="ml-3">
                    <p className="font-semibold">
                      {selectedRequest.status?.toLowerCase() === 'approved' || selectedRequest.status?.toLowerCase() === 'completed' 
                        ? 'Request Approved' :
                       selectedRequest.status?.toLowerCase() === 'pending' ? 'Request Pending' :
                       'Request Rejected'}
                    </p>
                    <p className="text-sm opacity-75">
                      {selectedRequest.status?.toLowerCase() === 'approved' || selectedRequest.status?.toLowerCase() === 'completed' 
                        ? 'Your request has been approved and items added to your inventory.' :
                       selectedRequest.status?.toLowerCase() === 'pending' ? 'Your request is awaiting admin approval.' :
                       'Your request was not approved. See notes below.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Information */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Request ID</p>
                  <p className="font-semibold">{selectedRequest.code || `#${selectedRequest.id}`}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status?.charAt(0).toUpperCase() + selectedRequest.status?.slice(1).toLowerCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Product Name</p>
                  <p className="font-semibold">{selectedRequest.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Quantity Requested</p>
                  <p className="font-semibold text-lg">{selectedRequest.quantityRequested}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date Requested</p>
                  <p className="font-semibold">
                    {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                {selectedRequest.approvedBy && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Processed By</p>
                      <p className="font-semibold">{selectedRequest.approvedBy}</p>
                    </div>
                  </>
                )}
                {selectedRequest.approvalDate && (
                  <div>
                    <p className="text-sm text-gray-500">Date Processed</p>
                    <p className="font-semibold">
                      {new Date(selectedRequest.approvalDate).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Reason Section */}
              {selectedRequest.reason && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 text-gray-700">Your Request Reason</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">{selectedRequest.reason}</p>
                  </div>
                </div>
              )}

              {/* Admin Notes Section */}
              {selectedRequest.approvalNotes && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 text-gray-700">
                    {selectedRequest.status?.toLowerCase() === 'approved' || selectedRequest.status?.toLowerCase() === 'completed' 
                      ? 'Approval Notes' : 'Rejection Reason'}
                  </h3>
                  <div className={`p-4 rounded-lg ${
                    selectedRequest.status?.toLowerCase() === 'approved' || selectedRequest.status?.toLowerCase() === 'completed' 
                      ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <p className="text-sm text-gray-600">{selectedRequest.approvalNotes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                {selectedRequest.status?.toLowerCase() === 'rejected' && (
                  <button 
                    onClick={() => window.location.href = '/staff/request-stock'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Create New Request
                  </button>
                )}
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
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

export default StaffMyRequests;