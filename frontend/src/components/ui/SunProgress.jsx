import React from 'react';
import { cn } from '../../utils/cn';
import Card from './Card';

const SunProgress = ({ current, goal, label = "Daily Goal" }) => {
    const percentage = Math.min(100, Math.max(0, (current / goal) * 100));
    const isOverLimit = current > goal;

    return (
        <Card className="bg-gradient-to-br from-primary to-indigo-600 text-white border-none relative overflow-hidden">
            {/* Decorative sun glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <div className="flex flex-col gap-4 relative z-10">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-primary-light text-sm font-medium mb-1">Today's goal</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold tracking-tight">{current}</span>
                            <span className="text-primary-light font-medium">/ {goal}</span>
                        </div>
                    </div>
                    {/* Optional: Add an icon or secondary stat here */}
                </div>

                <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-1000 ease-out",
                            isOverLimit ? "bg-secondary" : "bg-white"
                        )}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        </Card>
    );
};

export default SunProgress;
