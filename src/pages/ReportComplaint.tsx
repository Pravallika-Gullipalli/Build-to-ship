import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { aiService } from '../services/aiService';
import { complaintService } from '../services/complaintService';
import { mapService } from '../services/mapService';
import type { AIDetectionResult } from '../types/ai';
import Card from '../components/Card';
import Badge from '../components/Badge';
import MapComponent from '../components/MapComponent';
import { 
  Camera, 
  MapPin, 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  FileText,
  Trash2
} from 'lucide-react';

const reportSchema = zod.object({
  title: zod.string().min(5, 'Title must be at least 5 characters'),
  description: zod.string().min(10, 'Please provide at least 10 characters describing the issue')
});

type ReportFormValues = zod.infer<typeof reportSchema>;

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
    problems: ['Damaged Parks', 'Broken Benches', 'Damaged Government Buildings', 'Playground Maintenance', 'Broken Public Facilities']
  },
  {
    name: 'Flooding & Disaster Risks',
    icon: '🌧️',
    problems: ['Flooded Roads', 'Blocked Storm Drains', 'Landslide Risk', 'Fire Hazards']
  },
  {
    name: 'Public Safety',
    icon: '🚨',
    problems: ['Unsafe Construction Sites', 'Building Collapse Risk', 'Dangerous Open Pits', 'Damaged Safety Barriers']
  },
  {
    name: 'Public Transport',
    icon: '🚌',
    problems: ['Damaged Bus Shelters', 'Poor Bus Stop Facilities', 'Railway Crossing Issues']
  },
  {
    name: 'Public Utilities',
    icon: '🌐',
    problems: ['Damaged Internet/Fiber Cables', 'Public Wi-Fi Issues', 'Utility Pole Damage']
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  
  // AI analysis state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIDetectionResult | null>(null);
  
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
    control,
    formState: { errors }
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema)
  });

  const descriptionValue = useWatch({ control, name: 'description' });

  // Trigger GPS retrieval
  const handleGpsRequest = async () => {
    try {
      const location = await getCoordinates();
      setCoords({ lat: location.lat, lng: location.lng });
      const streetAddress = await mapService.reverseGeocode(location.lat, location.lng);
      setAddress(streetAddress);
      showToast('success', 'GPS Synced', 'Location coordinates successfully attached.');
    } catch {
      showToast('error', 'Location Error', 'Unable to fetch precise location.');
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
      // Wait for React to render the <video> element
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
          console.error('Camera permission denied or error:', err);
          showToast('error', 'Camera Error', 'Could not access device camera. Please grant permissions.');
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
      showToast('success', 'Photo Captured', 'Image successfully snapped and attached.');
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
    setSelectedProblem(null);
    setValue('title', ''); // Reset title until problem is chosen

    if (categoryName === 'Other Public Issues') {
      setSelectedProblem('Other Public Problem');
      setValue('title', 'Other Public Problem');
      
      // Focus description textbox & open camera capture
      setTimeout(() => {
        const descArea = document.getElementById('description-textarea');
        if (descArea) descArea.focus();
        
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }, 150);
    }
  };

  const handleProblemSelect = (problem: string) => {
    setSelectedProblem(problem);
    setValue('title', problem);

    if (problem === 'Other Public Problem' || selectedCategory === 'Other Public Issues') {
      // Focus description textbox & open camera capture
      setTimeout(() => {
        const descArea = document.getElementById('description-textarea');
        if (descArea) descArea.focus();
        
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }, 150);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        showToast('success', 'Photo Attached', 'Image successfully loaded into context.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Run AI analysis
  const triggerAIAnalysis = async () => {
    if (!descriptionValue || descriptionValue.length < 10) {
      showToast('warning', 'More Details Required', 'Please enter a description before running AI analysis.');
      return;
    }

    setAiLoading(true);
    setAiResult(null);

    try {
      const result = await aiService.detectIssue(descriptionValue, selectedImage || undefined);
      setAiResult(result);
      showToast('success', 'AI Analysis Complete', 'Category, priority, and resolution targets calculated.');
    } catch {
      showToast('error', 'AI Model Error', 'Automated analysis failed.');
    } finally {
      setAiLoading(false);
    }
  };

  // Submit Handler
  const onSubmit = async (values: ReportFormValues) => {
    if (!coords) {
      showToast('error', 'Location Missing', 'Please attach GPS coordinates before submitting.');
      return;
    }

    // Run AI analysis if not done yet
    let activeAi = aiResult;
    if (!activeAi) {
      setAiLoading(true);
      try {
        activeAi = await aiService.detectIssue(values.description, selectedImage || undefined);
        setAiResult(activeAi);
      } catch {
        showToast('error', 'Analysis Failure', 'AI analysis failed.');
        setAiLoading(false);
        return;
      }
      setAiLoading(false);
    }

    setIsSubmitting(true);

    try {
      await complaintService.createComplaint({
        title: values.title,
        description: values.description,
        category: selectedCategory || activeAi.category,
        priority: activeAi.priority,
        status: 'submitted',
        imageUrl: selectedImage || undefined,
        location: {
          lat: coords.lat,
          lng: coords.lng,
          address: address || 'Reported Location'
        },
        reporterId: user?.id || 'citizen-id',
        reporterName: user?.name || 'Anonymous Citizen',
        reportsCount: activeAi.duplicateWarning ? activeAi.duplicateCount! + 1 : 1
      });

      showToast('success', 'Complaint Filed', 'Your issue has been reported and logged.');
      navigate('/citizen/dashboard');
    } catch {
      showToast('error', 'Filing Failed', 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-slate-800/40 pb-2">
        <h2 className="text-xl font-bold text-white">Report An Infrastructure Issue</h2>
        <p className="text-xs text-slate-400">File a new ticket with automatic AI categorization and duplicate checks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Input Form */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              
              {/* Category Selection Grid */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-slate-400">Select Public Issue Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {issueCategories.map(cat => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => handleCategorySelect(cat.name)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all duration-200
                        ${selectedCategory === cat.name
                          ? 'bg-blue-600 border-blue-500 text-white shadow-glow-blue'
                          : 'border-slate-850 bg-slate-900/40 text-slate-300 hover:border-slate-700'
                        }`}
                    >
                      <span className="text-base shrink-0">{cat.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-problem selection */}
              {selectedCategory && (
                <div className="flex flex-col gap-2 animate-fadeIn">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Select Specific Sub-Problem</label>
                  <div className="flex flex-wrap gap-2">
                    {issueCategories.find(c => c.name === selectedCategory)?.problems.map(prob => (
                      <button
                        key={prob}
                        type="button"
                        onClick={() => handleProblemSelect(prob)}
                        className={`py-1.5 px-3 rounded-lg border text-xxs font-bold uppercase transition-all duration-200
                          ${selectedProblem === prob
                            ? 'bg-blue-600 border-blue-500 text-white shadow-glow-blue'
                            : 'border-slate-800 bg-slate-900/20 text-slate-400 hover:border-slate-700'
                          }`}
                      >
                        {prob}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Attach Graphic Context */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-slate-400">Attach Photo (Real Camera / File upload)</label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
                {selectedImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 h-48 bg-slate-950">
                    <img src={selectedImage} alt="Preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-2 right-2 bg-red-600/85 hover:bg-red-600 text-white rounded-lg p-1.5 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : showCamera ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black flex flex-col items-center">
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
                        className="bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue text-white font-bold text-xxs uppercase px-4 py-2 rounded-xl transition-all"
                      >
                        Capture Photo
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xxs uppercase px-4 py-2 rounded-xl transition-all"
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
                      className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-dashed border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/35 transition-all duration-300 group"
                    >
                      <Camera size={22} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                      <div className="text-center">
                        <span className="text-xxs font-bold text-slate-300 uppercase tracking-wider block">Open Live Camera</span>
                        <span className="text-[9px] text-slate-500 mt-1 block">Snap a photo in real time</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-dashed border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/35 transition-all duration-300 group"
                    >
                      <FileText size={22} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                      <div className="text-center">
                        <span className="text-xxs font-bold text-slate-300 uppercase tracking-wider block">Upload Image File</span>
                        <span className="text-[9px] text-slate-500 mt-1 block">Select from device library</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Title & Description inputs */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Issue Title (Auto-set by selection)</label>
                <input
                  {...register('title')}
                  placeholder="Select a category and problem above..."
                  type="text"
                  className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
                />
                {errors.title && <span className="text-[10px] text-rose-400">{errors.title.message}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Detailed description</label>
                <textarea
                  {...register('description')}
                  id="description-textarea"
                  placeholder="Provide precise details of the issue. The AI model checks for categories and duplicate markers to assign priority SLAs."
                  rows={4}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors resize-none"
                />
                {errors.description && <span className="text-[10px] text-rose-400">{errors.description.message}</span>}
              </div>

              {/* GPS coordinates trigger */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-slate-400">Location GPS Tag</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleGpsRequest}
                    disabled={gpsLoading}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xxs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <MapPin size={14} className={gpsLoading ? 'animate-bounce text-blue-400' : 'text-blue-400'} />
                    {gpsLoading ? 'Locating...' : 'Allow GPS Location'}
                  </button>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Allow GPS tracking or click map to select location..."
                    className="flex-1 bg-slate-950 border border-slate-800/80 rounded-xl px-4 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
                  />
                </div>
                {gpsError && <span className="text-[10px] text-amber-400">{gpsError}</span>}
              </div>

              {/* Run AI Analysis Action */}
              <button
                type="button"
                onClick={triggerAIAnalysis}
                disabled={aiLoading}
                className="bg-violet-900/30 hover:bg-violet-900/50 border border-violet-500/30 text-violet-300 font-bold text-xxs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles size={14} className={aiLoading ? 'animate-spin' : ''} />
                Run AI Scan Verification
              </button>

              {/* Submit Buttons */}
              <div className="flex gap-4 border-t border-slate-800/40 pt-4 mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue disabled:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? 'Filing Issue...' : 'Submit Complaint'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/citizen/dashboard')}
                  className="border border-slate-800 hover:bg-slate-900 text-slate-400 font-bold text-xs px-6 py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>

            </form>
          </Card>
        </div>

        {/* Right: AI Feedback Side Panel */}
        <div className="flex flex-col gap-6">
          <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 flex flex-col gap-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white border-b border-slate-800/60 pb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-violet-400" />
              Automated AI Predictor
            </h3>

            {aiLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Classifying issue models...</p>
              </div>
            ) : aiResult ? (
              <div className="flex flex-col gap-4 text-xs">
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Detected Category:</span>
                  <span className="font-bold text-white bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
                    {aiResult.category}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Confidence Rating:</span>
                  <span className="font-bold text-white">
                    {(aiResult.confidence * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Estimated Priority:</span>
                  <Badge type="priority" value={aiResult.priority} />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Resolution Target SLA:</span>
                  <span className="font-bold text-slate-200 flex items-center gap-1">
                    <Clock size={12} className="text-blue-400" />
                    {aiResult.estimatedResolutionTime}
                  </span>
                </div>

                {/* Duplicate alert block */}
                {aiResult.duplicateWarning && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl flex gap-2 leading-relaxed">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xxs uppercase tracking-wider">Duplicate Warning</p>
                      <p className="text-xxs text-amber-300/90 mt-0.5">
                        We detected {aiResult.duplicateCount} similar issue reports within 150m. We will increment the reports count for this marker to avoid cluttering local queues.
                      </p>
                    </div>
                  </div>
                )}
                
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-xxs flex flex-col items-center gap-2">
                <FileText size={24} className="text-slate-700" />
                <p>Attach coordinate coordinates and details to display AI evaluation predictions.</p>
              </div>
            )}
          </Card>

          {/* Leaflet map display */}
          <div className="h-60">
            <MapComponent
              complaints={[]}
              interactive={true}
              center={coords ? [coords.lat, coords.lng] : undefined}
              selectedLatLng={coords ? [coords.lat, coords.lng] : null}
              onMapClick={async (lat, lng) => {
                setCoords({ lat, lng });
                const streetAddress = await mapService.reverseGeocode(lat, lng);
                setAddress(streetAddress);
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
export default ReportComplaint;
