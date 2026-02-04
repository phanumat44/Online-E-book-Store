'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import PriceDisplay from '@/components/PriceDisplay';
import { ShoppingCart } from 'lucide-react';

export default function ProductDetail({ params }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();

  const [isOwned, setIsOwned] = useState(false);

  useEffect(() => {
    api.get(`/products/${params.id}`)
      .then(({ data }) => {
           if (data.status === 'inactive') {
             throw new Error('Product not found');
          }
          setProduct(data);
          setLoading(false);
      })
      .catch(err => {
          console.error(err);
          setLoading(false);
      });
  }, [params.id]);

  useEffect(() => {
      if (user && user.role !== 'admin') {
          api.get('/orders')
          .then(({ data: orders }) => {
              // Check if params.id exists in any order items
              if (Array.isArray(orders)) {
                for (const order of orders) {
                    let items = [];
                    try {
                        items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                    } catch (e) {}
                    
                    if (items.some(item => String(item.id) === String(params.id))) {
                        setIsOwned(true);
                        break;
                    }
                }
              }
          })
          .catch(err => console.error("Error fetching orders:", err));
      }
  }, [user, params.id]);

  if (loading) return <div>Loading...</div>;
  if (!product) return <div className="container"><h1>Product not found</h1><Link href="/">Back to Home</Link></div>;

  return (
    <div>
      {/* <Navbar /> */}
      <div className="container" style={{ marginTop: '20px' }}>
        <Link href="/" className="text-gray-500 hover:text-gray-700 mb-4 inline-block no-underline">
           &larr; Back to results
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Image (3 cols) */}
            <div className="lg:col-span-3">
                 <div className="bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center p-4 border border-gray-200">
                     {product.image_url ? (
                         <img src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${product.image_url}`} alt={product.title}  className="max-w-full max-h-[400px] object-contain" />
                     ) : (
                         <span className="text-6xl text-gray-300">PDF</span>
                     )}
                </div>
            </div>

            {/* Middle Column: Details (6 cols) */}
            <div className="lg:col-span-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{product.title}</h1>
                <p className="text-sm text-gray-500 mb-4">6th Edition</p> {/* Placeholder for edition/author if exists */}
                
                <hr className="my-4 border-gray-200" />
                
                <div className="mb-4">
                     <span className="font-bold text-gray-700">Description</span>
                     <div 
                        className="mt-2 text-gray-800 leading-relaxed product-description"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                </div>
            </div>

            {/* Right Column: Buy Box (3 cols) */}
            <div className="lg:col-span-3">
                <div className="p-5">
                    <div className="mb-2">
                        <PriceDisplay 
                            price={product.price} 
                            discountPercent={product.discount_percent} 
                            isDiscountActive={product.is_discount_active}
                            size="large"
                        />
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                        <span className="text-green-600 font-bold">In Stock.</span>
                    </div>

                     {(!user || user.role !== 'admin') ? (
                        <div className="flex flex-col gap-3">
                             {isOwned ? (
                                 <button 
                                    className="w-full bg-green-600 text-white font-medium py-2 px-4 rounded-md shadow-sm cursor-default text-sm"
                                    disabled
                                  >
                                    Owned (Already Purchased)
                                  </button>
                             ) : (
                                <button 
                                    onClick={() => addToCart(product)} 
                                    className="w-full bg-wine-900 hover:bg-wine-800 text-white font-medium py-3 px-6 rounded-full shadow-lg transition-all transform hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart size={18} />
                                    Add to Cart
                                </button>
                             )}
                        </div>
                    ) : (
                        <div className="p-3 bg-gray-100 border border-dashed border-gray-300 text-center text-gray-500 text-sm">
                            Admin View Only
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
