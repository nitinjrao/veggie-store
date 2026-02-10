import type { Category } from '../../types';

interface CategoryFilterProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function CategoryFilter({ categories, selectedId, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
          selectedId === null
            ? 'bg-gradient-green text-white shadow-glow-green'
            : 'bg-white text-text-dark border border-gray-200 hover:border-primary-green hover:text-primary-green'
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
            selectedId === cat.id
              ? 'bg-gradient-green text-white shadow-glow-green'
              : 'bg-white text-text-dark border border-gray-200 hover:border-primary-green hover:text-primary-green'
          }`}
        >
          {cat.name}
          {cat._count && (
            <span className="ml-1.5 text-xs opacity-70">({cat._count.vegetables})</span>
          )}
        </button>
      ))}
    </div>
  );
}
