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

  const onSubmit = (data: LoginData) => {
    api.post('/api/auth/login', data).then((res) => {
      localStorage.setItem('token', res.token);
      navigate('/admin/dashboard');
    }).catch(() => alert('Invalid credentials'));
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <input 
            {...register('username')} 
            placeholder="Username" 
            className="block w-full p-4 border border-baby-blue/50 rounded-xl focus:border-pink-accent outline-none bg-white/80 backdrop-blur-sm font-medium"
          />
          <input 
            {...register('password')} 
            type="password" 
            placeholder="Password" 
            className="block w-full p-4 border border-baby-blue/50 rounded-xl focus:border-pink-accent outline-none bg-white/80 backdrop-blur-sm font-medium"
          />
          <button 
            type="submit" 
            className="w-full bg-pink-accent text-white py-4 rounded-xl shadow-soft hover:shadow-lg transition-all duration-300 font-semibold"
          >
            Login
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;