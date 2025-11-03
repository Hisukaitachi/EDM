import React, { useEffect, useState } from 'react';
import { Bell, RefreshCw, AlertCircle } from 'react-feather';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import AdminSidebar from '../components/AdminSidebar';
import reportService from '../services/reportService';
import requestService from '../services/requestService';
import inventoryService from '../services/inventoryService';
import userService from '../services/userService';
import authService from '../services/authService';
import dataMapper from '../utils/dataMapper';
import { Package, ShoppingCart, Users, BarChart2 } from 'react-feather';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [stats, setStats] = useState({
    totalItems: 0,
    pendingRequests: 0,
    lowStockItems: 0,
    activeStaff: 0
  });
  const [stockChartData, setStockChartData] = useState([]);
  const [requestChartData, setRequestChartData] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const user = authService.getStoredUser();

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      setError(null);

      const [dashboardRes, requestsRes, lowStockRes, staffRes] = await Promise.all([
        reportService.getDashboard(),
        requestService.getAll({ limit: 5 }),
        inventoryService.getLowStock(),
        userService.getStaffList().catch(() => ({ data: [] }))
      ]);

      // Map dashboard analytics
      const analytics = dataMapper.mapDashboardAnalytics(dashboardRes.data);
      
      setStats({
        totalItems: analytics.totalItems,
        pendingRequests: analytics.pendingRequests,
        lowStockItems: analytics.lowStockItems,
        activeStaff: Array.isArray(staffRes.data) ? staffRes.data.length : 0
      });

      // Map requests
      const mappedRequests = dataMapper.mapStockRequestList(requestsRes.data);
      setRecentRequests(mappedRequests);

      // Map low stock items
      const mappedLowStock = dataMapper.mapLowStockList(lowStockRes.data);
      setLowStockItems(mappedLowStock);

      // Process request status for chart
      const statusCounts = mappedRequests.reduce((acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {});

      setRequestChartData([
        { label: 'Approved', value: statusCounts.Approved || 0 },
        { label: 'Pending', value: statusCounts.Pending || 0 },
        { label: 'Rejected', value: statusCounts.Rejected || 0 }
      ]);

      // Get stock movement data
      try {
        const movementRes = await reportService.getMonthlyMovement();
        const stockData = (movementRes.data?.labels || []).map((label, i) => ({
          label,
          value: movementRes.data?.values?.[i] ?? 0
        }));
        setStockChartData(stockData);
      } catch (err) {
        console.warn('Could not load stock movement data');
        setStockChartData([]);
      }

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

  const handleApproveRequest = async (requestId) => {
    setActionLoading(true);
    try {
      await requestService.process(requestId, { 
        status: 'Approved',
        notes: 'Approved by admin'
      });
      
      await fetchDashboardData(true);
      setSelectedRequest(null);
      alert('Request approved successfully!');
    } catch (err) {
      console.error('Approve error:', err);
      alert(err.response?.data?.message || err.message || 'Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    const notes = prompt('Enter rejection reason:');
    if (!notes) return;

    setActionLoading(true);
    try {
      await requestService.process(requestId, { 
        status: 'Rejected',
        notes
      });
      
      await fetchDashboardData(true);
      setSelectedRequest(null);
      alert('Request rejected');
    } catch (err) {
      console.error('Reject error:', err);
      alert(err.response?.data?.message || err.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
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
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.username}!</p>
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

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Items', value: stats.totalItems, icon: Package, bg: 'bg-blue-100', text: 'text-blue-600' },
            { label: 'Pending Requests', value: stats.pendingRequests, icon: ShoppingCart, bg: 'bg-green-100', text: 'text-green-600' },
            { label: 'Low Stock Items', value: stats.lowStockItems, icon: BarChart2, bg: 'bg-yellow-100', text: 'text-yellow-600' },
            { label: 'Active Staff', value: stats.activeStaff, icon: Users, bg: 'bg-purple-100', text: 'text-purple-600' }
          ].map(({ label, value, icon: Icon, bg, text }) => (
            <div key={label} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${bg} ${text} mr-4`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{label}</p>
                  <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-lg mb-4">Stock Levels (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stockChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-lg mb-4">Request Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={requestChartData}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {requestChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#10B981', '#F59E0B', '#EF4444'][index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-6 border-b">
            <h3 className="font-semibold text-lg">Recent Stock Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Request ID', 'Product', 'Quantity', 'Requested By', 'Date', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentRequests.length > 0 ? recentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{req.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{req.productName || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{req.quantityRequested}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{req.requestedBy || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                        req.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        req.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button 
                        onClick={() => setSelectedRequest(req)}
                        className="text-blue-600 hover:text-blue-900 mr-3 font-medium"
                      >
                        View
                      </button>
                      {req.status === 'Pending' && (
                        <>
                          <button 
                            onClick={() => handleApproveRequest(req.id)}
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-900 mr-3 disabled:opacity-50 font-medium"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectRequest(req.id)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 font-medium"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No recent requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-semibold text-lg">Low Stock Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Item Code', 'Product Name', 'Category', 'Current Stock', 'Threshold', 'Shortage'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowStockItems.length > 0 ? lowStockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.category || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-red-600 font-semibold">{item.stock}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.threshold}</td>
                    <td className="px-6 py-4 text-sm text-red-600 font-semibold">{item.shortage || 0}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No low stock items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedRequest(null)}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Request Details</h2>
              <div className="space-y-3 mb-6">
                <p><span className="font-semibold">Request ID:</span> {selectedRequest.code}</p>
                <p><span className="font-semibold">Product:</span> {selectedRequest.productName}</p>
                <p><span className="font-semibold">Quantity:</span> {selectedRequest.quantityRequested}</p>
                <p><span className="font-semibold">Status:</span> {selectedRequest.status}</p>
                <p><span className="font-semibold">Requested By:</span> {selectedRequest.requestedBy}</p>
                {selectedRequest.reason && (
                  <p><span className="font-semibold">Reason:</span> {selectedRequest.reason}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setSelectedRequest(null)}
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

export default AdminDashboard;