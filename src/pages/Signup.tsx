import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Layers, ArrowRight } from 'lucide-react';
import Card from '../components/Card';

const signupSchema = zod.object({
  name: zod.string().min(2, 'Name must be at least 2 characters'),
  email: zod.string().min(1, 'Email is required').email('Invalid email address'),
  phone: zod.string().min(10, 'Phone number must be at least 10 digits'),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
  role: zod.enum(['citizen', 'officer'] as const),
  agree: zod.boolean().refine(val => val === true, 'You must accept the terms')
});

type SignupFormValues = zod.infer<typeof signupSchema>;

export const Signup: React.FC = () => {
  const { signup } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'citizen',
      agree: false
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (values: SignupFormValues) => {
    setIsSubmitting(true);
    try {
      await signup({
        name: values.name,
        email: values.email,
        phone: values.phone,
        role: values.role,
        password: values.password
      });
      showToast('success', 'Account Created', `Successfully registered as a ${values.role}!`);
      
      if (values.role === 'citizen') {
        navigate('/citizen/dashboard');
      } else {
        navigate('/officer/dashboard');
      }
    } catch (err: any) {
      showToast('error', 'Registration Failed', err?.message || 'Error processing request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-950 min-h-screen relative overflow-hidden">
      <div className="absolute bottom-1/3 right-1/2 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-indigo-600/10 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 flex flex-col gap-6">
        <div className="flex items-center gap-2 self-center">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-glow-blue">
            <Layers size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg text-white">AI CivicFix</span>
        </div>

        <Card hoverable={false} className="border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white">Create New Account</h2>
            <p className="text-xs text-slate-400 mt-1">Get started with automated civic reports</p>
          </div>

          {/* Role selector switches */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              type="button"
              onClick={() => setValue('role', 'citizen')}
              className={`py-2.5 rounded-lg border text-xxs font-bold uppercase transition-all duration-200
                ${selectedRole === 'citizen'
                  ? 'bg-blue-600 border-blue-500 text-white shadow-glow-blue'
                  : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700'
                }`}
            >
              Citizen Account
            </button>
            <button
              type="button"
              onClick={() => setValue('role', 'officer')}
              className={`py-2.5 rounded-lg border text-xxs font-bold uppercase transition-all duration-200
                ${selectedRole === 'officer'
                  ? 'bg-blue-600 border-blue-500 text-white shadow-glow-blue'
                  : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700'
                }`}
            >
              Officer Account
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Full Name</label>
              <input
                {...register('name')}
                placeholder="Jane Doe"
                type="text"
                className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
              />
              {errors.name && <span className="text-[10px] text-rose-400">{errors.name.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Email Address</label>
              <input
                {...register('email')}
                placeholder="jane@example.com"
                type="email"
                className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
              />
              {errors.email && <span className="text-[10px] text-rose-400">{errors.email.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Phone Number</label>
              <input
                {...register('phone')}
                placeholder="+1 (555) 000-0000"
                type="text"
                className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
              />
              {errors.phone && <span className="text-[10px] text-rose-400">{errors.phone.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Password</label>
              <input
                {...register('password')}
                placeholder="••••••••"
                type="password"
                className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
              />
              {errors.password && <span className="text-[10px] text-rose-400">{errors.password.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  {...register('agree')}
                  type="checkbox"
                  className="mt-0.5 border-slate-800 bg-slate-950 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-xxs text-slate-400 leading-normal">
                  I consent to sharing my GPS location when submitting infrastructure complaints to municipal services.
                </span>
              </label>
              {errors.agree && <span className="text-[10px] text-rose-400">{errors.agree.message}</span>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue disabled:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 mt-3"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Register Account
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 border-t border-slate-800/80 pt-4">
            <span className="text-xxs text-slate-400">Already registered? </span>
            <Link to="/login" className="text-xxs text-blue-400 hover:text-blue-300 font-semibold">
              Sign In
            </Link>
          </div>
        </Card>

        <Link to="/" className="text-xxs text-slate-500 hover:text-slate-400 self-center">
          &larr; Back to home page
        </Link>
      </div>
    </div>
  );
};
export default Signup;
