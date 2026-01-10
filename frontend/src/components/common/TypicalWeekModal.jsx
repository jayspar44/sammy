import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import Button from '../ui/Button';
import { clsx } from 'clsx';
import { createPortal } from 'react-dom';
import { logger } from '../../utils/logger';

const DAYS = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
];

export const TypicalWeekModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [weekData, setWeekData] = useState({
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0
    });
    const [modifiedDays, setModifiedDays] = useState({});
    const [loading, setLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Initialize data when modal opens
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);

            // Load initial data or defaults
            if (initialData) {
                setWeekData({
                    monday: initialData.monday ?? 0,
                    tuesday: initialData.tuesday ?? 0,
                    wednesday: initialData.wednesday ?? 0,
                    thursday: initialData.thursday ?? 0,
                    friday: initialData.friday ?? 0,
                    saturday: initialData.saturday ?? 0,
                    sunday: initialData.sunday ?? 0
                });
            } else {
                // Reset to all zeros if no initial data
                setWeekData({
                    monday: 0,
                    tuesday: 0,
                    wednesday: 0,
                    thursday: 0,
                    friday: 0,
                    saturday: 0,
                    sunday: 0
                });
            }

            setModifiedDays({});
        } else {
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [isOpen, initialData]);

    const handleIncrement = (day) => {
        setWeekData((prev) => {
            const newValue = Math.min((prev[day] || 0) + 1, 100);
            return { ...prev, [day]: newValue };
        });

        // Track that this day was modified
        const initialValue = initialData?.[day] ?? 0;
        const newValue = Math.min((weekData[day] || 0) + 1, 100);

        if (newValue !== initialValue) {
            setModifiedDays((prev) => ({ ...prev, [day]: true }));
        } else {
            setModifiedDays((prev) => {
                const updated = { ...prev };
                delete updated[day];
                return updated;
            });
        }
    };

    const handleDecrement = (day) => {
        setWeekData((prev) => {
            const newValue = Math.max((prev[day] || 0) - 1, 0);
            return { ...prev, [day]: newValue };
        });

        // Track that this day was modified
        const initialValue = initialData?.[day] ?? 0;
        const newValue = Math.max((weekData[day] || 0) - 1, 0);

        if (newValue !== initialValue) {
            setModifiedDays((prev) => ({ ...prev, [day]: true }));
        } else {
            setModifiedDays((prev) => {
                const updated = { ...prev };
                delete updated[day];
                return updated;
            });
        }
    };

    const handleReset = () => {
        setWeekData({
            monday: 0,
            tuesday: 0,
            wednesday: 0,
            thursday: 0,
            friday: 0,
            saturday: 0,
            sunday: 0
        });

        // Mark all as modified if they weren't already 0
        const modified = {};
        DAYS.forEach((day) => {
            const initialValue = initialData?.[day.key] ?? 0;
            if (initialValue !== 0) {
                modified[day.key] = true;
            }
        });
        setModifiedDays(modified);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave(weekData);
            onClose();
        } catch (error) {
            logger.error('Failed to save typical week:', error);
        } finally {
            setLoading(false);
        }
    };

    const hasChanges = Object.keys(modifiedDays).length > 0;
    const totalChanges = Object.keys(modifiedDays).length;

    // Calculate weekly total
    const weeklyTotal = Object.values(weekData).reduce((sum, count) => sum + count, 0);

    if (!isVisible) return null;

    return createPortal(
        <div
            className={clsx(
                'fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center transition-all duration-300',
                isOpen ? 'bg-black/40 dark:bg-black/80 backdrop-blur-sm' : 'bg-black/0'
            )}
            onClick={onClose}
        >
            <div
                className={clsx(
                    'w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl transition-all duration-300 flex flex-col',
                    'rounded-t-[2.5rem] sm:rounded-[2.5rem]',
                    'max-h-[90dvh]',
                    isOpen ? 'translate-y-0 sm:scale-100 sm:opacity-100' : 'translate-y-full sm:translate-y-10 sm:scale-95 sm:opacity-0'
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag Handle (Mobile) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50">Typical Week Baseline</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Set your typical drinking pattern</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Help Text */}
                <div className="px-6 py-3 bg-sky-50 dark:bg-sky-900/20 border-b border-sky-100 dark:border-sky-900/30">
                    <p className="text-sm text-sky-800 dark:text-sky-300">
                        Set your typical drinking pattern before using Sammy. This helps track your progress toward healthier habits.
                    </p>
                </div>

                {/* Days List */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="space-y-2">
                        {DAYS.map((day) => {
                            const count = weekData[day.key] || 0;
                            const isModified = modifiedDays[day.key];

                            return (
                                <div
                                    key={day.key}
                                    className={clsx(
                                        'flex items-center justify-between p-4 rounded-2xl border transition-colors',
                                        isModified
                                            ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700'
                                            : count === 0
                                            ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                    )}
                                >
                                    <div className="flex-1">
                                        <div className="font-semibold text-slate-800 dark:text-slate-200">{day.label}</div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Decrement Button */}
                                        <button
                                            onClick={() => handleDecrement(day.key)}
                                            disabled={count === 0}
                                            className={clsx(
                                                'w-9 h-9 flex items-center justify-center rounded-full font-bold text-lg transition-colors',
                                                count === 0
                                                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-300 cursor-not-allowed'
                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95'
                                            )}
                                        >
                                            −
                                        </button>

                                        {/* Count Display */}
                                        <div className="w-12 text-center">
                                            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{count}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">drinks</div>
                                        </div>

                                        {/* Increment Button */}
                                        <button
                                            onClick={() => handleIncrement(day.key)}
                                            disabled={count >= 100}
                                            className={clsx(
                                                'w-9 h-9 flex items-center justify-center rounded-full font-bold text-lg transition-colors',
                                                count >= 100
                                                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-300 cursor-not-allowed'
                                                    : 'bg-primary text-white hover:bg-sky-600 active:scale-95'
                                            )}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 dark:border-slate-700 px-6 py-4 space-y-3">
                    {/* Weekly Total */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Weekly Total:</span>
                        <span className="text-lg font-bold text-primary">{weeklyTotal} drinks</span>
                    </div>

                    <div className="flex gap-3">
                        {/* Reset Button */}
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            disabled={loading}
                            className="flex-1"
                        >
                            Reset
                        </Button>

                        {/* Save Button */}
                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges || loading}
                            className="flex-1 flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Saving...' : hasChanges ? `Save ${totalChanges} Change${totalChanges > 1 ? 's' : ''}` : 'No Changes'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
