import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import Button from '../components/ui/Button';
import { cn } from '../utils/cn';
import { api } from '../api/services';
import { format } from 'date-fns';
import { TopBar } from '../components/layout/TopBar';
import { logger } from '../utils/logger';

const Message = ({ text, sender }) => {
    const isUser = sender === 'user';
    return (
        <div className={cn("flex mb-4 animate-slideUp", isUser ? "justify-end" : "justify-start")}>
            <div className={cn(
                "max-w-[80%] p-3 text-sm leading-relaxed shadow-sm transition-all",
                isUser
                    ? "bg-primary text-white rounded-2xl rounded-tr-none"
                    : "bg-surface text-slate-700 border border-slate-100 rounded-2xl rounded-tl-none"
            )}>
                {text}
            </div>
        </div>
    );
};

export default function Companion() {
    const bottomRef = useRef(null);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const history = await api.getChatHistory();
                if (history && history.length > 0) {
                    setMessages(history);
                } else {
                    // Default welcome if no history
                    setMessages([{ id: 'welcome', text: "Hi! How are you feeling today?", sender: 'sammy' }]);
                }
            } catch (err) {
                logger.error('Failed to load chat history', err);
            }
        };
        loadHistory();
    }, []);

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const response = await api.sendMessage(userMsg.text, todayStr);

            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: response.text,
                sender: 'sammy'
            }]);
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

    return (
        <div className="flex flex-col h-full relative bg-neutral-50">
            <TopBar />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                {messages.map(msg => (
                    <Message key={msg.id} {...msg} />
                ))}
                {isTyping && (
                    <div className="flex justify-start mb-4 animate-pulse">
                        <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 flex gap-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Area - in flex flow, above navbar */}
            <div className="px-4 py-2 bg-neutral-50">
                <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-2 rounded-[2rem] shadow-xl flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent px-4 text-sm focus:outline-none font-medium text-slate-700 min-w-0"
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
            </div>
        </div>
    );
}
