'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, LogOut, User, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navClasses = isHomePage
    ? `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-wine-900 shadow-xl border-b border-wine-800' : 'bg-transparent border-transparent'}`
    : 'sticky top-0 z-50 bg-wine-900 border-b border-wine-800 shadow-xl';

  return (
    <nav className={`${navClasses} font-bold`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-6 py-2">
        <div className="flex justify-between items-center h-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
             <div className="w-8 h-8 bg-white text-wine-900 rounded-full flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">W</div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-wine-100 transition-colors">
             Wara Ebook Shop
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {(!user || user.role !== 'admin') && (
              <Link href="/cart" className="relative group text-wine-100 hover:text-white transition-colors">
                <div className="p-2 rounded-full group-hover:bg-wine-800 transition-colors">
                  <ShoppingCart className="w-6 h-6" />
                  {cart.length > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-wine-900 transform translate-x-1/4 -translate-y-1/4 bg-white rounded-full border-2 border-wine-900">
                      {cart.length}
                    </span>
                  )}
                </div>
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-6">

                {user.role === 'admin' && (
                  <Link 
                    href="/admin" 
                    className="text-sm font-medium text-wine-100 hover:text-white transition-colors px-3 py-1 rounded-full hover:bg-wine-800"
                  >
                    Admin Dashboard
                  </Link>
                )}
                
                {user.role !== 'admin' && (
                  <Link 
                    href="/orders" 
                    className="text-sm font-medium text-wine-100 hover:text-white transition-colors px-3 py-1 rounded-full hover:bg-wine-800"
                  >
                    My Orders
                  </Link>
                )}

                <div className="flex items-center gap-3 pl-6 border-l border-wine-700">
                  <div className="flex items-center gap-2 text-wine-100">
                    <User className="w-5 h-5 text-white" />
                    <span className="text-sm font-medium hidden lg:block">{user.email}</span>
                  </div>
                  
                  <button 
                    onClick={logout} 
                    className="p-2 text-white hover:text-red-300 hover:bg-wine-800 rounded-full transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center px-5 py-2 border border-transparent rounded-full shadow-lg text-sm font-bold text-wine-900 bg-white hover:bg-wine-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-wine-900 focus:ring-white transition-all transform hover:-translate-y-0.5"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-wine-100 hover:text-white hover:bg-wine-800 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-wine-950 border-t border-wine-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 text-white">
             {(!user || user.role !== 'admin') && (
              <Link 
                href="/cart" 
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-wine-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart className="w-5 h-5 mr-3 text-gray-400" />
                Cart
                {cart.length > 0 && (
                  <span className="ml-auto bg-white text-wine-900 py-0.5 px-2.5 rounded-full text-xs font-bold">
                    {cart.length}
                  </span>
                )}
              </Link>
            )}
            
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link 
                    href="/admin"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-wine-800"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                 {user.role !== 'admin' && (
                  <Link 
                    href="/orders" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-wine-800"
                     onClick={() => setIsMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                )}
                <div className="px-3 py-2 text-sm text-wine-300">
                   Logged in as: {user.email}
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-400 hover:text-red-300 hover:bg-wine-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className="block w-full text-center px-4 py-3 mt-4 rounded-md shadow text-base font-medium text-wine-900 bg-white hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
