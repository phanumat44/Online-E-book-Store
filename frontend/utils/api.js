import axios from 'axios';
import Swal from 'sweetalert2';

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the error is 401 and NOT from the login endpoint
    const isLoginRequest = error.config?.url?.includes('/login');
    
    if (error.response?.status === 401 && !isLoginRequest) {
      handleSessionExpired();
    }
    return Promise.reject(error);
  }
);

const handleSessionExpired = () => {
    if (sessionStorage.getItem('session_expired_handling') === 'true') return;
    
    sessionStorage.setItem('session_expired_handling', 'true');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    Swal.fire({
        icon: 'warning',
        title: 'Session Expired',
        text: 'Your session has expired. Please login again.',
        confirmButtonText: 'Login',
        allowOutsideClick: false,
        allowEscapeKey: false
    }).then((result) => {
        if (result.isConfirmed) {
            sessionStorage.removeItem('session_expired_handling');
            window.localStorage.removeItem('token'); // Ensure redundant clear
            window.location.href = '/login';
        }
    });
};

export default api;

