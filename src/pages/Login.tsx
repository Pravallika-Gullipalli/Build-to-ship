import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Layers, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Card from '../components/Card';

const loginSchema = zod.object({
  email: zod.string().min(1, 'Email is required').email('Invalid email address'),
  password: zod.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormValues = zod.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const loggedUser = await login({
        email: values.email,
        password: values.password
      });
      showToast('success', 'Welcome Back', `Successfully signed in as ${loggedUser.role.toUpperCase()}`);
      
      // Navigate to matching portal
      if (loggedUser.role === 'citizen') {
        navigate('/citizen/dashboard');
      } else if (loggedUser.role === 'officer') {
        navigate('/officer/dashboard');
      } else if (loggedUser.role === 'admin') {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid email or password.';
      showToast('error', 'Authentication Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-950 min-h-screen relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-600/10 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 flex flex-col gap-6">
        <div className="flex items-center gap-2 self-center">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-glow-blue">
            <Layers size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg text-white">AI CivicFix</span>
        </div>

        <Card hoverable={false} className="border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white">Sign In to Dashboard</h2>
            <p className="text-xs text-slate-400 mt-1">Enter your registered email and password to access the portal</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Email Address</label>
              <input
                {...register('email')}
                type="email"
                className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
              />
              {errors.email && <span className="text-[10px] text-rose-400">{errors.email.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-bold text-slate-400">Password</label>
                <Link to="/forgot-password" className="text-[10px] text-blue-400 hover:text-blue-300">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-xl pl-4 pr-10 py-2 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <span className="text-[10px] text-rose-400">{errors.password.message}</span>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue disabled:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 mt-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Enter Dashboard
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 border-t border-slate-800/80 pt-4">
            <span className="text-xxs text-slate-400">Don't have an account? </span>
            <Link to="/signup" className="text-xxs text-blue-400 hover:text-blue-300 font-semibold">
              Create Account
            </Link>
          </div>
        </Card>

        {/* Back to landing */}
        <Link to="/" className="text-xxs text-slate-500 hover:text-slate-400 self-center">
          &larr; Back to home page
        </Link>
      </div>
    </div>
  );
};
export default Login;
