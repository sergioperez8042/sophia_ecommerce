'use client';

import { Check } from 'lucide-react';

interface CheckboxGroupProps {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
}

export default function CheckboxGroup({ label, options, value, onChange }: CheckboxGroupProps) {
  const toggle = (option: string) => {
    onChange(
      value.includes(option)
        ? value.filter(v => v !== option)
        : [...value, option]
    );
  };

  return (
    <div>
      <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const selected = value.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                selected
                  ? 'bg-[#505A4A] text-white border-[#505A4A]'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-[#505A4A]/50'
              }`}
            >
              {selected && <Check className="w-3.5 h-3.5" />}
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
