import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { Send, Bell } from 'lucide-react';
import Button from '../components/ui/Button';
import ChatMessage from '../components/common/ChatMessage';
import { api } from '../api/services';
import { format, subDays } from 'date-fns';
import { logger } from '../utils/logger';

// Inline status message component (not a chat bubble)
const StatusMessage = ({ icon: Icon, text }) => (
    <div className="flex items-center justify-center gap-2 py-3 my-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full">
            {Icon && <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">{text}</span>
        </div>
    </div>
);

// Chat input component - rendered via portal outside the scroll area
const ChatInput = ({ input, setInput, handleSend }) => {
    const portalTarget = document.getElementById('companion-chat-portal');
    if (!portalTarget) return null;

    return createPortal(
        <div
            className="absolute left-0 right-0 px-4 py-2 z-30"
            style={{ bottom: 'calc(1.5rem + 4rem + 4px + var(--safe-area-bottom, 0))' }}
        >
            <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-2 rounded-[2rem] shadow-xl flex gap-2 dark:bg-slate-800/95 dark:border-slate-700">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent px-4 text-sm focus:outline-none font-medium text-slate-700 min-w-0 dark:text-slate-200 placeholder:dark:text-slate-500"
                />
                <Button
                    size="icon"
                    variant="primary"
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="rounded-full w-10 h-10 shrink-0 p-0 shadow-none"
                >
                    <Send className="w-4 h-4 ml-0.5" />
                </Button>
            </div>
        </div>,
        portalTarget
    );
};

export default function Companion() {
    const location = useLocation();
    const bottomRef = useRef(null);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [chatContext, setChatContext] = useState(null); // 'morning_checkin' or null

    const loadHistory = useCallback(async () => {
        try {
            const history = await api.getChatHistory();
            if (history && history.length > 0) {
                return history;
            }
            return [];
        } catch (err) {
            logger.error('Failed to load chat history', err);
            return [];
        }
    }, []);

    const handleMorningCheckin = useCallback(async () => {
        setIsLoading(true);
        try {
            // Load existing chat history first
            const history = await loadHistory();

            // Calculate yesterday's date for display
            const yesterday = subDays(new Date(), 1);
            const yesterdayFormatted = format(yesterday, 'EEEE, MMM d'); // e.g., "Friday, Jan 17"

            // Add inline status message about morning check-in
            const statusMessage = {
                id: 'morning-checkin-status',
                type: 'status',
                icon: 'bell',
                text: `Morning check-in for ${yesterdayFormatted}`
            };

            // Send request to backend to get personalized greeting and persist it
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const response = await api.sendMessage(
                '__MORNING_CHECKIN_INIT__',
                todayStr,
                'morning_checkin'
            );

            // Display history + status + greeting
            setMessages([
                ...history,
                statusMessage,
                {
                    id: Date.now(),
                    text: response.text,
                    sender: 'sammy'
                }
            ]);
        } catch (err) {
            logger.error('Failed to initialize morning check-in', err);
            // Fallback: show history + status + generic message
            const history = await loadHistory();
            const yesterday = subDays(new Date(), 1);
            const yesterdayFormatted = format(yesterday, 'EEEE, MMM d');

            setMessages([
                ...history,
                {
                    id: 'morning-checkin-status',
                    type: 'status',
                    icon: 'bell',
                    text: `Morning check-in for ${yesterdayFormatted}`
                },
                {
                    id: 'morning-checkin-fallback',
                    text: "Good morning! ☀️ How did yesterday go? How many drinks did you have?",
                    sender: 'sammy'
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [loadHistory]);

    useEffect(() => {
        const initChat = async () => {
            setIsLoading(true);
            // Check if we're coming from a notification tap
            const routeContext = location.state?.context;

            if (routeContext === 'morning_checkin') {
                // Handle morning check-in flow
                setChatContext('morning_checkin');
                await handleMorningCheckin();
            } else {
                // Normal chat flow - load history
                const history = await loadHistory();
                if (history.length > 0) {
                    setMessages(history);
                } else {
                    setMessages([{ id: 'welcome', text: "Hi! How are you feeling today?", sender: 'sammy' }]);
                }
                setIsLoading(false);
            }
        };

        initChat();
    }, [location.state?.context, handleMorningCheckin, loadHistory]);

    const initialScrollDone = useRef(false);

    const scrollToBottom = (instant = false) => {
        bottomRef.current?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' });
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messages.length > 0) {
            // Use instant scroll on initial load, smooth scroll for new messages
            if (!initialScrollDone.current) {
                scrollToBottom(true);
                initialScrollDone.current = true;
            } else {
                scrollToBottom(false);
            }
        }
    }, [messages, isTyping]);

    // Reset initial scroll flag when component remounts (e.g., navigation)
    useEffect(() => {
        initialScrollDone.current = false;
    }, []);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            // Pass context to API if we're in morning_checkin mode
            const response = await api.sendMessage(userMsg.text, todayStr, chatContext);

            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: response.text,
                sender: 'sammy'
            }]);

            // If this was a morning checkin conversation, clear the context after first exchange
            if (chatContext === 'morning_checkin') {
                setChatContext(null);
            }
        } catch (err) {
            logger.error('Failed to send message', err);
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "Sorry, I'm having trouble connecting right now.",
                sender: 'sammy'
            }]);
        }
    };

    // Loading indicator component
    const LoadingIndicator = () => (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="flex gap-1 mb-3">
                <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Loading chat...</span>
        </div>
    );

    return (
        <>
            {/* Messages */}
            <div className="p-4 bg-neutral-50 dark:bg-slate-900 min-h-full">
                {isLoading ? (
                    <LoadingIndicator />
                ) : (
                    <>
                        {messages.map(msg => (
                            msg.type === 'status' ? (
                                <StatusMessage key={msg.id} icon={Bell} text={msg.text} />
                            ) : (
                                <ChatMessage key={msg.id} {...msg} />
                            )
                        ))}
                        {isTyping && (
                            <div className="flex justify-start mb-4 animate-pulse">
                                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 flex gap-1 dark:bg-slate-800 dark:border-slate-700">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce dark:bg-slate-500" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce dark:bg-slate-500" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce dark:bg-slate-500" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Chat input - rendered via portal outside the scroll area */}
            <ChatInput input={input} setInput={setInput} handleSend={handleSend} />
        </>
    );
}
