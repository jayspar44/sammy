import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import Button from '../components/ui/Button';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { cn } from '../utils/cn';
import { api } from '../api/services';
import { format } from 'date-fns';

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
    const { user } = useAuth();
    const { firstName } = useUserPreferences();

    // User Profile Button Logic
    const initial = firstName ? firstName[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'U');

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
                console.error("Failed to load chat history", err);
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
            console.error("Failed to send message", err);
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "Sorry, I'm having trouble connecting right now.",
                sender: 'sammy'
            }]);
        }
    };

    return (
        <div className="flex flex-col h-full relative min-h-screen bg-neutral-50">
            {/* Sticky Header */}
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm">
                            S
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-800 text-sm">Sammy</h1>
                        <p className="text-xs text-slate-500 font-medium">AI Companion</p>
                    </div>
                </div>

                {/* Right Side: Settings Link (Mirrors TopBar) */}
                <NavLink to="/settings" className="relative group">
                    <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md transition-transform active:scale-95",
                        "bg-gradient-to-tr from-sky-400 to-indigo-500 shadow-sky-200"
                    )}>
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            initial
                        )}
                    </div>
                </NavLink>
            </header>

            {/* Messages */}
            <div className="flex-1 p-4 pb-20">
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

            {/* Sticky Input Area */}
            <div className="sticky bottom-[80px] left-0 right-0 bg-transparent p-4 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md border border-slate-100 p-2 rounded-[2rem] shadow-xl flex gap-2 pointer-events-auto">
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
