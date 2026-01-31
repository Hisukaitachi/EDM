import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, ShoppingCart, Check, Search, Filter } from 'react-feather';
import StaffSidebar from '../components/StaffSidebar';
import inventoryService from '../services/inventoryService';
import requestService from '../services/requestService';
import authService from '../services/authService';
import dataMapper from '../utils/dataMapper';

const StaffRequestStock = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    inventoryId: '',
    productName: '',
    quantity: 1,
    reason: ''
  });
  
  // Filters for inventory selection
  const [search, setSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('All Product Types');
  
  const user = authService.getStoredUser();

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [inventoryRes, productTypesRes] = await Promise.all([
        inventoryService.getAll(),
        inventoryService.getProductTypes()
      ]);
      
      const mappedInventory = dataMapper.mapInventoryList(inventoryRes.data);
      const mappedProductTypes = dataMapper.mapProductTypeList(productTypesRes.data);
      
      setInventory(mappedInventory);
      setProductTypes(mappedProductTypes);
    } catch (err) {
      console.error('Inventory fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    
    // Check if there's a pre-selected item from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('itemId');
    if (itemId) {
      setFormData(prev => ({ ...prev, inventoryId: itemId }));
    }
  }, []);

  useEffect(() => {
    // Auto-fill product name when inventory item is selected
    if (formData.inventoryId) {
      const selectedItem = inventory.find(item => item.id === parseInt(formData.inventoryId));
      if (selectedItem) {
        setFormData(prev => ({ ...prev, productName: selectedItem.name }));
      }
    }
  }, [formData.inventoryId, inventory]);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase());
    const matchesProductType = productTypeFilter === 'All Product Types' || item.productType === productTypeFilter;
    return matchesSearch && matchesProductType;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'inventoryId' ? (value ? parseInt(value) : '') : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.inventoryId) {
      alert('Please select an item from inventory');
      return;
    }
    
    if (!formData.quantity || formData.quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    
    if (!formData.reason.trim()) {
      alert('Please provide a reason for this request');
      return;
    }

    setSubmitting(true);
    try {
      await requestService.create({
        inventoryId: formData.inventoryId,
        quantity: formData.quantity,
        reason: formData.reason.trim()
      });
      
      alert('Stock request submitted successfully!');
      
      // Reset form
      setFormData({
        inventoryId: '',
        productName: '',
        quantity: 1,
        reason: ''
      });
      
      // Redirect to my requests page
      setTimeout(() => {
        window.location.href = '/staff/my-requests';
      }, 1000);
      
    } catch (err) {
      console.error('Submit error:', err);
      alert(err.response?.data?.message || err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickRequest = (item) => {
    setFormData({
      inventoryId: item.id,
      productName: item.name,
      quantity: 1,
      reason: `Requesting ${item.name} for operational needs`
    });
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading available items...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">Request Stock</h1>
            <p className="text-gray-600">Request items from the warehouse inventory</p>
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
            </div>
          </div>
        )}

        {/* Request Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">New Stock Request</h2>
              <p className="text-gray-600 text-sm">Select an item and specify quantity</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Item<span className="text-red-500">*</span>
                </label>
                <select
                  name="inventoryId"
                  value={formData.inventoryId}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select an item --</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} - Size: {item.size} (Stock: {item.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity<span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter quantity"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Request<span className="text-red-500">*</span>
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                rows="4"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please provide a detailed reason for this stock request..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide context like: operational needs, project requirements, customer demand, etc.
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setFormData({ inventoryId: '', productName: '', quantity: 1, reason: '' })}
                className="px-6 py-2 border rounded-lg hover:bg-gray-100 transition"
                disabled={submitting}
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="animate-spin mr-2" size={18} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="mr-2" size={18} />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Available Items */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-semibold text-lg">Available Items from Warehouse</h3>
            <p className="text-sm text-gray-600 mt-1">Browse and request items from the warehouse inventory</p>
          </div>
          
          {/* Filters */}
          <div className="p-6 bg-gray-50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Search size={16} className="inline mr-2" />
                  Search Items
                </label>
                <input 
                  type="text" 
                  placeholder="Search by product name..." 
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
                    <option key={type.id} value={type.name}>{type.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Product Name', 'Product Type', 'Size', 'Type/Color', 'Available Stock', 'Price', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.length > 0 ? filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.productType || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.size || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.unit || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-semibold ${
                        item.stock === 0 ? 'text-red-600' :
                        item.stock <= 10 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">₱{item.price?.toFixed(2) || '0.00'}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleQuickRequest(item)}
                        disabled={item.stock === 0}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {item.stock === 0 ? 'Out of Stock' : 'Request'}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <ShoppingCart size={48} className="mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No items available</p>
                      <p className="text-sm mt-1">Please try adjusting your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffRequestStock;