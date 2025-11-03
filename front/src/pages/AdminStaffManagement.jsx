import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, X, Plus } from 'react-feather';
import AdminSidebar from '../components/AdminSidebar';
import userService from '../services/userService';
import authService from '../services/authService';
import dataMapper from '../utils/dataMapper';

const AdminStaffManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffList, setStaffList] = useState([]);
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentStaff, setCurrentStaff] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'staff',
    fullName: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const user = authService.getStoredUser();

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await userService.getAll();
      
      // Map backend data to frontend format
      const mappedStaff = dataMapper.mapUserList(res.data);
      setStaffList(mappedStaff);
    } catch (err) {
      console.error('Staff fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch = staff.username?.toLowerCase().includes(search.toLowerCase()) ||
                         staff.fullName?.toLowerCase().includes(search.toLowerCase()) ||
                         staff.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || staff.role === roleFilter;
    const matchesStatus = statusFilter === 'All Status' || 
                         (statusFilter === 'active' && staff.status === 'active') ||
                         (statusFilter === 'inactive' && staff.status === 'inactive');
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenModal = (mode, staff = null) => {
    setModalMode(mode);
    setCurrentStaff(staff);
    
    if (mode === 'edit' && staff) {
      setFormData({
        username: staff.username || '',
        password: '',
        role: staff.role || 'staff',
        fullName: staff.fullName || ''
      });
    } else {
      setFormData({
        username: '',
        password: '',
        role: 'staff',
        fullName: ''
      });
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentStaff(null);
    setFormData({
      username: '',
      password: '',
      role: 'staff',
      fullName: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.username.trim()) {
      alert('Username is required');
      return;
    }

    if (modalMode === 'add' && !formData.password.trim()) {
      alert('Password is required for new staff members');
      return;
    }

    if (!formData.fullName.trim()) {
      alert('Full name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'add') {
        await userService.create({
          username: formData.username.trim(),
          password: formData.password,
          role: formData.role,
          fullName: formData.fullName.trim()
        });
        alert('Staff member added successfully!');
        handleCloseModal();
        fetchStaff();
      } else {
        // Note: Backend doesn't have user update endpoint yet
        alert('User profile editing is not yet implemented in the backend. You can update the user status using the Activate/Deactivate buttons.');
        handleCloseModal();
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (staff) => {
    const newStatus = staff.status === 'active' ? 'inactive' : 'active';
    const confirmMsg = `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${staff.username}?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      await userService.updateStatus(staff.id, newStatus);
      alert(`Staff member ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      fetchStaff();
    } catch (err) {
      console.error('Status toggle error:', err);
      alert(err.response?.data?.message || err.message || 'Failed to update status');
    }
  };

  const getStaffStats = () => {
    const total = staffList.length;
    const active = staffList.filter(s => s.status === 'active').length;
    const inactive = staffList.filter(s => s.status === 'inactive').length;
    const admins = staffList.filter(s => s.role === 'admin').length;
    const staff = staffList.filter(s => s.role === 'staff').length;
    const managers = staffList.filter(s => s.role === 'manager').length;

    return { total, active, inactive, admins, staff, managers };
  };

  const stats = getStaffStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading staff...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
            <p className="text-gray-600">Manage all staff members and their roles</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => handleOpenModal('add')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
            >
              <Plus size={20} className="mr-2" />
              Add New Staff
            </button>
            <button 
              onClick={fetchStaff}
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
              <button 
                onClick={fetchStaff}
                className="text-red-600 text-sm underline mt-2 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-xs mb-1">Total Staff</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-xs mb-1">Active</p>
            <h3 className="text-2xl font-bold text-green-600">{stats.active}</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-xs mb-1">Inactive</p>
            <h3 className="text-2xl font-bold text-red-600">{stats.inactive}</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-xs mb-1">Admins</p>
            <h3 className="text-2xl font-bold text-blue-600">{stats.admins}</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-xs mb-1">Staff</p>
            <h3 className="text-2xl font-bold text-purple-600">{stats.staff}</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-xs mb-1">Managers</p>
            <h3 className="text-2xl font-bold text-indigo-600">{stats.managers}</h3>
          </div>
        </section>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input 
                type="text" 
                placeholder="Search by username, name, or email..." 
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select 
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option>All Roles</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-semibold">Staff Members ({filteredStaff.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Username', 'Full Name', 'Email', 'Role', 'Status', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStaff.length > 0 ? filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{staff.username}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{staff.fullName || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{staff.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                        staff.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        staff.role === 'manager' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                        staff.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {staff.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button 
                        onClick={() => handleStatusToggle(staff)}
                        className={`font-medium ${
                          staff.status === 'active' 
                            ? 'text-red-600 hover:text-red-900' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {staff.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No staff members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalMode === 'add' ? 'Add New Staff Member' : 'Edit Staff Member'}
                </h2>
                <button 
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={modalMode === 'edit'}
                    placeholder="Enter username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password{modalMode === 'add' && <span className="text-red-500">*</span>}
                    {modalMode === 'edit' && <span className="text-gray-500 text-xs ml-1">(leave blank to keep current)</span>}
                  </label>
                  <input
                    type="password"
                    name="password"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={modalMode === 'edit' ? 'Leave blank to keep current' : 'Enter password'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role<span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.role === 'admin' && 'Full system access'}
                    {formData.role === 'manager' && 'Can manage inventory and requests'}
                    {formData.role === 'staff' && 'Can view and create requests'}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button 
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : modalMode === 'add' ? 'Add Staff Member' : 'Update Staff Member'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminStaffManagement;