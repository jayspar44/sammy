import React, { useState } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';

const Companion = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I\'m Sammy. How are you feeling today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/chat', { message: userMsg.content });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble connecting. Try again?' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ paddingBottom: '60px' }}>
            <div className="card" style={{ height: '70vh', overflowY: 'auto' }}>
                {messages.map((m, i) => (
                    <div key={i} style={{
                        marginBottom: '10px',
                        textAlign: m.role === 'user' ? 'right' : 'left'
                    }}>
                        <div style={{
                            display: 'inline-block',
                            padding: '8px 12px',
                            borderRadius: '12px',
                            background: m.role === 'user' ? '#4a90e2' : '#f0f0f0',
                            color: m.role === 'user' ? 'white' : 'black'
                        }}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {loading && <div>Sammy is typing...</div>}
            </div>

            <div style={{ position: 'fixed', bottom: '60px', left: 0, right: 0, padding: '10px', background: 'white', display: 'flex', gap: '10px' }}>
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={e => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage} disabled={loading}>Send</button>
            </div>

            <nav className="nav-bar">
                <Link to="/">Home</Link>
                <Link to="/companion">Companion</Link>
            </nav>
        </div>
    );
};

export default Companion;
