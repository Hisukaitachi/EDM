// front/src/utils/dataMapper.js
// This utility maps backend data structures to frontend-expected structures

export const dataMapper = {
  // Map backend inventory item to frontend format
  mapInventoryItem: (backendItem) => {
    return {
      id: backendItem.inventory_id,
      code: backendItem.product_code,
      name: backendItem.product_name,
      category: backendItem.category_name,
      categoryId: backendItem.category_id,
      description: backendItem.description,
      stock: backendItem.quantity_in_stock,
      threshold: backendItem.reorder_level,
      unit: backendItem.unit_of_measure,
      price: parseFloat(backendItem.unit_price),
      status: backendItem.status,
      createdAt: backendItem.created_at,
      updatedAt: backendItem.updated_at
    };
  },

  // Map array of backend inventory items
  mapInventoryList: (backendList) => {
    return (backendList || []).map(item => dataMapper.mapInventoryItem(item));
  },

  // Map backend category to frontend format
  mapCategory: (backendCategory) => {
    return {
      id: backendCategory.category_id,
      name: backendCategory.category_name,
      description: backendCategory.description,
      createdAt: backendCategory.created_at
    };
  },

  // Map array of backend categories
  mapCategoryList: (backendList) => {
    return (backendList || []).map(cat => dataMapper.mapCategory(cat));
  },

  // Map backend stock request to frontend format
  mapStockRequest: (backendRequest) => {
    return {
      id: backendRequest.request_id,
      code: `REQ-${String(backendRequest.request_id).padStart(5, '0')}`,
      inventoryId: backendRequest.inventory_id,
      productName: backendRequest.product_name,
      productCode: backendRequest.product_code,
      storeName: 'Main Warehouse', // Backend doesn't have this field
      requestedBy: backendRequest.requested_by_name,
      requestedById: backendRequest.requested_by,
      quantityRequested: backendRequest.quantity_requested,
      reason: backendRequest.request_reason,
      status: backendRequest.request_status.charAt(0).toUpperCase() + backendRequest.request_status.slice(1), // Capitalize
      approvedBy: backendRequest.approved_by_name,
      approvedById: backendRequest.approved_by,
      approvalDate: backendRequest.approval_date,
      approvalNotes: backendRequest.approval_notes,
      createdAt: backendRequest.created_at,
      updatedAt: backendRequest.updated_at,
      // Map items array if exists
      items: backendRequest.items || [{
        name: backendRequest.product_name,
        quantity: backendRequest.quantity_requested,
        unit: 'pcs'
      }]
    };
  },

  // Map array of backend stock requests
  mapStockRequestList: (backendList) => {
    return (backendList || []).map(req => dataMapper.mapStockRequest(req));
  },

  // Map backend user to frontend format
  mapUser: (backendUser) => {
    return {
      id: backendUser.user_id,
      username: backendUser.username,
      fullName: backendUser.full_name,
      email: backendUser.email || `${backendUser.username}@stockpro.com`,
      role: backendUser.role,
      status: backendUser.status,
      phone: backendUser.phone || 'N/A',
      createdAt: backendUser.created_at,
      updatedAt: backendUser.updated_at
    };
  },

  // Map array of backend users
  mapUserList: (backendList) => {
    return (backendList || []).map(user => dataMapper.mapUser(user));
  },

  // Map backend dashboard analytics to frontend format
  mapDashboardAnalytics: (backendData) => {
    return {
      totalItems: backendData.totalProducts || 0,
      pendingRequests: backendData.pendingRequests || 0,
      lowStockItems: backendData.lowStockItems || 0,
      totalInventoryValue: backendData.totalInventoryValue || 0,
      recentTransactions: backendData.recentTransactions || 0
    };
  },

  // Map backend low stock item to frontend format
  mapLowStockItem: (backendItem) => {
    return {
      id: backendItem.inventory_id,
      code: backendItem.product_code,
      name: backendItem.product_name,
      category: backendItem.category_name,
      stock: backendItem.quantity_in_stock,
      threshold: backendItem.reorder_level,
      shortage: backendItem.shortage_quantity,
      unitPrice: parseFloat(backendItem.unit_price),
      reorderCost: parseFloat(backendItem.reorder_cost_estimate),
      status: backendItem.status,
      lastUpdated: backendItem.last_updated
    };
  },

  // Map array of backend low stock items
  mapLowStockList: (backendList) => {
    return (backendList || []).map(item => dataMapper.mapLowStockItem(item));
  }
};

export default dataMapper;