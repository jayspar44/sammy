import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, DollarSign, TrendingDown, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { api } from '../../api/services';
import { logger } from '../../utils/logger';

/**
 * Last7DaysSummaryModal - Expanded view of last 7 days with AI summary
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - currentDate: string (YYYY-MM-DD)
 */
export const Last7DaysSummaryModal = ({ isOpen, onClose, currentDate }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [summaryData, setSummaryData] = useState(null);
    const [aiSummary, setAiSummary] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            fetchSummary();
        } else {
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [isOpen, currentDate]);

    const fetchSummary = async () => {
        setLoading(true);
        setAiSummary(null);
        try {
            // First fetch without AI for fast initial load
            const data = await api.getWeeklySummary(false, currentDate);
            setSummaryData(data);
            setLoading(false);

            // Then fetch AI summary
            setAiLoading(true);
            const dataWithAI = await api.getWeeklySummary(true, currentDate);
            setAiSummary(dataWithAI.aiSummary);
        } catch (err) {
            logger.error('Failed to fetch weekly summary', err);
            setLoading(false);
        } finally {
            setAiLoading(false);
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
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50">Last 7 Days</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </header>

                {loading ? (
                    <LoadingSkeleton />
                ) : summaryData ? (
                    <>
                        {/* Stats summary cards */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <StatCard
                                icon={<TrendingDown className="w-4 h-4" />}
                                value={summaryData.totalDrinks}
                                label="drinks"
                                subtext={`/ ${summaryData.totalTarget}`}
                            />
                            <StatCard
                                icon={<Star className="w-4 h-4" />}
                                value={summaryData.dryDays}
                                label="dry days"
                            />
                            <StatCard
                                icon={<DollarSign className="w-4 h-4" />}
                                value={`$${summaryData.moneySaved}`}
                                label="saved"
                            />
                        </div>

                        {/* AI Summary */}
                        <div className="mb-6 p-4 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-xl border border-sky-100 dark:border-sky-800">
                            {aiLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        Sammy is thinking...
                                    </span>
                                </div>
                            ) : aiSummary ? (
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {aiSummary}
                                </p>
                            ) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                                    {summaryData.daysUnderTarget >= 5
                                        ? 'Great week! You stayed on track most days.'
                                        : 'Keep going - every day is a new opportunity.'}
                                </p>
                            )}
                        </div>

                        {/* Day-by-day breakdown */}
                        <div className="space-y-2">
                            {summaryData.days.map((day) => (
                                <DayRow key={day.date} day={day} />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        Unable to load summary
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

const StatCard = ({ icon, value, label, subtext }) => (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
        <div className="flex items-center justify-center gap-1 text-primary dark:text-sky-400 mb-1">
            {icon}
        </div>
        <div className="flex items-baseline justify-center gap-1">
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}</span>
            {subtext && (
                <span className="text-xs text-slate-400 dark:text-slate-500">{subtext}</span>
            )}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
    </div>
);

const DayRow = ({ day }) => {
    const dateObj = new Date(day.date + 'T00:00:00');
    const dayName = format(dateObj, 'EEE');
    const dateStr = format(dateObj, 'MMM d');

    const isUnder = day.count !== null && day.count <= day.goal;
    const progressWidth = day.count !== null && day.goal > 0
        ? Math.min((day.count / day.goal) * 100, 100)
        : 0;

    return (
        <div className="flex items-center gap-3 py-2">
            {/* Day label */}
            <div className="w-16">
                <div className="font-medium text-slate-700 dark:text-slate-300">{dayName}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">{dateStr}</div>
            </div>

            {/* Progress bar */}
            <div className="flex-1">
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={clsx(
                            "h-full rounded-full transition-all duration-500",
                            day.count === null
                                ? "bg-slate-200 dark:bg-slate-600"
                                : isUnder
                                    ? "bg-green-400 dark:bg-green-500"
                                    : "bg-amber-400 dark:bg-amber-500"
                        )}
                        style={{ width: day.count === null ? '0%' : `${progressWidth}%` }}
                    />
                </div>
            </div>

            {/* Count */}
            <div className="w-16 text-right">
                {day.count !== null ? (
                    <span className={clsx(
                        "font-semibold",
                        isUnder ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
                    )}>
                        {day.count} / {day.goal}
                    </span>
                ) : (
                    <span className="text-slate-400 dark:text-slate-500">—</span>
                )}
            </div>

            {/* Dry day indicator */}
            <div className="w-6 flex justify-center">
                {day.isDry && (
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                )}
            </div>
        </div>
    );
};

const LoadingSkeleton = () => (
    <div className="animate-pulse">
        <div className="grid grid-cols-3 gap-3 mb-6">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-100 dark:bg-slate-700 rounded-xl p-3 h-20" />
            ))}
        </div>
        <div className="bg-slate-100 dark:bg-slate-700 rounded-xl h-16 mb-6" />
        <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded" />
            ))}
        </div>
    </div>
);

export default Last7DaysSummaryModal;
