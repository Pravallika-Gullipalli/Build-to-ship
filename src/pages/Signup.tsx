import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { authService } from '../services/authService';
import { Layers, ArrowRight, CheckCircle2, RotateCw } from 'lucide-react';
import Card from '../components/Card';

const signupSchema = zod.object({
  name: zod.string().optional(),
  email: zod.string().min(1, 'Email is required').email('Invalid email address'),
  phone: zod.string().optional(),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
  role: zod.enum(['citizen', 'officer'] as const),
  agree: zod.boolean().refine(val => val === true, 'You must accept the terms')
}).superRefine((data, ctx) => {
  if (data.role === 'officer') {
    if (!data.name || data.name.trim().length < 2) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: 'Name must be at least 2 characters for officers',
        path: ['name']
      });
    }
    if (!data.phone || data.phone.trim().length < 10) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: 'Phone number must be at least 10 digits for officers',
        path: ['phone']
      });
    }
  }
});

type SignupFormValues = zod.infer<typeof signupSchema>;

export const Signup: React.FC = () => {
  const { signup, verifyOtp } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  
  const redirectedState = location.state as { email?: string; password?: string } | null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(!!redirectedState?.email);
  const [registeredEmail, setRegisteredEmail] = useState(redirectedState?.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [selectedRole, setSelectedRole] = useState<'citizen' | 'officer'>('citizen');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: redirectedState?.email || '',
      phone: '',
      password: '',
      role: 'citizen',
      agree: false
    }
  });

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const onSubmit = async (values: SignupFormValues) => {
    setIsSubmitting(true);
    const finalName = values.name || values.email.split('@')[0];
    const finalPhone = values.phone || '';
    try {
      const result = await signup({
        name: finalName,
        email: values.email,
        phone: finalPhone,
        role: selectedRole,
        password: values.password
      });
      
      if (result.confirmationRequired) {
        setRegisteredEmail(values.email);
        setSignupSuccess(true);
        setResendCooldown(45);
        showToast('info', 'Verification Code Sent', `A 6-digit confirmation code was sent to ${values.email}.`);
      } else {
        showToast('success', 'Account Created', `Successfully registered as a ${selectedRole}!`);
        if (selectedRole === 'citizen') {
          navigate('/citizen/dashboard');
        } else {
          navigate('/officer/dashboard');
        }
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Error processing registration.';
      showToast('error', 'Registration Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !registeredEmail) return;
    try {
      await authService.resendSignupOtp(registeredEmail);
      showToast('success', 'New Code Sent', `A new verification code was sent to ${registeredEmail}.`);
      setResendCooldown(45);
    } catch (err: any) {
      showToast('error', 'Resend Failed', err?.message || 'Could not resend verification code.');
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      showToast('warning', 'Code Required', 'Please enter the 6-digit confirmation code.');
      return;
    }

    setIsVerifying(true);
    try {
      const loggedUser = await verifyOtp(registeredEmail, otpCode.trim(), selectedRole);
      showToast('success', 'Account Verified', `Welcome to AI CivicFix, ${loggedUser.name}!`);
      
      if (loggedUser.role === 'citizen') {
        navigate('/citizen/dashboard');
      } else if (loggedUser.role === 'officer') {
        navigate('/officer/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid or expired verification code.';
      showToast('error', 'Verification Failed', errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-950 min-h-screen relative overflow-hidden">
        <div className="absolute bottom-1/3 right-1/2 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-indigo-600/10 blur-[80px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10 flex flex-col gap-6 animate-fadeIn">
          <div className="flex items-center gap-2 self-center">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-glow-blue">
              <Layers size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-white">AI CivicFix</span>
          </div>

          <Card hoverable={false} className="border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl text-center">
            <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5 text-blue-400 shadow-glow-blue/20">
              <CheckCircle2 size={32} />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Verify Your Account</h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              A 6-digit confirmation code has been dispatched to <strong className="text-blue-400">{registeredEmail}</strong>. Please enter the code below to complete account activation.
            </p>

            {/* OTP verification form input */}
            <form onSubmit={handleVerifySubmit} className="flex flex-col gap-4 text-left mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Enter 6-digit confirmation code:</label>
                <input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  type="text"
                  maxLength={6}
                  autoFocus
                  className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest outline-none focus:border-blue-500 text-slate-100 font-bold transition-colors"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">Didn't receive code?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className="text-blue-400 hover:text-blue-300 font-bold disabled:text-slate-500 flex items-center gap-1 transition-colors"
                >
                  <RotateCw size={12} className={resendCooldown > 0 ? '' : 'animate-spin-slow'} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isVerifying || otpCode.length !== 6}
                className="bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue disabled:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg mt-1"
              >
                {isVerifying ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirm & Activate Account</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="flex flex-col gap-3 border-t border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={() => setSignupSuccess(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-semibold"
              >
                &larr; Back to Registration
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-950 min-h-screen relative overflow-hidden">
      <div className="absolute bottom-1/3 right-1/2 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-indigo-600/10 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 flex flex-col gap-6 animate-fadeIn">
        <div className="flex items-center gap-2 self-center">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-glow-blue">
            <Layers size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg text-white">AI CivicFix</span>
        </div>

        <Card hoverable={false} className="border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white">Create New Account</h2>
            <p className="text-xs text-slate-400 mt-1">Get started with automated civic reporting</p>
          </div>

          {/* Role selector switches */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              type="button"
              onClick={() => setSelectedRole('citizen')}
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
              onClick={() => setSelectedRole('officer')}
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
                className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
              />
              {errors.name && <span className="text-[10px] text-rose-400">{errors.name.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Email Address</label>
              <input
                {...register('email')}
                placeholder="jane@example.com"
                type="email"
                className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
              />
              {errors.email && <span className="text-[10px] text-rose-400">{errors.email.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Phone Number</label>
              <input
                {...register('phone')}
                placeholder="+1 (555) 000-0000"
                type="text"
                className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
              />
              {errors.phone && <span className="text-[10px] text-rose-400">{errors.phone.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Password</label>
              <input
                {...register('password')}
                placeholder="Minimum 6 characters..."
                type="password"
                className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
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
              className="bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue disabled:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 mt-3 shadow-lg"
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
