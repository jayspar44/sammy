import React from 'react';
import { cn } from '../../utils/cn';

const Button = React.forwardRef(({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
        primary: 'bg-primary text-primary-foreground shadow-lg shadow-sky-200 hover:bg-sky-600',
        secondary: 'bg-white text-slate-700 border border-slate-100 hover:bg-secondary-light',
        ghost: 'text-slate-500 hover:bg-slate-100',
        sage: 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 shadow-sm',
    };

    return (
        <button
            ref={ref}
            className={cn(
                'flex items-center justify-center px-4 py-3 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
                variants[variant],
                className
            )}
            {...props}
        />
    );
});

Button.displayName = 'Button';

export default Button;
