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
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
          selectedId === null
            ? 'bg-primary-green text-white'
            : 'bg-white text-text-dark border border-gray-200 hover:border-primary-green'
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
            selectedId === cat.id
              ? 'bg-primary-green text-white'
              : 'bg-white text-text-dark border border-gray-200 hover:border-primary-green'
          }`}
        >
          {cat.name}
          {cat._count && (
            <span className="ml-1 text-xs opacity-70">({cat._count.vegetables})</span>
          )}
        </button>
      ))}
    </div>
  );
}
