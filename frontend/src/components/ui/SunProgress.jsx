import React from 'react';
import { format } from 'date-fns';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import Card from './Card';

const SunProgress = ({ current, goal, hasLogged = false, date = null }) => {
    const percentage = Math.min(100, Math.max(0, (current / goal) * 100));
    const isOverLimit = current > goal;

    // Format date as "Sat 3rd"
    const formattedDate = date ? format(new Date(date + 'T00:00:00'), 'EEE do') : '';

    return (
        <Card className="bg-gradient-to-br from-primary to-indigo-600 text-white border-none relative overflow-hidden">
            {/* Decorative sun glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <div className="flex flex-col gap-4 relative z-10">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-primary-light font-bold">
                                Today's goal {formattedDate && `(${formattedDate})`}
                            </p>
                            {hasLogged && (
                                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 animate-fadeIn">
                                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                </div>
                            )}
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-bold tracking-tight">{hasLogged ? current : '-'}</span>
                            <span className="text-2xl text-primary-light font-medium">/ {goal}</span>
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
