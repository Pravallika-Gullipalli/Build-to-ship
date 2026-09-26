import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { getAvatarUrl, getDefaultAvatar } from '../utils/avatar';
import Card from '../components/Card';
import { 
  User as UserIcon,
  Mail, 
  Phone, 
  Calendar, 
  Camera, 
  Upload, 
  Trash2, 
  ShieldAlert, 
  KeyRound, 
  Check, 
  Shield, 
  Briefcase, 
  MapPin, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Sparkles,
  Lock,
  Activity,
  FileText,
  CheckCircle2
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { 
    user, 
    updateProfile, 
    verifyPassword, 
    requestEmailChange, 
    requestPhoneChange, 
    verifyEmailChange, 
    verifyPhoneChange,
    resetPassword,
    logout
  } = useAuth();
  const { showToast } = useNotification();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'details' | 'security' | 'activity'>('details');

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [department, setDepartment] = useState('');
  const [assignedRegion, setAssignedRegion] = useState('');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Photo modal states
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoSourceTab, setPhotoSourceTab] = useState<'upload' | 'camera' | 'preset'>('upload');
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Verification modal states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyStep, setVerifyStep] = useState<'password' | 'otp'>('password');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pendingChanges, setPendingChanges] = useState<{
    email?: string;
    phone?: string;
  } | null>(null);

  // Sync inputs with user context on mount or change
  useEffect(() => {
    if (user) {
      setDisplayName(user.name || '');
      setPhoneNumber(user.phone || '');
      setEmailAddress(user.email || '');
      setDepartment(user.department || '');
      setAssignedRegion(user.assignedRegion || '');
      const storedBio = localStorage.getItem(`civicfix_bio_${user.id}`) || '';
      setBio(storedBio);
    }
  }, [user]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // OTP resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!user) return null;

  // -- Photo Capture Methods --
  const handleStartCamera = async () => {
    setPhotoSourceTab('camera');
    setCapturedImagePreview(null);
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera stream access failed:', err);
        showToast('error', 'Camera Error', 'Could not open camera. Please grant camera permission.');
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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImagePreview(dataUrl);
    }
    handleStopCamera();
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'File Too Large', 'Please select an image smaller than 5MB.');
        return;
      }
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
      showToast('success', 'Profile Photo Updated', 'Your profile picture has been updated successfully.');
      setShowPhotoModal(false);
      setCapturedImagePreview(null);
    } catch (err: any) {
      showToast('error', 'Update Failed', err?.message || 'An error occurred while uploading avatar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPreset = (presetAvatar: string) => {
    saveAvatar(presetAvatar);
  };

  const handleDeleteAvatar = async () => {
    try {
      setIsSubmitting(true);
      const cleanDefault = getDefaultAvatar(user.name, user.role);
      await updateProfile({ avatarUrl: cleanDefault });
      showToast('success', 'Profile Photo Reset', 'Avatar has been reset to default.');
      setShowPhotoModal(false);
    } catch {
      showToast('error', 'Removal Failed', 'Unable to reset photo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -- Profile Form Submit Handler --
  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameChanged = displayName !== user.name;
    const phoneChanged = phoneNumber !== (user.phone || '');
    const emailChanged = emailAddress !== user.email;
    const departmentChanged = department !== (user.department || '');
    const regionChanged = assignedRegion !== (user.assignedRegion || '');

    // Save bio locally
    localStorage.setItem(`civicfix_bio_${user.id}`, bio);

    if (!nameChanged && !phoneChanged && !emailChanged && !departmentChanged && !regionChanged) {
      showToast('info', 'Profile Up To Date', 'No changes detected.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. If email or phone changed, trigger security verification modal first
      if (emailChanged || phoneChanged) {
        setPendingChanges({
          email: emailChanged ? emailAddress : undefined,
          phone: phoneChanged ? phoneNumber : undefined
        });
        setPassword('');
        setOtpToken('');
        setVerifyStep('password');
        setShowVerifyModal(true);
        setIsSubmitting(false);
        return;
      }

      // 2. Otherwise update standard profile fields immediately
      await updateProfile({ 
        name: displayName,
        department: department || undefined,
        assignedRegion: assignedRegion || undefined
      });
      showToast('success', 'Profile Saved', 'Your information has been updated successfully.');
    } catch (err: any) {
      showToast('error', 'Update Failed', err?.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -- Password Verification Check --
  const handleVerifyPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      showToast('warning', 'Password Required', 'Please enter your current account password.');
      return;
    }

    setIsSubmitting(true);
    
    // 1. Verify current account password
    try {
      await verifyPassword(password);
    } catch (pwdErr: any) {
      showToast('error', 'Authentication Failed', 'Incorrect password. Please try again.');
      setIsSubmitting(false);
      return;
    }

    // 2. Dispatch OTP to target
    try {
      if (pendingChanges?.email) {
        await requestEmailChange(pendingChanges.email);
        showToast('success', 'Verification Code Sent', `A 6-digit confirmation code was sent to ${pendingChanges.email}.`);
      } else if (pendingChanges?.phone) {
        await requestPhoneChange(pendingChanges.phone);
        showToast('success', 'Verification Code Sent', `A 6-digit confirmation code was sent to ${pendingChanges.phone}.`);
      }
      setResendCooldown(60);
      setVerifyStep('otp');
    } catch (otpErr: any) {
      console.error('OTP dispatch failed:', otpErr);
      showToast('error', 'OTP Error', otpErr.message || 'Failed to dispatch verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -- Resend OTP Handler --
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      if (pendingChanges?.email) {
        await requestEmailChange(pendingChanges.email);
        showToast('success', 'New Code Sent', `A new verification code was sent to ${pendingChanges.email}.`);
      } else if (pendingChanges?.phone) {
        await requestPhoneChange(pendingChanges.phone);
        showToast('success', 'New Code Sent', `A new verification code was sent to ${pendingChanges.phone}.`);
      }
      setResendCooldown(60);
    } catch (err: any) {
      showToast('error', 'Resend Failed', err?.message || 'Could not resend OTP.');
    }
  };

  // -- OTP Token Verification Check --
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken) {
      showToast('warning', 'Code Required', 'Please enter the 6-digit confirmation code.');
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
        showToast('success', 'Phone Updated', `Your phone was successfully changed to ${pendingChanges.phone}.`);
      }

      // Update name & other fields if changed concurrently
      if (displayName !== user.name || department !== (user.department || '') || assignedRegion !== (user.assignedRegion || '')) {
        await updateProfile({ 
          name: displayName,
          department: department || undefined,
          assignedRegion: assignedRegion || undefined
        });
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
      showToast('warning', 'Fields Required', 'Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      showToast('warning', 'Weak Password', 'New password must be at least 6 characters long.');
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

      showToast('success', 'Password Changed', 'Your account password has been updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast('error', 'Password Update Failed', err.message || 'Incorrect current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: 'None', color: 'bg-slate-700' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 4) return { level: 2, label: 'Medium', color: 'bg-amber-500' };
    return { level: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const roleBadgeStyles = {
    citizen: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    officer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    admin: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
  }[user.role] || 'bg-blue-500/10 text-blue-400 border-blue-500/30';

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
      
      {/* --- HERO PROFILE HEADER BANNER --- */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl">
        {/* Ambient Top Decorative Banner */}
        <div className="h-36 sm:h-44 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent)]" />
          <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border backdrop-blur-md shadow-sm ${roleBadgeStyles} bg-slate-950/60`}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse" />
              {user.role} Portal
            </span>
          </div>
        </div>

        {/* Profile Card Bottom Details */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-5 -mt-16 sm:-mt-20">
          
          {/* Avatar with Camera Trigger */}
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative group">
              <div 
                onClick={() => setShowPhotoModal(true)}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1.5 bg-white dark:bg-slate-950 border-4 border-white dark:border-slate-900 shadow-2xl overflow-hidden cursor-pointer transition-transform duration-200 group-hover:scale-[1.02]"
              >
                <img
                  src={getAvatarUrl(user)}
                  alt={user.name}
                  className="w-full h-full rounded-2xl object-cover"
                />
                <div className="absolute inset-1.5 rounded-2xl bg-slate-950/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white">
                  <Camera size={22} className="text-blue-400 mb-1" />
                  <span className="text-[10px] font-bold tracking-wider uppercase">Change Photo</span>
                </div>
              </div>

              {/* Shutter quick badge */}
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                aria-label="Upload photo"
                className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg border-2 border-white dark:border-slate-900 transition-all hover:scale-110"
              >
                <Camera size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {user.name}
                </h1>
                <CheckCircle2 size={18} className="text-blue-500 shrink-0" />
              </div>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail size={13} className="text-slate-400" />
                  {user.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone size={13} className="text-slate-400" />
                  {user.phone || 'No phone attached'}
                </span>
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex-wrap">
                {user.department && (
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700/50">
                    <Briefcase size={12} className="text-blue-400" />
                    {user.department}
                  </span>
                )}
                {user.assignedRegion && (
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700/50">
                    <MapPin size={12} className="text-emerald-400" />
                    {user.assignedRegion}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-slate-400" />
                  Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowPhotoModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-sm"
            >
              <Camera size={14} />
              Update Photo
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all shadow-sm"
            >
              Sign Out
            </button>
          </div>

        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex border-t border-slate-200/80 dark:border-slate-800/80 px-6 sm:px-8 bg-slate-50/50 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-all duration-150
              ${activeTab === 'details'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
          >
            <UserIcon size={14} />
            Personal Details
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-all duration-150
              ${activeTab === 'security'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
          >
            <Shield size={14} />
            Security & Password
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-all duration-150
              ${activeTab === 'activity'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
          >
            <Activity size={14} />
            Civic Overview
          </button>
        </div>
      </div>

      {/* --- TAB CONTENT AREA --- */}

      {/* TAB 1: PERSONAL DETAILS */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Main Edit Form */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card hoverable={false} className="border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 p-6 sm:p-8 backdrop-blur-xl shadow-lg">
              <div className="border-b border-slate-200 dark:border-slate-800/60 pb-4 mb-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserIcon size={18} className="text-blue-500" />
                  Edit Profile Parameters
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update your display credentials and contact channels for civic dispatch updates.
                </p>
              </div>

              <form onSubmit={handleSubmitProfile} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <UserIcon size={13} className="text-slate-400" />
                      Full Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-colors shadow-sm"
                      required
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-colors shadow-sm"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Mail size={13} className="text-slate-400" />
                      Email Address
                    </span>
                    <span className="text-[10px] text-blue-500 dark:text-blue-400 font-semibold normal-case">
                      Verified Channel (OTP protected)
                    </span>
                  </label>
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="user@example.com"
                    className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-colors shadow-sm"
                    required
                  />
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                    Changing your email address will prompt a quick security password and OTP confirmation code.
                  </p>
                </div>

                {/* Role Specific Fields (Department & Ward) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase size={13} className="text-slate-400" />
                      Municipal Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder={user.role === 'officer' ? 'e.g. Public Works / Water' : 'General Public / Civic Sector'}
                      className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-colors shadow-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400" />
                      Assigned Region / Ward
                    </label>
                    <input
                      type="text"
                      value={assignedRegion}
                      onChange={(e) => setAssignedRegion(e.target.value)}
                      placeholder="e.g. Ward 12 / Downtown Sector"
                      className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-colors shadow-sm"
                    />
                  </div>
                </div>

                {/* Bio / Civic Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={13} className="text-slate-400" />
                    Civic Bio & Notes
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Add brief details about your neighborhood or municipal responsibilities..."
                    className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-colors shadow-sm resize-none"
                  />
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800/60 pt-5 mt-2">
                  <span className="text-[11px] text-slate-500">
                    Profiles are automatically synced with the civic database.
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue disabled:bg-slate-700 text-white font-bold text-xs py-3 px-8 rounded-xl transition-all flex items-center gap-2 shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </Card>
          </div>

          {/* Right Info Column */}
          <div className="flex flex-col gap-6">
            
            {/* Identity Badge Card */}
            <Card hoverable={false} className="border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 p-6 backdrop-blur-xl shadow-lg flex flex-col gap-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800/60 pb-3 flex items-center gap-2">
                <Shield size={16} className="text-blue-500" />
                Municipal Identity
              </h4>

              <div className="flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-500">Account ID:</span>
                  <span className="font-mono text-[10px] text-slate-800 dark:text-slate-300 truncate max-w-[140px]">{user.id}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-500">System Role:</span>
                  <span className="font-bold uppercase text-[10px] text-blue-500">{user.role}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-500">Verification Status:</span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-500 text-[11px]">
                    <CheckCircle2 size={13} /> Active & Verified
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Database Record:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">Synchronized</span>
                </div>
              </div>
            </Card>

            {/* Quick Tips */}
            <Card hoverable={false} className="border-blue-500/20 bg-blue-500/5 p-6 backdrop-blur-xl flex flex-col gap-3">
              <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Sparkles size={16} />
                Profile Best Practices
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Keeping your phone number and email current ensures you receive instantaneous GPS assignment updates and real-time status changes for complaints filed in your area.
              </p>
            </Card>

          </div>
        </div>
      )}

      {/* TAB 2: SECURITY & PASSWORD */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Change Password Form */}
          <div className="lg:col-span-2">
            <Card hoverable={false} className="border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 p-6 sm:p-8 backdrop-blur-xl shadow-lg">
              <div className="border-b border-slate-200 dark:border-slate-800/60 pb-4 mb-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock size={18} className="text-blue-500" />
                  Change Account Password
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ensure your account credentials remain secure with regular password updates.
                </p>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="flex flex-col gap-5">
                
                {/* Current Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound size={13} className="text-slate-400" />
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password..."
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 pr-11 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-colors shadow-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  {/* New Password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters..."
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 pr-11 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-colors shadow-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {newPassword && (
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Strength:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{passwordStrength.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`} 
                            style={{ width: `${(passwordStrength.level / 3) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password..."
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 pr-11 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-colors shadow-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {confirmPassword && newPassword !== confirmPassword && (
                      <span className="text-[10px] text-rose-500 font-semibold mt-1">
                        Passwords do not match
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end border-t border-slate-200 dark:border-slate-800/60 pt-5 mt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                    className="bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue disabled:bg-slate-700 text-white font-bold text-xs py-3 px-8 rounded-xl transition-all flex items-center gap-2 shadow-lg"
                  >
                    {isChangingPassword ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={15} />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </Card>
          </div>

          {/* Security Information Panel */}
          <div className="flex flex-col gap-6">
            <Card hoverable={false} className="border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 p-6 backdrop-blur-xl shadow-lg flex flex-col gap-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800/60 pb-3 flex items-center gap-2">
                <ShieldAlert size={16} className="text-amber-500" />
                Security Standards
              </h4>

              <div className="flex flex-col gap-3.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">OTP Dual-Verification</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Sensitive parameter modifications require instant OTP token verification.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                    <KeyRound size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Encrypted Auth Tokens</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Sessions are signed with JWT verification tokens.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

        </div>
      )}

      {/* TAB 3: CIVIC OVERVIEW */}
      {activeTab === 'activity' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-fadeIn">
          
          <Card hoverable={false} className="border-blue-500/30 bg-blue-500/5 p-6 backdrop-blur-xl flex flex-col gap-2">
            <span className="text-[11px] uppercase font-bold text-blue-500 tracking-wider">Reports Logged</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">Active</span>
            <span className="text-[11px] text-slate-500">Synchronized with city database</span>
          </Card>

          <Card hoverable={false} className="border-emerald-500/30 bg-emerald-500/5 p-6 backdrop-blur-xl flex flex-col gap-2">
            <span className="text-[11px] uppercase font-bold text-emerald-500 tracking-wider">Resolution Status</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">98.4%</span>
            <span className="text-[11px] text-slate-500">City-wide response benchmark</span>
          </Card>

          <Card hoverable={false} className="border-purple-500/30 bg-purple-500/5 p-6 backdrop-blur-xl flex flex-col gap-2">
            <span className="text-[11px] uppercase font-bold text-purple-500 tracking-wider">Portal Access</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{user.role.toUpperCase()}</span>
            <span className="text-[11px] text-slate-500">Permission scope enabled</span>
          </Card>

          <Card hoverable={false} className="border-amber-500/30 bg-amber-500/5 p-6 backdrop-blur-xl flex flex-col gap-2">
            <span className="text-[11px] uppercase font-bold text-amber-500 tracking-wider">Security Tier</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">Level 2</span>
            <span className="text-[11px] text-slate-500">OTP token auth enabled</span>
          </Card>

        </div>
      )}

      {/* --- PHOTO MODAL --- */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 flex flex-col gap-6">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Camera size={18} className="text-blue-500" />
                  Update Profile Picture
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Upload, snap a camera photo, or choose a clean default avatar</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleStopCamera();
                  setShowPhotoModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Photo Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  handleStopCamera();
                  setPhotoSourceTab('upload');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${photoSourceTab === 'upload' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhotoSourceTab('camera');
                  handleStartCamera();
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${photoSourceTab === 'camera' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                Take Camera Photo
              </button>
              <button
                type="button"
                onClick={() => {
                  handleStopCamera();
                  setPhotoSourceTab('preset');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${photoSourceTab === 'preset' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                Default Avatars
              </button>
            </div>

            {/* Tab 1: Upload */}
            {photoSourceTab === 'upload' && (
              <div className="flex flex-col gap-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Click to browse or drag & drop image</p>
                    <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, WEBP or GIF up to 5MB</p>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {/* Tab 2: Live Camera */}
            {photoSourceTab === 'camera' && (
              <div className="flex flex-col gap-4">
                {capturedImagePreview ? (
                  <div className="flex flex-col items-center gap-4">
                    <img src={capturedImagePreview} alt="Captured" className="w-48 h-48 rounded-2xl object-cover border-2 border-blue-500 shadow-xl" />
                    <div className="flex gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => saveAvatar(capturedImagePreview)}
                        disabled={isSubmitting}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-glow-blue"
                      >
                        {isSubmitting ? 'Saving...' : 'Use This Photo'}
                      </button>
                      <button
                        type="button"
                        onClick={handleStartCamera}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Retake
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-black flex flex-col items-center">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
                    <div className="absolute bottom-4 flex gap-3 z-10">
                      <button
                        type="button"
                        onClick={handleCapturePhoto}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-glow-blue flex items-center gap-2"
                      >
                        <Camera size={16} />
                        Snap Photo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Presets & Reset */}
            {photoSourceTab === 'preset' && (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-slate-500">Select a clean vector default avatar based on your profile initials:</p>
                <div className="grid grid-cols-3 gap-3">
                  {(['citizen', 'officer', 'admin'] as const).map(roleOption => {
                    const presetUrl = getDefaultAvatar(user.name, roleOption);
                    return (
                      <button
                        key={roleOption}
                        type="button"
                        onClick={() => handleSelectPreset(presetUrl)}
                        className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-slate-50 dark:bg-slate-950/50 transition-all hover:scale-105"
                      >
                        <img src={presetUrl} alt={roleOption} className="w-16 h-16 rounded-xl" />
                        <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">{roleOption} Theme</span>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold transition-all"
                  >
                    <Trash2 size={14} />
                    Reset to Default SVG Avatar
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* --- PASSWORD & OTP SECURITY MODAL --- */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 flex flex-col gap-5">
            
            <div className="flex items-start gap-3 border-b border-slate-200 dark:border-slate-800/60 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Security Verification</h3>
                <p className="text-xs text-slate-500 mt-0.5">Authorize profile modification with two-factor security checks</p>
              </div>
            </div>

            {verifyStep === 'password' ? (
              <form onSubmit={handleVerifyPasswordSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <KeyRound size={12} />
                    Verify Current Password
                  </label>
                  <p className="text-xs text-slate-500 leading-normal">
                    To modify sensitive parameters like email or phone number, please enter your current password to continue.
                  </p>
                  <input
                    type="password"
                    placeholder="Enter account password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-colors mt-2"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex gap-3 border-t border-slate-200 dark:border-slate-800/60 pt-4 mt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue disabled:bg-slate-700 text-white font-bold text-xs py-3 rounded-xl transition-all"
                  >
                    {isSubmitting ? 'Verifying Password...' : 'Next: Send OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVerifyModal(false);
                      setPendingChanges(null);
                    }}
                    className="border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs px-5 py-3 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Check size={14} className="text-emerald-500" />
                    Enter 6-Digit Verification Code
                  </label>
                  <p className="text-xs text-slate-500 leading-normal">
                    A confirmation code was dispatched to <strong className="text-blue-500">{pendingChanges?.email || pendingChanges?.phone}</strong>.
                  </p>

                  <input
                    type="text"
                    placeholder="123456"
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-center text-base font-mono tracking-widest outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-colors mt-2 font-bold"
                    autoFocus
                    required
                  />

                  <div className="flex items-center justify-between text-xs mt-2">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0}
                      className="text-blue-500 hover:underline font-bold disabled:text-slate-400 flex items-center gap-1"
                    >
                      <RefreshCw size={12} className={resendCooldown > 0 ? '' : 'animate-spin-slow'} />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-slate-200 dark:border-slate-800/60 pt-4 mt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting || otpToken.length !== 6}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue disabled:bg-slate-700 text-white font-bold text-xs py-3 rounded-xl transition-all"
                  >
                    {isSubmitting ? 'Confirming...' : 'Verify & Apply Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyStep('password')}
                    className="border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs px-5 py-3 rounded-xl transition-all"
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
