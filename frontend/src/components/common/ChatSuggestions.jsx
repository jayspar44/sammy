import { cn } from '../../utils/cn';

/**
 * ChatSuggestions - Quick-reply suggestion chips for chat
 *
 * Props:
 * - suggestions: string[] - Array of suggestion texts
 * - onSelect: (suggestion: string) => void - Handler when a suggestion is tapped
 * - context: 'default' | 'weekly_planning' | 'morning_checkin' - Current chat context
 */
const ChatSuggestions = ({ suggestions = [], onSelect, context: _context = 'default' }) => {
    if (!suggestions || suggestions.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2 py-2">
            {suggestions.map((suggestion, index) => (
                <button
                    key={index}
                    onClick={() => onSelect(suggestion)}
                    className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        "bg-white border border-slate-200 text-slate-700",
                        "hover:bg-slate-50 hover:border-slate-300",
                        "active:scale-95",
                        "dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300",
                        "dark:hover:bg-slate-700 dark:hover:border-slate-600",
                        // Primary styling for first suggestion
                        index === 0 && "bg-primary/10 border-primary/20 text-primary dark:bg-sky-900/30 dark:border-sky-800 dark:text-sky-400"
                    )}
                >
                    {suggestion}
                </button>
            ))}
        </div>
    );
};

/**
 * Get suggestions based on context and state
 */
export const getSuggestionsForContext = (context, hasPlan = false, dayOfWeek = new Date().getDay()) => {
    // Sunday = 0, Monday = 1, etc.
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;
    const isMonday = dayOfWeek === 1;

    switch (context) {
        case 'weekly_planning':
            if (hasPlan) {
                return [
                    'Keep same plan',
                    'Go lighter this week',
                    'Add a dry day'
                ];
            }
            return [
                '2 per day',
                '3 on weekends, 1 weekdays',
                'Help me decide'
            ];

        case 'morning_checkin':
            return [
                '0',
                '1',
                '2',
                '3+'
            ];

        default:
            // Default suggestions based on day of week
            if (isSunday || isMonday) {
                return hasPlan
                    ? ['How was my week?', 'Update my plan']
                    : ['Plan my week', 'How am I doing?'];
            }
            if (isWeekend) {
                return ['Log today', 'How am I doing?'];
            }
            return ['How am I doing?', 'Tips for tonight'];
    }
};

export default ChatSuggestions;
