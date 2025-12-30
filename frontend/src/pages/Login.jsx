import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const { loginEmail, signup, user } = useAuth();
    const navigate = useNavigate();

    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSignup) {
                await signup(email, password);
            } else {
                await loginEmail(email, password);
            }
        } catch (err) {
            console.error("Auth error:", err);
            // Improve error messages
            if (err.code === 'auth/invalid-credential') {
                setError('Invalid email or password.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('Email is already in use.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else {
                setError('Failed to ' + (isSignup ? 'create account' : 'log in'));
            }
        }

        setLoading(false);
    };



    return (
        <div className="card" style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
            <h1>Sammy</h1>
            <p className="subtitle">Your AI Habit Companion</p>

            {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', padding: '0.5rem', background: '#ffebee', borderRadius: '4px' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />

                <button type="submit" disabled={loading} style={{ background: 'var(--primary)', color: 'white' }}>
                    {loading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Log In')}
                </button>
            </form>

            <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                <button
                    onClick={() => setIsSignup(!isSignup)}
                    style={{ background: 'none', color: 'var(--primary)', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
                >
                    {isSignup ? 'Log In' : 'Sign Up'}
                </button>
            </div>
        </div>
    );
};

export default Login;
