import { twMerge } from 'tailwind-merge';

export const Card = ({ className, children, ...props }) => {
    return (
        <div
            className={twMerge(
                'bg-white rounded-3xl shadow-sm border border-slate-100 p-6',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
