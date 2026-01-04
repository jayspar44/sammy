import { useState, useEffect } from 'react';
import { X, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import { clsx } from 'clsx';
import { createPortal } from 'react-dom';
import { format, subDays, addDays, startOfWeek, isSameWeek } from 'date-fns';
import { api } from '../../api/services';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';

export const EditHistoricCountModal = ({ isOpen, onClose, onSave, currentDate }) => {
    const { registeredDate } = useUserPreferences();
    const [weekStartDate, setWeekStartDate] = useState(null);
    const [weekData, setWeekData] = useState([]);
    const [weekDataCache, setWeekDataCache] = useState({}); // Cache fetched week data
    const [modifiedCounts, setModifiedCounts] = useState({});
    const [modifiedGoals, setModifiedGoals] = useState({});
    const [editMode, setEditMode] = useState('count'); // 'count' or 'target'
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);

    // Get today's date for reference
    const today = new Date();

    // Initialize to current week or week containing currentDate
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            const referenceDate = currentDate ? new Date(currentDate + 'T00:00:00') : today;
            // Start from last Sunday (or adjust to start Monday if preferred)
            const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 }); // Monday
            setWeekStartDate(weekStart);
            setModifiedCounts({});
            setModifiedGoals({});
            setEditMode('count');
        } else {
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [isOpen, currentDate]);

    // Load data for the current week
    useEffect(() => {
        if (weekStartDate) {
            const weekKey = format(weekStartDate, 'yyyy-MM-dd');

            // Check cache first
            if (weekDataCache[weekKey]) {
                setWeekData(weekDataCache[weekKey]);
                setLoadingData(false);
            } else {
                loadWeekData(weekStartDate);
            }
        }
    }, [weekStartDate]);

    const loadWeekData = async (startDate) => {
        setLoadingData(true);
        const weekKey = format(startDate, 'yyyy-MM-dd');

        try {
            // Prepare all date info first
            const dateInfos = [];
            for (let i = 0; i < 7; i++) {
                const date = addDays(startDate, i);
                dateInfos.push({
                    date,
                    dateStr: format(date, 'yyyy-MM-dd'),
                    dayLabel: format(date, 'EEE'),
                    dateLabel: format(date, 'MMM d'),
                    isFuture: date > today
                });
            }

            // Batch fetch all stats
            const weekEndDate = addDays(startDate, 6);
            const rangeStats = await api.getStatsRange(
                format(startDate, 'yyyy-MM-dd'),
                format(weekEndDate, 'yyyy-MM-dd')
            );

            // Combine data
            const days = dateInfos.map((info) => {
                const dayStats = rangeStats[info.dateStr] || {};

                // Fallback if dayStats is empty (e.g. no record found)
                const count = dayStats.today?.count ?? 0;
                const limit = dayStats.today?.limit ?? 2;
                const hasRecord = dayStats.hasRecord ?? false;

                return {
                    date: info.dateStr,
                    dayLabel: info.dayLabel,
                    dateLabel: info.dateLabel,
                    count: info.isFuture ? null : count,
                    limit: info.isFuture ? null : limit,
                    isFuture: info.isFuture,
                    isBeforeRegistered: registeredDate ? info.dateStr < registeredDate.split('T')[0] : false,
                    hasRecord: !info.isFuture && hasRecord
                };
            });

            setWeekData(days);
            // Cache the data
            setWeekDataCache(prev => ({ ...prev, [weekKey]: days }));
        } catch (err) {
            console.error('Failed to load week data', err);
        } finally {
            setLoadingData(false);
        }
    };

    const handlePrevWeek = () => {
        const newWeekStart = subDays(weekStartDate, 7);
        setWeekStartDate(newWeekStart);
    };

    const handleNextWeek = () => {
        const nextWeek = addDays(weekStartDate, 7);
        // Don't allow going into future weeks
        if (nextWeek <= today) {
            setWeekStartDate(nextWeek);
        }
    };

    const handleThisWeek = () => {
        const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
        setWeekStartDate(thisWeekStart);
    };

    const handleCountChange = (date, delta) => {
        const day = weekData.find(d => d.date === date);
        if (!day || day.isFuture) return;

        if (editMode === 'target') {
            const currentGoal = modifiedGoals[date] ?? day.limit;
            const newGoal = Math.max(1, currentGoal + delta); // Min goal 1? Or 0? Let's say 1 for logic.

            setModifiedGoals(prev => ({
                ...prev,
                [date]: newGoal
            }));
        } else {
            const currentCount = modifiedCounts[date] ?? day.count;
            const newCount = Math.max(0, currentCount + delta);

            setModifiedCounts(prev => ({
                ...prev,
                [date]: newCount
            }));
        }
    };

    const handleSaveAll = async () => {
        setLoading(true);
        try {
            // Save modified counts
            const countUpdates = Object.entries(modifiedCounts).map(([date, count]) =>
                api.updateHistoricCount(date, { newCount: count })
            );

            // Save modified goals
            const goalUpdates = Object.entries(modifiedGoals).map(([date, goal]) =>
                api.updateHistoricCount(date, { newGoal: goal })
            );

            await Promise.all([...countUpdates, ...goalUpdates]);
            onSave?.();
            onClose();
        } catch (err) {
            console.error('Failed to save changes', err);
            alert('Failed to save some changes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isVisible && !isOpen) return null;

    const isCurrentWeek = weekStartDate && isSameWeek(weekStartDate, today, { weekStartsOn: 1 });
    const hasChanges = Object.keys(modifiedCounts).length > 0 || Object.keys(modifiedGoals).length > 0;
    const weekEndDate = weekStartDate ? addDays(weekStartDate, 6) : null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className={clsx(
                    "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={clsx(
                    "w-full max-w-md max-h-[90dvh] bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] px-5 pb-6 pt-6 relative flex flex-col transition-transform duration-300 ease-out transform",
                    isOpen ? "translate-y-0" : "translate-y-full sm:translate-y-10 sm:scale-95 sm:opacity-0"
                )}
            >
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full sm:hidden" />

                <header className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Edit History</h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </header>

                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-4 bg-slate-50 rounded-xl p-2">
                    <button
                        onClick={handlePrevWeek}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>

                    <div className="text-center">
                        <p className="text-sm font-semibold text-slate-700">
                            {weekStartDate && weekEndDate &&
                                `${format(weekStartDate, 'MMM d')} - ${format(weekEndDate, 'MMM d')}`
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleThisWeek}
                            disabled={isCurrentWeek}
                            className={clsx(
                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                isCurrentWeek
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    : "bg-primary text-white hover:bg-primary/90"
                            )}
                        >
                            This Week
                        </button>
                        <button
                            onClick={handleNextWeek}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                            disabled={weekStartDate && addDays(weekStartDate, 7) > today}
                        >
                            <ChevronRight className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loadingData ? (
                    <>
                        <div className="space-y-1.5 mb-4 flex-1 overflow-y-auto min-h-0">
                            {[...Array(7)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl border-2 border-slate-200 bg-slate-50 animate-pulse">
                                    <div className="flex flex-col gap-1">
                                        <div className="h-4 w-16 bg-slate-200 rounded"></div>
                                        <div className="h-3 w-20 bg-slate-200 rounded"></div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-16 bg-slate-200 rounded"></div>
                                        <div className="flex gap-2">
                                            <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
                                            <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Skeleton Save Button */}
                        <div className="h-12 bg-slate-200 rounded-2xl animate-pulse"></div>
                    </>
                ) : (
                    <>
                        {/* Vertical Day List */}
                        <div className="space-y-1.5 mb-4 flex-1 overflow-y-auto min-h-0">
                            {weekData.map((day) => {
                                const currentCount = modifiedCounts[day.date] ?? day.count;
                                const isModified = day.date in modifiedCounts;
                                const isToday = day.date === format(today, 'yyyy-MM-dd');

                                // Show dash if no record exists and user hasn't modified it yet
                                const shouldShowDash = !day.hasRecord && !day.isFuture && !isModified;
                                const currentLimit = modifiedGoals[day.date] ?? day.limit;
                                const isGoalModified = day.date in modifiedGoals;

                                return (
                                    <div
                                        key={day.date}
                                        className={clsx(
                                            "flex items-center justify-between py-2.5 px-3 rounded-xl border-2 transition-all",
                                            day.isFuture
                                                ? "bg-slate-50 border-slate-100 opacity-50"
                                                : day.isBeforeRegistered
                                                    ? "bg-slate-50 border-slate-100 opacity-75" // Keep neutral for pre-reg
                                                    : shouldShowDash
                                                        ? "bg-red-50 border-red-200 shadow-sm"
                                                        : isModified
                                                            ? "bg-sky-50 border-primary shadow-sm"
                                                            : isGoalModified
                                                                ? "bg-amber-50 border-amber-300 shadow-sm"
                                                                : isToday
                                                                    ? "bg-slate-100 border-slate-300"
                                                                    : "bg-white border-slate-200"
                                        )}
                                    >
                                        {/* Day Info */}
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-slate-700">{day.dayLabel}</p>
                                            <p className="text-xs text-slate-500">{day.dateLabel}</p>
                                        </div>

                                        {day.isFuture ? (
                                            <p className="text-sm text-slate-400">—</p>
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                {/* Count Display */}
                                                <div className="text-right min-w-[3rem]">
                                                    {shouldShowDash ? (
                                                        <>
                                                            <span className={clsx(
                                                                "text-xl font-bold",
                                                                day.isBeforeRegistered ? "text-slate-400" : "text-red-400"
                                                            )}>-</span>
                                                            <span className={clsx("text-sm", editMode === 'target' ? "text-amber-600 font-bold" : "text-slate-400")}>/{currentLimit}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className={clsx("text-xl font-bold text-slate-800", editMode === 'target' && "opacity-50")}>{currentCount}</span>
                                                            <span className={clsx("text-sm", editMode === 'target' ? "text-amber-600 font-bold" : "text-slate-400")}>/{currentLimit}</span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* +/- Buttons */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleCountChange(day.date, -1)}
                                                        disabled={currentCount === 0}
                                                        className={clsx(
                                                            "w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 transition-colors",
                                                            currentCount === 0
                                                                ? "bg-slate-100 cursor-not-allowed opacity-50"
                                                                : "bg-slate-100 hover:bg-slate-200 active:scale-95"
                                                        )}
                                                    >
                                                        <span className="text-xl font-light">−</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleCountChange(day.date, 1)}
                                                        className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors active:scale-95"
                                                    >
                                                        <span className="text-xl font-light">+</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Save Button */}
                        <Button
                            variant="primary"
                            className="w-full text-base h-12 rounded-2xl shadow-lg shadow-sky-200"
                            onClick={handleSaveAll}
                            disabled={!hasChanges || loading}
                        >
                            <Save className="w-5 h-5 mr-2" />
                            {loading ? 'Saving...' : hasChanges ? `Save ${Object.keys(modifiedCounts).length + Object.keys(modifiedGoals).length} Change(s)` : 'No Changes'}
                        </Button>

                        <button
                            onClick={() => setEditMode(prev => prev === 'count' ? 'target' : 'count')}
                            className="w-full mt-3 text-sm text-slate-400 font-medium hover:text-slate-600 transition-colors"
                        >
                            {editMode === 'count' ? 'Adjust Daily Targets' : 'Back to Editing Counts'}
                        </button>
                    </>
                )}
            </div>
        </div >,
        document.body
    );
};
