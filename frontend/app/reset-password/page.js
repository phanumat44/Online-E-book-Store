'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                setTimeout(() => router.push('/login'), 3000);
            } else {
                setError(data.error || 'Something went wrong');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    if (!token) return <div className="text-center p-10 text-red-500">Invalid Link (No Token)</div>;

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter your new password below.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                     {message && <div className="mb-4 p-3 bg-green-50 text-green-700 border-l-4 border-green-500 text-sm rounded">{message}</div>}
                     {error && <div className="mb-4 p-3 bg-red-50 text-red-700 border-l-4 border-red-500 text-sm rounded">{error}</div>}
                    
                    {!message && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="rounded-md shadow-sm -space-y-px">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input 
                                        type="password" 
                                        className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-wine-500 focus:border-wine-500 focus:z-10 sm:text-sm transition-colors"
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        required 
                                        minLength={6}
                                        placeholder="New Password"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                    <input 
                                        type="password" 
                                        className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-wine-500 focus:border-wine-500 focus:z-10 sm:text-sm transition-colors"
                                        value={confirmPassword} 
                                        onChange={(e) => setConfirmPassword(e.target.value)} 
                                        required 
                                        placeholder="Confirm New Password"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-wine-900 hover:bg-wine-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine-500 transition-all shadow-md transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Resetting...' : 'Set New Password'}
                            </button>
                        </form>
                    )}
                    
                    <div className="mt-4 text-center">
                         <Link href="/login" className="font-medium text-wine-600 hover:text-wine-500 transition-colors">
                             Back to Login
                         </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPassword() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
