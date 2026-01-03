import { clsx } from 'clsx';

export const MobileContainer = ({ children, className }) => {
    return (
        <div className="min-h-[100dvh] bg-background flex justify-center">
            <div
                className={clsx(
                    "w-full max-w-lg bg-background h-[100dvh] relative overflow-hidden flex flex-col",
                    className
                )}
            >
                {children}
            </div>
        </div>
    );
};
