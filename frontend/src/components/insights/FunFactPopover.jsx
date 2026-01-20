import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';

/**
 * Popover to display fun equivalencies for stats.
 * Shows as bottom sheet on mobile, centered modal on desktop.
 */
const FunFactPopover = ({ isOpen, onClose, title, value, equivalencies, theme = 'emerald' }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const themes = {
        emerald: {
            bg: 'bg-emerald-50 dark:bg-emerald-900/40',
            text: 'text-emerald-700 dark:text-emerald-300',
            accent: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-800',
        },
        amber: {
            bg: 'bg-amber-50 dark:bg-amber-900/40',
            text: 'text-amber-700 dark:text-amber-300',
            accent: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-800',
        },
        indigo: {
            bg: 'bg-indigo-50 dark:bg-indigo-900/40',
            text: 'text-indigo-700 dark:text-indigo-300',
            accent: 'text-indigo-600 dark:text-indigo-400',
            border: 'border-indigo-200 dark:border-indigo-800',
        },
    };

    const t = themes[theme] || themes.emerald;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className={clsx(
                    'absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-300',
                    isOpen ? 'opacity-100' : 'opacity-0'
                )}
                onClick={onClose}
            />

            {/* Popover Content */}
            <div
                className={clsx(
                    'w-full max-w-sm bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl p-6 pb-10 sm:pb-6 relative transition-all duration-300 ease-out transform',
                    isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full sm:translate-y-4 sm:scale-95 opacity-0'
                )}
            >
                {/* Drag handle on mobile */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full sm:hidden" />

                {/* Header */}
                <div className={clsx('text-center mb-4 pt-2 sm:pt-0', t.text)}>
                    <div className="text-sm font-medium uppercase tracking-wider opacity-80">{title}</div>
                    <div className={clsx('text-3xl font-bold mt-1', t.accent)}>{value}</div>
                </div>

                {/* Equivalencies */}
                <div className={clsx('rounded-2xl p-4 border', t.bg, t.border)}>
                    <div className="space-y-3">
                        {equivalencies.map((eq, index) => (
                            <div
                                key={index}
                                className={clsx(
                                    'flex items-center gap-3 text-base',
                                    t.text
                                )}
                            >
                                <span className="text-2xl">{eq.emoji}</span>
                                <span className="font-medium">{eq.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tap to dismiss hint */}
                <div className="text-center mt-4 text-xs text-slate-400 dark:text-slate-500">
                    Tap anywhere to dismiss
                </div>
            </div>
        </div>,
        document.body
    );
};

export default FunFactPopover;
