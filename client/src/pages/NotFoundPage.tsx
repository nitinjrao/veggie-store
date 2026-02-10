import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl mb-4">🥬</p>
        <h1 className="font-heading font-bold text-4xl text-text-dark mb-2">404</h1>
        <p className="text-text-muted mb-6">This page doesn't exist</p>
        <Link
          to="/"
          className="inline-block px-6 py-2.5 rounded-full bg-primary-green text-white font-medium hover:bg-primary-green-dark transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
