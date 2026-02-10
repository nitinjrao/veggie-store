import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center px-4">
      <div className="text-center animate-fade-in-up">
        <div className="text-7xl mb-6 animate-float">🥬</div>
        <h1 className="font-heading font-bold text-5xl text-text-dark mb-2">404</h1>
        <p className="text-text-muted text-lg mb-8">Oops! This page doesn't exist</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-green text-white font-medium hover:shadow-glow-green transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
