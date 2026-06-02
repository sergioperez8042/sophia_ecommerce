'use client';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: 'sm' | 'md';
    'aria-label'?: string;
}

export default function Toggle({
    checked,
    onChange,
    disabled = false,
    size = 'md',
    'aria-label': ariaLabel,
}: ToggleProps) {
    const dims = size === 'sm'
        ? { track: 'w-9 h-5', thumb: 'w-4 h-4', translate: 'left-[18px]', off: 'left-0.5' }
        : { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'left-[22px]', off: 'left-0.5' };

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative ${dims.track} rounded-full transition-colors ${
                checked ? 'bg-[#2E4A3A]' : 'bg-gray-300 dark:bg-gray-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <span
                className={`absolute top-0.5 ${dims.thumb} bg-white rounded-full shadow transition-transform ${
                    checked ? dims.translate : dims.off
                }`}
            />
        </button>
    );
}
