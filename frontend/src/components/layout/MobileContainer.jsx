import { clsx } from 'clsx';

export const MobileContainer = ({ children, className }) => {
    return (
        <div className="min-h-screen bg-slate-100 flex justify-center items-start pt-0 sm:pt-10 pb-0 sm:pb-10">
            <div
                className={clsx(
                    "w-full max-w-md bg-background min-h-[100dvh] sm:min-h-[850px] sm:h-[850px] sm:rounded-[3rem] sm:shadow-2xl sm:border border-slate-200 relative overflow-hidden flex flex-col",
                    className
                )}
            >
                {children}
            </div>
        </div>
    );
};
