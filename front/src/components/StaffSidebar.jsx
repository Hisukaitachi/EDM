import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, ShoppingCart, FileText, LogOut } from 'react-feather';
import authService from '../services/authService';

const StaffSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getStoredUser();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/staff/dashboard' },
    { id: 'inventory', label: 'View Inventory', icon: Package, path: '/staff/inventory' },
    { id: 'request', label: 'Request Stock', icon: ShoppingCart, path: '/staff/request-stock' },
    { id: 'my-requests', label: 'My Requests', icon: FileText, path: '/staff/my-requests' }
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      authService.logout();
      navigate('/login');
    }
  };

  return (
    <aside className="w-64 bg-white shadow-lg fixed h-full flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-blue-600">StockPro</h1>
        <p className="text-gray-500 text-sm mt-1">Staff Panel</p>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b">
        <div className="flex items-center p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg mr-3 shadow">
            {user?.username?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 truncate">{user?.fullName || user?.username || 'Staff'}</h3>
            <p className="text-gray-500 text-xs">Staff Member</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <Icon size={20} className="mr-3 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut size={20} className="mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default StaffSidebar;