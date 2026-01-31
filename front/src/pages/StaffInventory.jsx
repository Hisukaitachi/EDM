import React, { useEffect, useState } from 'react';
import { Package, RefreshCw, AlertCircle, Search, Filter } from 'react-feather';
import StaffSidebar from '../components/StaffSidebar';
import requestService from '../services/requestService';
import inventoryService from '../services/inventoryService';
import authService from '../services/authService';
import dataMapper from '../utils/dataMapper';

const StaffInventory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myInventory, setMyInventory] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('All Product Types');
  
  const user = authService.getStoredUser();

  const fetchMyInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all approved/completed requests for this staff member
      const [requestsResponse, inventoryResponse] = await Promise.all([
        requestService.getMyRequests(),
        inventoryService.getAll()
      ]);
      
      const allRequests = dataMapper.mapStockRequestList(requestsResponse.data || []);
      const allInventoryItems = dataMapper.mapInventoryList(inventoryResponse.data || []);
      
      // Create a map of inventory items by ID for quick lookup
      const inventoryMap = new Map();
      allInventoryItems.forEach(item => {
        inventoryMap.set(item.id, item);
      });
      
      // Filter only approved/completed requests
      const approvedRequests = allRequests.filter(
        req => req.status === 'Approved' || req.status === 'Completed' || req.status === 'completed'
      );
      
      // Group by product and sum quantities
      const myInventoryMap = new Map();
      
      approvedRequests.forEach(req => {
        const key = req.inventoryId || req.productName;
        const inventoryItem = inventoryMap.get(req.inventoryId);
        
        if (myInventoryMap.has(key)) {
          const existing = myInventoryMap.get(key);
          existing.totalReceived += req.quantityRequested;
          existing.requestCount += 1;
          existing.lastReceived = new Date(req.approvalDate || req.createdAt);
        } else {
          myInventoryMap.set(key, {
            id: req.inventoryId || key,
            productName: req.productName,
            productType: inventoryItem?.productType || req.productType || 'N/A',
            totalReceived: req.quantityRequested,
            requestCount: 1,
            lastReceived: new Date(req.approvalDate || req.createdAt),
            unit: inventoryItem?.unit || req.unit || 'pcs',
            size: inventoryItem?.size || 'N/A',
            price: inventoryItem?.price || 0
          });
        }
      });
      
      // Convert map to array and sort by last received date
      const inventory = Array.from(myInventoryMap.values()).sort(
        (a, b) => b.lastReceived - a.lastReceived
      );
      
      setMyInventory(inventory);
      
      // Extract unique product types
      const types = [...new Set(inventory.map(item => item.productType).filter(Boolean))];
      setProductTypes(types);
      
    } catch (err) {
      console.error('Inventory fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyInventory();
  }, []);

  const filteredInventory = myInventory.filter((item) => {
    const matchesSearch = item.productName?.toLowerCase().includes(search.toLowerCase());
    const matchesProductType = productTypeFilter === 'All Product Types' || item.productType === productTypeFilter;
    return matchesSearch && matchesProductType;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100 font-sans">
      <StaffSidebar />
      
      <main className="ml-64 flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Inventory</h1>
            <p className="text-gray-600">Items you have received from approved requests</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={fetchMyInventory}
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
            </div>
          </div>
        )}

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-md overflow-hidden text-white mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">Your Inventory Summary</h2>
                <p className="text-blue-100">
                  You have received <strong>{myInventory.length}</strong> different item(s) through <strong>{myInventory.reduce((sum, item) => sum + item.requestCount, 0)}</strong> approved request(s).
                </p>
              </div>
              <div className="p-4 bg-white bg-opacity-20 rounded-lg">
                <Package size={48} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Search size={16} className="inline mr-2" />
                Search
              </label>
              <input 
                type="text" 
                placeholder="Search items..." 
                className="w-full border rounded-lg px-3 py-2" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Filter size={16} className="inline mr-2" />
                Product Type
              </label>
              <select 
                className="w-full border rounded-lg px-3 py-2" 
                value={productTypeFilter} 
                onChange={(e) => setProductTypeFilter(e.target.value)}
              >
                <option>All Product Types</option>
                {productTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-semibold">My Items ({filteredInventory.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Product Name', 'Product Type', 'Size', 'Total Received', 'Unit', 'Request Count', 'Last Received'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.length > 0 ? filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{item.productName}</td>
                    <td className="px-6 py-4 text-sm">{item.productType}</td>
                    <td className="px-6 py-4 text-sm">{item.size}</td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-600">{item.totalReceived}</td>
                    <td className="px-6 py-4 text-sm">{item.unit}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        {item.requestCount} request{item.requestCount !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.lastReceived ? item.lastReceived.toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Package size={48} className="mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">No items in your inventory yet</p>
                        <p className="text-sm mb-4">Make a stock request to get items added to your inventory</p>
                        <button 
                          onClick={() => window.location.href = '/staff/request-stock'}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Request Stock
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="text-blue-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">About Your Inventory</p>
              <p>
                This inventory shows all items you have received through approved stock requests. 
                The quantities shown are cumulative totals from all your approved requests. 
                To request more items, go to the "Request Stock" page.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffInventory;