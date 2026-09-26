import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { complaintService } from '../services/complaintService';
import { mapService } from '../services/mapService';
import Card from '../components/Card';
import { 
  Camera, 
  MapPin, 
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const reportSchema = zod.object({
  title: zod.string().min(3, 'Title must be at least 3 characters'),
  description: zod.string().min(5, 'Please provide at least 5 characters describing the issue'),
  priority: zod.enum(['low', 'medium', 'high', 'critical']),
  category: zod.string().optional(),
  address: zod.string().optional()
});

type ReportFormValues = {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  address?: string;
};

interface IssueCategory {
  name: string;
  icon: string;
  problems: string[];
}

const issueCategories: IssueCategory[] = [
  {
    name: 'Roads & Streets',
    icon: '🛣️',
    problems: ['Potholes', 'Damaged Roads', 'Broken Footpaths', 'Missing Road Signs', 'Open Manholes']
  },
  {
    name: 'Traffic & Transportation',
    icon: '🚦',
    problems: ['Traffic Signal Malfunction', 'Illegal Parking', 'Traffic Congestion', 'Damaged Bus Stops', 'Unsafe Crosswalks']
  },
  {
    name: 'Electricity',
    icon: '💡',
    problems: ['Street Lights Not Working', 'Fallen Electric Poles', 'Exposed Electrical Wires', 'Transformer Problems']
  },
  {
    name: 'Water Supply',
    icon: '🚰',
    problems: ['Water Pipeline Leakage', 'No Public Water Supply', 'Water Contamination', 'Waterlogging']
  },
  {
    name: 'Sanitation & Waste',
    icon: '🚽',
    problems: ['Garbage Overflow', 'Illegal Dumping', 'Sewage Overflow', 'Blocked Drains', 'Public Toilet Maintenance']
  },
  {
    name: 'Environment',
    icon: '🌳',
    problems: ['Fallen Trees', 'Illegal Tree Cutting', 'Air Pollution', 'Water Pollution', 'Noise Pollution']
  },
  {
    name: 'Public Health & Safety',
    icon: '🏥',
    problems: ['Mosquito Breeding Areas', 'Dead Animal on Road', 'Stray Animal Nuisance', 'Unsafe Public Spaces']
  },
  {
    name: 'Public Infrastructure',
    icon: '🏛️',
    problems: ['Damaged Parks', 'Broken Benches', 'Damaged Government Buildings', 'Playground Maintenance']
  },
  {
    name: 'Flooding & Disaster Risks',
    icon: '🌧️',
    problems: ['Flooded Roads', 'Blocked Storm Drains', 'Landslide Risk', 'Fire Hazards']
  },
  {
    name: 'Public Safety',
    icon: '🚨',
    problems: ['Unsafe Construction Sites', 'Building Collapse Risk', 'Dangerous Open Pits']
  },
  {
    name: 'Public Transport',
    icon: '🚌',
    problems: ['Damaged Bus Shelters', 'Poor Bus Stop Facilities', 'Railway Crossing Issues']
  },
  {
    name: 'Other Public Issues',
    icon: '❓',
    problems: ['Community Concern', 'Civic Suggestion', 'Other Public Problem']
  }
];

export const ReportComplaint: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const { loading: gpsLoading, error: gpsError, getCoordinates } = useGeolocation();

  // Component state
  const [selectedCategory, setSelectedCategory] = useState<string>('Roads & Streets');
  const [selectedProblem, setSelectedProblem] = useState<string | null>('Potholes');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 16.4793, lng: 80.6619 });
  const [address, setAddress] = useState<string>('Civic Center Area');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Camera states
  const [showCamera, setShowCamera] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: 'Potholes on Road',
      description: '',
      priority: 'medium',
      category: 'Roads & Streets',
      address: 'Civic Center Area'
    }
  });

  // Trigger GPS retrieval
  const handleGpsRequest = async () => {
    try {
      const location = await getCoordinates();
      setCoords({ lat: location.lat, lng: location.lng });
      const streetAddress = await mapService.reverseGeocode(location.lat, location.lng);
      setAddress(streetAddress);
      setValue('address', streetAddress);
      showToast('success', 'GPS Synced', 'Location coordinates attached successfully.');
    } catch {
      showToast('info', 'Location Set', 'Using default coordinates. You can type your exact street address.');
    }
  };

  // Auto-request location on mount & clean up stream
  React.useEffect(() => {
    handleGpsRequest();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      setShowCamera(true);
      setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error('Camera permission denied:', err);
          showToast('error', 'Camera Error', 'Could not access device camera.');
          setShowCamera(false);
        }
      }, 100);
    } catch {
      showToast('error', 'Camera Error', 'Camera is not supported on this device.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setSelectedImage(dataUrl);
      showToast('success', 'Photo Captured', 'Image attached successfully.');
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    const cat = issueCategories.find(c => c.name === categoryName);
    const defaultProb = cat?.problems[0] || categoryName;
    setSelectedProblem(defaultProb);
    setValue('title', defaultProb);
    setValue('category', categoryName);
  };

  const handleProblemSelect = (problem: string) => {
    setSelectedProblem(problem);
    setValue('title', problem);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        showToast('success', 'Photo Attached', 'Image loaded successfully.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Handler
  const onSubmit = async (values: ReportFormValues) => {
    setIsSubmitting(true);

    try {
      await complaintService.createComplaint({
        title: values.title.trim(),
        description: values.description.trim(),
        category: selectedCategory || values.category || 'Roads & Streets',
        priority: selectedPriority || values.priority || 'medium',
        status: 'submitted',
        imageUrl: selectedImage || undefined,
        location: {
          lat: coords.lat,
          lng: coords.lng,
          address: address.trim() || values.address?.trim() || 'Reported Civic Location'
        },
        reporterId: user?.id || '',
        reporterName: user?.name || 'Citizen',
        reportsCount: 1
      });

      showToast('success', 'Complaint Filed Successfully', 'Your complaint has been submitted and saved.');
      navigate('/citizen/dashboard');
    } catch (err: any) {
      console.error('Submission error:', err);
      const msg = err?.message || 'An error occurred during submission. Please try again.';
      showToast('error', 'Filing Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 pb-12">
      
      {/* Header */}
      <div className="border-b border-slate-800/40 pb-3">
        <h2 className="text-2xl font-extrabold text-white">Report An Issue</h2>
        <p className="text-xs text-slate-400 mt-1">Submit your infrastructure complaint directly to municipal authorities</p>
      </div>

      {/* Main Complaint Form Card */}
      <Card hoverable={false} className="border-slate-800/80 bg-slate-900/50 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          
          {/* 1. Category Selection */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>1. Select Issue Category</span>
              <span className="text-blue-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {issueCategories.map(cat => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleCategorySelect(cat.name)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all duration-200
                    ${selectedCategory === cat.name
                      ? 'bg-blue-600 border-blue-500 text-white shadow-glow-blue'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                >
                  <span className="text-lg shrink-0">{cat.icon}</span>
                  <span className="text-xxs font-bold uppercase tracking-wider truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Quick Problem Presets */}
          {selectedCategory && (
            <div className="flex flex-col gap-2 animate-fadeIn">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Common Problems in {selectedCategory}
              </label>
              <div className="flex flex-wrap gap-2">
                {issueCategories.find(c => c.name === selectedCategory)?.problems.map(prob => (
                  <button
                    key={prob}
                    type="button"
                    onClick={() => handleProblemSelect(prob)}
                    className={`py-2 px-3.5 rounded-lg border text-xs font-semibold transition-all duration-200
                      ${selectedProblem === prob
                        ? 'bg-blue-600 border-blue-500 text-white shadow-glow-blue'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                  >
                    {prob}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Issue Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>2. Issue Title</span>
              <span className="text-blue-400">*</span>
            </label>
            <input
              {...register('title')}
              placeholder="e.g. Deep pothole on Main Street near junction..."
              type="text"
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-slate-100 font-medium transition-colors"
            />
            {errors.title && (
              <span className="text-xs text-rose-400 flex items-center gap-1 mt-0.5">
                <AlertCircle size={12} /> {errors.title.message}
              </span>
            )}
          </div>

          {/* 4. Priority Level */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              3. Urgency / Priority Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { level: 'low', label: 'Low', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
                { level: 'medium', label: 'Medium', color: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10' },
                { level: 'high', label: 'High', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
                { level: 'critical', label: 'Critical', color: 'border-rose-500/40 text-rose-400 bg-rose-500/10' }
              ].map(p => (
                <button
                  key={p.level}
                  type="button"
                  onClick={() => {
                    setSelectedPriority(p.level as any);
                    setValue('priority', p.level as any);
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold uppercase transition-all duration-200 text-center
                    ${selectedPriority === p.level
                      ? `${p.color} ring-2 ring-offset-2 ring-offset-slate-950 ring-blue-500`
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Detailed Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>4. Detailed Description</span>
              <span className="text-blue-400">*</span>
            </label>
            <textarea
              {...register('description')}
              id="description-textarea"
              placeholder="Describe what is wrong, exact location landmarks, and any safety hazards..."
              rows={4}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-slate-100 font-medium transition-colors resize-none leading-relaxed"
            />
            {errors.description && (
              <span className="text-xs text-rose-400 flex items-center gap-1 mt-0.5">
                <AlertCircle size={12} /> {errors.description.message}
              </span>
            )}
          </div>

          {/* 6. Location Input & GPS */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>5. Location / Street Address</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleGpsRequest}
                disabled={gpsLoading}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 border border-slate-700"
              >
                <MapPin size={16} className={gpsLoading ? 'animate-bounce text-blue-400' : 'text-blue-400'} />
                {gpsLoading ? 'Locating...' : 'Get Current GPS'}
              </button>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setValue('address', e.target.value);
                }}
                placeholder="Enter street name, landmark, or area..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-slate-100 font-medium transition-colors"
              />
            </div>
            {gpsError && <span className="text-xs text-amber-400">{gpsError}</span>}
          </div>

          {/* 7. Attach Photo */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              6. Attach Photo (Optional)
            </label>
            
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />

            {selectedImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 h-56 bg-slate-950">
                <img src={selectedImage} alt="Complaint Preview" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-3 right-3 bg-red-600 hover:bg-red-500 text-white rounded-xl p-2 transition-colors shadow-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : showCamera ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black flex flex-col items-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-64 object-cover"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-10">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg"
                  >
                    Snap Photo
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex items-center justify-center gap-3 p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 hover:border-slate-700 transition-all duration-200 group"
                >
                  <Camera size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Take Live Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-3 p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 hover:border-slate-700 transition-all duration-200 group"
                >
                  <FileText size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Upload From Gallery</span>
                </button>
              </div>
            )}
          </div>

          {/* Submit Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 border-t border-slate-800/80 pt-6 mt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue disabled:bg-slate-800 text-white font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Submit Complaint</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/citizen/dashboard')}
              className="border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>

        </form>
      </Card>
    </div>
  );
};

export default ReportComplaint;
