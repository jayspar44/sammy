import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
    Trophy,
    Star,
    Medal,
    Crown,
    Flame,
    Wallet,
    PiggyBank,
    Lock
} from 'lucide-react';
import Card from '../ui/Card';
import { cn } from '../../utils/cn';
import { api } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { logger } from '../../utils/logger';

// Map icon names from backend to Lucide components
const iconMap = {
    'flame': Flame,
    'trophy': Trophy,
    'crown': Crown,
    'star': Star,
    'medal': Medal,
    'wallet': Wallet,
    'piggy-bank': PiggyBank,
};

// Group milestones by type for display
const typeLabels = {
    'dry_streak': 'Dry Streaks',
    'drinks_saved': 'Drinks Saved',
    'money_saved': 'Money Saved',
};

const MilestoneBadge = ({ milestone }) => {
    const IconComponent = iconMap[milestone.icon] || Trophy;
    const isUnlocked = milestone.isUnlocked;

    return (
        <div
            className={cn(
                'relative flex flex-col items-center p-3 rounded-xl transition-all',
                isUnlocked
                    ? 'bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 border border-amber-200 dark:border-amber-700'
                    : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 opacity-60'
            )}
        >
            {/* Icon */}
            <div
                className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center mb-2',
                    isUnlocked
                        ? 'bg-amber-200 dark:bg-amber-700'
                        : 'bg-slate-200 dark:bg-slate-600'
                )}
            >
                {isUnlocked ? (
                    <IconComponent
                        className={cn(
                            'w-5 h-5',
                            isUnlocked
                                ? 'text-amber-600 dark:text-amber-300'
                                : 'text-slate-400 dark:text-slate-500'
                        )}
                    />
                ) : (
                    <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                )}
            </div>

            {/* Label */}
            <div
                className={cn(
                    'text-xs font-medium text-center leading-tight',
                    isUnlocked
                        ? 'text-amber-800 dark:text-amber-200'
                        : 'text-slate-500 dark:text-slate-400'
                )}
            >
                {milestone.label}
            </div>

            {/* Progress bar for locked milestones */}
            {!isUnlocked && (
                <div className="w-full mt-2">
                    <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-slate-400 dark:bg-slate-500 rounded-full transition-all"
                            style={{ width: `${milestone.progress}%` }}
                        />
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-center">
                        {milestone.progress}%
                    </div>
                </div>
            )}

            {/* Unlocked date */}
            {isUnlocked && milestone.unlockedAt && (
                <div className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-1">
                    {format(new Date(milestone.unlockedAt), 'MMM d')}
                </div>
            )}
        </div>
    );
};

const MilestonesCard = () => {
    const { user } = useAuth();
    const { manualDate } = useUserPreferences();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMilestones = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const dateStr = manualDate || format(new Date(), 'yyyy-MM-dd');
                const result = await api.getMilestones(dateStr);
                setData(result);
            } catch (err) {
                logger.error('Failed to load milestones', err);
            } finally {
                setLoading(false);
            }
        };
        loadMilestones();
    }, [user, manualDate]);

    // Group milestones by type
    const groupedMilestones = data?.milestones?.reduce((acc, milestone) => {
        const type = milestone.type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(milestone);
        return acc;
    }, {}) || {};

    // Count unlocked milestones
    const unlockedCount = data?.milestones?.filter(m => m.isUnlocked).length || 0;
    const totalCount = data?.milestones?.length || 0;

    if (loading) {
        return (
            <Card className="p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded w-32 mb-4" />
                    <div className="grid grid-cols-4 gap-3">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-700 rounded-xl" />
                        ))}
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-50">Milestones</h3>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    {unlockedCount}/{totalCount} unlocked
                </div>
            </div>

            {/* Milestones by type */}
            {Object.entries(groupedMilestones).map(([type, milestones]) => (
                <div key={type} className="mb-4 last:mb-0">
                    <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        {typeLabels[type] || type}
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {milestones.map((milestone) => (
                            <MilestoneBadge key={milestone.id} milestone={milestone} />
                        ))}
                    </div>
                </div>
            ))}

            {/* Stats summary */}
            {data?.stats && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                Current Streak
                            </div>
                            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                {data.stats.currentStreak} days
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                Longest Streak
                            </div>
                            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                {data.stats.longestStreak} days
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                Drinks Saved
                            </div>
                            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {data.stats.drinksSaved}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default MilestonesCard;
