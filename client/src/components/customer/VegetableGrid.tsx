import { Leaf } from 'lucide-react';
import type { Vegetable } from '../../types';
import VegetableCard from './VegetableCard';

interface VegetableGridProps {
  vegetables: Vegetable[];
  loading: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="w-14 h-14 shimmer rounded-full mx-auto mb-3" />
      <div className="h-4 shimmer rounded-lg w-3/4 mb-2" />
      <div className="h-3 shimmer rounded-lg w-1/2 mb-4" />
      <div className="h-5 shimmer rounded-lg w-1/3 mb-3" />
      <div className="h-10 shimmer rounded-xl mt-1" />
    </div>
  );
}

export default function VegetableGrid({ vegetables, loading }: VegetableGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (vegetables.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Leaf className="w-10 h-10 text-gray-300" />
        </div>
        <p className="text-lg font-medium text-text-dark mb-1">No vegetables found</p>
        <p className="text-sm text-text-muted">Try a different search or category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 stagger-children">
      {vegetables.map((veg) => (
        <VegetableCard key={veg.id} vegetable={veg} />
      ))}
    </div>
  );
}
