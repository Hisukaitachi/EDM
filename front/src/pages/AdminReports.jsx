import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, Download, TrendingUp, TrendingDown, Calendar } from 'react-feather';
import AdminSidebar from '../components/AdminSidebar';
import reportService from '../services/reportService';
import requestService from '../services/requestService';
import inventoryService from '../services/inventoryService';
import userService from '../services/userService';
import authService from '../services/authService';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area 
} from 'recharts';

const AdminReports = ({ onNavigate }) => {
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
        movementRes,
        requestsRes,
        valuationRes,
        staffRes
      ] = await Promise.all([
        reportService.getDashboard(),
        reportService.getMonthlyMovement(),
        requestService.getAll({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }),
        reportService.getInventoryValuation().catch(() => ({ data: { totalValue: 0 } })),
        userService.getStaffList()
      ]);

      // Set KPIs
      setKpis({
        totalItems: dashboardRes.data?.totalItems || 0,
        pendingRequests: dashboardRes.data?.pendingRequests || 0,
        lowStockItems: dashboardRes.data?.lowStockItems || 0,
        activeStaff: staffRes.data?.length || 0
      });

      // Process stock trend data
      if (movementRes.data) {
        const trendData = (movementRes.data.labels || []).map((label, i) => ({
          label,
          value: movementRes.data.values?.[i] || movementRes.data.datasets?.[0]?.data?.[i] || 0
        }));
        setStockTrend(trendData);
      }

      // Process request status data
      const requests = requestsRes.data || [];
      const statusCounts = requests.reduce((acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, { Approved: 0, Pending: 0, Rejected: 0 });

      setRequestStatus([
        { label: 'Approved', value: statusCounts.Approved },
        { label: 'Pending', value: statusCounts.Pending },
        { label: 'Rejected', value: statusCounts.Rejected }
      ]);

      // Calculate monthly stats
      const totalRequests = requests.length;
      const approvedRequests = statusCounts.Approved;
      const approvalRate = totalRequests > 0 ? ((approvedRequests / totalRequests) * 100).toFixed(1) : 0;

      setMonthlyStats({
        totalRequests,
        approvedRequests,
        approvalRate
      });

      // Get top requested items
      try {
        const topRes = await reportService.getMostRequested({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          limit: 10
        });
        setTopItems(topRes.data || []);
      } catch (err) {
        console.warn('Could not load top items');
        setTopItems([]);
      }

      // Set recent activity
      setRecentActivity(requests.slice(0, 10));

      // Set inventory valuation
      setInventoryValuation(valuationRes.data?.totalValue || 0);

    } catch (err) {
      console.error('Report load error:', err);
      setError(err.message || 'Failed to load report data');
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
      ['Report Generated:', new Date().toLocaleString()],
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
      ['Approval Rate', `${monthlyStats.approvalRate}%`]
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stockpro-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

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
      {/* Main Content */}
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
              className="p-2 rounded-lg hover:bg-gray-200 transition"
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
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-sm">Total Items</p>
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{kpis.totalItems}</h3>
            <p className="text-xs text-gray-500 mt-1">Inventory items</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-sm">Pending Requests</p>
              <TrendingUp className="text-yellow-600" size={20} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{kpis.pendingRequests}</h3>
            <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-sm">Low Stock</p>
              <TrendingDown className="text-red-600" size={20} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{kpis.lowStockItems}</h3>
            <p className="text-xs text-gray-500 mt-1">Need restock</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-sm">Active Staff</p>
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{kpis.activeStaff}</h3>
            <p className="text-xs text-gray-500 mt-1">Team members</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-sm">Valuation</p>
              <TrendingUp className="text-purple-600" size={20} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">₱{inventoryValuation.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">Total inventory</p>
          </div>
        </section>

        {/* Request Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm mb-1">Total Requests</p>
            <h3 className="text-2xl font-bold">{monthlyStats.totalRequests}</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm mb-1">Approved Requests</p>
            <h3 className="text-2xl font-bold text-green-600">{monthlyStats.approvedRequests}</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm mb-1">Approval Rate</p>
            <h3 className="text-2xl font-bold text-blue-600">{monthlyStats.approvalRate}%</h3>
          </div>
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Stock Movement Trend</h3>
            {stockTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stockTrend}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#3B82F6" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No stock movement data available
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Request Status Distribution</h3>
            {requestStatus.some(s => s.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={requestStatus} 
                    dataKey="value" 
                    nameKey="label" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100}
                    label={(entry) => `${entry.label}: ${entry.value}`}
                  >
                    {requestStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10B981', '#F59E0B', '#EF4444'][index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No request data available
              </div>
            )}
          </div>
        </section>

        {/* Top Requested Items */}
        <section className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="font-semibold mb-4">Top Requested Items</h3>
          {topItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topItems}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No requested items data available
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-semibold">Recent Stock Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Request ID', 'Store', 'Items', 'Requested By', 'Date', 'Status'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentActivity.length > 0 ? recentActivity.map((req) => (
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
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No recent activity
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