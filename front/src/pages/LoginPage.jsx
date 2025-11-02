import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield, Users, Box } from 'react-feather';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Get role from query string
  const queryParams = new URLSearchParams(location.search);
  const initialRole = queryParams.get('role') || 'admin';

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: initialRole,
    rememberMe: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRoleSelect = (role) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData.username, formData.password);
      const user = response.user || JSON.parse(localStorage.getItem('user'));
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/staff/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-inter">
      <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-lg transform transition-all">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <Box className="text-indigo-600" size={32} />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">StockPro</h2>
          <p className="text-sm text-gray-600">Inventory Management System</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-gray-400" size={20} />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="input-field block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={20} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                />
                <div
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="text-gray-400 hover:text-gray-500" size={20} />
                  ) : (
                    <Eye className="text-gray-400 hover:text-gray-500" size={20} />
                  )}
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Login as</label>
              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => handleRoleSelect('admin')}
                  className={`role-selector rounded-md p-3 text-center cursor-pointer border transition-all ${
                    formData.role === 'admin'
                      ? 'active border-indigo-600'
                      : 'border-gray-300 text-gray-700 hover:border-indigo-300'
                  }`}
                >
                  <Shield size={20} className="mx-auto mb-1" />
                  <span className="text-sm font-medium">Admin</span>
                </div>
                <div
                  onClick={() => handleRoleSelect('staff')}
                  className={`role-selector rounded-md p-3 text-center cursor-pointer border transition-all ${
                    formData.role === 'staff'
                      ? 'active border-indigo-600'
                      : 'border-gray-300 text-gray-700 hover:border-indigo-300'
                  }`}
                >
                  <Users size={20} className="mx-auto mb-1" />
                  <span className="text-sm font-medium">Staff</span>
                </div>
              </div>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 px-4 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;