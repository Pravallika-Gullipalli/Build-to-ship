import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import { ShieldAlert, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-950 min-h-[80vh] text-slate-100">
      <Card hoverable={false} className="max-w-md w-full border-slate-800 bg-slate-900/40 p-8 text-center flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center animate-bounce">
          <ShieldAlert size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">404 - Page Not Found</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            The requested municipal path is invalid. It may have been relocated or represents restricted administration space.
          </p>
        </div>
        <Link
          to="/"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all flex items-center gap-1.5 mt-2"
        >
          <Home size={14} />
          Back to Home Page
        </Link>
      </Card>
    </div>
  );
};
export default NotFoundPage;
