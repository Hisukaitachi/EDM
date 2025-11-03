import React, { useEffect, useState } from 'react';
import { Bell, RefreshCw, AlertCircle, Package, ShoppingCart, AlertTriangle, PlusCircle, FileText, HelpCircle } from 'react-feather';
import StaffSidebar from '../components/StaffSidebar';
import requestService from '../services/requestService';
import inventoryService from '../services/inventoryService';
import authService from '../services/authService';
import dataMapper from '../utils/dataMapper';

const StaffDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    pendingRequests: 0
  });
  
  const [myRequests, setMyRequests] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const user = authService.getStoredUser();

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      setError(null);

      const [myRequestsRes, lowStockRes, allInventoryRes] = await Promise.all([
        requestService.getMyRequests(),
        inventoryService.getLowStock(),
        inventoryService.getAll()
      ]);

      // Map requests
      const mappedRequests = dataMapper.mapStockRequestList(myRequestsRes.data || []);
      setMyRequests(mappedRequests);

      // Map low stock items
      const mappedLowStock = dataMapper.mapLowStockList(lowStockRes.data || []);
      setLowStockItems(mappedLowStock);

      // Map inventory
      const mappedInventory = dataMapper.mapInventoryList(allInventoryRes.data || []);

      // Calculate stats
      const pendingCount = mappedRequests.filter(req => req.status === 'Pending').length;
      
      setStats({
        totalItems: mappedInventory.length,
        lowStockItems: mappedLowStock.length,
        pendingRequests: pendingCount
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
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rejected':
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
            <h1 className="text-2xl font-bold text-gray-800">Staff Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.username || user?.fullName}!</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="p-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={refreshing ? 'animate-spin' : ''} size={20} />
            </button>
            <div className="relative cursor-pointer">
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-md overflow-hidden text-white mb-8">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.fullName || user?.username}!</h2>
            <p className="mb-6">
              You have {stats.pendingRequests} pending stock request{stats.pendingRequests !== 1 ? 's' : ''} and {stats.lowStockItems} item{stats.lowStockItems !== 1 ? 's' : ''} running low.
            </p>
            <button 
              onClick={() => window.location.href = '/staff/inventory'}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              View Inventory
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <Package size={24} />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Items in Store</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalItems}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Low Stock Items</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <ShoppingCart size={24} />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Pending Requests</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</h3>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button 
            onClick={() => window.location.href = '/staff/request-stock'}
            className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center hover:bg-blue-50 transition hover:shadow-lg"
          >
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mb-3">
              <PlusCircle size={24} />
            </div>
            <span className="font-medium">New Request</span>
          </button>

          <button 
            onClick={() => window.location.href = '/staff/reports'}
            className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center hover:bg-green-50 transition hover:shadow-lg"
          >
            <div className="p-3 rounded-full bg-green-100 text-green-600 mb-3">
              <FileText size={24} />
            </div>
            <span className="font-medium">View Reports</span>
          </button>

          <button 
            onClick={() => alert('Report Issue feature coming soon!')}
            className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center hover:bg-yellow-50 transition hover:shadow-lg"
          >
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mb-3">
              <AlertTriangle size={24} />
            </div>
            <span className="font-medium">Report Issue</span>
          </button>

          <button 
            onClick={() => alert('Help documentation coming soon!')}
            className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center hover:bg-purple-50 transition hover:shadow-lg"
          >
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mb-3">
              <HelpCircle size={24} />
            </div>
            <span className="font-medium">Get Help</span>
          </button>
        </section>

        {/* Recent Requests */}
        <section className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-6 border-b">
            <h3 className="font-semibold text-lg">Your Recent Requests</h3>
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
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.productName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.quantityRequested}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        onClick={() => handleViewRequest(req)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No requests found. Create your first stock request!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {myRequests.length > 5 && (
            <div className="p-4 border-t text-center">
              <button 
                onClick={() => window.location.href = '/staff/my-requests'}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Requests
              </button>
            </div>
          )}
        </section>

        {/* Low Stock Items */}
        <section className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-semibold text-lg">Low Stock Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Item Code', 'Product Name', 'Current Stock', 'Threshold', 'Shortage', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowStockItems.length > 0 ? lowStockItems.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{item.stock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.threshold}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{item.shortage || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        onClick={() => window.location.href = `/staff/request-stock?itemId=${item.id}`}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Request Stock
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No low stock items. All items are well stocked!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {lowStockItems.length > 5 && (
            <div className="p-4 border-t text-center">
              <button 
                onClick={() => window.location.href = '/staff/inventory?filter=low-stock'}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Low Stock Items
              </button>
            </div>
          )}
        </section>

        {/* Request Details Modal */}
        {showRequestModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowRequestModal(false)}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Request Details</h2>
              <div className="space-y-3 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Request ID</p>
                    <p className="font-semibold">{selectedRequest.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Product</p>
                    <p className="font-semibold">{selectedRequest.productName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Product Code</p>
                    <p className="font-semibold">{selectedRequest.productCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantity Requested</p>
                    <p className="font-semibold">{selectedRequest.quantityRequested}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date Requested</p>
                    <p className="font-semibold">
                      {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {selectedRequest.reason && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Reason</p>
                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedRequest.reason}</p>
                  </div>
                )}
                
                {selectedRequest.approvedBy && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Approved By</p>
                    <p className="font-semibold">{selectedRequest.approvedBy}</p>
                  </div>
                )}
                
                {selectedRequest.approvalNotes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Admin Notes</p>
                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedRequest.approvalNotes}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowRequestModal(false)}
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

export default StaffDashboard;