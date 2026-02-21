import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({ variant = 'primary', children, className, ...props }: ButtonProps) {
  const classes = `btn ${variant}${className ? ` ${className}` : ''}`;
  return (
    <button {...props} className={classes}>
      {children}
    </button>
  );
}
