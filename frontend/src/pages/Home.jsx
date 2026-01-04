import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Sparkles, Plus, Calendar } from 'lucide-react';
import Button from '../components/ui/Button';
import SunProgress from '../components/ui/SunProgress';
import { cn } from '../utils/cn';
import { LogDrinkModal } from '../components/common/LogDrinkModal';
import { SetGoalModal } from '../components/common/SetGoalModal';
import { EditHistoricCountModal } from '../components/common/EditHistoricCountModal';
import { api } from '../api/services';
import { useAuth } from '../contexts/AuthContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';

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
        <div className="mb-4">
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                    Weekly Trend
                </h3>
            </div>

            <div className="flex gap-2 h-32 px-2">
                {/* Y-Axis */}
                <div className="flex flex-col justify-between text-xs text-slate-400 font-medium py-1">
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
                            barColor = "bg-primary";
                            height = "8px";
                        } else {
                            // Positive value -> Pale Blue
                            barColor = "bg-sky-200";
                            height = `${Math.min((d.val / maxVal) * 100, 100)}%`;
                        }

                        return (
                            <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-2 group cursor-pointer relative">
                                {d.val === 0 && (
                                    <span className="text-[10px] font-bold text-primary animate-fadeIn -mb-1">0</span>
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
                                    d.isToday ? "text-primary" : "text-slate-400"
                                )}>
                                    {d.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default function Home() {
    const { user } = useAuth();
    const { manualDate } = useUserPreferences();
    const [stats, setStats] = useState({ count: 0, limit: 2 });
    const [trends, setTrends] = useState([]);
    const [showLogModal, setShowLogModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [hasLoggedToday, setHasLoggedToday] = useState(false);

    const fetchStats = async () => {
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
            console.error("Failed to fetch stats", err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchStats();
        }
    }, [user, manualDate]);

    const handleLogDrink = async (count) => {
        const date = manualDate || format(new Date(), 'yyyy-MM-dd');
        try {
            await api.logDrink(date, count);
            setShowLogModal(false);
            fetchStats(); // Refresh
        } catch (err) {
            console.error("Failed to log drink", err);
            alert("Failed to log drink");
        }
    };

    const handleSetGoal = async (newGoal) => {
        try {
            const date = manualDate || format(new Date(), 'yyyy-MM-dd');
            await api.updateUserProfile({ dailyGoal: newGoal, date });
            setShowGoalModal(false);
            fetchStats(); // Refresh to see new limit
        } catch (err) {
            console.error("Failed to set goal", err);
            alert("Failed to set goal");
        }
    };

    return (
        <div className="p-6 pt-8 animate-fadeIn">
            {/* Hero */}
            {/* Hero */}
            <div className="mb-8 animate-slideUp">
                <div onClick={() => setShowGoalModal(true)} className="cursor-pointer active:scale-95 transition-transform">
                    <SunProgress
                        current={stats.count}
                        goal={stats.limit}
                        hasLogged={hasLoggedToday}
                        date={manualDate || format(new Date(), 'yyyy-MM-dd')}
                    />
                </div>
            </div>

            {/* EXPICIT ACTION BUTTONS - Moved Above Weekly Trend */}
            <div className="mb-10 animate-slideUp" style={{ animationDelay: '200ms' }}>
                <Button
                    variant="primary"
                    className="w-full shadow-lg shadow-sky-200/50 py-4 text-lg mb-3"
                    onClick={() => handleLogDrink(0)}
                >
                    <Sparkles className="w-5 h-5 mr-2" />
                    I stayed dry today
                </Button>

                <Button
                    variant="ghost"
                    className="w-full bg-sky-100 text-sky-700 hover:bg-sky-200 py-3"
                    onClick={() => setShowLogModal(true)}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Log Drink
                </Button>
            </div>

            {/* Weekly Trend - Moved Below */}
            <div className="animate-slideUp" style={{ animationDelay: '300ms' }}>
                <WeeklyTrend data={trends} currentDateStr={manualDate || format(new Date(), 'yyyy-MM-dd')} />

                {/* Edit History Button */}
                <Button
                    variant="ghost"
                    className="w-full mt-4 bg-slate-50 text-slate-600 hover:bg-slate-100 py-2.5"
                    onClick={() => setShowEditModal(true)}
                >
                    <Calendar className="w-4 h-4 mr-2" />
                    Edit History
                </Button>
            </div>

            {/* EXPICIT ACTION BUTTON */}


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
        </div>
    );
}
