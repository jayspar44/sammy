import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { getVersionString } from '../../utils/appConfig';
import Wordmark from '../ui/Wordmark';

export const TopBar = () => {
    const { user } = useAuth();
    const { firstName } = useUserPreferences();
    const location = useLocation();
    const navigate = useNavigate();

    const displayName = firstName || user?.email || 'Friend';

    const isOnSettings = location.pathname === '/settings';

    const handleSettingsClick = (e) => {
        if (isOnSettings) {
            e.preventDefault();
            navigate(-1);
        }
    };

    return (
        <header className="relative flex items-center justify-between px-6 py-4 bg-surface/50 backdrop-blur-sm sticky top-0 z-40">
            {/* Left: Logo and greeting */}
            <div className="flex items-center gap-3">
                <Wordmark variant="icon" size="sm" />
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                        Hi, {displayName}
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Ready to shine?</p>
                </div>
            </div>

            {/* Center: Version string (absolute positioned, top aligned) */}
            <div className="absolute left-1/2 top-4 -translate-x-1/2">
                <p className="text-slate-400 font-mono text-[10px]">{getVersionString()}</p>
            </div>

            {/* Right: Settings button */}
            {isOnSettings ? (
                <button onClick={handleSettingsClick} className="relative group">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg shadow-sky-200 transition-transform active:scale-95 bg-primary">
                        <Settings className="w-5 h-5" />
                    </div>
                </button>
            ) : (
                <NavLink to="/settings" className="relative group">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sky-700 transition-transform active:scale-95 bg-sky-100 hover:bg-sky-200">
                        <Settings className="w-5 h-5" />
                    </div>
                </NavLink>
            )}
        </header>
    );
};
