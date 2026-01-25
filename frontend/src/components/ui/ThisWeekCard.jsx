import { Pencil, MessageCircle, Check, X, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { cn } from '../../utils/cn';

/**
 * ThisWeekCard - Displays the current week's drinking plan and progress
 *
 * Props:
 * - weekData: { days: [{date, day, goal, count, status}], totalGoal, totalCount, daysLogged }
 * - hasPlan: boolean - whether user has a weekly plan set
 * - onEditClick: () => void - handler for edit button
 * - onPlanWithSammy: () => void - handler for "Plan with Sammy" CTA
 * - loading: boolean - show loading skeleton
 */
const ThisWeekCard = ({
    weekData,
    hasPlan = false,
    onEditClick,
    onPlanWithSammy,
    loading = false,
    weekLabel = 'This Week',
    onWeekToggle,
    canGoNext = true,
    canGoPrev = false
}) => {
    if (loading) {
        return (
            <Card className="p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
                </div>
                <div className="flex justify-between gap-2 mb-4">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div className="h-3 w-4 bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-full" />
                            <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        </div>
                    ))}
                </div>
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            </Card>
        );
    }

    // Empty state - no week data available
    if (!weekData?.days) {
        return (
            <Card className="p-6">
                <div className="flex items-center gap-1 mb-4">
                    {onWeekToggle && (
                        <button
                            onClick={() => onWeekToggle('prev')}
                            disabled={!canGoPrev}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-30"
                        >
                            <ChevronLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </button>
                    )}
                    <h3 className="font-bold text-slate-800 dark:text-slate-50">{weekLabel}</h3>
                    {onWeekToggle && (
                        <button
                            onClick={() => onWeekToggle('next')}
                            disabled={!canGoNext}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-30"
                        >
                            <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </button>
                    )}
                </div>
                <div className="py-4">
                    <p className="text-slate-500 dark:text-slate-400 mb-4 text-center">
                        No weekly plan set yet
                    </p>
                    <Button
                        variant="primary"
                        className="w-full shadow-md shadow-sky-200/50 py-4 text-lg"
                        onClick={onPlanWithSammy}
                    >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Plan with Sammy
                    </Button>
                </div>
            </Card>
        );
    }

    const { days, totalGoal, totalCount, daysLogged } = weekData;
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const isFutureWeek = weekLabel !== 'This Week';

    // Calculate progress status
    const remaining = totalGoal - totalCount;
    const isOnTrack = remaining >= 0;
    const statusText = isOnTrack
        ? `${totalCount} of ${totalGoal} drinks`
        : `${totalCount} of ${totalGoal} (${Math.abs(remaining)} over)`;

    // Progress message
    let progressMessage = '';
    if (daysLogged === 0) {
        progressMessage = 'No logs yet this week';
    } else if (isOnTrack && remaining > 3) {
        progressMessage = 'Looking good!';
    } else if (isOnTrack && remaining <= 3 && remaining > 0) {
        progressMessage = 'On track';
    } else if (remaining === 0) {
        progressMessage = 'At target';
    } else {
        progressMessage = 'Over target';
    }

    return (
        <Card className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                    {onWeekToggle && (
                        <button
                            onClick={() => onWeekToggle('prev')}
                            disabled={!canGoPrev}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-30"
                        >
                            <ChevronLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </button>
                    )}
                    <h3 className="font-bold text-slate-800 dark:text-slate-50">{weekLabel}</h3>
                    {onWeekToggle && (
                        <button
                            onClick={() => onWeekToggle('next')}
                            disabled={!canGoNext}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-30"
                        >
                            <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </button>
                    )}
                </div>
                <button
                    onClick={onEditClick}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    aria-label="Edit weekly plan"
                >
                    <Pencil className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </button>
            </div>

            {/* 7-Day Grid with row labels */}
            <div className={cn("flex gap-1", !isFutureWeek && "mb-4")}>
                {/* Row labels */}
                <div className="flex flex-col items-end justify-end gap-1 pr-2">
                    <span className="text-[10px] font-bold uppercase text-transparent">D</span>
                    <div className="w-7 h-7 flex items-center justify-center">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Target</span>
                    </div>
                    {!isFutureWeek && (
                        <>
                            <div className="w-7 h-7 flex items-center justify-center">
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">Actual</span>
                            </div>
                            <div className="h-3" />
                        </>
                    )}
                </div>
                {/* Day columns */}
                <div className="flex-1 flex justify-between gap-1">
                    {days.map((day, index) => (
                        <DayColumn
                            key={day.date}
                            label={dayLabels[index]}
                            goal={day.goal}
                            count={day.count}
                            status={day.status}
                            isFutureWeek={isFutureWeek}
                        />
                    ))}
                </div>
            </div>

            {/* Summary - current week shows progress, future week shows total target */}
            {!isFutureWeek ? (
                <div className="flex items-center justify-between text-sm">
                    <span className={cn(
                        "font-medium",
                        isOnTrack ? "text-slate-600 dark:text-slate-400" : "text-amber-600 dark:text-amber-400"
                    )}>
                        {statusText}
                    </span>
                    <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        isOnTrack
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    )}>
                        {progressMessage}
                    </span>
                </div>
            ) : (
                <div className="flex items-center justify-between text-sm mt-4">
                    <span className="font-medium text-slate-600 dark:text-slate-400">
                        {totalGoal} drinks target
                    </span>
                </div>
            )}

            {/* Show Plan with Sammy button if goals exist but no template */}
            {!hasPlan && (
                <Button
                    variant="ghost"
                    className="w-full mt-4 text-primary hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/20"
                    onClick={onPlanWithSammy}
                >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Plan with Sammy
                </Button>
            )}
        </Card>
    );
};

/**
 * DayColumn - Individual day display in the week grid
 */
const DayColumn = ({ label, goal, count, status, isFutureWeek = false }) => {
    // Determine styling based on status
    const getStatusIcon = () => {
        if (status === 'future') return null;
        if (status === 'today' && count === null) return null;
        if (count === null) return <Circle className="w-3 h-3 text-slate-300 dark:text-slate-600" />;
        if (count <= goal) return <Check className="w-3 h-3 text-green-500" />;
        return <X className="w-3 h-3 text-amber-500" />;
    };

    const goalBgClass = cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
        // For future weeks, use consistent styling for all days
        isFutureWeek
            ? "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
            : status === 'future'
                ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                : "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
    );

    const countBgClass = cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
        count === null
            ? "text-slate-300 dark:text-slate-600"
            : count <= goal
                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
    );

    const isToday = status === 'today';

    return (
        <div className="flex-1 flex flex-col items-center gap-1">
            {/* Day label */}
            <span className={cn(
                "text-[10px] font-bold uppercase",
                isToday && !isFutureWeek
                    ? "text-primary dark:text-sky-400"
                    : "text-slate-400 dark:text-slate-500"
            )}>
                {label}
            </span>

            {/* Goal */}
            <div className={goalBgClass}>
                {goal}
            </div>

            {/* Actual count - hide for future weeks */}
            {!isFutureWeek && (
                <div className={countBgClass}>
                    {count !== null ? count : (status !== 'future' ? '·' : '')}
                </div>
            )}

            {/* Status icon - hide for future weeks */}
            {!isFutureWeek && (
                <div className="h-3 flex items-center justify-center">
                    {getStatusIcon()}
                </div>
            )}
        </div>
    );
};

export default ThisWeekCard;
