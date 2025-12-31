import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Button = ({
    variant = 'primary',
    size = 'md',
    icon: Icon,
    className,
    children,
    ...props
}) => {
    const variants = {
        primary: 'bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/20',
        secondary: 'bg-primary-light text-primary hover:bg-primary-light/80',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
        outline: 'bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-50',
    };

    const sizes = {
        sm: 'h-9 px-4 text-sm',
        md: 'h-12 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10 p-2',
    };

    return (
        <button
            className={twMerge(
                'inline-flex items-center justify-center font-medium rounded-2xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {Icon && <Icon className={clsx('w-5 h-5', children && 'mr-2')} />}
            {children}
        </button>
    );
};
