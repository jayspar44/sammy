import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { Link } from 'react-router-dom';

const Home = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [todayLog, setTodayLog] = useState({ count: 0 });

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/logs');
            setLogs(res.data);

            const today = new Date().toISOString().split('T')[0];
            const todayEntry = res.data.find(l => l.date === today);
            if (todayEntry) {
                setTodayLog(todayEntry.habits?.drinking || { count: 0 });
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    const updateLog = async (delta) => {
        const today = new Date().toISOString().split('T')[0];
        const newCount = Math.max(0, (todayLog.count || 0) + delta);

        try {
            await api.post('/logs', {
                date: today,
                habits: {
                    drinking: { count: newCount }
                }
            });
            setTodayLog(prev => ({ ...prev, count: newCount }));
            fetchLogs(); // refresh list
        } catch (error) {
            console.error('Error updating log:', error);
        }
    };

    return (
        <div>
            <div className="card">
                <h2>Hello, {user.displayName}</h2>
                <p>Today's Count</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                    <button onClick={() => updateLog(-1)}>-</button>
                    <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{todayLog.count || 0}</span>
                    <button onClick={() => updateLog(1)}>+</button>
                </div>
            </div>

            <div className="card">
                <h3>History</h3>
                {logs.slice(0, 5).map(log => (
                    <div key={log.date} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                        <span>{log.date}</span>
                        <span>{log.habits?.drinking?.count || 0}</span>
                    </div>
                ))}
            </div>

            <nav className="nav-bar">
                <Link to="/">Home</Link>
                <Link to="/companion">Companion</Link>
            </nav>
        </div>
    );
};

export default Home;
