import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Layers, ArrowRight, Mail, Phone, KeyRound, ShieldCheck, Check } from 'lucide-react';
import Card from '../components/Card';

export const ForgotPassword: React.FC = () => {
  const { requestPasswordReset, verifyPasswordResetOtp, resetPassword } = useAuth();
  const { showToast } = useNotification();

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [channel, setChannel] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. Submit Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const destination = channel === 'email' ? email : phone;
    if (!destination) {
      showToast('warning', 'Input Required', `Please provide your registered ${channel}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(channel === 'email' ? { email } : { phone });
      showToast('success', 'OTP Dispatched', `A 6-digit confirmation code was sent to ${destination}.`);
      setStep(2);
    } catch (err: any) {
      showToast('error', 'Request Failed', err.message || 'Could not send recovery OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Verify OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken) {
      showToast('warning', 'OTP Required', 'Please enter the 6-digit confirmation code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyPasswordResetOtp(channel === 'email' ? { email } : { phone }, otpToken);
      showToast('success', 'Code Confirmed', 'Verification complete. You may now reset your password.');
      setStep(3);
    } catch (err: any) {
      showToast('error', 'Verification Failed', err.message || 'Incorrect confirmation code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Reset to New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showToast('warning', 'Inputs Required', 'Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      showToast('warning', 'Weak Password', 'New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'Mismatch Error', 'Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(newPassword);
      showToast('success', 'Password Reset Complete', 'Your credentials have been successfully updated.');
      setIsSuccess(true);
    } catch (err: any) {
      showToast('error', 'Reset Failed', err.message || 'Failed to apply new password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-950 min-h-screen relative overflow-hidden">
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-600/10 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 flex flex-col gap-6 animate-fadeIn">
        <div className="flex items-center gap-2 self-center">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-glow-blue">
            <Layers size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg text-white">AI CivicFix</span>
        </div>

        <Card hoverable={false} className="border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white">Password Recovery</h2>
            <p className="text-xs text-slate-400 mt-1">Restore your secure dashboard parameters and credentials</p>
          </div>

          {isSuccess ? (
            <div className="text-center flex flex-col items-center gap-4 py-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-semibold text-sm text-slate-200">Credentials Updated</h3>
              <p className="text-xs text-slate-400 leading-normal max-w-xs">
                Your password was reset successfully. You may now return to the sign in portal to log in.
              </p>
              <Link to="/login" className="bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all mt-4 w-full text-center">
                Return to Sign In
              </Link>
            </div>
          ) : step === 1 ? (
            <form onSubmit={handleRequestOtp} className="flex flex-col gap-4 animate-fadeIn">
              {/* Channel Selector Button Group */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Select OTP Destination</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannel('email')}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xxs font-bold uppercase transition-all duration-200
                      ${channel === 'email'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-glow-blue'
                        : 'border-slate-800 bg-slate-900/20 text-slate-400 hover:border-slate-700'
                      }`}
                  >
                    <Mail size={12} />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('phone')}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xxs font-bold uppercase transition-all duration-200
                      ${channel === 'phone'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-glow-blue'
                        : 'border-slate-800 bg-slate-900/20 text-slate-400 hover:border-slate-700'
                      }`}
                  >
                    <Phone size={12} />
                    Mobile Phone
                  </button>
                </div>
              </div>

              {channel === 'email' ? (
                <div className="flex flex-col gap-1 animate-fadeIn">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@civicfix.gov"
                    className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1 animate-fadeIn">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 012-3456"
                    className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue disabled:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Send Recovery OTP
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          ) : step === 2 ? (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 animate-fadeIn">
              <div className="flex flex-col gap-1.5 text-center items-center">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mb-2">
                  <KeyRound size={20} />
                </div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Enter Verification OTP</label>
                <p className="text-[10px] text-slate-500 leading-normal max-w-xs mt-1">
                  A verification token was dispatched to {channel === 'email' ? email : phone}. Please insert it below to unlock recovery access.
                </p>
                <input
                  type="text"
                  placeholder="Enter 6-digit code..."
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value)}
                  maxLength={6}
                  className="bg-slate-950 border border-slate-800/85 rounded-xl px-4 py-2.5 text-center text-xs font-mono tracking-widest outline-none focus:border-blue-500 text-slate-200 transition-colors mt-3 w-full"
                  autoFocus
                />
                <span className="text-[9px] text-slate-500 mt-2 block">
                  💡 Developer bypass code: <strong className="text-blue-400">123456</strong>
                </span>
              </div>

              <div className="flex gap-3 border-t border-slate-800/40 pt-4 mt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue disabled:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border border-slate-800 hover:bg-slate-850 text-slate-400 font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                >
                  Back
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4 animate-fadeIn">
              <div className="text-center flex flex-col items-center mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mb-2">
                  <Check size={20} />
                </div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Set New Password</label>
                <p className="text-[10px] text-slate-500 leading-normal max-w-xs mt-1">
                  Identity confirmed. Please create a new account login password.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters..."
                  className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password to verify..."
                  className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue disabled:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all mt-2"
              >
                {isSubmitting ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 1 && (
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
