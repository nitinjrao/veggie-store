import { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin, Check } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  refrigerators: { id: string; name: string }[];
}

interface FridgeSelectProps {
  locations: Location[];
  value: string;
  onChange: (fridgeId: string) => void;
}

export default function FridgeSelect({ locations, value, onChange }: FridgeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedFridge = locations
    .flatMap((l) => l.refrigerators.map((r) => ({ ...r, locationName: l.name })))
    .find((f) => f.id === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 border rounded-xl text-sm transition-all bg-white ${
          isOpen
            ? 'border-primary-green ring-2 ring-primary-green/40'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {selectedFridge ? (
          <span className="flex items-center gap-2 text-text-dark">
            <MapPin className="w-3.5 h-3.5 text-primary-green shrink-0" />
            <span className="truncate">
              <span className="text-text-muted">{selectedFridge.locationName} —</span>{' '}
              {selectedFridge.name}
            </span>
          </span>
        ) : (
          <span className="text-text-muted">Select pickup fridge...</span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-fade-in">
          <div className="max-h-64 overflow-y-auto overscroll-contain py-1">
            {locations.map((location) => (
              <div key={location.id}>
                <div className="px-3.5 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider bg-gray-50 sticky top-0">
                  {location.name}
                </div>
                {location.refrigerators.map((fridge) => {
                  const isSelected = fridge.id === value;
                  return (
                    <button
                      key={fridge.id}
                      type="button"
                      onClick={() => {
                        onChange(fridge.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                        isSelected
                          ? 'bg-primary-green/10 text-primary-green-dark font-medium'
                          : 'text-text-dark hover:bg-gray-50'
                      }`}
                    >
                      <span className="w-4 shrink-0">
                        {isSelected && <Check className="w-4 h-4 text-primary-green" />}
                      </span>
                      {fridge.name}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
