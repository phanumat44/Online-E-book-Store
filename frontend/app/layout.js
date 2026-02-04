import './globals.css'
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';

import Footer from '@/components/Footer';

export const metadata = {
  title: 'Wara Ebook Shop',
  description: 'Buy high quality PDFs',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-wine-black min-h-screen flex flex-col">
        <AuthProvider>
            <CartProvider>
                <Navbar />
                <div className="flex-grow">
                  {children}
                </div>
                <Footer />
            </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
