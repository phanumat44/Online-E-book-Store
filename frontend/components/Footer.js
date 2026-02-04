'use client';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-wine-900 text-white mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl text-wine-100 font-bold tracking-wider">Wara Ebook</h3>
            <p className="text-wine-100 text-sm leading-relaxed">
              Your premium destination for high-quality digital reading materials. 
              Elevate your mind with our curated collection.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-wine-50">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-wine-200 hover:text-white transition-colors duration-200 text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-wine-400"></span> Home
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-wine-200 hover:text-white transition-colors duration-200 text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-wine-400"></span> Cart
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-wine-200 hover:text-white transition-colors duration-200 text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-wine-400"></span> My Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-wine-50">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-wine-200 text-sm">
                <Mail size={16} />
                <span>support@waraebook.com</span>
              </li>
              <li className="flex items-center gap-3 text-wine-200 text-sm">
                <Phone size={16} />
                <span>+66 2 123 4567</span>
              </li>
              <li className="flex items-center gap-3 text-wine-200 text-sm">
                <MapPin size={16} />
                <span>Bangkok, Thailand</span>
              </li>
            </ul>
          </div>

          {/* Socials */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-wine-50">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="bg-wine-800 p-2 rounded-full hover:bg-wine-700 transition-colors text-white">
                <Facebook size={20} />
              </a>
              <a href="#" className="bg-wine-800 p-2 rounded-full hover:bg-wine-700 transition-colors text-white">
                <Twitter size={20} />
              </a>
              <a href="#" className="bg-wine-800 p-2 rounded-full hover:bg-wine-700 transition-colors text-white">
                <Instagram size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-wine-800 mt-12 pt-8 text-center text-wine-300 text-sm">
          <p>&copy; {new Date().getFullYear()} Wara Ebook Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
