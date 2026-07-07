import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { aiService } from '../services/aiService';
import { complaintService } from '../services/complaintService';
import type { AIDetectionResult } from '../types/ai';
import Card from '../components/Card';
import Badge from '../components/Badge';
import MapComponent from '../components/MapComponent';
import { 
  Camera, 
  Upload, 
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

// Mock images for quick select simulation
const mockImages = [
  { name: 'Pothole', url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600', description: 'Deep pothole in middle of lane' },
  { name: 'Water Pipe Leak', url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=600', description: 'Severe water main burst flooding sidewalk' },
  { name: 'Broken Streetlamp', url: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&q=80&w=600', description: 'Streetlight out, block pitch black' }
];

export const ReportComplaint: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const { loading: gpsLoading, error: gpsError, getCoordinates } = useGeolocation();

  // Component state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  
  // AI analysis state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIDetectionResult | null>(null);
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema)
  });

  const descriptionValue = watch('description');

  // Trigger GPS retrieval
  const handleGpsRequest = async () => {
    try {
      const location = await getCoordinates();
      setCoords({ lat: location.lat, lng: location.lng });
      // Simulate reverse geocoding address
      setAddress(`Around ${location.lat.toFixed(4)} N, ${location.lng.toFixed(4)} W, Civic Sector`);
      showToast('success', 'GPS Synced', 'Location coordinates successfully attached.');
    } catch (err) {
      showToast('error', 'Location Error', 'Unable to fetch precise location.');
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
    } catch (err) {
      showToast('error', 'AI Model Error', 'Automated analysis failed.');
    } finally {
      setAiLoading(false);
    }
  };

  // Quick simulate preset clicks
  const selectPresetImage = (url: string, desc: string, title: string) => {
    setSelectedImage(url);
    setValue('description', desc);
    setValue('title', title);
    showToast('info', 'Preset Loaded', `Mock image and details loaded.`);
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
      } catch (err) {
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
        category: activeAi.category,
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
    } catch (err) {
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
              
              {/* Presets block */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-slate-400">Demo Presets (Quick Select)</label>
                <div className="grid grid-cols-3 gap-3">
                  {mockImages.map((m, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectPresetImage(m.url, m.description, `Reported ${m.name}`)}
                      className={`relative rounded-xl overflow-hidden border h-16 group transition-all
                        ${selectedImage === m.url ? 'border-blue-500 shadow-glow-blue' : 'border-slate-800'}`}
                    >
                      <img src={m.url} alt={m.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1">
                        <span className="text-[9px] font-bold text-white uppercase text-center leading-tight">{m.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload block */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-slate-400">Attach Graphic Context</label>
                {selectedImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 h-48 bg-slate-950">
                    <img src={selectedImage} alt="Preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg p-1.5 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedImage('https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600')}
                      className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/20 hover:border-slate-700 transition-colors"
                    >
                      <Camera size={20} className="text-slate-400" />
                      <span className="text-xxs font-semibold text-slate-300">Simulate Camera Snapping</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImage('https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=600')}
                      className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/20 hover:border-slate-700 transition-colors"
                    >
                      <Upload size={20} className="text-slate-400" />
                      <span className="text-xxs font-semibold text-slate-300">Simulate File Upload</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Title & Description inputs */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Issue Title</label>
                <input
                  {...register('title')}
                  placeholder="e.g. Deep crater pothole"
                  type="text"
                  className="bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
                />
                {errors.title && <span className="text-[10px] text-rose-400">{errors.title.message}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Description details</label>
                <textarea
                  {...register('description')}
                  placeholder="Provide precise details of the issue. The AI model checks for categories (water leak, pothole, sanitation, lighting) to verify priority SLAs."
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
                    readOnly
                    value={address}
                    placeholder="Allow GPS tracking to coordinate markers..."
                    className="flex-1 bg-slate-950/40 border border-slate-800/60 rounded-xl px-4 text-xs outline-none text-slate-400"
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
              interactive={false}
              center={coords ? [coords.lat, coords.lng] : undefined}
              selectedLatLng={coords ? [coords.lat, coords.lng] : null}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
export default ReportComplaint;
