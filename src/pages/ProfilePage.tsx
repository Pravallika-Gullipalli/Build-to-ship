import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import Card from '../components/Card';
import { Briefcase, Mail, Phone, Calendar, Camera, Upload, Trash2, ShieldAlert, KeyRound, Check } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { 
    user, 
    updateProfile, 
    verifyPassword, 
    requestEmailChange, 
    requestPhoneChange, 
    verifyEmailChange, 
    verifyPhoneChange,
    resetPassword
  } = useAuth();
  const { showToast } = useNotification();

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync inputs with user context on mount or change
  useEffect(() => {
    if (user) {
      setDisplayName(user.name);
      setPhoneNumber(user.phone || '');
      setEmailAddress(user.email);
    }
  }, [user]);

  // Photo modal states
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Verification modal states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyStep, setVerifyStep] = useState<'password' | 'otp'>('password');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [pendingChanges, setPendingChanges] = useState<{
    email?: string;
    phone?: string;
  } | null>(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (!user) return null;

  // -- Photo Capture Methods --
  const handleStartCamera = async () => {
    setShowCamera(true);
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 400 }, height: { ideal: 400 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera stream access failed:', err);
        showToast('error', 'Camera Error', 'Could not open camera. Check permissions.');
        setShowCamera(false);
      }
    }, 100);
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 400;
    canvas.height = video.videoHeight || 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      saveAvatar(dataUrl);
    }
    handleStopCamera();
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        saveAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveAvatar = async (dataUrl: string) => {
    try {
      setIsSubmitting(true);
      await updateProfile({ avatarUrl: dataUrl });
      showToast('success', 'Profile Photo Updated', 'Avatar image changed successfully.');
      setShowPhotoModal(false);
    } catch {
      showToast('error', 'Update Failed', 'An error occurred while uploading avatar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (window.confirm('Remove profile picture?')) {
      try {
        setIsSubmitting(true);
        await updateProfile({ avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120' });
        showToast('success', 'Profile Photo Removed', 'Avatar set back to default.');
        setShowPhotoModal(false);
      } catch {
        showToast('error', 'Removal Failed', 'Unable to remove photo.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // -- Profile Form Submit Handler --
  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameChanged = displayName !== user.name;
    const phoneChanged = phoneNumber !== (user.phone || '');
    const emailChanged = emailAddress !== user.email;

    if (!nameChanged && !phoneChanged && !emailChanged) {
      showToast('info', 'No Changes Detected', 'Your settings are already up to date.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. If only name changed, save immediately without password verification
      if (!emailChanged && !phoneChanged) {
        await updateProfile({ name: displayName });
        showToast('success', 'Profile Saved', 'Display name updated successfully.');
        setIsSubmitting(false);
        return;
      }

      // 2. If email or phone changed, trigger password check modal first
      setPendingChanges({
        email: emailChanged ? emailAddress : undefined,
        phone: phoneChanged ? phoneNumber : undefined
      });
      setPassword('');
      setOtpToken('');
      setVerifyStep('password');
      setShowVerifyModal(true);
    } catch {
      showToast('error', 'Update Failed', 'Failed to update profile parameters.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -- Password Verification Check --
  const handleVerifyPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      showToast('warning', 'Password Required', 'Please input your current password.');
      return;
    }

    setIsSubmitting(true);
    
    // 1. First, verify the password itself
    try {
      await verifyPassword(password);
    } catch (pwdErr: any) {
      showToast('error', 'Authentication Failed', 'Incorrect account password.');
      setIsSubmitting(false);
      return;
    }

    // 2. Next, trigger OTP dispatch
    try {
      if (pendingChanges?.email) {
        await requestEmailChange(pendingChanges.email);
        showToast('success', 'Email OTP Sent', `A verification code was dispatched to ${pendingChanges.email}.`);
      } else if (pendingChanges?.phone) {
        await requestPhoneChange(pendingChanges.phone);
        showToast('success', 'Phone OTP Sent', `A verification code was dispatched to ${pendingChanges.phone}.`);
      }
      setVerifyStep('otp');
    } catch (otpErr: any) {
      console.error('OTP dispatch failed:', otpErr);
      showToast('error', 'Service Error', otpErr.message || 'Failed to dispatch verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -- OTP Token Verification Check --
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken) {
      showToast('warning', 'Verification Code Required', 'Please enter the 6-digit confirmation code.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (pendingChanges?.email) {
        await verifyEmailChange(pendingChanges.email, otpToken);
        showToast('success', 'Email Updated', `Your email was successfully changed to ${pendingChanges.email}.`);
      }
      
      if (pendingChanges?.phone) {
        await verifyPhoneChange(pendingChanges.phone, otpToken);
        showToast('success', 'Phone Updated', `Your phone number was successfully changed to ${pendingChanges.phone}.`);
      }

      // If name was also edited, apply name update
      if (displayName !== user.name) {
        await updateProfile({ name: displayName });
      }

      setShowVerifyModal(false);
      setPendingChanges(null);
    } catch (err: any) {
      showToast('error', 'Verification Failed', err.message || 'Incorrect confirmation code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -- Change Password Handler --
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('warning', 'Inputs Required', 'Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      showToast('warning', 'Weak Password', 'New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'Mismatch Error', 'New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      // 1. Verify current password
      await verifyPassword(currentPassword);
      
      // 2. Set new password
      await resetPassword(newPassword);

      showToast('success', 'Password Updated', 'Your account password was updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message || 'Incorrect current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-slate-800/40 pb-2">
        <h2 className="text-xl font-bold text-white">My Portal Profile</h2>
        <p className="text-xs text-slate-400">View and update your personal credentials and municipal contact info</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Info Panel */}
        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-6 flex flex-col items-center text-center gap-4 relative">
          {/* Avatar Container with Hover Overlay */}
          <div 
            onClick={() => setShowPhotoModal(true)}
            className="w-24 h-24 rounded-full relative group cursor-pointer overflow-hidden border-2 border-blue-500/30 p-1 bg-slate-950 transition-all hover:border-blue-500/80"
          >
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
              alt={user.name}
              className="w-full h-full rounded-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/80 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Camera size={20} className="text-blue-400" />
              <span className="text-[8px] font-bold text-slate-200 uppercase tracking-wider mt-1">Edit photo</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">{user.name}</h3>
            <span className="text-xxs px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold uppercase tracking-wider mt-1.5 inline-block">
              {user.role} view
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowPhotoModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-200 font-bold text-xxs px-4 py-2 rounded-xl transition-all uppercase tracking-wider"
          >
            <Camera size={12} />
            Add My Profile Pic
          </button>

          <div className="w-full border-t border-slate-800/60 pt-4 flex flex-col gap-3 text-xs text-left text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-slate-500 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-slate-500 shrink-0" />
              <span>{user.phone || 'No phone attached'}</span>
            </div>
            {user.department && (
              <div className="flex items-center gap-2">
                <Briefcase size={14} className="text-slate-500 shrink-0" />
                <span>Dept: {user.department}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-500 shrink-0" />
              <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>

        {/* Right Settings Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-6">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white border-b border-slate-800/60 pb-3 mb-5">
              Account Parameters
            </h3>

            <form onSubmit={handleSubmitProfile} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Phone Number</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 font-semibold flex items-center gap-1.5">
                  Email Address
                  <span className="text-[9px] text-slate-500 normal-case">(Requires password confirmation)</span>
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue disabled:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all self-start px-6 mt-2"
              >
                {isSubmitting ? 'Processing...' : 'Save Changes'}
              </button>
            </form>
          </Card>

          <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-6">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white border-b border-slate-800/60 pb-3 mb-5">
              Change Account Password
            </h3>

            <form onSubmit={handleChangePasswordSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password..."
                  className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    placeholder="Verify new password..."
                    className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue disabled:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all self-start px-6 mt-2"
              >
                {isChangingPassword ? 'Changing Password...' : 'Update Password'}
              </button>
            </form>
          </Card>
        </div>
      </div>

      {/* --- PHOTO MODAL --- */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 flex flex-col gap-5 animate-fadeIn">
            <div className="border-b border-slate-800/50 pb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Update Profile Picture</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Choose a photo source to update your public avatar</p>
            </div>

            {showCamera ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black flex flex-col items-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
                <div className="absolute bottom-4 flex gap-3 z-10">
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xxs uppercase px-4 py-2 rounded-xl transition-all shadow-glow-blue"
                  >
                    Take Photo
                  </button>
                  <button
                    type="button"
                    onClick={handleStopCamera}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold text-xxs uppercase px-4 py-2 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="flex flex-col items-center gap-2 p-5 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/50 transition-all duration-200 group text-slate-300"
                  >
                    <Camera size={22} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                    <span className="text-xxs font-bold uppercase tracking-wider">Open Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 p-5 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/50 transition-all duration-200 group text-slate-300"
                  >
                    <Upload size={22} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                    <span className="text-xxs font-bold uppercase tracking-wider">Open Files</span>
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />

                {user.avatarUrl && !user.avatarUrl.includes('photo-1535713875002-d1d0cf377fde') && (
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    className="flex items-center justify-center gap-1.5 bg-red-950/20 hover:bg-red-900/30 border border-red-900/30 text-red-400 font-bold text-xxs uppercase py-2.5 rounded-xl transition-all mt-1"
                  >
                    <Trash2 size={12} />
                    Remove Current Photo
                  </button>
                )}
              </div>
            )}

            {!showCamera && (
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-350 font-bold text-xxs uppercase py-2.5 rounded-xl transition-all"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- PASSWORD & OTP SECURITY MODAL --- */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 flex flex-col gap-5 animate-fadeIn">
            
            <div className="flex items-start gap-3 border-b border-slate-800/50 pb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Account Update Verification</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Protecting your credentials with security confirmation checks</p>
              </div>
            </div>

            {verifyStep === 'password' ? (
              <form onSubmit={handleVerifyPasswordSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <KeyRound size={10} />
                    Verify Current Password
                  </label>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    To modify sensitive parameters like email or phone number, please authenticate by entering your current password first.
                  </p>
                  <input
                    type="password"
                    placeholder="Enter account password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-950 border border-slate-800/85 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors mt-2"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 border-t border-slate-800/40 pt-4 mt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue disabled:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
                  >
                    {isSubmitting ? 'Verifying...' : 'Confirm Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVerifyModal(false);
                      setPendingChanges(null);
                    }}
                    className="border border-slate-800 hover:bg-slate-850 text-slate-400 font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Check size={10} />
                    Confirm Verification OTP
                  </label>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    A verification code has been dispatched to {pendingChanges?.email || pendingChanges?.phone}. Please insert it below.
                  </p>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code..."
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value)}
                    maxLength={6}
                    className="bg-slate-950 border border-slate-800/85 rounded-xl px-4 py-2.5 text-center text-xs font-mono tracking-widest outline-none focus:border-blue-500 text-slate-200 transition-colors mt-2"
                    autoFocus
                  />
                  <span className="text-[9px] text-slate-500 mt-1 block">
                    💡 Developer bypass code: <strong className="text-blue-400">123456</strong>
                  </span>
                </div>

                <div className="flex gap-3 border-t border-slate-800/40 pt-4 mt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue disabled:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
                  >
                    {isSubmitting ? 'Confirming...' : 'Verify OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyStep('password')}
                    className="border border-slate-800 hover:bg-slate-850 text-slate-400 font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
export default ProfilePage;
