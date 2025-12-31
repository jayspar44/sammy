import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Zap, DollarSign, Flame, Calendar, TrendingDown, Wallet } from 'lucide-react';
import Card from '../components/ui/Card';
import { cn } from '../utils/cn';
import { api } from '../api/services';
import { useAuth } from '../contexts/AuthContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';

const StatCard = ({ icon: Icon, label, value, theme = 'emerald', className }) => {
    const themes = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        sky: 'bg-sky-50 text-sky-600 border-sky-100',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    };

    return (
        <Card className={cn("flex flex-col items-start justify-between p-5 gap-3 transition-transform active:scale-95", themes[theme], className)}>
            <div className="p-2 bg-white/60 rounded-xl backdrop-blur-sm">
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <div className="text-2xl font-bold tracking-tight mb-1">{value}</div>
                <div className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</div>
            </div>
        </Card>
    );
};

export default function Insights() {
    const { user } = useAuth();
    const { manualDate } = useUserPreferences();
    const [stats, setStats] = useState({
        moneySaved: 0,
        caloriesCut: 0,
        dryStreak: 0,
        trends: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            if (!user) return;
            try {
                const todayStr = manualDate || format(new Date(), 'yyyy-MM-dd');
                const data = await api.getStats(todayStr);
                setStats({
                    moneySaved: data.insights?.moneySaved || 0,
                    caloriesCut: data.insights?.caloriesCut || 0,
                    dryStreak: data.insights?.dryStreak || 0,
                    trends: data.trends || []
                });
            } catch (err) {
                console.error("Failed to load insights", err);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, [user, manualDate]);

    // Transform trends for the chart
    // We want last 30 days. API returns 'trends' which is an array of logs.
    // We need to fill in gaps for the chart.
    const monthlyData = Array.from({ length: 30 }, (_, i) => {
        const anchor = manualDate ? new Date(manualDate) : new Date();
        const d = new Date(anchor);
        d.setDate(anchor.getDate() - (29 - i)); // Go back 29 days to today

        // Use format() to match the 'yyyy-MM-dd' string from API (Local Time)
        // new Date().toISOString() uses UTC, which causes off-by-one mismatches
        const dStr = format(d, 'yyyy-MM-dd');

        const log = stats.trends.find(l => l.date === dStr);
        let val = null;
        if (log) val = log.count;

        return {
            day: d.getDate(),
            val
        };
    });

    const maxVal = Math.max(...monthlyData.map(d => d.val || 0), 5);

    return (
        <div className="p-6 pt-8 pb-24 animate-fadeIn">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-1">Your Progress</h1>
                <p className="text-slate-500 font-medium">Keep up the momentum!</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <StatCard
                    icon={Wallet}
                    label="Money Saved"
                    value={`$${stats.moneySaved}`}
                    theme="emerald"
                    className="border"
                />
                <StatCard
                    icon={TrendingDown}
                    label="Calories Cut"
                    value={`${stats.caloriesCut}`} // Format nicely if > 1000? e.g. 2.4k
                    theme="amber"
                    className="border"
                />
            </div>

            {/* Streak Card - Full Width */}
            <Card className="mb-8 bg-indigo-600 text-white border-none flex items-center justify-between p-6 shadow-lg shadow-indigo-200">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Zap className="w-6 h-6 text-yellow-300 fill-current" />
                    </div>
                    <div>
                        <div className="text-sm text-indigo-100 font-medium uppercase tracking-wider">Dry Streak</div>
                        <div className="text-3xl font-bold">{stats.dryStreak} Days</div>
                    </div>
                </div>
                <div className="text-indigo-200">
                    <TrendingDown className="w-6 h-6 rotate-180" />
                </div>
            </Card>

            {/* Monthly Trend */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <h3 className="font-bold text-slate-800">Last 30 Days</h3>
                </div>

                <div className="flex gap-2 h-40">
                    {/* Y-Axis */}
                    <div className="flex flex-col justify-between text-xs text-slate-400 font-medium py-1">
                        <span>{Math.ceil(maxVal)}</span>
                        <span>{Math.ceil(maxVal / 2)}</span>
                        <span>0</span>
                    </div>

                    <div className="flex-1 flex items-end gap-1 h-full">
                        {monthlyData.map((d, i) => {
                            let barColor = "bg-slate-100";
                            let height = "0px";

                            if (d.val === null) {
                                height = "0px";
                            } else if (d.val === 0) {
                                barColor = "bg-primary";
                                height = "8px"; // Match Home.jsx visual weight
                            } else {
                                barColor = "bg-sky-200";
                                height = `${Math.min((d.val / maxVal) * 100, 100)}%`;
                            }

                            return (
                                <div key={i} className="flex-1 h-full flex flex-col justify-end group relative cursor-pointer" title={`Day ${d.day}: ${d.val ?? 'No Log'}`}>
                                    <div
                                        className={cn(
                                            "w-full rounded-t-sm transition-all hover:opacity-80",
                                            barColor
                                        )}
                                        style={{ height }}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="mt-4 flex justify-between text-xs text-slate-400 font-bold tracking-wider">
                    <span>30 days ago</span>
                    <span>Today</span>
                </div>
            </Card>
        </div>
    );
}
