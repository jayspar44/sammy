import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Sparkles, Plus, Pencil } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import SunProgress from '../components/ui/SunProgress';
import ThisWeekCard from '../components/ui/ThisWeekCard';
import ConfettiCanvas from '../components/common/ConfettiCanvas';
import { cn } from '../utils/cn';
import { LogDrinkModal } from '../components/common/LogDrinkModal';
import { SetGoalModal } from '../components/common/SetGoalModal';
import { EditHistoricCountModal } from '../components/common/EditHistoricCountModal';
import { WeeklyPlanModal } from '../components/common/WeeklyPlanModal';
import { Last7DaysSummaryModal } from '../components/common/Last7DaysSummaryModal';
import { api } from '../api/services';
import { useAuth } from '../contexts/AuthContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { logger } from '../utils/logger';

const WeeklyTrend = ({ data = [], currentDateStr }) => {
    // Generate last 7 days including today (currentDateStr)
    // Order: [Today-6, Today-5, ..., Today]
    const chartData = Array.from({ length: 7 }, (_, i) => {
        // Parse strictly as local midnight to avoid UTC shifts
        // Assuming currentDateStr is YYYY-MM-DD
        const anchor = currentDateStr ? new Date(currentDateStr + 'T00:00:00') : new Date();
        const d = new Date(anchor);
        d.setDate(anchor.getDate() - (6 - i));

        const dStr = format(d, 'yyyy-MM-dd');
        const dayLabel = format(d, 'EEEEE'); // 'M', 'T', 'W'...

        const log = data.find(l => l.date === dStr);
        // Distinguish between 0 (logged 0) and null (no log)
        // Adjust logic: If we want to treat "no record" as "no bar", we pass null.
        // If we want "no record" to IMPLIED 0, we'd use 0. 
        // User requested explicit difference. 
        // Assuming API returns 'undefined' for missing days in 'data' array.
        let val = null;
        if (log) {
            val = log.count;
        }

        return {
            val,
            label: dayLabel,
            isToday: i === 6
        };
    });

    const maxVal = Math.max(...chartData.map(d => d.val || 0), 5); // Minimum scale of 5

    return (
        <div className="flex gap-2 h-32">
                {/* Y-Axis */}
                <div className="flex flex-col justify-between text-xs text-slate-400 font-medium py-1 dark:text-slate-500">
                    <span>{Math.ceil(maxVal)}</span>
                    <span>{Math.ceil(maxVal / 2)}</span>
                    <span>0</span>
                </div>

                {/* Chart Area */}
                <div className="flex-1 flex justify-between items-end gap-3 h-full">
                    {chartData.map((d, i) => {
                        let barColor = "bg-slate-200"; // Default (null/no data placeholder?)
                        let height = "0%";

                        if (d.val === null) {
                            // No Record -> No bar
                            height = "0px";
                        } else if (d.val === 0) {
                            // Zero drinks -> Primary Blue (Goal)
                            barColor = "bg-primary dark:bg-sky-400";
                            height = "8px";
                        } else {
                            // Positive value -> Pale Blue
                            barColor = "bg-sky-200 dark:bg-sky-900";
                            height = `${Math.min((d.val / maxVal) * 100, 100)}%`;
                        }

                        return (
                            <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-2 group cursor-pointer relative">
                                {d.val !== null && (
                                    <span className="text-[10px] font-bold text-primary animate-fadeIn -mb-1 dark:text-sky-400">{d.val}</span>
                                )}
                                {/* Bar */}
                                <div
                                    className={cn(
                                        "w-full rounded-t-sm transition-all duration-500 relative",
                                        barColor
                                    )}
                                    style={{ height }}
                                />

                                {/* Label */}
                                <span className={cn(
                                    "text-xs font-bold",
                                    d.isToday ? "text-primary dark:text-sky-400" : "text-slate-400 dark:text-slate-500"
                                )}>
                                    {d.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
    );
};

export default function Home() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { manualDate } = useUserPreferences();
    const [stats, setStats] = useState({ count: 0, limit: 2 });
    const [statsLoading, setStatsLoading] = useState(true);
    const [trends, setTrends] = useState([]);
    const [showLogModal, setShowLogModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showWeeklyPlanModal, setShowWeeklyPlanModal] = useState(false);
    const [showLast7DaysModal, setShowLast7DaysModal] = useState(false);
    const [hasLoggedToday, setHasLoggedToday] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [weekPlan, setWeekPlan] = useState(null);
    const [weekPlanLoading, setWeekPlanLoading] = useState(true);
    const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, 1 = next week

    const fetchStats = async () => {
        setStatsLoading(true);
        try {
            // Ensure we use the same date string for the chart prop
            const todayStr = manualDate || format(new Date(), 'yyyy-MM-dd');

            const data = await api.getStats(todayStr);
            if (data.today) {
                setStats({ count: data.today.count, limit: data.today.limit });
            }
            if (data.trends) {
                setTrends(data.trends);
                // Check if user has logged for today
                const todayLog = data.trends.find(log => log.date === todayStr);
                setHasLoggedToday(!!todayLog);
            }
        } catch (err) {
            logger.error('Failed to fetch stats', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchWeeklyPlan = async () => {
        setWeekPlanLoading(true);
        try {
            const baseDate = manualDate ? new Date(manualDate + 'T00:00:00') : new Date();
            const targetDate = new Date(baseDate);
            targetDate.setDate(targetDate.getDate() + (weekOffset * 7));
            const dateStr = format(targetDate, 'yyyy-MM-dd');
            const data = await api.getWeeklyPlan(dateStr);
            setWeekPlan(data);
        } catch (err) {
            logger.error('Failed to fetch weekly plan', err);
        } finally {
            setWeekPlanLoading(false);
        }
    };

    const handleWeekToggle = (direction) => {
        setWeekOffset(direction === 'next' ? 1 : 0);
    };

    useEffect(() => {
        if (user) {
            fetchStats();
            fetchWeeklyPlan();
        }
    }, [user, manualDate, weekOffset]);

    const handleLogDrink = async (count) => {
        const date = manualDate || format(new Date(), 'yyyy-MM-dd');
        try {
            await api.logDrink(date, count);
            setShowLogModal(false);
            fetchStats(); // Refresh
            fetchWeeklyPlan(); // Refresh weekly plan
        } catch (err) {
            logger.error('Failed to log drink', err);
        }
    };

    // Separate handler for "I stayed dry today" button with optimistic update + confetti
    const handleStayedDry = async () => {
        const date = manualDate || format(new Date(), 'yyyy-MM-dd');
        // Optimistic update - immediately show the new state
        setStats(prev => ({ ...prev, count: 0 }));
        setHasLoggedToday(true);
        setShowConfetti(true);

        try {
            await api.logDrink(date, 0);
            // Silently refresh trends and weekly plan in background without loading state
            const data = await api.getStats(date);
            if (data.trends) {
                setTrends(data.trends);
            }
            fetchWeeklyPlan();
        } catch (err) {
            logger.error('Failed to log drink', err);
            // Revert on error
            fetchStats();
        }
    };

    const handleSetGoal = async (newGoal) => {
        try {
            const date = manualDate || format(new Date(), 'yyyy-MM-dd');
            await api.updateUserProfile({ dailyGoal: newGoal, date });
            setShowGoalModal(false);
            fetchStats(); // Refresh to see new limit
        } catch (err) {
            logger.error('Failed to set goal', err);
        }
    };

    const handleSaveWeeklyPlan = async (targets, isRecurring) => {
        try {
            const todayStr = manualDate || format(new Date(), 'yyyy-MM-dd');
            // Calculate Monday of current week for weekStartDate
            const today = new Date(todayStr);
            const dayOfWeek = today.getDay();
            const monday = new Date(today);
            monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            const weekStartDate = format(monday, 'yyyy-MM-dd');

            await api.setWeeklyPlan(targets, weekStartDate, isRecurring);
            setShowWeeklyPlanModal(false);
            fetchWeeklyPlan(); // Refresh
            fetchStats(); // Refresh stats too in case goals changed
        } catch (err) {
            logger.error('Failed to save weekly plan', err);
        }
    };

    const handlePlanWithSammy = () => {
        navigate('/companion', { state: { context: 'weekly_planning' } });
    };

    return (
        <div className="p-6 pt-8 animate-fadeIn min-h-full dark:bg-slate-900">
            {/* Hero */}
            <div className="mb-8 animate-slideUp">
                {statsLoading ? (
                    <div className="animate-pulse">
                        <div className="bg-slate-200 dark:bg-slate-700 rounded-3xl p-5 h-[120px]">
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="h-4 w-32 bg-slate-300 dark:bg-slate-600 rounded mb-2" />
                                        <div className="h-9 w-20 bg-slate-300 dark:bg-slate-600 rounded" />
                                    </div>
                                </div>
                                <div className="h-3 w-full bg-slate-300 dark:bg-slate-600 rounded-full" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div onClick={() => setShowGoalModal(true)} className="cursor-pointer active:scale-95 transition-transform">
                        <SunProgress
                            current={stats.count}
                            goal={stats.limit}
                            hasLogged={hasLoggedToday}
                            date={manualDate || format(new Date(), 'yyyy-MM-dd')}
                        />
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <Card className="mb-8 p-6 animate-slideUp" style={{ animationDelay: '150ms' }}>
                <h3 className="font-bold text-slate-800 dark:text-slate-50 mb-4">Quick Actions</h3>
                <Button
                    variant="primary"
                    className="w-full shadow-md shadow-sky-200/50 py-4 text-lg mb-3"
                    onClick={handleStayedDry}
                >
                    <Sparkles className="w-5 h-5 mr-2" />
                    I stayed dry today
                </Button>

                <Button
                    variant="ghost"
                    className="w-full bg-sky-100 text-sky-700 hover:bg-sky-200 py-3 dark:bg-sky-900/30 dark:text-sky-300 dark:hover:bg-sky-900/50"
                    onClick={() => setShowLogModal(true)}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Log Drink
                </Button>
            </Card>

            {/* This Week Card */}
            <div className="mb-8 animate-slideUp" style={{ animationDelay: '200ms' }}>
                <ThisWeekCard
                    weekData={weekPlan?.currentWeek}
                    hasPlan={weekPlan?.hasPlan}
                    onEditClick={() => setShowWeeklyPlanModal(true)}
                    onPlanWithSammy={handlePlanWithSammy}
                    loading={weekPlanLoading}
                    weekLabel={weekOffset === 0 ? 'This Week' : 'Next Week'}
                    onWeekToggle={handleWeekToggle}
                    canGoPrev={weekOffset > 0}
                    canGoNext={weekOffset < 1}
                />
            </div>

            {/* Weekly Trend */}
            <Card
                className="p-6 animate-slideUp"
                style={{ animationDelay: '300ms' }}
            >
                <div
                    className="flex items-center justify-between mb-4 cursor-pointer"
                    onClick={() => setShowLast7DaysModal(true)}
                >
                    <h3 className="font-bold text-slate-800 dark:text-slate-50">Last 7 days</h3>
                    <span className="text-xs text-primary font-medium dark:text-sky-400">
                        View Summary
                    </span>
                </div>

                {/* Quick stats row */}
                {trends.length > 0 && (
                    <div className="flex items-center gap-3 mb-4 text-xs">
                        <span className="text-slate-600 dark:text-slate-400">
                            {trends.slice(0, 7).reduce((sum, d) => sum + (d.count || 0), 0)} drinks
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <span className="text-green-600 dark:text-green-400">
                            {trends.slice(0, 7).filter(d => d.count === 0).length} dry days
                        </span>
                    </div>
                )}

                <div
                    className="cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => setShowEditModal(true)}
                >
                    <WeeklyTrend data={trends} currentDateStr={manualDate || format(new Date(), 'yyyy-MM-dd')} />
                </div>

                <Button
                    variant="ghost"
                    className="w-full mt-4 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    onClick={() => setShowEditModal(true)}
                >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit History
                </Button>
            </Card>


            <LogDrinkModal
                isOpen={showLogModal}
                onClose={() => setShowLogModal(false)}
                onConfirm={handleLogDrink}
            />

            <SetGoalModal
                isOpen={showGoalModal}
                onClose={() => setShowGoalModal(false)}
                onConfirm={handleSetGoal}
                currentGoal={stats.limit}
            />

            <EditHistoricCountModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={fetchStats}
                currentDate={manualDate || format(new Date(), 'yyyy-MM-dd')}
            />

            <WeeklyPlanModal
                isOpen={showWeeklyPlanModal}
                onClose={() => setShowWeeklyPlanModal(false)}
                onSave={handleSaveWeeklyPlan}
                currentPlan={weekPlan?.template}
                onChatWithSammy={() => {
                    setShowWeeklyPlanModal(false);
                    handlePlanWithSammy();
                }}
            />

            <Last7DaysSummaryModal
                isOpen={showLast7DaysModal}
                onClose={() => setShowLast7DaysModal(false)}
                currentDate={manualDate || format(new Date(), 'yyyy-MM-dd')}
            />

            {/* Confetti celebration for staying dry */}
            <ConfettiCanvas
                trigger={showConfetti}
                onComplete={() => setShowConfetti(false)}
            />
        </div>
    );
}
