import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useNotification } from '../contexts/NotificationContext';
import { Layers, ArrowRight, Mail } from 'lucide-react';
import Card from '../components/Card';

const forgotPasswordSchema = zod.object({
  email: zod.string().min(1, 'Email is required').email('Invalid email address')
});

type ForgotFormValues = zod.infer<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const { showToast } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (values: ForgotFormValues) => {
    setIsSubmitting(true);
    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
      showToast('success', 'Reset Mail Sent', `A recovery link has been dispatched to ${values.email}`);
    }, 1000);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-950 min-h-screen relative overflow-hidden">
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-600/10 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 flex flex-col gap-6">
        <div className="flex items-center gap-2 self-center">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-glow-blue">
            <Layers size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg text-white">AI CivicFix</span>
        </div>

        <Card hoverable={false} className="border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white">Reset Password</h2>
            <p className="text-xs text-slate-400 mt-1">We'll dispatch a link to restore your dashboard access</p>
          </div>

          {isSent ? (
            <div className="text-center flex flex-col items-center gap-4 py-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Mail size={24} />
              </div>
              <h3 className="font-semibold text-sm text-slate-200">Email Dispatched</h3>
              <p className="text-xs text-slate-400 leading-normal max-w-xs">
                Check your inbox! We've forwarded secure instructions to recover your credentials.
              </p>
              <Link to="/login" className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-6 py-2.5 rounded-xl transition-all mt-4 w-full">
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Email Address</label>
                <input
                  {...register('email')}
                  placeholder="name@civicfix.gov"
                  type="email"
                  className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
                />
                {errors.email && <span className="text-[10px] text-rose-400">{errors.email.message}</span>}
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
                    Send Recovery Link
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          {!isSent && (
            <div className="text-center mt-6 border-t border-slate-800/80 pt-4">
              <Link to="/login" className="text-xxs text-blue-400 hover:text-blue-300 font-semibold">
                Back to Sign In
              </Link>
            </div>
          )}
        </Card>

        <Link to="/" className="text-xxs text-slate-500 hover:text-slate-400 self-center">
          &larr; Back to home page
        </Link>
      </div>
    </div>
  );
};
export default ForgotPassword;
