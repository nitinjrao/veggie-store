import type { Vegetable } from '../../types';
import VegetableCard from './VegetableCard';

interface VegetableGridProps {
  vegetables: Vegetable[];
  loading: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
      <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
      <div className="h-9 bg-gray-200 rounded-lg mt-3" />
    </div>
  );
}

export default function VegetableGrid({ vegetables, loading }: VegetableGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (vegetables.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p className="text-lg">No vegetables found</p>
        <p className="text-sm mt-1">Try a different search or category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {vegetables.map((veg) => (
        <VegetableCard key={veg.id} vegetable={veg} />
      ))}
    </div>
  );
}
