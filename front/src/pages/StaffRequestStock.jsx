import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, ShoppingCart, Check } from 'react-feather';
import StaffSidebar from '../components/StaffSidebar';
import inventoryService from '../services/inventoryService';
import requestService from '../services/requestService';
import authService from '../services/authService';
import dataMapper from '../utils/dataMapper';

const StaffRequestStock = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
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
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  
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
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) ||
                         item.code?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
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
      quantity: Math.max(1, item.threshold - item.stock),
      reason: `Restocking low inventory item: ${item.name}`
    });
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const lowStockItems = inventory.filter(item => item.stock <= item.threshold);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
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
            <p className="text-gray-600">Submit a new stock request to the admin</p>
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
              <p className="text-gray-600 text-sm">Fill in the details below</p>
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
                      {item.code} - {item.name} (Stock: {item.stock})
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
                Provide context like: low inventory, upcoming promotion, customer demand, etc.
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

        {/* Low Stock Items - Quick Request */}
        {lowStockItems.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="font-semibold text-lg">Low Stock Items - Quick Request</h3>
              <p className="text-sm text-gray-600 mt-1">Click to quickly request these items</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Code', 'Product Name', 'Current Stock', 'Threshold', 'Shortage', 'Quick Action'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lowStockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-red-600 font-semibold">{item.stock}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.threshold}</td>
                      <td className="px-6 py-4 text-sm text-red-600 font-semibold">
                        {Math.max(0, item.threshold - item.stock)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleQuickRequest(item)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-medium"
                        >
                          Quick Request
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffRequestStock;