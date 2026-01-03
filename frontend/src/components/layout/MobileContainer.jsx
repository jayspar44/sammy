import { clsx } from 'clsx';

export const MobileContainer = ({ children, className }) => {
    return (
        <div className="fixed inset-0 sm:relative sm:inset-auto sm:min-h-screen bg-slate-100 flex justify-center items-start sm:pt-10 sm:pb-10">
            <div
                className={clsx(
                    "w-full max-w-md bg-background h-[100dvh] sm:h-[850px] sm:rounded-[3rem] sm:shadow-2xl sm:border border-slate-200 relative overflow-hidden flex flex-col",
                    className
                )}
            >
                {children}
            </div>
        </div>
    );
};
