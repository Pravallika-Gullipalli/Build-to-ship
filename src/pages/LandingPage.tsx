import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  ArrowRight,
  Cpu,
  BarChart3,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';
import Card from '../components/Card';

const stats = [
  { value: '3,842', label: 'Issues Logged' },
  { value: '94.2%', label: 'AI Match Accuracy' },
  { value: '1.8 Days', label: 'Avg Resolution Time' },
  { value: '18,500', label: 'Citizen Registrations' }
];

const faqs = [
  {
    q: 'How does the AI prioritize complaints?',
    a: 'AI CivicFix uses natural language processing and computer vision to analyze the description and images of reported issues. It evaluates traffic volume, safety risks (e.g., stopping signs covered or street flooding), and past database patterns to automatically assign low, medium, high, or critical priority.'
  },
  {
    q: 'Is there a way to prevent duplicate complaints?',
    a: 'Yes. Before a complaint is submitted, the system checks a 100-meter radius around the current coordinate. If a matching issue is found, it prompts the user that the issue has already been reported, allowing them to subscribe to status updates instead of generating database clutter.'
  },
  {
    q: 'How are city officers notified of issues?',
    a: 'Once verified, complaints are routed to the relevant municipal departments. Officers receive real-time notifications via their command dashboard, sorted by priority and distance to ensure high-severity items are addressed first.'
  }
];

export const LandingPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100">
      
      {/* Navbar */}
      <header className="sticky top-0 w-full z-50 bg-slate-950/70 border-b border-slate-900/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-glow-blue">
              <Cpu size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-white">AI CivicFix</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How It Works</a>
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#faq" className="text-sm text-slate-400 hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-slate-800">
              Sign In
            </Link>
            <Link to="/signup" className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue transition-all px-4 py-2 rounded-xl text-white">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center py-20 px-6 overflow-hidden">
        {/* Glow Spheres background */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-xs font-semibold max-w-max">
              <Sparkles size={14} className="animate-pulse" /> Next-Gen Civic Infrastructure Management
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Intelligent Public <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Complaint Sorting
              </span>
            </h1>

            <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl">
              Empower citizens, automate prioritization with local AI models, and optimize city dispatch services. Eliminate duplicates, calculate response times, and monitor municipal metrics instantly.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-2">
              <Link
                to="/signup"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 hover:shadow-glow-blue transition-all px-6 py-3.5 rounded-xl font-bold text-white text-sm"
              >
                File Your First Complaint
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/map"
                className="text-sm font-semibold border border-slate-800 hover:bg-slate-900/50 hover:text-white transition-colors px-6 py-3.5 rounded-xl text-slate-300"
              >
                Explore Public Map
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900/40 p-1.5 backdrop-blur-xl">
              <img
                src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=800"
                alt="Civic Dashboard Overview"
                className="w-full h-[400px] object-cover rounded-xl opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
              
              {/* Overlay card */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl border border-slate-700/40 bg-slate-900/90 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Automated Classification Active</p>
                    <p className="text-[10px] text-slate-400">Infrastructure scanning online</p>
                  </div>
                </div>
                <span className="text-xxs px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 uppercase font-bold tracking-wider">
                  Edge AI V2
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Statistics Bar */}
      <section className="border-y border-slate-900 bg-slate-950/30 py-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, idx) => (
            <div key={idx} className="flex flex-col gap-1.5">
              <span className="text-3xl font-extrabold text-white bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{s.value}</span>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How AI CivicFix Works</h2>
          <p className="text-xs text-slate-400 mt-2">Transforming community reporting in 3 simple phases</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card hoverable={false} className="flex flex-col gap-4 text-center items-center">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <MapPin size={24} />
            </div>
            <h3 className="font-bold text-lg text-white">1. Citizens Snap & Submit</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload photos or snap issues with GPS tagging. Our portal parses the location coordinates and description fields.
            </p>
          </Card>
          <Card hoverable={false} className="flex flex-col gap-4 text-center items-center">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <Cpu size={24} />
            </div>
            <h3 className="font-bold text-lg text-white">2. AI Verifies & Flags</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automated pipelines predict issues, warn of nearby duplicates, evaluate safety severity, and estimate response targets.
            </p>
          </Card>
          <Card hoverable={false} className="flex flex-col gap-4 text-center items-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <h3 className="font-bold text-lg text-white">3. Officers Repair & Update</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Assigned teams inspect details, initiate repairs, and upload status changes. Citizens follow timeline updates in real-time.
            </p>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Full-Suite Features</h2>
          <p className="text-xs text-slate-400 mt-2">Engineered to streamline civil issue ticket resolving workflows</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card hoverable={true} className="flex flex-col gap-2">
            <h4 className="font-semibold text-base text-white flex items-center gap-2">
              <Cpu size={16} className="text-blue-400" /> Image Vision Scanner
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mt-1">
              Supports camera capture or file uploads. Automatically detects category and priority from graphics context.
            </p>
          </Card>
          <Card hoverable={true} className="flex flex-col gap-2">
            <h4 className="font-semibold text-base text-white flex items-center gap-2">
              <Shield size={16} className="text-blue-400" /> Duplicate Block System
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mt-1">
              Geofences coordinate markers to alert citizens of existing filings. Prevents multiple dispatches to the same location.
            </p>
          </Card>
          <Card hoverable={true} className="flex flex-col gap-2">
            <h4 className="font-semibold text-base text-white flex items-center gap-2">
              <Clock size={16} className="text-blue-400" /> Status Step Timelines
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mt-1">
              Animated tracking of submission, verification, officer allocation, repair status, and final resolution.
            </p>
          </Card>
          <Card hoverable={true} className="flex flex-col gap-2">
            <h4 className="font-semibold text-base text-white flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-400" /> Regional Metrics Board
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mt-1">
              Tracks department response curves, monthly aggregate stats, and satisfaction ratings via vector statistics charts.
            </p>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 bg-slate-950/40 border-t border-slate-900">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-400 mt-2">Everything you need to know about CivicFix</p>
          </div>

          <div className="flex flex-col gap-4">
            {faqs.map((faq, idx) => (
              <Card key={idx} hoverable={false} className="border-slate-800/80 bg-slate-900/10">
                <h4 className="font-bold text-sm text-slate-100">{faq.q}</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Cpu size={12} className="text-white" />
            </div>
            <span className="font-bold text-xs text-white">AI CivicFix</span>
          </div>

          <p className="text-xxs text-slate-500 leading-normal">
            &copy; {new Date().getFullYear()} AI CivicFix. Built for smart cities and automated ticket resolution. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
