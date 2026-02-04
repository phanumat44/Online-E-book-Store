'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import Swal from 'sweetalert2';
import api from '@/utils/api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [ownedItems, setOwnedItems] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
    
    // Check if admin and clear cart/restrict if needed
    if (user) {
        if (user.role === 'admin') {
            setCart([]); // Ensure admin cart is empty
            localStorage.removeItem('cart');
        }
    }
  }, [user]);

  // Sync owned items
  useEffect(() => {
      if (user && user.role !== 'admin') {
          // Use api instance which handles token automatically
           api.get('/orders')
             .then(({ data: orders }) => {
                 const ownedIds = new Set();
                 if (Array.isArray(orders)) {
                    for (const order of orders) {
                        let items = [];
                        try {
                            items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                        } catch (e) {}
                        items.forEach(i => ownedIds.add(String(i.id)));
                    }
                 }
                 setOwnedItems(Array.from(ownedIds));
             })
             .catch(console.error);
      } else {
          setOwnedItems([]);
      }
  }, [user]);


  const addToCart = (product) => {
    // Check if owned
    if (ownedItems.includes(String(product.id))) {
        Swal.fire({
            icon: 'info',
            title: 'Already Owned',
            text: 'You already own this book!',
            confirmButtonColor: '#3085d6',
        });
        return;
    }

    setCart((prev) => {
      // Check if item exists
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
          Swal.fire({
            icon: 'warning',
            title: 'Already in Cart',
            text: 'This item is already in your cart.',
            confirmButtonColor: '#f39c12',
          });
          return prev;
      }
      const newCart = [...prev, product];
      localStorage.setItem('cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const removeFromCart = (index) => {
     setCart((prev) => {
       const newCart = [...prev];
       newCart.splice(index, 1);
       localStorage.setItem('cart', JSON.stringify(newCart));
       return newCart;
     });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const cartTotal = cart.reduce((sum, item) => {
      let price = Number(item.price);
      if (item.is_discount_active && item.discount_percent > 0) {
          price = price * (100 - item.discount_percent) / 100;
      }
      return sum + price;
  }, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
