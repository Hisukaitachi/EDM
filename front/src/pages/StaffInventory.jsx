import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, Package, Search, Filter } from 'react-feather';
import StaffSidebar from '../components/StaffSidebar';
import inventoryService from '../services/inventoryService';
import authService from '../services/authService';
import dataMapper from '../utils/dataMapper';

const StaffInventory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [stockStatusFilter, setStockStatusFilter] = useState('All Items');
  
  // Selected item for details modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const user = authService.getStoredUser();

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [inventoryRes, categoriesRes] = await Promise.all([
        inventoryService.getAll(),
        inventoryService.getCategories()
      ]);
      
      const mappedInventory = dataMapper.mapInventoryList(inventoryRes.data);
      const mappedCategories = dataMapper.mapCategoryList(categoriesRes.data);
      
      setInventory(mappedInventory);
      setCategories(mappedCategories);
    } catch (err) {
      console.error('Inventory fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    
    // Check if there's a filter from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter');
    if (filter === 'low-stock') {
      setStockStatusFilter('Low Stock');
    }
  }, []);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) ||
                         item.code?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;
    
    let matchesStock = true;
    if (stockStatusFilter === 'In Stock') matchesStock = item.stock > item.threshold;
    else if (stockStatusFilter === 'Low Stock') matchesStock = item.stock <= item.threshold && item.stock > 0;
    else if (stockStatusFilter === 'Out of Stock') matchesStock = item.stock === 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleRequestStock = (item) => {
    window.location.href = `/staff/request-stock?itemId=${item.id}`;
  };

  const getStockStatus = (item) => {
    if (item.stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (item.stock <= item.threshold) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const getStockStats = () => {
    const total = inventory.length;
    const inStock = inventory.filter(item => item.stock > item.threshold).length;
    const lowStock = inventory.filter(item => item.stock <= item.threshold && item.stock > 0).length;
    const outOfStock = inventory.filter(item => item.stock === 0).length;
    return { total, inStock, lowStock, outOfStock };
  };

  const stats = getStockStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading inventory...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">View Inventory</h1>
            <p className="text-gray-600">Browse all available stock items</p>
          </div>
          <button 
            onClick={fetchInventory}
            className="p-2 rounded-lg hover:bg-gray-200 transition"
            title="Refresh"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="text-red-600 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <button 
                onClick={fetchInventory}
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
            <p className="text-gray-500 text-sm mb-1">Total Items</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm mb-1">In Stock</p>
            <h3 className="text-2xl font-bold text-green-600">{stats.inStock}</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm mb-1">Low Stock</p>
            <h3 className="text-2xl font-bold text-yellow-600">{stats.lowStock}</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm mb-1">Out of Stock</p>
            <h3 className="text-2xl font-bold text-red-600">{stats.outOfStock}</h3>
          </div>
        </section>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search size={16} className="inline mr-1" />
                Search Items
              </label>
              <input 
                type="text" 
                placeholder="Search by name or code..." 
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter size={16} className="inline mr-1" />
                Category
              </label>
              <select 
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option>All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package size={16} className="inline mr-1" />
                Stock Status
              </label>
              <select 
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={stockStatusFilter} 
                onChange={(e) => setStockStatusFilter(e.target.value)}
              >
                <option>All Items</option>
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-semibold text-lg">Inventory Items ({filteredInventory.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Code', 'Product Name', 'Category', 'Stock', 'Threshold', 'Unit', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.length > 0 ? filteredInventory.map((item) => {
                  const status = getStockStatus(item);
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.category}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`font-semibold ${
                          item.stock === 0 ? 'text-red-600' :
                          item.stock <= item.threshold ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.threshold}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.unit || 'pcs'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button 
                          onClick={() => handleViewDetails(item)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          View
                        </button>
                        {item.stock <= item.threshold && (
                          <button 
                            onClick={() => handleRequestStock(item)}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            Request
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      No inventory items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Item Details</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Item Code</p>
                  <p className="font-semibold">{selectedItem.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Product Name</p>
                  <p className="font-semibold">{selectedItem.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-semibold">{selectedItem.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unit of Measure</p>
                  <p className="font-semibold">{selectedItem.unit || 'pcs'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Stock</p>
                  <p className={`font-semibold text-lg ${
                    selectedItem.stock === 0 ? 'text-red-600' :
                    selectedItem.stock <= selectedItem.threshold ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {selectedItem.stock}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reorder Level</p>
                  <p className="font-semibold">{selectedItem.threshold}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unit Price</p>
                  <p className="font-semibold">₱{selectedItem.price?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStockStatus(selectedItem).color}`}>
                    {getStockStatus(selectedItem).label}
                  </span>
                </div>
              </div>

              {selectedItem.description && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedItem.description}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                {selectedItem.stock <= selectedItem.threshold && (
                  <button 
                    onClick={() => handleRequestStock(selectedItem)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Request Stock
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

export default StaffInventory;