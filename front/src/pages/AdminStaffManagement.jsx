import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, X, Plus, Edit2, UserCheck, UserX } from 'react-feather';
import AdminSidebar from '../components/AdminSidebar';
import userService from '../services/userService';
import authService from '../services/authService';

const AdminStaffManagement = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffList, setStaffList] = useState([]);
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentStaff, setCurrentStaff] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'staff',
    fullName: '',
    phone: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const user = authService.getStoredUser();

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await userService.getAll();
      setStaffList(res.data || []);
    } catch (err) {
      console.error('Staff fetch error:', err);
      setError(err.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch = staff.username?.toLowerCase().includes(search.toLowerCase()) ||
                         staff.email?.toLowerCase().includes(search.toLowerCase()) ||
                         staff.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || staff.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenModal = (mode, staff = null) => {
    setModalMode(mode);
    setCurrentStaff(staff);
    
    if (mode === 'edit' && staff) {
      setFormData({
        username: staff.username || '',
        email: staff.email || '',
        password: '',
        role: staff.role || 'staff',
        fullName: staff.fullName || '',
        phone: staff.phone || ''
      });
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'staff',
        fullName: '',
        phone: ''
      });
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentStaff(null);
  };

  const handleSubmit = async () => {
    if (!formData.username || !formData.email || (modalMode === 'add' && !formData.password)) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'add') {
        await userService.create(formData);
        alert('Staff member added successfully!');
      } else {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await userService.update(currentStaff.id, updateData);
        alert('Staff member updated successfully!');
      }
      
      handleCloseModal();
      fetchStaff();
    } catch (err) {
      console.error('Submit error:', err);
      alert(err.message || 'Operation failed');
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
      alert(err.message || 'Failed to update status');
    }
  };

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
      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
            <p className="text-gray-600">Manage all staff members</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input 
                type="text" 
                placeholder="Search staff..." 
                className="w-full border rounded-lg px-3 py-2" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select 
                className="w-full border rounded-lg px-3 py-2" 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option>All Roles</option>
                <option>admin</option>
                <option>staff</option>
                <option>manager</option>
              </select>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-semibold">All Staff Members ({filteredStaff.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Username', 'Full Name', 'Email', 'Role', 'Phone', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStaff.length > 0 ? filteredStaff.map((staff) => (
                  <tr key={staff.id}>
                    <td className="px-6 py-4 text-sm font-medium">{staff.username}</td>
                    <td className="px-6 py-4 text-sm">{staff.fullName || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">{staff.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full capitalize">
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{staff.phone || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                        staff.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {staff.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button 
                        onClick={() => handleOpenModal('edit', staff)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleStatusToggle(staff)}
                        className={staff.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                      >
                        {staff.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCloseModal}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {modalMode === 'add' ? 'Add New Staff' : 'Edit Staff Member'}
                </h2>
                <button onClick={handleCloseModal}>
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Username*</label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    disabled={modalMode === 'edit'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Email*</label>
                  <input
                    type="email"
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password{modalMode === 'add' ? '*' : ' (leave blank to keep current)'}
                  </label>
                  <input
                    type="password"
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder={modalMode === 'edit' ? 'Leave blank to keep current' : ''}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Role*</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                  {submitting ? 'Saving...' : modalMode === 'add' ? 'Add Staff' : 'Update Staff'}
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