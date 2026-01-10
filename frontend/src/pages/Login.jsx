import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowRight } from 'lucide-react';
import Wordmark from '../components/ui/Wordmark';
import { logger } from '../utils/logger';

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
            logger.error('Auth error:', err);
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 animate-fadeIn dark:bg-slate-900">
            <Card className="w-full max-w-md p-8 shadow-xl bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                <div className="text-center mb-8">
                    <Wordmark variant="full" size="lg" className="justify-center" />
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder:text-slate-500"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder:text-slate-500"
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full h-12 mt-2 shadow-lg shadow-sky-200 text-lg"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Sign In')}
                        {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center dark:border-slate-700">
                    <p className="text-slate-500 text-sm mb-3 dark:text-slate-400">
                        {isSignup ? 'Already have an account?' : "Don't have an account?"}
                    </p>
                    <Button
                        variant="ghost"
                        className="w-full hover:bg-slate-50 text-slate-600 dark:hover:bg-slate-700 dark:text-slate-300"
                        onClick={() => setIsSignup(!isSignup)}
                    >
                        {isSignup ? 'Sign In' : 'Create Account'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default Login;
