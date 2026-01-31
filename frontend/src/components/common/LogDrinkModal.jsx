import { useState, useEffect } from 'react';
import { X, Minus, Plus, Beer } from 'lucide-react';
import { Button } from './Button';
import { clsx } from 'clsx';
import { createPortal } from 'react-dom';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';

export const LogDrinkModal = ({ isOpen, onClose, onConfirm }) => {
    const handleClose = useModalBackHandler(isOpen, onClose, 'logDrink');
    const [count, setCount] = useState(1);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setCount(1);
        } else {
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className={clsx(
                    "absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={handleClose}
            />

            {/* Modal Content */}
            <div
                className={clsx(
                    "w-full max-w-md bg-white dark:bg-slate-800 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pb-12 pt-8 relative transition-transform duration-300 ease-out transform",
                    isOpen ? "translate-y-0" : "translate-y-full sm:translate-y-10 sm:scale-95 sm:opacity-0"
                )}
            >
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full sm:hidden" />

                <header className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-50">Log Drink</h2>
                    <button onClick={handleClose} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </header>

                <div className="flex flex-col items-center justify-center mb-8">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setCount(Math.max(1, count - 1))}
                            className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-95"
                        >
                            <Minus className="w-8 h-8" />
                        </button>
                        <div className="text-7xl font-bold text-slate-800 dark:text-slate-50 w-24 text-center tabular-nums">
                            {count}
                        </div>
                        <button
                            onClick={() => setCount(count + 1)}
                            className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-95"
                        >
                            <Plus className="w-8 h-8" />
                        </button>
                    </div>
                    <p className="text-slate-400 dark:text-slate-500 font-medium mt-4 uppercase tracking-wide text-xs">Standard Drinks</p>
                </div>

                <Button
                    className="w-full text-lg h-16 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 shadow-xl shadow-sky-200"
                    onClick={() => onConfirm(count)}
                    icon={Beer}
                >
                    Add
                </Button>
            </div>
        </div>,
        document.body
    );
};
