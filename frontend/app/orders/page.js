'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Swal from 'sweetalert2';
import api from '@/utils/api';
import { Package, ShoppingBag, Download, Clock, FileText } from 'lucide-react';

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin') {
        // Admins don't have personal orders
        return;
    }
    
    api.get('/orders')
      .then(({ data }) => setOrders(data))
      .catch(err => setError(err.message));
  }, [user]);

  const handleDownload = async (orderId, productName) => {
    try {
        const response = await api.get(`/download/${orderId}`, {
            responseType: 'blob'
        });

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${productName || 'download'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (e) {
         let errMsg = e.message;
         if (e.response && e.response.data instanceof Blob) {
             // Try to read error blob
             try {
                errMsg = await new Response(e.response.data).text();
             } catch(err) {} 
         }
         
        Swal.fire({
            icon: 'error',
            title: 'Download Failed',
            text: errMsg || 'Could not download the file.'
        });
    }

  };

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (!user) return <div className="container"><p>Please <Link href="/login">login</Link> to view your orders.</p></div>;
  if (user.role === 'admin') return <div className="container"><p>Admins do not have personal orders.</p></div>;

  return (
    <div className="container px-4 py-8 min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-8 text-wine-900 border-b pb-4 border-gray-200">My Orders</h1>
      {error && <p className="text-red-500 bg-red-50 p-4 rounded-xl mb-6 border border-red-100 flex items-center gap-2">
          <span className="font-bold">Error:</span> {error}
      </p>}
      
      {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
             <div className="w-20 h-20 bg-wine-50 rounded-full flex items-center justify-center mb-6 text-wine-900">
                <Package size={40} />
             </div>
             <h2 className="text-2xl font-bold text-wine-900 mb-2">No orders yet</h2>
             <p className="text-gray-500 text-lg mb-8 max-w-sm text-center">
                 You haven't purchased any books yet. Start building your digital library today!
             </p>
             <Link href="/" className="bg-wine-900 text-white px-8 py-3 rounded-full font-bold hover:bg-wine-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2">
                 <ShoppingBag size={20} />
                 Start Shopping
             </Link>
          </div>
      ) : (
          <div className="grid gap-6">
              {orders.map(order => {
                  let items = [];
                  try {
                       items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                  } catch (e) {}
                  
                  return (
                    <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 border-b border-gray-100 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <Clock size={20} className="text-wine-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Order Placed</p>
                                    <p className="font-medium text-gray-900">{new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-wine-900 bg-wine-50 px-3 py-1 rounded-full">
                                <span className="text-sm font-bold">#{order.id}</span>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <div className="space-y-4 mb-6">
                                {items && items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 group">
                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
                                            {item.image_url ? (
                                                    <img src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${item.image_url}`} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <FileText size={24} />
                                                    </div>
                                            )}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate group-hover:text-wine-700 transition-colors">{item.title || `Product (ID: ${item.id})`}</h3>
                                            <p className="text-sm text-gray-500">Digital PDF Download</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">฿{Number(item.price).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-100 gap-4">
                                <div className="flex items-center gap-2">
                                     <span className="text-gray-500 text-sm">Total Amount:</span>
                                     <span className="text-2xl font-bold text-wine-900">฿{Number(order.total_amount).toLocaleString()}</span>
                                </div>
                                <button 
                                    onClick={() => handleDownload(order.id, `Order-${order.id}`)} 
                                    className="w-full sm:w-auto bg-wine-900 hover:bg-wine-800 text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    <Download size={18} />
                                    Download 
                                </button>
                            </div>
                        </div>
                    </div>
                  );
              })}
          </div>
      )}
    </div>
  );
}
