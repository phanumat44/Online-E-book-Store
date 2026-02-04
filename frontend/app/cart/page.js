'use client';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Trash2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import api from '@/utils/api';
import PriceDisplay from '@/components/PriceDisplay';

// Separate Checkout Form Component (reused logic basically)
function CartCheckoutForm({ clientSecret, userEmail }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { clearCart } = useCart();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
        payment_method_data: {
            billing_details: {
                email: userEmail
            }
        }
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message);
      } else {
        setMessage("An unexpected error occurred.");
      }
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '20px', padding: '20px', border: '1px solid #e6e6e6', borderRadius: '4px' }}>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', fontSize: '0.93rem', fontWeight: '500', marginBottom: '4px', color: '#30313d' }}>Email</label>
        <input 
            type="email" 
            value={userEmail || ''} 
            disabled 
            style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '5px', 
                border: '1px solid #e6e6e6', 
                backgroundColor: '#f6f9fc',
                color: '#8898aa',
                cursor: 'not-allowed'
            }} 
        />
      </div>
      <PaymentElement options={{ layout: 'tabs', fields: { billingDetails: { email: 'never' } } }} />
      <button 
        disabled={isLoading || !stripe || !elements} 
        className="w-full mt-6 bg-wine-900 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-wine-800 transition-transform transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Processing..." : "Pay Now"}
      </button>
      {message && <div style={{ color: 'red', marginTop: '10px' }}>{message}</div>}
    </form>
  );
}

export default function CartPage() {
  const { cart, removeFromCart, cartTotal } = useCart();
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState('');
  const [stripePromise, setStripePromise] = useState(null);
  const [isCheckout, setIsCheckout] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load Stripe Key
    api.get('/config')
        .then(({ data }) => setStripePromise(loadStripe(data.publishableKey)));
  }, []);

  const handleCheckout = async () => {
      if (!user) {
          router.push('/login');
          return;
      }
      if (user.role === 'admin') {
          Swal.fire({
            icon: 'error',
            title: 'Action blocked',
            text: 'Admins cannot make purchases.'
          });
          return;
      }

      // 1. Create Payment Intent with cart items
       // Update: Send full item details so we can maybe use them or just IDs?
       // The backend expects `items` array. server.js logic: `for (const item of items) { select * from products where id = item.id ... }`
       // So the backend re-fetches price/details from DB.
       // However, the backend writes `JSON.stringify(items)` to the order.
       // If we send `{id:1, title: '...'}`, the backend loop uses `item.id`, but writes the whole object to DB?
       // Let's check server.js logic again.
       // `const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [item.id]);`
       // It doesn't modify `items` array before inserting `items` via `JSON.stringify(items)`.
       // So if we send `{id:1, title: 'Book'}`, that is what gets stored!
       // Perfect. Let's send more data from frontend.
       
       const itemsPayload = cart.map(item => ({ 
           id: item.id, 
           title: item.title, 
           price: item.price,
           image_url: item.image_url
       })); 
       
       try {
        const { data } = await api.post("/create-payment-intent", { items: itemsPayload });
        
        if (data.clientSecret) {
            setClientSecret(data.clientSecret);
            setIsCheckout(true);
        } else {
             Swal.fire({
                icon: 'error',
                title: 'Payment Initialization Failed',
                text: "Error creating payment: " + data.error
            });
        }
       } catch (err) {
         Swal.fire({
                icon: 'error',
                title: 'Payment Initialization Failed',
                text: "Error creating payment: " + (err.response?.data?.error || err.message)
            });
       }
  };

  if (cart.length === 0) {
      return (
        <div className="container px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-24 h-24 bg-wine-50 rounded-full flex items-center justify-center mb-6 animate-fade-in-up">
                <ShoppingBag size={48} className="text-wine-900" />
            </div>
            <h1 className="text-3xl font-bold text-wine-900 mb-4">Your Cart is Empty</h1>
            <p className="text-gray-500 text-lg mb-8 text-center max-w-md">
                Looks like you haven't added any books to your collection yet.
                Explore our library to find your next great read.
            </p>
            <Link href="/" className="bg-wine-900 text-white px-8 py-3 rounded-full font-bold hover:bg-wine-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Start Shopping
            </Link>
        </div>
      );
  }

  const options = {
    clientSecret,
    appearance: { theme: 'stripe' },
    defaultValues: {
      billingDetails: {
        email: user?.email,
      },
    },
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h1>{isCheckout ? <span style={{ fontSize: '32px' }}>Checkout</span> : <span style={{ fontSize: '32px'}}>Shopping Cart</span> }</h1>
      
      {!isCheckout ? (
        <>
            <div className="card mt-3">
                {cart.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors rounded-lg px-2">
                        {/* Image */}
                        <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-md overflow-hidden relative">
                           {item.image_url ? (
                                <img 
                                    src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${item.image_url}`} 
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center text-gray-400">
                                   No Image
                               </div>
                           )}
                        </div>

                        {/* Title & Price */}
                        <div className="flex-grow min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">{item.title}</h3>
                            <PriceDisplay 
                                price={item.price} 
                                discountPercent={item.discount_percent} 
                                isDiscountActive={item.is_discount_active} 
                            />
                        </div>

                        {/* Delete Action */}
                        <button 
                            onClick={() => removeFromCart(index)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all group flex-shrink-0"
                            title="Remove item"
                        >
                            <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                ))}
                <div className="mt-8 flex justify-end items-center border-t border-gray-200 pt-6">
                    <span className="text-gray-600 mr-4 text-lg">Total:</span>
                    <span className="text-3xl font-bold text-gray-900">฿{cartTotal}</span>
                </div>
            </div>
            
            <div className="mt-8 flex justify-end">
                <button 
                    onClick={handleCheckout} 
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-wine-900 hover:bg-wine-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine-500 transition-all transform hover:-translate-y-0.5"
                >
                    Proceed to Checkout
                </button>
            </div>
        </>
      ) : (
          <div>
              {clientSecret && stripePromise && (
                <Elements options={options} stripe={stripePromise}>
                  <CartCheckoutForm clientSecret={clientSecret} userEmail={user?.email} />
                </Elements>
              )}
          </div>
      )}
    </div>
  );
}
