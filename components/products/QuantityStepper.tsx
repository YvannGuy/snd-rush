'use client';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  label,
}: QuantityStepperProps) {
  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (!max || value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1.5 w-fit bg-white">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={value <= min}
          className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-gray-700 text-sm"
        >
          −
        </button>
        <span className="text-base font-semibold text-gray-900 w-8 text-center">
          {value}
        </span>
        <button
          type="button"
          onClick={handleIncrease}
          disabled={max !== undefined && value >= max}
          className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-gray-700 text-sm"
        >
          +
        </button>
      </div>
    </div>
  );
}

