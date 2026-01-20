import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';

interface LoginData {
  username: string;
  password: string;
}

const AdminLogin = () => {
  const { register, handleSubmit } = useForm<LoginData>();
  const api = useApi();
  const navigate = useNavigate();

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: LoginData) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', data);
      if (res && res.token) {
        localStorage.setItem('token', res.token);
        navigate('/admin/dashboard');
      } else {
        setError('Invalid response from server. Please try again.');
      }
    } catch (err: any) {
      // Extract more detailed error message
      let errorMessage = 'Failed to login. ';
      
      if (err?.message) {
        errorMessage += err.message;
      } else if (err?.error) {
        errorMessage += err.error;
      } else if (typeof err === 'string') {
        errorMessage += err;
      } else {
        errorMessage += 'Please check your credentials and try again.';
      }
      
      // Check for specific error types
      if (err?.message?.includes('API URL is not configured')) {
        errorMessage = 'API URL is not configured. Please contact the administrator.';
      } else if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) {
        errorMessage = 'Cannot connect to server. Please check your internet connection and ensure the backend is running.';
      } else if (err?.message?.includes('CORS')) {
        errorMessage = 'CORS error: Server configuration issue. Please contact the administrator.';
      }
      
      setError(errorMessage);
      
      // Always log errors for debugging
      console.error('Login error:', {
        error: err,
        message: err?.message,
        stack: err?.stack,
        data: data
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 bg-white/90 backdrop-blur-md p-10 rounded-3xl shadow-2xl max-w-md w-full border border-white/20"
      >
        <h1 className="text-3xl font-bold text-center mb-8 text-pink-accent drop-shadow-sm">Admin Login</h1>
        {import.meta.env.DEV && (
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs">
            API URL: {import.meta.env.VITE_API_URL || 'http://localhost:3000'}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <input 
            {...register('username', { required: 'Username is required' })} 
            placeholder="Username" 
            className="block w-full p-4 border border-baby-blue/50 rounded-xl focus:border-pink-accent outline-none bg-white/80 backdrop-blur-sm font-medium"
            disabled={loading}
          />
          <input 
            {...register('password', { required: 'Password is required' })} 
            type="password" 
            placeholder="Password" 
            className="block w-full p-4 border border-baby-blue/50 rounded-xl focus:border-pink-accent outline-none bg-white/80 backdrop-blur-sm font-medium"
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-pink-accent text-white py-4 rounded-xl shadow-soft hover:shadow-lg transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;