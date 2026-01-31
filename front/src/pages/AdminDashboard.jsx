import React, { useEffect, useState } from 'react';
import { Bell, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from 'react-feather';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, BarChart, Bar } from 'recharts';
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
    activeStaff: 0,
    totalValue: 0
  });
  const [stockChartData, setStockChartData] = useState([]);
  const [requestChartData, setRequestChartData] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [topRequestedItems, setTopRequestedItems] = useState([]);
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const user = authService.getStoredUser();

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      setError(null);

      const [dashboardRes, requestsRes, inventoryRes, lowStockRes, staffRes] = await Promise.all([
        reportService.getDashboard().catch(() => ({ data: {} })),
        requestService.getAll({ limit: 10 }).catch(() => ({ data: [] })),
        inventoryService.getAll().catch(() => ({ data: [] })),
        inventoryService.getLowStock().catch(() => ({ data: [] })),
        userService.getStaffList().catch(() => ({ data: [] }))
      ]);

      // Map data
      const analytics = dataMapper.mapDashboardAnalytics(dashboardRes.data);
      const mappedRequests = dataMapper.mapStockRequestList(requestsRes.data);
      const mappedInventory = dataMapper.mapInventoryList(inventoryRes.data);
      const mappedLowStock = dataMapper.mapLowStockList(lowStockRes.data);
      
      // Calculate total inventory value
      const totalValue = mappedInventory.reduce((sum, item) => {
        return sum + (item.stock * (item.price || 0));
      }, 0);

      // Calculate low stock items
      const lowStockCount = mappedInventory.filter(item => 
        item.stock <= item.size && item.stock > 0
      ).length;

      setStats({
        totalItems: mappedInventory.length,
        pendingRequests: mappedRequests.filter(r => r.status === 'Pending').length,
        lowStockItems: lowStockCount,
        activeStaff: Array.isArray(staffRes.data) ? staffRes.data.length : 0,
        totalValue: totalValue
      });

      setRecentRequests(mappedRequests.slice(0, 5));
      setLowStockItems(mappedLowStock.slice(0, 5));

      // Process request status for chart
      const statusCounts = mappedRequests.reduce((acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {});

      setRequestChartData([
        { label: 'Approved', value: statusCounts.Approved || statusCounts.Completed || 0, color: '#10B981' },
        { label: 'Pending', value: statusCounts.Pending || 0, color: '#F59E0B' },
        { label: 'Rejected', value: statusCounts.Rejected || 0, color: '#EF4444' }
      ]);

      // Process daily activity (last 7 days)
      const last7Days = [];
      const dailyRequestMap = new Map();
      
      mappedRequests.forEach(req => {
        const date = new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyRequestMap.set(date, (dailyRequestMap.get(date) || 0) + 1);
      });

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        last7Days.push({
          label,
          requests: dailyRequestMap.get(label) || 0,
          stock: mappedInventory.length // This would ideally be historical data
        });
      }
      setDailyActivity(last7Days);

      // Get stock movement data
      try {
        const movementRes = await reportService.getMonthlyMovement();
        const stockData = (movementRes.data?.labels || []).map((label, i) => ({
          label,
          value: movementRes.data?.values?.[i] ?? movementRes.data?.datasets?.[0]?.data?.[i] ?? 0
        }));
        setStockChartData(stockData.length > 0 ? stockData : last7Days.map(d => ({ label: d.label, value: d.stock })));
      } catch (err) {
        console.warn('Could not load stock movement data');
        setStockChartData(last7Days.map(d => ({ label: d.label, value: d.stock })));
      }

      // Get top requested items
      const itemRequestMap = new Map();
      mappedRequests.forEach(req => {
        const key = req.productName || 'Unknown';
        if (itemRequestMap.has(key)) {
          itemRequestMap.set(key, itemRequestMap.get(key) + 1);
        } else {
          itemRequestMap.set(key, 1);
        }
      });

      const topItems = Array.from(itemRequestMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      setTopRequestedItems(topItems);

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

  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

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
            <p className="text-gray-600 mt-1">Welcome back, <span className="font-semibold text-blue-600">{user?.username}</span>!</p>
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

        {/* Enhanced KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <Package size={28} />
              </div>
              <TrendingUp className="text-blue-100" size={20} />
            </div>
            <h3 className="text-4xl font-bold mb-1">{stats.totalItems}</h3>
            <p className="text-blue-100 text-sm font-medium">Total Items</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <Clock size={28} />
              </div>
              <div className={`${stats.pendingRequests > 0 ? 'animate-pulse' : ''}`}>
                <AlertCircle className="text-yellow-100" size={20} />
              </div>
            </div>
            <h3 className="text-4xl font-bold mb-1">{stats.pendingRequests}</h3>
            <p className="text-yellow-100 text-sm font-medium">Pending Requests</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <BarChart2 size={28} />
              </div>
              <TrendingDown className="text-red-100" size={20} />
            </div>
            <h3 className="text-4xl font-bold mb-1">{stats.lowStockItems}</h3>
            <p className="text-red-100 text-sm font-medium">Low Stock Items</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <Users size={28} />
              </div>
              <TrendingUp className="text-green-100" size={20} />
            </div>
            <h3 className="text-4xl font-bold mb-1">{stats.activeStaff}</h3>
            <p className="text-green-100 text-sm font-medium">Active Staff</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <ShoppingCart size={28} />
              </div>
              <TrendingUp className="text-purple-100" size={20} />
            </div>
            <h3 className="text-2xl font-bold mb-1">₱{stats.totalValue.toLocaleString()}</h3>
            <p className="text-purple-100 text-sm font-medium">Total Value</p>
          </div>
        </section>

        {/* Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Activity Trend */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Daily Activity (Last 7 Days)</h3>
            {dailyActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyActivity}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area type="monotone" dataKey="requests" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRequests)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <BarChart2 size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No activity data</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Request Status Distribution */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Request Status Distribution</h3>
            {requestChartData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={requestChartData}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ label, value, percent }) => `${label}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: '#6b7280' }}
                  >
                    {requestChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Package size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No request data</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Top Requested Items Chart */}
        <section className="bg-white rounded-lg shadow-lg p-6 mb-8 hover:shadow-xl transition">
          <h3 className="font-bold text-lg mb-4 text-gray-800">Top 5 Requested Items</h3>
          {topRequestedItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topRequestedItems}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }} 
                  stroke="#6b7280"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Package size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No request data available</p>
              </div>
            </div>
          )}
        </section>

        {/* Recent Stock Requests */}
        <section className="bg-white rounded-lg shadow-lg overflow-hidden mb-8 hover:shadow-xl transition">
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-gray-800">Recent Stock Requests</h3>
                <p className="text-sm text-gray-600 mt-1">Latest requests awaiting your action</p>
              </div>
              <a href="/admin/requests" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All →
              </a>
            </div>
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
                  <tr key={req.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{req.code || req.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{req.productName || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-blue-600">{req.quantityRequested}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{req.requestedBy || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                        req.status === 'Approved' || req.status === 'Completed' ? 'bg-green-100 text-green-800' :
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
                            className="text-green-600 hover:text-green-900 mr-3 disabled:opacity-50 font-medium inline-flex items-center"
                          >
                            <CheckCircle size={14} className="mr-1" />
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectRequest(req.id)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 font-medium inline-flex items-center"
                          >
                            <XCircle size={14} className="mr-1" />
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <ShoppingCart size={48} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">No recent requests</p>
                        <p className="text-sm mt-1">Requests will appear here when staff make them</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Low Stock Items */}
        <section className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
          <div className="p-6 border-b bg-gradient-to-r from-red-50 to-orange-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-gray-800 flex items-center">
                  <AlertCircle className="text-red-600 mr-2" size={20} />
                  Low Stock Items
                </h3>
                <p className="text-sm text-gray-600 mt-1">Items that need to be restocked soon</p>
              </div>
              <a href="/admin/inventory" className="text-red-600 hover:text-red-800 text-sm font-medium">
                View All →
              </a>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Product Name', 'Product Type', 'Current Stock', 'Size', 'Unit', 'Shortage'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowStockItems.length > 0 ? lowStockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.category || item.productType || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-semibold ${
                        item.stock === 0 ? 'text-red-600' : 
                        item.stock <= (item.threshold || item.size || 0) ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.threshold || item.size || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.unit || 'pcs'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-red-600 font-semibold">
                        {item.shortage || ((item.threshold || item.size || 0) - item.stock)}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <Package size={48} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">All items are well stocked!</p>
                        <p className="text-sm mt-1">Great job maintaining inventory levels</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Request Details Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedRequest(null)}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-700">Request ID:</span>
                  <span className="text-gray-900">{selectedRequest.code || selectedRequest.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-700">Product:</span>
                  <span className="text-gray-900">{selectedRequest.productName}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-700">Quantity:</span>
                  <span className="text-blue-600 font-bold">{selectedRequest.quantityRequested}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-700">Status:</span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    selectedRequest.status === 'Approved' || selectedRequest.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    selectedRequest.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-700">Requested By:</span>
                  <span className="text-gray-900">{selectedRequest.requestedBy}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-700">Date:</span>
                  <span className="text-gray-900">
                    {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                  </span>
                </div>
                {selectedRequest.reason && (
                  <div className="py-2">
                    <span className="font-semibold text-gray-700">Reason:</span>
                    <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded">{selectedRequest.reason}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                {selectedRequest.status === 'Pending' && (
                  <>
                    <button 
                      onClick={() => handleApproveRequest(selectedRequest.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center"
                    >
                      <CheckCircle size={18} className="mr-2" />
                      Approve
                    </button>
                    <button 
                      onClick={() => handleRejectRequest(selectedRequest.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center"
                    >
                      <XCircle size={18} className="mr-2" />
                      Reject
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
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