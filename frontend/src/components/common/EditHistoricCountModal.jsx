import { useState, useEffect } from 'react';
import { X, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import { clsx } from 'clsx';
import { createPortal } from 'react-dom';
import { format, subDays, addDays, startOfWeek, isSameWeek } from 'date-fns';
import { api } from '../../api/services';

export const EditHistoricCountModal = ({ isOpen, onClose, onSave, currentDate }) => {
    const [weekStartDate, setWeekStartDate] = useState(null);
    const [weekData, setWeekData] = useState([]);
    const [weekDataCache, setWeekDataCache] = useState({}); // Cache fetched week data
    const [modifiedCounts, setModifiedCounts] = useState({});
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
                const dateStr = format(date, 'yyyy-MM-dd');
                dateInfos.push({
                    date,
                    dateStr,
                    dayLabel: format(date, 'EEE'),
                    dateLabel: format(date, 'MMM d'),
                    isFuture: date > today
                });
            }

            // Batch fetch all stats in parallel
            const statsPromises = dateInfos.map(info =>
                info.isFuture ? Promise.resolve(null) : api.getStats(info.dateStr)
            );
            const statsResults = await Promise.all(statsPromises);

            // Combine data
            const days = dateInfos.map((info, i) => {
                const hasRecord = !info.isFuture && statsResults[i]?.today !== undefined;
                return {
                    date: info.dateStr,
                    dayLabel: info.dayLabel,
                    dateLabel: info.dateLabel,
                    count: info.isFuture ? null : (statsResults[i]?.today?.count ?? 0),
                    limit: info.isFuture ? null : (statsResults[i]?.today?.limit ?? 2),
                    isFuture: info.isFuture,
                    hasRecord: hasRecord
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

        const currentCount = modifiedCounts[date] ?? day.count;
        const newCount = Math.max(0, currentCount + delta);

        setModifiedCounts(prev => ({
            ...prev,
            [date]: newCount
        }));
    };

    const handleSaveAll = async () => {
        setLoading(true);
        try {
            // Save all modified counts
            const updates = Object.entries(modifiedCounts).map(([date, count]) =>
                api.updateHistoricCount(date, count)
            );
            await Promise.all(updates);
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
    const hasChanges = Object.keys(modifiedCounts).length > 0;
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
                    "w-full max-w-2xl bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pb-12 pt-8 relative transition-transform duration-300 ease-out transform",
                    isOpen ? "translate-y-0" : "translate-y-full sm:translate-y-10 sm:scale-95 sm:opacity-0"
                )}
            >
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full sm:hidden" />

                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Edit History</h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </header>

                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-6 bg-slate-50 rounded-xl p-3">
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
                        <div className="space-y-2 mb-6">
                            {[...Array(7)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 bg-slate-50 animate-pulse">
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
                        <div className="h-14 bg-slate-200 rounded-2xl animate-pulse"></div>
                    </>
                ) : (
                    <>
                        {/* Vertical Day List */}
                        <div className="space-y-2 mb-6">
                            {weekData.map((day) => {
                                const currentCount = modifiedCounts[day.date] ?? day.count;
                                const isModified = day.date in modifiedCounts;
                                const isToday = day.date === format(today, 'yyyy-MM-dd');
                                const hasNoRecord = !day.hasRecord && !day.isFuture;

                                return (
                                    <div
                                        key={day.date}
                                        className={clsx(
                                            "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                                            day.isFuture
                                                ? "bg-slate-50 border-slate-100 opacity-50"
                                                : hasNoRecord
                                                    ? "bg-red-50 border-red-200 shadow-sm"
                                                    : isModified
                                                        ? "bg-sky-50 border-primary shadow-sm"
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
                                                    {hasNoRecord ? (
                                                        <>
                                                            <span className="text-xl font-bold text-red-400">—</span>
                                                            <span className="text-sm text-slate-400">/{day.limit}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-xl font-bold text-slate-800">{currentCount}</span>
                                                            <span className="text-sm text-slate-400">/{day.limit}</span>
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
                            className="w-full text-lg h-14 rounded-2xl shadow-xl shadow-sky-200"
                            onClick={handleSaveAll}
                            disabled={!hasChanges || loading}
                        >
                            <Save className="w-5 h-5 mr-2" />
                            {loading ? 'Saving...' : hasChanges ? `Save ${Object.keys(modifiedCounts).length} Change(s)` : 'No Changes'}
                        </Button>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};
