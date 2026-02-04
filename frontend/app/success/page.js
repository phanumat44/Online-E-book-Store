'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import api from '@/utils/api';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get('payment_intent');
  const [status, setStatus] = useState('verifying');
  const [orderData, setOrderData] = useState(null);
  const { clearCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (!paymentIntentId) return;

    let timeoutId;

    const checkStatus = () => {
        api.post('/verify-payment', { paymentIntentId })
        .then(({ data }) => {
            if (data.success) {
                setStatus('success');
                setOrderData(data);
                clearCart();
                
                // If opened as a popup/new tab (common with some payment flows), try to close after delay
                if (window.opener) {
                    setTimeout(() => {
                        window.close();
                    }, 5000); // 5 seconds to let them see the success message
                }
            } else if (data.status === 'processing') {
                // Keep waiting - poll again in 3s
                setStatus('processing');
                timeoutId = setTimeout(checkStatus, 3000);
            } else {
                setStatus('failed');
            }
        })
        .catch(() => setStatus('error'));
    };

    checkStatus();

    return () => clearTimeout(timeoutId);
  }, [paymentIntentId, clearCart]);

  const handleDownload = async () => {
      try {
          const res = await api.get(`/download/${orderData?.orderId}`, {
              responseType: 'blob'
          });

          const blob = new Blob([res.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${orderData?.productName || 'download'}.pdf`; 
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
      } catch (e) {
         let errMsg = e.message;
         if (e.response && e.response.data instanceof Blob) {
             try { errMsg = await new Response(e.response.data).text(); } catch(err) {}
         }
          alert("Download failed: " + errMsg);
      }
  };

  return (
    <div className="container flex items-center justify-center min-h-[60vh]">
      {(status === 'verifying' || status === 'processing') && (
        <div className="text-center p-12 bg-white rounded-2xl shadow-lg border border-gray-100 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Transaction...</h2>
            <p className="text-gray-500 mb-6">Please wait while we confirm your payment.</p>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wine-900 mx-auto"></div>
        </div>
      )}
      
      {status === 'success' && (
        <div className="card max-w-lg w-full text-center p-10">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-green-600 text-4xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-wine-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-8">Thank you for your purchase.</p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left">
                <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-2">Order Details</p>
                <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{orderData?.productName || "Your Order"}</span>
                </div>
            </div>
            
            <div className="space-y-4">
                <button 
                    onClick={handleDownload} 
                    className="w-full bg-wine-900 hover:bg-wine-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:-translate-y-1 block"
                >
                    Download PDF
                </button>
                
                <Link href="/" className="block text-wine-600 font-medium hover:text-wine-800 transition-colors">
                    Back to Shop
                </Link>
                
                {typeof window !== 'undefined' && window.opener && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                        <button 
                            onClick={() => window.close()} 
                            className="text-gray-400 hover:text-gray-600 text-sm"
                        >
                            Close Window
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}

      {(status === 'failed' || status === 'error') && (
        <div className="card max-w-lg w-full text-center p-10 border-red-100">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-red-500 text-4xl">✕</span>
            </div>
            <h1 className="text-2xl font-bold text-red-700 mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-8">We could not verify your payment or it was declined.</p>
            
            <Link href="/cart" className="inline-block bg-gray-900 text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors shadow-md">
                Return to Checkout
            </Link>
        </div>
      )}
    </div>
  );
}
