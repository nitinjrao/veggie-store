import { Outlet } from 'react-router-dom';
import { useInitialize } from '../../hooks/useInitialize';

export default function CustomerLayout() {
  useInitialize();

  return (
    <div className="min-h-screen bg-bg-light">
      <main className="max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
