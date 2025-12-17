import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: `
      btn-primary
      bg-white text-black
      relative overflow-hidden z-[1]
      hover:text-white hover:shadow-[0_0_30px_rgba(177,60,255,0.4)]
      active:scale-95
    `,
    secondary: `
      bg-gradient-to-r from-neon-blue to-neon-cyan text-white
      hover:shadow-lg hover:shadow-neon-cyan/50 hover:from-neon-blue/90 hover:to-neon-cyan/90
      active:scale-95 active:shadow-md active:shadow-neon-cyan/30
    `,
    outline: `
      btn-outline
      bg-transparent border border-white/20 text-white
      hover:border-neon-cyan hover:shadow-[0_0_15px_rgba(77,189,255,0.2)_inset] hover:text-neon-cyan
      active:scale-95
    `,
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm min-w-[120px]',
    md: 'px-6 py-3 text-base min-w-[160px]',
    lg: 'px-8 py-4 text-lg min-w-[200px]',
  };

  const baseStyles = `
    font-semibold rounded-lg
    transition-all duration-300 ease-[cubic-bezier(0.165,0.84,0.44,1)]
    focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-dark-primary
    select-none inline-flex items-center justify-center gap-2
  `;

  const interactionStyles = disabled || isLoading
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';

  return (
    <button
      type="button"
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${interactionStyles}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-sm">Загрузка...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
