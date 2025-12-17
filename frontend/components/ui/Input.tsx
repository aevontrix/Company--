import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full px-4 py-3 bg-dark-card border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-all ${
          error ? 'border-neon-magenta' : 'border-neon-purple/30 hover:border-neon-purple/50'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-neon-magenta">{error}</p>}
    </div>
  )
);

Input.displayName = 'Input';
export default Input;
