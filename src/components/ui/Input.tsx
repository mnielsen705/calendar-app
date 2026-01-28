import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-stone-600 mb-2">{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm transition-all duration-200 bg-white
            placeholder:text-stone-400
            focus:outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100
            ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-stone-200'}
            ${className}`}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
