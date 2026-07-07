import { useState, useRef, useEffect } from 'react';
import { pillClasses } from './Button';

interface DropdownOption<T extends string> {
  key: T;
  label: string;
}

interface DropdownProps<T extends string> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
}

export function Dropdown<T extends string>({ value, options, onChange }: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.key === value);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs px-3 py-2.5 rounded-lg font-medium bg-gray-800 text-gray-300 hover:text-white transition-colors"
      >
        {selected?.label}
        <svg
          viewBox="0 0 12 12"
          fill="currentColor"
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M2.5 4.5L6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 z-10 flex flex-col gap-1 bg-gray-800 rounded-lg p-1 shadow-lg whitespace-nowrap">
          {options.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
              className={`text-left text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${pillClasses(key === value)}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
