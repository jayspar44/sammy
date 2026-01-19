import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { TrendingUp, Info } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import Card from '../ui/Card';
import { cn } from '../../utils/cn';
import { api } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { logger } from '../../utils/logger';

const CumulativeSavingsChart = () => {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const { manualDate, typicalWeek } = useUserPreferences();

    const [mode, setMode] = useState('benchmark'); // 'benchmark' or 'target'
    const [range, setRange] = useState('90d'); // '90d' or 'all'
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            setLoading(true);
            setError(null);
            try {
                const dateStr = manualDate || format(new Date(), 'yyyy-MM-dd');
                const result = await api.getCumulativeStats(mode, range, dateStr);
                setData(result);
            } catch (err) {
                logger.error('Failed to load cumulative stats', err);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user, mode, range, manualDate]);

    // Check if user has set typicalWeek from profile context (not API response)
    const canUseBenchmark = typicalWeek !== null && Object.keys(typicalWeek).length > 0;

    // Format data for chart - sample if too many points
    const chartData = (() => {
        if (!data?.series) return [];
        const series = data.series;

        // If more than 90 data points, sample to ~90 for readability
        if (series.length > 90) {
            const step = Math.ceil(series.length / 90);
            return series.filter((_, i) => i % step === 0 || i === series.length - 1);
        }
        return series;
    })();

    // Calculate min/max for Y axis
    const yValues = chartData.map(d => d.cumulative);
    const minY = Math.min(0, ...yValues);
    const maxY = Math.max(0, ...yValues);
    const yPadding = Math.max(Math.abs(maxY - minY) * 0.1, 2);

    // Colors based on theme
    const colors = {
        positive: isDark ? '#34d399' : '#10b981', // emerald
        negative: isDark ? '#f87171' : '#ef4444', // red
        line: isDark ? '#6ee7b7' : '#059669',
        grid: isDark ? '#334155' : '#e2e8f0',
        text: isDark ? '#94a3b8' : '#64748b',
        tooltip: {
            bg: isDark ? '#1e293b' : '#ffffff',
            border: isDark ? '#334155' : '#e2e8f0',
            text: isDark ? '#f1f5f9' : '#1e293b'
        }
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const item = payload[0].payload;
        const dateObj = new Date(item.date + 'T00:00:00');

        return (
            <div
                className="px-3 py-2 rounded-lg shadow-lg border text-sm"
                style={{
                    backgroundColor: colors.tooltip.bg,
                    borderColor: colors.tooltip.border,
                    color: colors.tooltip.text
                }}
            >
                <div className="font-medium mb-1">
                    {format(dateObj, 'MMM d, yyyy')}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400">Daily:</span>
                    <span className={item.daily >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                        {item.daily >= 0 ? '+' : ''}{item.daily}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400">Total:</span>
                    <span className={item.cumulative >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                        {item.cumulative >= 0 ? '+' : ''}{item.cumulative}
                    </span>
                </div>
            </div>
        );
    };

    // Format X axis tick
    const formatXTick = (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        return format(d, 'M/d');
    };

    // Determine tick interval based on data length
    const tickInterval = Math.ceil(chartData.length / 6);

    return (
        <Card className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-50">Drinks Saved</h3>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* Mode Toggle */}
                <div className="flex rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
                    <button
                        onClick={() => canUseBenchmark && setMode('benchmark')}
                        disabled={!canUseBenchmark}
                        className={cn(
                            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors relative',
                            mode === 'benchmark'
                                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-50 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
                            !canUseBenchmark && 'opacity-50 cursor-not-allowed'
                        )}
                        title={!canUseBenchmark ? 'Set your typical week in Settings first' : undefined}
                    >
                        vs Baseline
                        {!canUseBenchmark && (
                            <Info className="w-3 h-3 ml-1 inline-block" />
                        )}
                    </button>
                    <button
                        onClick={() => setMode('target')}
                        className={cn(
                            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                            mode === 'target'
                                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-50 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        )}
                    >
                        vs Target
                    </button>
                </div>

                {/* Range Toggle */}
                <div className="flex rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
                    <button
                        onClick={() => setRange('90d')}
                        className={cn(
                            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                            range === '90d'
                                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-50 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        )}
                    >
                        90 Days
                    </button>
                    <button
                        onClick={() => setRange('all')}
                        className={cn(
                            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                            range === 'all'
                                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-50 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        )}
                    >
                        All Time
                    </button>
                </div>
            </div>

            {/* Chart */}
            {loading ? (
                <div className="h-48 animate-pulse bg-slate-100 dark:bg-slate-700 rounded-xl" />
            ) : error ? (
                <div className="h-48 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    {error}
                </div>
            ) : chartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    No data yet. Start logging to see your progress!
                </div>
            ) : (
                <>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={colors.positive} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={colors.positive} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatXTick}
                                    tick={{ fontSize: 10, fill: colors.text }}
                                    axisLine={{ stroke: colors.grid }}
                                    tickLine={false}
                                    interval={tickInterval}
                                />
                                <YAxis
                                    domain={[Math.floor(minY - yPadding), Math.ceil(maxY + yPadding)]}
                                    tick={{ fontSize: 10, fill: colors.text }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={35}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <ReferenceLine y={0} stroke={colors.grid} strokeDasharray="3 3" />
                                <Area
                                    type="monotone"
                                    dataKey="cumulative"
                                    stroke={colors.line}
                                    strokeWidth={2}
                                    fill="url(#colorPositive)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Summary */}
                    {data?.summary && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-6">
                            <div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                    Total Saved
                                </div>
                                <div className={cn(
                                    'text-xl font-bold',
                                    data.summary.totalSaved >= 0
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-red-600 dark:text-red-400'
                                )}>
                                    {data.summary.totalSaved >= 0 ? '+' : ''}{data.summary.totalSaved}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                    Avg/Week
                                </div>
                                <div className={cn(
                                    'text-xl font-bold',
                                    data.summary.avgPerWeek >= 0
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-red-600 dark:text-red-400'
                                )}>
                                    {data.summary.avgPerWeek >= 0 ? '+' : ''}{data.summary.avgPerWeek}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                    Days
                                </div>
                                <div className="text-xl font-bold text-slate-800 dark:text-slate-50">
                                    {data.summary.totalDays}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </Card>
    );
};

export default CumulativeSavingsChart;
