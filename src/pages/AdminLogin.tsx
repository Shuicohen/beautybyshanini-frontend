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
      if (res.token) {
        localStorage.setItem('token', res.token);
        navigate('/admin/dashboard');
      } else {
        setError('Invalid response from server');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to connect to server. Please check your internet connection and try again.';
      setError(errorMessage);
      if (import.meta.env.DEV) {
        console.error('Login error:', err);
      }
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