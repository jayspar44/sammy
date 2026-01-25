import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus, Plus, Calendar, MessageCircle, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import Button from '../ui/Button';

/**
 * WeeklyPlanModal - Modal for setting/editing weekly drinking targets
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onSave: (targets, isRecurring) => void
 * - currentPlan: { monday: number, ..., isActive: boolean } | null
 * - onChatWithSammy: () => void
 */
export const WeeklyPlanModal = ({
    isOpen,
    onClose,
    onSave,
    currentPlan = null,
    onChatWithSammy
}) => {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Default values: 2 on weekdays, 3 on weekends
    const defaultTargets = {
        monday: 2,
        tuesday: 2,
        wednesday: 2,
        thursday: 2,
        friday: 3,
        saturday: 3,
        sunday: 1
    };

    const [targets, setTargets] = useState(defaultTargets);
    const [isRecurring, setIsRecurring] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    // Initialize from currentPlan when modal opens
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            if (currentPlan) {
                setTargets({
                    monday: currentPlan.monday ?? defaultTargets.monday,
                    tuesday: currentPlan.tuesday ?? defaultTargets.tuesday,
                    wednesday: currentPlan.wednesday ?? defaultTargets.wednesday,
                    thursday: currentPlan.thursday ?? defaultTargets.thursday,
                    friday: currentPlan.friday ?? defaultTargets.friday,
                    saturday: currentPlan.saturday ?? defaultTargets.saturday,
                    sunday: currentPlan.sunday ?? defaultTargets.sunday
                });
                setIsRecurring(currentPlan.isActive !== false);
            } else {
                setTargets(defaultTargets);
                setIsRecurring(true);
            }
        } else {
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [isOpen, currentPlan]);

    const updateTarget = (day, delta) => {
        setTargets(prev => ({
            ...prev,
            [day]: Math.max(0, Math.min(20, prev[day] + delta))
        }));
    };

    const weekTotal = dayOrder.reduce((sum, day) => sum + targets[day], 0);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(targets, isRecurring);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    if (!isVisible && !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className={clsx(
                    "absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={clsx(
                    "w-full max-w-md bg-white dark:bg-slate-800 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pb-12 pt-8 relative transition-transform duration-300 ease-out transform max-h-[90vh] overflow-y-auto",
                    isOpen ? "translate-y-0" : "translate-y-full sm:translate-y-10 sm:scale-95 sm:opacity-0"
                )}
            >
                {/* Drag handle (mobile) */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full sm:hidden" />

                {/* Header */}
                <header className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary dark:text-sky-400" />
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50">Weekly Plan</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </header>

                {/* Day targets */}
                <div className="space-y-3 mb-6">
                    {dayOrder.map((day, index) => (
                        <DayRow
                            key={day}
                            label={dayLabels[index]}
                            value={targets[day]}
                            onDecrease={() => updateTarget(day, -1)}
                            onIncrease={() => updateTarget(day, 1)}
                        />
                    ))}
                </div>

                {/* Week total */}
                <div className="flex items-center justify-between py-3 px-4 bg-primary/10 dark:bg-sky-900/30 rounded-xl mb-6">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Week Total</span>
                    <span className="text-2xl font-bold text-primary dark:text-sky-400">{weekTotal}</span>
                </div>

                {/* Repeat toggle */}
                <label className="flex items-center gap-3 mb-6 cursor-pointer">
                    <div
                        className={clsx(
                            "w-12 h-7 rounded-full transition-colors relative",
                            isRecurring ? "bg-primary" : "bg-slate-200 dark:bg-slate-600"
                        )}
                        onClick={() => setIsRecurring(!isRecurring)}
                    >
                        <div
                            className={clsx(
                                "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                                isRecurring ? "translate-x-6" : "translate-x-1"
                            )}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Repeat weekly
                        </span>
                    </div>
                </label>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <Button
                        variant="primary"
                        className="w-full text-lg h-14 rounded-2xl shadow-lg shadow-sky-200/50 dark:shadow-none"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Plan'}
                    </Button>

                    {onChatWithSammy && (
                        <button
                            onClick={onChatWithSammy}
                            className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-sky-400 transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Need help? Chat with Sammy
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

/**
 * DayRow - Single day target input row
 */
const DayRow = ({ label, value, onDecrease, onIncrease }) => {
    return (
        <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-300 w-12">{label}</span>

            <div className="flex items-center gap-3">
                <button
                    onClick={onDecrease}
                    disabled={value === 0}
                    className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        value === 0
                            ? "bg-slate-100 text-slate-300 dark:bg-slate-700 dark:text-slate-600 cursor-not-allowed"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 active:scale-95"
                    )}
                >
                    <Minus className="w-4 h-4" />
                </button>

                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 w-8 text-center tabular-nums">
                    {value}
                </span>

                <button
                    onClick={onIncrease}
                    disabled={value >= 20}
                    className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        value >= 20
                            ? "bg-slate-100 text-slate-300 dark:bg-slate-700 dark:text-slate-600 cursor-not-allowed"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 active:scale-95"
                    )}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default WeeklyPlanModal;
