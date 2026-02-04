'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import api from '@/utils/api';
import { Eye, EyeOff, Edit, Trash2, Download, LayoutDashboard, Package, Users, Settings, TrendingUp, DollarSign, ShoppingBag, UserPlus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area } from 'recharts';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [products, setProducts] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [stats, setStats] = useState({
      counts: { users: 0, products: 0, orders: 0 },
      revenueChart: [],
      topSellers: [],
      recentTransactions: [],
      userTrend: []
  });

  // User Search State
  const [userSearch, setUserSearch] = useState('');

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    // Load saved tab from localStorage on mount
    const savedTab = localStorage.getItem('adminActiveTab');
    if (savedTab) {
        setActiveTab(savedTab);
    }

    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
      } else {
        // Initial Fetch
        fetchStats();
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
      // Save active tab to localStorage whenever it changes
      localStorage.setItem('adminActiveTab', activeTab);
      
      if (activeTab === 'dashboard') fetchStats();
      if (activeTab === 'products') fetchProducts();
      if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const fetchStats = async () => {
      try {
          const { data } = await api.get('/admin/dashboard-stats');
          setStats(data);
      } catch (err) { console.error(err); }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/admin/products');
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
      try {
          const { data } = await api.get('/admin/users');
          setUsersList(data);
      } catch (err) { console.error(err); }
  };

  // --- Product Actions ---
  const handleDelete = async (id) => {
      if(!confirm("Are you sure you want to delete this product?")) return;
      try {
          const res = await api.delete(`/products/${id}`);
          if(res.status === 200) fetchProducts();
      } catch(e) { console.error(e); }
  };

  const toggleStatus = async (id, currentStatus) => {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      try {
          const res = await api.patch(`/products/${id}/status`, { status: newStatus });
          if (res.status === 200) {
              fetchProducts();
          } else {
              alert("Failed to update status");
          }
      } catch(e) { console.error(e); }
  };

  const handleDownload = async (id, title) => {
    try {
        const response = await api.get(`/admin/products/${id}/download`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
         const contentDisposition = response.headers['content-disposition'];
         let fileName = `${title}.pdf`;
         if (contentDisposition) {
             const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
             if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
         }
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Download error:", err);
        alert("Failed to download file.");
    }
  };

  // --- Password Action ---
  const handlePasswordChange = async (e) => {
      e.preventDefault();
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          setPasswordMsg({ type: 'error', text: 'Passwords do not match' });
          return;
      }
      try {
          await api.post('/change-password', { 
              currentPassword: passwordForm.currentPassword,
              newPassword: passwordForm.newPassword 
          });
          setPasswordMsg({ type: 'success', text: 'Password updated successfully' });
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } catch (err) {
          setPasswordMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update password' });
      }
  };

  if (loading || !user || user.role !== 'admin') return <p>Loading...</p>;

  // --- Render Tabs ---
  const renderDashboard = () => (
      <div className="space-y-6 animate-in fade-in duration-500">
          {/* Stats Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                      <p className="text-gray-500 text-sm font-medium">Total Users</p>
                      <h3 className="text-3xl font-bold text-wine-900 mt-1">{stats.counts.users}</h3>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-full text-blue-600"><Users size={24} /></div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                      <p className="text-gray-500 text-sm font-medium">Total Products</p>
                      <h3 className="text-3xl font-bold text-wine-900 mt-1">{stats.counts.products}</h3>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-full text-purple-600"><Package size={24} /></div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                      <p className="text-gray-500 text-sm font-medium">Total Orders</p>
                      <h3 className="text-3xl font-bold text-wine-900 mt-1">{stats.counts.orders}</h3>
                  </div>
                  <div className="bg-green-50 p-3 rounded-full text-green-600"><ShoppingBag size={24} /></div>
              </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <DollarSign size={20} className="text-green-600" /> Revenue & Sales
                  </h3>
                  <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stats.revenueChart}>
                              <defs>
                                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#97050E" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="#97050E" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="date" hide />
                              <YAxis />
                              <Tooltip />
                              <Area type="monotone" dataKey="revenue" stroke="#97050E" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (THB)" />
                              <Line type="monotone" dataKey="sales" stroke="#2563eb" name="Sales Count" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                       <TrendingUp size={20} className="text-orange-600" /> Best Sellers
                  </h3>
                  <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.topSellers} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                              <XAxis type="number" />
                              <YAxis dataKey="name" type="category" width={100} style={{fontSize: '12px'}} />
                              <Tooltip cursor={{fill: 'transparent'}} />
                              <Bar dataKey="count" fill="#4ade80" radius={[0, 4, 4, 0]} name="Units Sold" barSize={20} />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>

          {/* Charts Row 2 & Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <UserPlus size={20} className="text-blue-600" /> New Registrations Trend
                  </h3>
                  <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={stats.userTrend}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="count" stroke="#8884d8" name="New Users" strokeWidth={2} />
                          </LineChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Transactions</h3>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-500">
                          <thead className="bg-gray-50 text-gray-700">
                              <tr>
                                  <th className="px-4 py-3">Order ID</th>
                                  <th className="px-4 py-3">User</th>
                                  <th className="px-4 py-3">Amount</th>
                                  <th className="px-4 py-3">Date</th>
                              </tr>
                          </thead>
                          <tbody>
                              {stats.recentTransactions.map(tx => (
                                  <tr key={tx.id} className="border-b hover:bg-gray-50">
                                      <td className="px-4 py-3 font-medium">#{tx.id}</td>
                                      <td className="px-4 py-3">{tx.email || 'Guest'}</td>
                                      <td className="px-4 py-3 font-semibold text-wine-700">฿{tx.total_amount}</td>
                                      <td className="px-4 py-3">{new Date(tx.created_at).toLocaleDateString()}</td>
                                  </tr>
                              ))}
                              {stats.recentTransactions.length === 0 && (
                                  <tr><td colSpan="4" className="text-center py-4">No recent transactions</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderProducts = () => (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
               <h2 className="text-xl font-bold text-wine-900">Product Management</h2>
               <div className="text-sm text-gray-500">Same as before</div>
          </div>
          <table className="w-full border-collapse">
                <thead>
                    <tr className="text-left bg-gray-50 border-b border-gray-100">
                        <th className="p-4 text-wine-900 font-semibold">ID</th>
                        <th className="p-4 text-wine-900 font-semibold">Product</th>
                        <th className="p-4 text-wine-900 font-semibold">Price</th>
                        <th className="p-4 text-wine-900 font-semibold">Status</th>
                        <th className="p-4 text-wine-900 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 text-gray-500">#{product.id}</td>
                            <td className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                        {product.image_url ? (
                                            <img src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${product.image_url}`} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold">PDF</div>
                                        )}
                                    </div>
                                    <span className="font-medium text-gray-900 line-clamp-1 max-w-xs">{product.title}</span>
                                </div>
                            </td>
                            <td className="p-4 text-gray-600">
                                <div className="flex flex-col">
                                    {product.is_discount_active ? (
                                        <>
                                            <span className="font-bold text-wine-700">฿{(product.price * (1 - product.discount_percent/100)).toFixed(2)}</span>
                                            <span className="text-xs text-gray-400 line-through">฿{product.price}</span>
                                        </>
                                    ) : (
                                        <span className="font-bold">฿{product.price}</span>
                                    )}
                                </div>
                            </td>
                            <td className="p-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {product.status || 'active'}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => toggleStatus(product.id, product.status)} title={product.status === 'active' ? 'Deactivate' : 'Activate'} className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                                        {product.status === 'active' ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    <Link href={`/admin/edit-product/${product.id}`} title="Edit" className="p-2 rounded-full text-white bg-wine-900 hover:bg-wine-800 transition-colors shadow-sm">
                                        <Edit size={18} />
                                    </Link>
                                    <button onClick={() => handleDelete(product.id)} title="Delete" className="p-2 rounded-full text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                    <button onClick={() => handleDownload(product.id, product.title)} title="Download PDF" className="p-2 rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors">
                                        <Download size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
          </table>
          {products.length === 0 && <div className="text-center py-12 text-gray-500">No products found.</div>}
      </div>
  );



  const renderUsers = () => {
    const filteredUsers = usersList.filter(u => 
        u.email.toLowerCase().includes(userSearch.toLowerCase()) || 
        String(u.id).includes(userSearch)
    );

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
           <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
               <h2 className="text-xl font-bold text-wine-900">User Management</h2>
               <div className="relative">
                   <input 
                       type="text" 
                       placeholder="Search users..." 
                       className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-wine-500 outline-none text-sm w-64"
                       value={userSearch}
                       onChange={(e) => setUserSearch(e.target.value)}
                   />
                   <div className="absolute left-3 top-2.5 text-gray-400">
                       <Users size={16} />
                   </div>
               </div>
           </div>
           <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                   <tr>
                       <th className="p-4">ID</th>
                       <th className="p-4">Email</th>
                       <th className="p-4">Role</th>
                       <th className="p-4">Joined At</th>
                   </tr>
               </thead>
               <tbody>
                   {filteredUsers.map(u => (
                       <tr key={u.id} className="border-b hover:bg-gray-50">
                           <td className="p-4 text-gray-500">#{u.id}</td>
                           <td className="p-4 font-medium text-gray-900">{u.email}</td>
                           <td className="p-4">
                               <span className={`px-2 py-1 rounded-md text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                   {u.role}
                               </span>
                           </td>
                           <td className="p-4 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                       </tr>
                   ))}
                   {filteredUsers.length === 0 && (
                       <tr><td colSpan="4" className="text-center py-8 text-gray-500">No users found matching "{userSearch}"</td></tr>
                   )}
               </tbody>
           </table>
      </div>
    );
  };

  const renderSettings = () => (
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8 animate-in fade-in duration-500">
          <h2 className="text-2xl font-bold text-wine-900 mb-6 flex items-center gap-2">
              <Settings size={24} /> Change Password
          </h2>
          {passwordMsg.text && (
              <div className={`p-4 mb-6 rounded-lg ${passwordMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  {passwordMsg.text}
              </div>
          )}
          <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input type="password" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-wine-500 outline-none" 
                      value={passwordForm.currentPassword} onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input type="password" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-wine-500 outline-none" 
                      value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input type="password" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-wine-500 outline-none" 
                      value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-wine-900 text-white font-bold py-2 rounded-lg hover:bg-wine-800 transition-colors">
                  Update Password
              </button>
          </form>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container px-4 py-8">
        
        {/* Header & Add Button */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-wine-900">Admin Dashboard</h1>
            {activeTab === 'products' && (
                <Link href="/admin/add-product" className="bg-wine-900 hover:bg-wine-800 text-white px-6 py-2 rounded-full shadow-lg transition-transform transform hover:-translate-y-0.5 font-medium flex items-center gap-2">
                    <Package size={18} /> Add New Product
                </Link>
            )}
        </div>

        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto gap-2 mb-8 bg-white p-1 rounded-xl shadow-sm border border-gray-100 max-w-fit">
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'dashboard' ? 'bg-wine-50 text-wine-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                <LayoutDashboard size={18} /> Dashboard
            </button>
            <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'products' ? 'bg-wine-50 text-wine-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                <Package size={18} /> Products
            </button>
            <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'users' ? 'bg-wine-50 text-wine-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                <Users size={18} /> Users
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'settings' ? 'bg-wine-50 text-wine-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                <Settings size={18} /> Settings
            </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'products' && renderProducts()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
}
