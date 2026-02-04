"use client"
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import api from '@/utils/api';
import PriceDisplay from '@/components/PriceDisplay';
import { ShoppingCart, Check } from 'lucide-react';

import Image from 'next/image';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [sortOption, setSortOption] = useState('latest');
  const [ownedItems, setOwnedItems] = useState(new Set());

  useEffect(() => {
    fetchProducts();
  }, [page]); 

  // Fetch owned items
  useEffect(() => {
      if (user && user.role !== 'admin') {
          api.get('/orders')
            .then(({ data: orders }) => { // Destructure data as orders
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
                setOwnedItems(ownedIds);
            })
            .catch(console.error);
      } else {
          setOwnedItems(new Set());
      }
  }, [user]);

  // Allow passing page explicitly to handle cases where state isn't updated yet (like reset)
  // Allow passing page explicitly to handle cases where state isn't updated yet (like reset)
  const fetchProducts = async (searchQuery = search, pageNum = page) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/products`, {
          params: { page: pageNum, limit: 6, search: searchQuery }
      });
      // Axios returns data in data property
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
        setLoading(false);
    }
  };

  const handleSearch = (e) => {
      e.preventDefault();
      setPage(1); // Reset to page 1 on new search
      fetchProducts(search, 1);
  };

  const handleSearchChange = (e) => {
      const val = e.target.value;
      setSearch(val);
      if (val === '') {
          setPage(1);
          fetchProducts('', 1);
      }
  };

  // Client-side sorting logic
  const sortedProducts = [...products].sort((a, b) => {
      if (sortOption === 'price-asc') return Number(a.price) - Number(b.price);
      if (sortOption === 'price-desc') return Number(b.price) - Number(a.price);
      if (sortOption === 'name-asc') return a.title.localeCompare(b.title);
      if (sortOption === 'name-desc') return b.title.localeCompare(a.title);
      return 0;
  });

  return (
    <main>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-wine-900 to-black text-white py-20 mb-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-10">
           <div className="max-w-2xl">
   <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-white m-0">
  The right <span className="text-wine-400">Syntax</span> for the solution
</h1>
<p className="text-xl text-gray-300 mb-8 font-light">
  Dream of clean, bug-free code and we will have the expert documentation ready for download... Literally.
</p>
<div className="flex gap-4">
  <button className="bg-white text-wine-900 px-8 py-3 rounded-full font-bold hover:bg-wine-50 transition-all text-lg shadow-lg transform hover:-translate-y-1">
    Get the Guide
  </button>
              </div>
           </div>


<div className="hidden md:block w-1/3 relative">
  <div className="relative aspect-[3/4] rotate-3 transform translate-y-4 transition-transform hover:rotate-0 duration-500">
    <Image
      src="/hero-ebook.png"
      alt="Programming Guide eBook Cover"
      fill
      priority
      className="object-cover rounded-2xl shadow-2xl  "
    />
  </div>
</div>
        </div>
      </div>

      <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="text-3xl font-bold text-wine-900">Available Books</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-grow max-w-xl">
            <input 
                type="text" 
                placeholder="Search documents..." 
                value={search}
                onChange={handleSearchChange}
                className="w-full px-6 py-3 rounded-full border border-gray-200 focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-all shadow-sm"
            />
            <button type="submit" className="bg-wine-900 text-white px-8 py-3 rounded-full font-bold hover:bg-wine-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Search
            </button>
        </form>

        <div className="relative">
            <select 
                value={sortOption} 
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none w-full md:w-auto px-6 py-3 pr-10 rounded-full border border-gray-200 focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none cursor-pointer bg-white shadow-sm hover:border-wine-300 transition-colors"
            >
                <option value="latest">Sort by: Latest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A-Z</option>
                <option value="name-desc">Name: Z-A</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-wine-900">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
            </div>
        </div>
      </div>

      {loading ? <p>Loading...</p> : (
        <>
          <div className="grid">
            {sortedProducts.map(product => {
              const isOwned = ownedItems.has(String(product.id));
              
              return (
              <div key={product.id} className='card'>
              <Link href={`/products/${product.id}` } style={{ textDecoration: 'none' }}>
                {product.image_url ? (
                    <div style={{ width: '100%', height: '200px', background: '#f6f9fc', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${product.image_url}`} alt={product.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                ) : (
                    <div style={{ width: '100%', height: '200px', background: '#eaeaea', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#999' }}>PDF</span>
                    </div>
                )}
                <div  style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h2 className='line-clamp-2 font-bold leading-6 h-[3rem]' style={{ cursor: 'pointer' }}>{product.title}</h2>
                </div>
                {/* <p className='line-clamp-2 truncate font-bold text-red-500' style={{ color: '#666', minHeight: '60px' }}>{product.description}</p> */}
                <div  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                  <PriceDisplay 
                      price={product.price} 
                      discountPercent={product.discount_percent} 
                      isDiscountActive={product.is_discount_active} 
                  />
                  {(!user || user.role !== 'admin') ? (
                       isOwned ? (
                             <button 
                                className="bg-green-600 text-white p-3 rounded-full shadow-lg flex items-center justify-center cursor-default"
                                disabled
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                title="Owned"
                              >
                                <Check size={20} />
                              </button>
                       ) : (

                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addToCart(product)
                              }} 
                            className="bg-wine-900 hover:bg-wine-800 text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-110 flex items-center justify-center"
                            title="Add to Cart"
                          >
                            <ShoppingCart size={20} />
                          </button>
                       )
                  ) : (
                      <span className='text-wine-500' style={{ color: '#888', fontStyle: 'italic' }}>Admin View</span>
                  )}
                </div>
              </Link>
              </div>
            )})}
          </div>
          
          {products.length === 0 && <p>No products found.</p>}

          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
              <button 
                disabled={page <= 1} 
                onClick={() => setPage(page - 1)}
                style={{ padding: '10px 20px', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}
              >
                  Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button 
                disabled={page >= totalPages} 
                onClick={() => setPage(page + 1)}
                style={{ padding: '10px 20px', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}
              >
                  Next
              </button>
          </div>
        </>
      )}
      </div>
    </main>
  );
}
