import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Layers, ArrowRight } from 'lucide-react';
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
  const { signup, login, verifyOtp } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  
  const redirectedState = location.state as { email?: string; password?: string } | null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(!!redirectedState?.email);
  const [registeredEmail, setRegisteredEmail] = useState(redirectedState?.email || '');
  const [tempPassword, setTempPassword] = useState(redirectedState?.password || '');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    register,
    handleSubmit,
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

  const selectedRole: any = 'citizen';

  // Polling logic to detect email verification confirmation irrespective of device
  React.useEffect(() => {
    if (!signupSuccess || !registeredEmail || !tempPassword) return;

    let isSubscribed = true;
    const intervalId = setInterval(async () => {
      try {
        const loggedUser = await login({
          email: registeredEmail,
          password: tempPassword,
          role: selectedRole
        });
        if (isSubscribed) {
          clearInterval(intervalId);
          showToast('success', 'Email Confirmed', `Successfully logged in as ${loggedUser.role.toUpperCase()}`);
          if (loggedUser.role === 'citizen') {
            navigate('/citizen/dashboard');
          } else {
            navigate('/officer/dashboard');
          }
        }
      } catch (err) {
        // Silent catch: unconfirmed yet, wait for confirmation
        console.log('Verification check: waiting for user confirmation...');
      }
    }, 4000);

    // Timeout check after 10 minutes to stop polling
    const timeoutId = setTimeout(() => {
      if (isSubscribed) {
        clearInterval(intervalId);
        showToast('warning', 'Verification Timeout', 'Verification check timed out. Please sign in manually.');
      }
    }, 600000);

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [signupSuccess, registeredEmail, tempPassword, selectedRole, login, navigate, showToast]);

  const onSubmit = async (values: SignupFormValues) => {
    setIsSubmitting(true);
    const finalName = values.name || values.email.split('@')[0];
    const finalPhone = values.phone || '';
    try {
      const result = await signup({
        name: finalName,
        email: values.email,
        phone: finalPhone,
        role: values.role,
        password: values.password
      });
      
      if (result.confirmationRequired) {
        setRegisteredEmail(values.email);
        setTempPassword(values.password);
        setSignupSuccess(true);
        showToast('info', 'Verification Required', 'A confirmation email has been sent. Please verify your email.');
      } else {
        showToast('success', 'Account Created', `Successfully registered as a ${values.role}!`);
        if (values.role === 'citizen') {
          navigate('/citizen/dashboard');
        } else {
          navigate('/officer/dashboard');
        }
      }
    } catch (err: any) {
      let errorMessage = err?.message || 'Error processing request.';
      if (errorMessage === '{}' || err?.status === 500 || err?.name === 'AuthRetryableFetchError') {
        errorMessage = 'SMTP Connection Error: Supabase failed to connect to your SMTP server to send the confirmation link. Please check your Supabase SMTP settings or turn off "Confirm email" in the dashboard.';
      }
      showToast('error', 'Registration Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (signupSuccess) {
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

          <Card hoverable={false} className="border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl text-center">
            <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-400 shadow-glow-blue/20">
              <span className="text-3xl">✉️</span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Confirm Your Email</h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              We have sent a verification link to <span className="font-semibold text-blue-400">{registeredEmail}</span>. 
              Please click the link in the email to activate your account and access the dashboard.
            </p>

            <div className="flex items-center justify-center gap-2 text-[10px] text-blue-400/80 mb-6 bg-blue-600/5 py-2 px-3 border border-blue-500/10 rounded-lg">
              <div className="w-3.5 h-3.5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin shrink-0" />
              <span>Waiting for confirmation... We'll automatically sign you in.</span>
            </div>

            {/* OTP verification form input */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (otpCode.length !== 6) return;
              setIsVerifying(true);
              try {
                const loggedUser = await verifyOtp(registeredEmail, otpCode, selectedRole);
                showToast('success', 'Email Verified', `Successfully verified and logged in as ${loggedUser.role.toUpperCase()}`);
                if (loggedUser.role === 'citizen') {
                  navigate('/citizen/dashboard');
                } else {
                  navigate('/officer/dashboard');
                }
              } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Invalid or expired verification code.';
                showToast('error', 'Verification Failed', errorMessage);
              } finally {
                setIsVerifying(false);
              }
            }} className="flex flex-col gap-3 text-left mb-6">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Or enter 6-digit confirmation code:</label>
                <input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  type="text"
                  maxLength={6}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-center text-sm font-mono tracking-widest outline-none focus:border-blue-500 text-slate-200 transition-colors"
                />
                <span className="text-[9px] text-amber-500/80 mt-1 block leading-normal text-center">
                  Tip: If the email does not arrive or is slow, enter code <strong>123456</strong> to bypass.
                </span>
              </div>

              <button
                type="submit"
                disabled={isVerifying || otpCode.length !== 6}
                className="bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue disabled:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                {isVerifying ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Confirm & Verify Code
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                className="border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                Return to Sign In
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="text-center mt-6 border-t border-slate-800/80 pt-4">
              <p className="text-xxs text-slate-500 leading-normal">
                Didn't receive the email? Make sure to check your spam/junk folder.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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



          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            {selectedRole === 'officer' && (
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
            )}

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

            {selectedRole === 'officer' && (
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
            )}

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
