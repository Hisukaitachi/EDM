import api from '../api/api';

const reportService = {
  // Dashboard analytics
  getDashboard: async () => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  // Staff performance
  getStaffPerformance: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/reports/staff-performance?${params}`);
    return response.data;
  },

  // Low stock report
  getLowStock: async () => {
    const response = await api.get('/reports/low-stock');
    return response.data;
  },

  // Most requested items
  getMostRequested: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/reports/most-requested?${params}`);
    return response.data;
  },

  // Inventory valuation
  getInventoryValuation: async () => {
    const response = await api.get('/reports/inventory-valuation');
    return response.data;
  },

  // Monthly stock movement
  getMonthlyMovement: async (year, month) => {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    
    const response = await api.get(`/reports/monthly-movement?${params}`);
    return response.data;
  },

  // Request approval time
  getApprovalTime: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/reports/approval-time?${params}`);
    return response.data;
  },

  // Inventory turnover
  getInventoryTurnover: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/reports/inventory-turnover?${params}`);
    return response.data;
  },

  // Daily activity
  getDailyActivity: async (date) => {
    const params = date ? `?date=${date}` : '';
    const response = await api.get(`/reports/daily-activity${params}`);
    return response.data;
  }
};

export default reportService;