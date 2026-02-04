'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/utils/api';

import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import { Upload, FileText, Image as ImageIcon, X } from 'lucide-react';

export default function EditProduct({ params }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = params;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    discount_percent: '',
    is_discount_active: false,
    status: 'active',
    currentImage: '',
    pdf: null,
    image: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [abortController, setAbortController] = useState(null);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
        return;
      }
      // Fetch product details
      api.get(`/products/${id}`)
        .then(({data}) => {
             if (data.status === 'inactive' && data.status !== 'inactive') { 
                // Logic check: admin can see inactive? Yes.
             }
            setFormData(prev => ({
                ...prev,
                title: data.title,
                description: data.description,
                price: data.price,
                discount_percent: data.discount_percent || 0,
                is_discount_active: !!data.is_discount_active,
                status: data.status || 'active',
                currentImage: data.image_url
            }));
            setLoading(false);
        })
        .catch(err => {
            setError(err.message);
            setLoading(false);
        });
    }
  }, [user, authLoading, router, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setUploadProgress(0);

    const controller = new AbortController();
    setAbortController(controller);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('discount_percent', formData.discount_percent || 0);
    data.append('is_discount_active', formData.is_discount_active);
    data.append('status', formData.status);
    if (formData.pdf) data.append('pdf', formData.pdf);
    if (formData.image) data.append('image', formData.image);

    try {
      await api.put(`/products/${id}`, data, {
           headers: { 'Content-Type': 'multipart/form-data' },
           signal: controller.signal,
           onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percentCompleted);
           }
      });

      router.push('/admin');

    } catch (err) {
      if (api.isCancel(err) || err.name === 'CanceledError' || err.name === 'AbortError') {
          setError('Upload cancelled');
      } else {
          setError(err.response?.data?.error || err.message);
      }
    } finally {
      setSaving(false);
      setAbortController(null);
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
      if (abortController) {
          abortController.abort();
      }
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-wine-900 border-b pb-4 border-gray-200">Edit Product</h1>
        
        {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700">
                {error}
            </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
                <input 
                    type="text" 
                    placeholder="Enter product title" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    required 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-all"
                />
            </div>
            
            <div className="h-96">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <div className="h-80">
                    <ReactQuill 
                        theme="snow" 
                        value={formData.description} 
                        onChange={(value) => setFormData({...formData, description: value})} 
                        modules={modules}
                        className="h-full"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (THB)</label>
                    <input 
                        type="number" 
                        placeholder="0.00" 
                        value={formData.price} 
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        required 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-all"
                    />
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select 
                        value={formData.status} 
                        onChange={e => setFormData({...formData, status: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-all"
                    >
                        <option value="active">Active (Selling)</option>
                        <option value="inactive">Inactive (Hidden)</option>
                    </select>
                </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-wine-900 mb-4">Discount Settings</h3>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={formData.is_discount_active}
                                onChange={e => setFormData({...formData, is_discount_active: e.target.checked})}
                            />
                            <span className="slider round"></span>
                        </label>
                        <span className="text-gray-700 font-medium">Enable Discount</span>
                    </div>
                    {formData.is_discount_active && (
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                placeholder="%" 
                                value={formData.discount_percent} 
                                onChange={e => setFormData({...formData, discount_percent: e.target.value})}
                                min="0" 
                                max="100"
                                className="w-20 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-wine-500 focus:border-wine-500"
                            />
                            <span className="text-gray-600">% Off</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 space-y-4 hover:border-wine-300 transition-colors bg-gray-50/50">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Current Cover Image</label>
                     {formData.currentImage ? (
                        <img src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${formData.currentImage}`} className="h-24 rounded-md shadow-sm border border-gray-200 mb-4" />
                    ) : <p className="text-sm text-gray-400 italic mb-4">No image uploaded</p>}
                    
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Cover Image (Optional)</label>
                    <div className="flex items-center gap-4">
                        <label className="cursor-pointer bg-wine-50 text-wine-900 border border-wine-200 hover:bg-wine-100 px-6 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 shadow-sm">
                            <ImageIcon size={18} />
                            <span>Change Image</span>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={e => setFormData({...formData, image: e.target.files[0]})}
                                className="hidden"
                            />
                        </label>
                        <span className="text-sm text-gray-500 italic">
                            {formData.image ? formData.image.name : 'No new image chosen'}
                        </span>
                         {formData.image && (
                            <button 
                                type="button" 
                                onClick={() => setFormData({...formData, image: null})}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">New PDF File (Optional)</label>
                    <div className="flex items-center gap-4">
                         <label className="cursor-pointer bg-wine-50 text-wine-900 border border-wine-200 hover:bg-wine-100 px-6 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 shadow-sm">
                            <FileText size={18} />
                            <span>Change PDF</span>
                            <input 
                                type="file" 
                                accept=".pdf"
                                onChange={e => setFormData({...formData, pdf: e.target.files[0]})}
                                className="hidden"
                            />
                        </label>
                        <span className="text-sm text-gray-500 italic">
                            {formData.pdf ? formData.pdf.name : 'No new file chosen'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <button 
                    type="submit" 
                    disabled={saving} 
                    className="flex-1 bg-wine-900 hover:bg-wine-800 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-transform transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        uploadProgress > 0 && uploadProgress < 100 
                        ? `Uploading ${formData.image ? 'Image' : ''}${formData.image && formData.pdf ? ' & ' : ''}${formData.pdf ? 'PDF' : ''}... ${uploadProgress}%` 
                        : (uploadProgress === 100 ? 'Processing...' : 'Saving...')
                    ) : 'Update Product'}
                </button>
                {saving && (
                    <button 
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-3 bg-red-100 text-red-700 hover:bg-red-200 font-bold rounded-full transition-colors"
                    >
                        Cancel Upload
                    </button>
                )}
                 <button 
                    type="button"
                    onClick={() => router.push('/admin')}
                    className="px-6 py-3 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
