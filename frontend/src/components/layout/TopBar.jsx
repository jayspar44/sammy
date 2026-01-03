import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { cn } from '../../utils/cn';

export const TopBar = () => {
    const { user } = useAuth();
    const { firstName } = useUserPreferences();
    const location = useLocation();
    const navigate = useNavigate();

    const displayName = firstName || user?.email || 'Friend';
    const initial = firstName ? firstName[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'S');

    const isOnSettings = location.pathname === '/settings';

    const handleAvatarClick = (e) => {
        if (isOnSettings) {
            e.preventDefault();
            navigate(-1);
        }
    };

    return (
        <header className="flex justify-between items-center px-6 py-4 bg-surface/50 backdrop-blur-sm sticky top-0 z-40">
            <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                    Hi, {displayName}
                </h1>
                <p className="text-slate-500 font-medium text-sm">Ready to shine?</p>
            </div>
            {isOnSettings ? (
                <button onClick={handleAvatarClick} className="relative group">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg transition-transform active:scale-95",
                        "bg-gradient-to-tr from-sky-400 to-indigo-500 shadow-sky-200"
                    )}>
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            initial
                        )}
                    </div>
                </button>
            ) : (
                <NavLink to="/settings" className="relative group">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg transition-transform active:scale-95",
                        "bg-gradient-to-tr from-sky-400 to-indigo-500 shadow-sky-200"
                    )}>
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            initial
                        )}
                    </div>
                </NavLink>
            )}
        </header>
    );
};
