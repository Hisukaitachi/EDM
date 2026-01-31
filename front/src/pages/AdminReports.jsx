import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, Download, TrendingUp, TrendingDown, Calendar, Package, Users, Clock } from 'react-feather';
import AdminSidebar from '../components/AdminSidebar';
import reportService from '../services/reportService';
import requestService from '../services/requestService';
import inventoryService from '../services/inventoryService';
import userService from '../services/userService';
import authService from '../services/authService';
import dataMapper from '../utils/dataMapper';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area 
} from 'recharts';

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [kpis, setKpis] = useState({
    totalItems: 0,
    pendingRequests: 0,
    lowStockItems: 0,
    activeStaff: 0
  });
  
  const [stockTrend, setStockTrend] = useState([]);
  const [requestStatus, setRequestStatus] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [inventoryValuation, setInventoryValuation] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState({
    totalRequests: 0,
    approvedRequests: 0,
    approvalRate: 0
  });
  const [productTypeDistribution, setProductTypeDistribution] = useState([]);
  const [dailyRequestTrend, setDailyRequestTrend] = useState([]);

  const [dateRange, setDateRange] = useState('last30days');

  const user = authService.getStoredUser();

  const fetchReportData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      setError(null);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      if (dateRange === 'last7days') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === 'last30days') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (dateRange === 'last90days') {
        startDate.setDate(startDate.getDate() - 90);
      }

      // Fetch all data in parallel
      const [
        dashboardRes,
        inventoryRes,
        requestsRes,
        staffRes
      ] = await Promise.all([
        reportService.getDashboard().catch(() => ({ data: {} })),
        inventoryService.getAll().catch(() => ({ data: [] })),
        requestService.getAll({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }).catch(() => ({ data: [] })),
        userService.getStaffList().catch(() => ({ data: [] }))
      ]);

      // Map dashboard analytics
      const analytics = dataMapper.mapDashboardAnalytics(dashboardRes.data);
      const mappedInventory = dataMapper.mapInventoryList(inventoryRes.data);
      const mappedRequests = dataMapper.mapStockRequestList(requestsRes.data);
      
      // Set KPIs
      setKpis({
        totalItems: mappedInventory.length,
        pendingRequests: mappedRequests.filter(r => r.status === 'Pending').length,
        lowStockItems: mappedInventory.filter(item => item.stock <= item.size && item.stock > 0).length,
        activeStaff: Array.isArray(staffRes.data) ? staffRes.data.length : 0
      });

      // Calculate inventory valuation
      const totalValue = mappedInventory.reduce((sum, item) => {
        return sum + (item.stock * (item.price || 0));
      }, 0);
      setInventoryValuation(totalValue);

      // Process product type distribution
      const typeMap = new Map();
      mappedInventory.forEach(item => {
        const type = item.productType || 'Uncategorized';
        if (typeMap.has(type)) {
          typeMap.set(type, typeMap.get(type) + 1);
        } else {
          typeMap.set(type, 1);
        }
      });
      
      const typeDistribution = Array.from(typeMap.entries()).map(([name, value]) => ({
        name,
        value
      }));
      setProductTypeDistribution(typeDistribution);

      // Process stock trend data (last 7 days of stock levels)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push({
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: mappedInventory.reduce((sum, item) => sum + item.stock, 0),
          items: mappedInventory.length
        });
      }
      setStockTrend(last7Days);

      // Process request status distribution
      const statusCounts = mappedRequests.reduce((acc, req) => {
        const status = req.status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const statusData = Object.entries(statusCounts).map(([label, value]) => ({
        label,
        value
      }));
      setRequestStatus(statusData);

      // Calculate monthly stats
      const totalRequests = mappedRequests.length;
      const approvedRequests = statusCounts.Approved || statusCounts.Completed || 0;
      const approvalRate = totalRequests > 0 ? ((approvedRequests / totalRequests) * 100).toFixed(1) : 0;

      setMonthlyStats({
        totalRequests,
        approvedRequests,
        approvalRate
      });

      // Process daily request trend
      const dailyMap = new Map();
      mappedRequests.forEach(req => {
        const date = new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
      });
      
      const dailyTrend = Array.from(dailyMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-14); // Last 14 days
      setDailyRequestTrend(dailyTrend);

      // Get top requested items
      const itemRequestMap = new Map();
      mappedRequests.forEach(req => {
        const key = req.productName || 'Unknown';
        if (itemRequestMap.has(key)) {
          const existing = itemRequestMap.get(key);
          existing.count += 1;
          existing.quantity += req.quantityRequested || 0;
        } else {
          itemRequestMap.set(key, {
            name: key,
            count: 1,
            quantity: req.quantityRequested || 0
          });
        }
      });

      const topItemsData = Array.from(itemRequestMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      setTopItems(topItemsData);

      // Set recent activity
      setRecentActivity(mappedRequests.slice(0, 10));

    } catch (err) {
      console.error('Report load error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load report data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const handleExportData = () => {
    // Create CSV data
    const csvData = [
      ['StockPro Analytics Report'],
      ['Generated:', new Date().toLocaleString()],
      ['Date Range:', dateRange],
      [''],
      ['KPI Summary'],
      ['Metric', 'Value'],
      ['Total Items', kpis.totalItems],
      ['Pending Requests', kpis.pendingRequests],
      ['Low Stock Items', kpis.lowStockItems],
      ['Active Staff', kpis.activeStaff],
      ['Inventory Valuation', `₱${inventoryValuation.toLocaleString()}`],
      [''],
      ['Request Statistics'],
      ['Total Requests', monthlyStats.totalRequests],
      ['Approved Requests', monthlyStats.approvedRequests],
      ['Approval Rate', `${monthlyStats.approvalRate}%`],
      [''],
      ['Request Status Distribution'],
      ['Status', 'Count'],
      ...requestStatus.map(item => [item.label, item.value]),
      [''],
      ['Top Requested Items'],
      ['Product Name', 'Request Count', 'Total Quantity'],
      ...topItems.map(item => [item.name, item.count, item.quantity])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stockpro-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100 font-sans">
      <AdminSidebar/>
      
      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
            <p className="text-gray-600">Visual insights into your inventory and requests</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center border rounded-lg bg-white">
              <Calendar size={18} className="ml-3 text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="last90days">Last 90 Days</option>
              </select>
            </div>
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
            >
              <Download size={18} className="mr-2" />
              Export
            </button>
            <button 
              onClick={() => fetchReportData(true)}
              disabled={refreshing}
              className="p-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              <RefreshCw className={refreshing ? 'animate-spin' : ''} size={20} />
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
                onClick={() => fetchReportData(true)}
                className="text-red-600 text-sm underline mt-2 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-100 text-sm font-medium">Total Items</p>
              <Package className="text-blue-100" size={24} />
            </div>
            <h3 className="text-4xl font-bold mb-1">{kpis.totalItems}</h3>
            <p className="text-xs text-blue-100">In inventory</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-yellow-100 text-sm font-medium">Pending</p>
              <Clock className="text-yellow-100" size={24} />
            </div>
            <h3 className="text-4xl font-bold mb-1">{kpis.pendingRequests}</h3>
            <p className="text-xs text-yellow-100">Awaiting approval</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-red-100 text-sm font-medium">Low Stock</p>
              <TrendingDown className="text-red-100" size={24} />
            </div>
            <h3 className="text-4xl font-bold mb-1">{kpis.lowStockItems}</h3>
            <p className="text-xs text-red-100">Need restock</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-100 text-sm font-medium">Active Staff</p>
              <Users className="text-green-100" size={24} />
            </div>
            <h3 className="text-4xl font-bold mb-1">{kpis.activeStaff}</h3>
            <p className="text-xs text-green-100">Team members</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-purple-100 text-sm font-medium">Valuation</p>
              <TrendingUp className="text-purple-100" size={24} />
            </div>
            <h3 className="text-2xl font-bold mb-1">₱{inventoryValuation.toLocaleString()}</h3>
            <p className="text-xs text-purple-100">Total value</p>
          </div>
        </section>

        {/* Request Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 font-medium">Total Requests</p>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="text-blue-600" size={24} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{monthlyStats.totalRequests}</h3>
            <p className="text-sm text-gray-500 mt-2">In selected period</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 font-medium">Approved</p>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-green-600">{monthlyStats.approvedRequests}</h3>
            <p className="text-sm text-gray-500 mt-2">Successfully processed</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 font-medium">Approval Rate</p>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-purple-600">{monthlyStats.approvalRate}%</h3>
            <p className="text-sm text-gray-500 mt-2">Success rate</p>
          </div>
        </section>

        {/* Charts Row 1 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Request Trend */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Daily Request Trend</h3>
            {dailyRequestTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyRequestTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Clock size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No request data available</p>
                </div>
              </div>
            )}
          </div>

          {/* Request Status Distribution */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Request Status Distribution</h3>
            {requestStatus.length > 0 && requestStatus.some(s => s.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={requestStatus} 
                    dataKey="value" 
                    nameKey="label" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100}
                    label={({ label, value, percent }) => `${label}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: '#6b7280' }}
                  >
                    {requestStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                  <p>No request data available</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Charts Row 2 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Requested Items */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Top 10 Requested Items</h3>
            {topItems.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topItems} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    width={150}
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value, name) => [value, name === 'count' ? 'Requests' : name === 'quantity' ? 'Total Qty' : name]}
                  />
                  <Bar dataKey="count" fill="#6366F1" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Package size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No requested items data</p>
                </div>
              </div>
            )}
          </div>

          {/* Product Type Distribution */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Inventory by Product Type</h3>
            {productTypeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={productTypeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]}>
                    {productTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Package size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No product type data</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <h3 className="font-bold text-lg text-gray-800">Recent Stock Requests</h3>
            <p className="text-sm text-gray-600 mt-1">Latest activity in your inventory system</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Request ID', 'Product', 'Quantity', 'Requested By', 'Date', 'Status'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentActivity.length > 0 ? recentActivity.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{req.code || req.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{req.productName || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-blue-600">{req.quantityRequested}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{req.requestedBy || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        req.status === 'Approved' || req.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        req.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <AlertCircle size={48} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">No recent activity</p>
                        <p className="text-sm mt-1">Stock requests will appear here</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminReports;