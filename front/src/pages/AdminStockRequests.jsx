import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, X, Eye, Check, XCircle } from 'react-feather';
import requestService from '../services/requestService';
import authService from '../services/authService';
import AdminSidebar from '../components/AdminSidebar';

const AdminStockRequests = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');

  const user = authService.getStoredUser();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [requestsRes, pendingRes] = await Promise.all([
        requestService.getAll(),
        requestService.getPendingCount()
      ]);
      
      setRequests(requestsRes.data || []);
      setPendingCount(pendingRes.data?.count || 0);
    } catch (err) {
      console.error('Requests fetch error:', err);
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = req.code?.toLowerCase().includes(search.toLowerCase()) ||
                         req.storeName?.toLowerCase().includes(search.toLowerCase()) ||
                         req.requestedBy?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectionNotes('');
    setShowRejectModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    try {
      await requestService.process(selectedRequest.id, {
        status: 'Approved',
        notes: 'Approved by admin'
      });
      
      alert('Request approved successfully!');
      setShowApproveModal(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      console.error('Approve error:', err);
      alert(err.message || 'Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequest) return;
    if (!rejectionNotes.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      await requestService.process(selectedRequest.id, {
        status: 'Rejected',
        notes: rejectionNotes
      });
      
      alert('Request rejected');
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionNotes('');
      fetchRequests();
    } catch (err) {
      console.error('Reject error:', err);
      alert(err.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100 font-sans">
      <AdminSidebar/>
      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Stock Requests</h1>
            <p className="text-gray-600">Manage and approve stock requests</p>
          </div>
          <div className="flex items-center space-x-4">
            {pendingCount > 0 && (
              <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-semibold">
                {pendingCount} Pending
              </div>
            )}
            <button 
              onClick={fetchRequests}
              className="p-2 rounded-lg hover:bg-gray-200 transition"
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
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input 
                type="text" 
                placeholder="Search requests..." 
                className="w-full border rounded-lg px-3 py-2" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                className="w-full border rounded-lg px-3 py-2" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All Status</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-semibold">All Stock Requests ({filteredRequests.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Request ID', 'Store', 'Items', 'Requested By', 'Date', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                  <tr key={req.id}>
                    <td className="px-6 py-4 text-sm font-medium">{req.code || req.id}</td>
                    <td className="px-6 py-4 text-sm">{req.storeName || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      {Array.isArray(req.items) ? `${req.items.length} items` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">{req.requestedBy || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        req.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        req.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button 
                        onClick={() => handleViewDetails(req)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        View
                      </button>
                      {req.status === 'Pending' && (
                        <>
                          <button 
                            onClick={() => handleApproveClick(req)}
                            className="text-green-600 hover:text-green-900"
                            title="Approve"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectClick(req)}
                            className="text-red-600 hover:text-red-900"
                            title="Reject"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No stock requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDetailsModal(false)}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full mx-4 max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Request Details</h2>
                <button onClick={() => setShowDetailsModal(false)}>
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Request ID</p>
                  <p className="font-semibold">{selectedRequest.code || selectedRequest.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Store</p>
                  <p className="font-semibold">{selectedRequest.storeName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Requested By</p>
                  <p className="font-semibold">{selectedRequest.requestedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-semibold">
                    {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedRequest.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    selectedRequest.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedRequest.status}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3">Requested Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(selectedRequest.items || []).map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm">{item.name || 'N/A'}</td>
                          <td className="px-4 py-2 text-sm font-semibold">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm">{item.unit || 'pcs'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedRequest.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                {selectedRequest.status === 'Pending' && (
                  <>
                    <button 
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleRejectClick(selectedRequest);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleApproveClick(selectedRequest);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approve Confirmation Modal */}
        {showApproveModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => !actionLoading && setShowApproveModal(false)}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <Check className="text-green-600" size={24} />
                </div>
                <h2 className="text-xl font-bold">Approve Request</h2>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to approve request <strong>{selectedRequest.code || selectedRequest.id}</strong> from <strong>{selectedRequest.storeName}</strong>?
              </p>

              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setShowApproveModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleApproveConfirm}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Approval'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Confirmation Modal */}
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => !actionLoading && setShowRejectModal(false)}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <XCircle className="text-red-600" size={24} />
                </div>
                <h2 className="text-xl font-bold">Reject Request</h2>
              </div>
              
              <p className="text-gray-600 mb-4">
                Rejecting request <strong>{selectedRequest.code || selectedRequest.id}</strong> from <strong>{selectedRequest.storeName}</strong>.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason*</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  rows="4"
                  placeholder="Please provide a reason for rejection..."
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setShowRejectModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRejectConfirm}
                  disabled={actionLoading || !rejectionNotes.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminStockRequests;