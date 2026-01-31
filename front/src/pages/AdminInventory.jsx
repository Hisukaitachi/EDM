import React, { useEffect, useState } from 'react';
import { Package, Plus, RefreshCw, AlertCircle, X, Edit2, Trash2 } from 'react-feather';
import AdminSidebar from '../components/AdminSidebar';
import inventoryService from '../services/inventoryService';
import authService from '../services/authService';
import dataMapper from '../utils/dataMapper';

const AdminInventory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [productTypes, setProductTypes] = useState([]); // Changed from categories
  
  // Filters
  const [search, setSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('All Product Types'); // Changed
  const [stockStatusFilter, setStockStatusFilter] = useState('All Items');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    // code: '', // REMOVED
    productTypeId: '', // Changed from categoryId
    stock: 0,
    size: '', // Changed from threshold
    unit: 'pcs',
    price: 0,
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const user = authService.getStoredUser();

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [inventoryRes, productTypesRes] = await Promise.all([
        inventoryService.getAll(),
        inventoryService.getProductTypes() // Changed from getCategories
      ]);
      
      // Map backend data to frontend format
      const mappedInventory = dataMapper.mapInventoryList(inventoryRes.data);
      const mappedProductTypes = dataMapper.mapProductTypeList(productTypesRes.data); // Changed
      
      setInventory(mappedInventory);
      setProductTypes(mappedProductTypes); // Changed
    } catch (err) {
      console.error('Inventory fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase());
    // Removed product code from search
    const matchesProductType = productTypeFilter === 'All Product Types' || item.productType === productTypeFilter; // Changed
    
    let matchesStock = true;
    if (stockStatusFilter === 'In Stock') matchesStock = item.stock > item.size; // Changed threshold to size
    else if (stockStatusFilter === 'Low Stock') matchesStock = item.stock <= item.size && item.stock > 0; // Changed
    else if (stockStatusFilter === 'Out of Stock') matchesStock = item.stock === 0;

    return matchesSearch && matchesProductType && matchesStock; // Changed
  });

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    
    if (mode === 'edit' && item) {
      setFormData({
        name: item.name || '',
        // code: item.code || '', // REMOVED
        productTypeId: item.productTypeId || '', // Changed from categoryId
        stock: item.stock || 0,
        size: item.size || '', // Changed from threshold
        unit: item.unit || 'pcs',
        price: item.price || 0,
        description: item.description || ''
      });
    } else {
      setFormData({
        name: '',
        // code: '', // REMOVED
        productTypeId: '', // Changed from categoryId
        stock: 0,
        size: '', // Changed from threshold
        unit: 'pcs',
        price: 0,
        description: ''
      });
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentItem(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.productTypeId) { // Removed code validation, changed categoryId
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      if (modalMode === 'add') {
        await inventoryService.create(formData);
        alert('Item added successfully!');
      } else {
        await inventoryService.update(currentItem.id, formData);
        alert('Item updated successfully!');
      }
      
      handleCloseModal();
      fetchInventory();
    } catch (err) {
      console.error('Submit error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Form data sent:', formData);
      alert(err.response?.data?.message || err.response?.data?.error || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      await inventoryService.delete(item.id);
      alert('Item deleted successfully!');
      fetchInventory();
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || err.message || 'Failed to delete item');
    }
  };

  const handleUpdateStock = async (item) => {
    const newStock = prompt(`Update stock for "${item.name}":\nCurrent: ${item.stock}`, item.stock);
    if (newStock === null || newStock === '') return;

    const quantity = parseInt(newStock);
    if (isNaN(quantity)) {
      alert('Please enter a valid number');
      return;
    }

    try {
      // Calculate the change needed
      const change = quantity - item.stock;
      await inventoryService.updateStock(item.id, { 
        quantity: Math.abs(change),
        type: change >= 0 ? 'add' : 'remove',
        notes: `Stock adjusted from ${item.stock} to ${quantity}`
      });
      alert('Stock updated successfully!');
      fetchInventory();
    } catch (err) {
      console.error('Stock update error:', err);
      alert(err.response?.data?.message || err.message || 'Failed to update stock');
    }
  };

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
      <AdminSidebar/>
      
      <main className="ml-64 flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
            <p className="text-gray-600">Manage all inventory items</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => handleOpenModal('add')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
            >
              <Plus size={20} className="mr-2" />
              Add New Item
            </button>
            <button 
              onClick={fetchInventory}
              className="p-2 rounded-lg hover:bg-gray-200 transition"
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input 
                type="text" 
                placeholder="Search items..." 
                className="w-full border rounded-lg px-3 py-2" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
              <select 
                className="w-full border rounded-lg px-3 py-2" 
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
            <h3 className="font-semibold">All Inventory Items ({filteredInventory.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* Removed 'Code' column */}
                  {['Name', 'Product Type', 'Stock', 'Size', 'Unit', 'Price', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.length > 0 ? filteredInventory.map((item) => {
                  const status =
                    item.stock === 0 ? 'Out of Stock' :
                    item.stock <= item.size ? 'Low Stock' : 'In Stock'; // Changed threshold to size
                  const statusColor =
                    status === 'In Stock' ? 'bg-green-100 text-green-800' :
                    status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800';

                  return (
                    <tr key={item.id}>
                      {/* Removed product code cell */}
                      <td className="px-6 py-4 text-sm">{item.name}</td>
                      <td className="px-6 py-4 text-sm">{item.productType}</td> {/* Changed from category */}
                      <td className="px-6 py-4 text-sm font-semibold">{item.stock}</td>
                      <td className="px-6 py-4 text-sm">{item.size}</td> {/* Changed from threshold */}
                      <td className="px-6 py-4 text-sm">{item.unit || 'pcs'}</td>
                      <td className="px-6 py-4 text-sm">₱{item.price?.toFixed(2) || '0.00'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button 
                          onClick={() => handleUpdateStock(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Stock
                        </button>
                        <button 
                          onClick={() => handleOpenModal('edit', item)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      No inventory items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCloseModal}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {modalMode === 'add' ? 'Add New Item' : 'Edit Item'}
                </h2>
                <button onClick={handleCloseModal}>
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* REMOVED: Item Code field */}
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Product Name*</label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Product Type*</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.productTypeId}
                    onChange={(e) => setFormData({...formData, productTypeId: e.target.value})}
                  >
                    <option value="">Select Product Type</option>
                    {productTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Stock Quantity*</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Size*</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.size}
                    onChange={(e) => setFormData({...formData, size: e.target.value})}
                  >
                    <option value="">Select Size</option>
                    <option value="3x100M">3x100M</option>
                    <option value="2x100M">2x100M</option>
                    <option value="2x26M">2x26M</option>
                    <option value="2x30M">2x30M</option>
                    <option value="2x45M">2x45M</option>
                    <option value="2x50M">2x50M</option>
                    <option value="2x75M">2x75M</option>
                    <option value="2x80M">2x80M</option>
                    <option value="2x90M">2x90M</option>
                    <option value="1/2x100M">1/2x100M</option>
                    <option value="1/2x20M">1/2x20M</option>
                    <option value="1/2x30M">1/2x30M</option>
                    <option value="1/2x40M">1/2x40M</option>
                    <option value="1x100M">1x100M</option>
                    <option value="1x20M">1x20M</option>
                    <option value="1x30M">1x30M</option>
                    <option value="1x40M">1x40M</option>
                    <option value="1x50M">1x50M</option>
                    <option value="3/4x20M">3/4x20M</option>
                    <option value="3/4x30M">3/4x30M</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={handleCloseModal}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : modalMode === 'add' ? 'Add Item' : 'Update Item'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminInventory;