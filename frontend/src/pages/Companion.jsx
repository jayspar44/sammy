import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Send } from 'lucide-react';
import Button from '../components/ui/Button';
import ChatMessage from '../components/common/ChatMessage';
import { api } from '../api/services';
import { format } from 'date-fns';
import { logger } from '../utils/logger';

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
        <>
            {/* Messages */}
            <div className="p-4 bg-neutral-50 dark:bg-slate-900 min-h-full">
                {messages.map(msg => (
                    <ChatMessage key={msg.id} {...msg} />
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
                <div ref={bottomRef} />
            </div>

            {/* Chat input - rendered via portal outside the scroll area */}
            <ChatInput input={input} setInput={setInput} handleSend={handleSend} />
        </>
    );
}
