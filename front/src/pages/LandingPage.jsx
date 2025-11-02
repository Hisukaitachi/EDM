import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, CheckCircle } from 'react-feather';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-gray-100 font-inter">
      {/* Sidebar */}
      <div className="sidebar w-64 bg-white shadow-lg h-screen flex-shrink-0">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold text-blue-600">StockPro</h1>
          <p className="text-gray-500 text-sm">Inventory Management System</p>
        </div>
        <div className="p-4">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full mx-auto mb-2 border-4 border-blue-100 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">SP</span>
            </div>
            <h3 className="font-semibold">Welcome!</h3>
            <p className="text-gray-500 text-sm">Please select your role</p>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/login?role=admin')}
              className="w-full flex items-center p-3 rounded-lg hover:bg-indigo-100 text-gray-700 hover:text-indigo-600 transition"
            >
              <Shield className="mr-3" size={20} />
              <span>Admin Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/login?role=staff')}
              className="w-full flex items-center p-3 rounded-lg hover:bg-indigo-100 text-gray-700 hover:text-indigo-600 transition"
            >
              <Users className="mr-3" size={20} />
              <span>Staff Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-600 mb-2">Stock Inventory Management</h1>
            <p className="text-xl text-gray-600">
              Efficiently manage your inventory with our comprehensive solution
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Admin Portal Card */}
            <div className="card-hover bg-white rounded-xl shadow-md overflow-hidden transition">
              <div className="gradient-bg p-6">
                <div className="flex items-center">
                  <Shield size={48} className="mr-4" />
                  <div>
                    <h2 className="text-2xl font-bold">Admin Portal</h2>
                    <p>Full system control</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <span>Manage all inventory</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <span>View stock requests</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <span>Staff management</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <span>Analytics dashboard</span>
                  </li>
                </ul>
                <button
                  onClick={() => navigate('/login?role=admin')}
                  className="btn-primary mt-6 px-6 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Access Admin Portal
                </button>
              </div>
            </div>

            {/* Staff Portal Card */}
            <div className="card-hover bg-white rounded-xl shadow-md overflow-hidden transition">
              <div className="gradient-bg p-6">
                <div className="flex items-center">
                  <Users size={48} className="mr-4" />
                  <div>
                    <h2 className="text-2xl font-bold">Staff Portal</h2>
                    <p>Store operations</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <span>View current stock</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <span>Request new stock</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <span>Report issues</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <span>Track requests</span>
                  </li>
                </ul>
                <button
                  onClick={() => navigate('/login?role=staff')}
                  className="btn-primary mt-6 px-6 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Access Staff Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;