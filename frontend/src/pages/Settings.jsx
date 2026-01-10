/* global __BUILD_TIMESTAMP__, __GIT_HASH__, __GIT_BRANCH__ */
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { User, Code, LogOut, Save, Info, Calendar, Moon } from 'lucide-react';
import { cn } from '../utils/cn';
import { api } from '../api/services';
import { logger } from '../utils/logger';
import { App } from '@capacitor/app';
import { TypicalWeekModal } from '../components/common/TypicalWeekModal';

export default function Settings() {
    const { logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const {
        firstName,
        registeredDate,
        avgDrinkCost,
        avgDrinkCals,
        updateProfileConfig,
        profileLoading,
        chatHistoryEnabled,
        typicalWeek,
        developerMode,
        setDeveloperMode,
        spoofDb,
        setSpoofDb,
        manualDate,
        setManualDate
    } = useUserPreferences();

    const [nameInput, setNameInput] = useState('');
    const [costInput, setCostInput] = useState(10);
    const [calsInput, setCalsInput] = useState(150);
    const [appInfo, setAppInfo] = useState({ id: '', version: '', build: '' });
    const [showTypicalWeekModal, setShowTypicalWeekModal] = useState(false);

    useEffect(() => {
        logger.debug('Settings Sync:', { firstName, avgDrinkCost, avgDrinkCals });
        setNameInput(firstName || '');
        setCostInput(avgDrinkCost || 10);
        setCalsInput(avgDrinkCals || 150);
    }, [firstName, avgDrinkCost, avgDrinkCals]);

    useEffect(() => {
        App.getInfo().then(info => {
            setAppInfo({ id: info.id, version: info.version, build: info.build });
        }).catch(() => {
            // Web fallback
            setAppInfo({ id: 'web', version: import.meta.env.VITE_APP_VERSION || 'unknown', build: '' });
        });
    }, []);

    const handleSaveProfile = async () => {
        await updateProfileConfig({
            firstName: nameInput,
            avgDrinkCost: parseFloat(costInput),
            avgDrinkCals: parseInt(calsInput)
        });
        // Optional: Show success toast
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            logger.error('Logout failed', error);
        }
    };

    const handleSaveTypicalWeek = async (weekData) => {
        try {
            await updateProfileConfig({ typicalWeek: weekData });
            setShowTypicalWeekModal(false);
        } catch (error) {
            logger.error('Failed to save typical week', error);
            throw error;
        }
    };

    return (
        <div className="p-6 pb-8 space-y-6 animate-fadeIn min-h-full dark:bg-slate-900">
            {/* Profile Section */}
            <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider dark:text-slate-500">Profile</h3>
                <Card className="p-4 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-sky-100 p-2 rounded-full text-sky-600 dark:bg-sky-900 dark:text-sky-400">
                            <User className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">Personal Info</span>
                    </div>

                    {profileLoading ? (
                        <div className="space-y-4 animate-pulse">
                            <div>
                                <div className="h-4 w-20 bg-slate-200 rounded mb-1" />
                                <div className="h-10 bg-slate-100 rounded-xl" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="h-4 w-16 bg-slate-200 rounded mb-1" />
                                    <div className="h-10 bg-slate-100 rounded-xl" />
                                </div>
                                <div>
                                    <div className="h-4 w-20 bg-slate-200 rounded mb-1" />
                                    <div className="h-10 bg-slate-100 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 dark:text-slate-400">First Name</label>
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                                    placeholder="Your Name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 dark:text-slate-400">Avg Cost ($)</label>
                                    <input
                                        type="number"
                                        value={costInput}
                                        onChange={(e) => setCostInput(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                                        placeholder="10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 dark:text-slate-400">Avg Calories</label>
                                    <input
                                        type="number"
                                        value={calsInput}
                                        onChange={(e) => setCalsInput(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                                        placeholder="150"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={handleSaveProfile}
                        disabled={profileLoading}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>

                </Card>
            </section>

            {/* Appearance Section */}
            <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider dark:text-slate-500">Appearance</h3>
                <Card className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "p-2 rounded-full transition-colors",
                                isDark ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400" : "bg-slate-100 text-slate-500"
                            )}>
                                <Moon className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="font-bold text-slate-700 dark:text-slate-200 block">Dark Mode</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">Reduce eye strain in low light</span>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isDark}
                                onChange={() => toggleTheme()}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-900 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 dark:peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                </Card>
            </section>

            {/* Typical Week Baseline Section */}
            <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider dark:text-slate-500">Typical Week Baseline</h3>
                <Card className="p-4 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-amber-100 p-2 rounded-full text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="font-bold text-slate-700 dark:text-slate-200">Your Typical Drinking Pattern</span>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Used for baseline calculations and progress tracking</p>
                        </div>
                    </div>

                    {profileLoading ? (
                        <div className="animate-pulse">
                            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                                {[...Array(7)].map((_, i) => (
                                    <div key={i} className="flex flex-col items-center p-2 sm:p-3 bg-slate-100 rounded-lg">
                                        <div className="h-3 w-6 bg-slate-200 rounded mb-1" />
                                        <div className="h-6 w-4 bg-slate-200 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : typicalWeek ? (
                        <>
                            {/* Horizontal Day Display */}
                            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                                    const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][index];
                                    const count = typicalWeek[dayKey] || 0;
                                    return (
                                        <div key={day} className="flex flex-col items-center p-2 sm:p-3 bg-slate-50 rounded-lg border border-slate-200 dark:bg-slate-700 dark:border-slate-600">
                                            <div className="text-xs font-semibold text-slate-500 mb-1 dark:text-slate-400">{day}</div>
                                            <div className="text-xl font-bold text-slate-800 dark:text-slate-200">{count}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Weekly Total */}
                            <div className="flex items-center justify-between px-2 py-2 bg-sky-50 rounded-lg border border-sky-100 dark:bg-sky-900/30 dark:border-sky-800">
                                <span className="text-sm font-semibold text-sky-800 dark:text-sky-300">Weekly Total:</span>
                                <span className="text-lg font-bold text-sky-600 dark:text-sky-400">
                                    {Object.values(typicalWeek).reduce((sum, val) => sum + (val || 0), 0)} drinks
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-6 px-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 dark:bg-slate-700 dark:border-slate-600">
                            <p className="text-sm text-slate-600 mb-1 dark:text-slate-300">No typical week baseline set</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Set your baseline to track progress</p>
                        </div>
                    )}

                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => setShowTypicalWeekModal(true)}
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        {typicalWeek ? 'Edit Baseline' : 'Set Baseline'}
                    </Button>
                </Card>
            </section>

            {/* Privacy Section */}
            <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider dark:text-slate-500">Privacy & Data</h3>
                <Card className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-semibold text-slate-700 block text-sm dark:text-slate-200">Chat History</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">Save conversations for 7 days</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={chatHistoryEnabled}
                                onChange={(e) => updateProfileConfig({ chatHistoryEnabled: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-900 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 dark:peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
                        <Button
                            variant="outline"
                            className="w-full text-red-500 border-red-100 hover:bg-red-50"
                            onClick={async () => {
                                if (window.confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
                                    try {
                                        await api.clearChatHistory();
                                        // Optional: show toast
                                    } catch (err) {
                                        logger.error('Failed to clear history', err);
                                    }
                                }
                            }}
                        >
                            <span className="w-2 h-2 rounded-full bg-red-400 mr-2" />
                            Clear Chat History
                        </Button>
                    </div>
                </Card>
            </section>

            {/* Developer Section */}
            <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider dark:text-slate-500">Advanced</h3>
                <Card className="p-4 space-y-4 border-amber-100/50 dark:border-amber-900/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-full transition-colors", developerMode ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400")}>
                                <Code className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="font-bold text-slate-700 block dark:text-slate-200">Developer Mode</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">Unlock advanced testing tools</span>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={developerMode} onChange={(e) => setDeveloperMode(e.target.checked)} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-900 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 dark:peer-checked:bg-amber-600"></div>
                        </label>
                    </div>

                    {developerMode && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-slideUp dark:border-slate-700">
                            {/* Spoof DB */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Spoof Database</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={spoofDb} onChange={(e) => setSpoofDb(e.target.checked)} />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 dark:peer-checked:bg-amber-600"></div>
                                </label>
                            </div>

                            {/* Manual Date */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 dark:text-slate-400">Simulate Date</label>
                                <input
                                    type="date"
                                    value={manualDate || ''}
                                    onChange={(e) => setManualDate(e.target.value)}
                                    className="w-full bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200"
                                />
                                {manualDate && (
                                    <button onClick={() => setManualDate(null)} className="text-xs text-amber-600 underline mt-1 dark:text-amber-400">Reset to Today</button>
                                )}
                            </div>

                            {/* Registered Date (Manual Override) */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Registered Date</label>
                                    <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">Careful!</span>
                                </div>
                                <input
                                    type="date"
                                    value={registeredDate?.split('T')[0] || ''}
                                    onChange={(e) => updateProfileConfig({ registeredDate: e.target.value })}
                                    className="w-full bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200"
                                />
                            </div>
                        </div>
                    )}
                </Card>
            </section>

            {/* Account Section */}
            <section className="space-y-4">
                <Button variant="outline" className="w-full border-red-100 text-red-500 hover:bg-red-50" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                </Button>
            </section>

            {/* App Info Section */}
            <section className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                    <Info className="w-4 h-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">App Info</h3>
                </div>
                <div className="text-xs text-slate-400 space-y-1 dark:text-slate-500">
                    <p>Sammy: v{__APP_VERSION__}</p>
                    {appInfo.version && appInfo.id !== 'web' && (
                        <p>Native: v{appInfo.version}{appInfo.build ? ` (${appInfo.build})` : ''}</p>
                    )}
                    <p className="break-all">
                        App ID: {appInfo.id || 'loading...'}
                        {appInfo.id?.includes('.local') ? (
                            <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-medium">LOCAL</span>
                        ) : appInfo.id?.includes('.dev') ? (
                            <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded text-[10px] font-medium">DEV</span>
                        ) : appInfo.id === 'web' ? (
                            <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">WEB</span>
                        ) : appInfo.id ? (
                            <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[10px] font-medium">PROD</span>
                        ) : null}
                    </p>
                    <p className="break-all">
                        Backend: {import.meta.env.VITE_API_URL || 'local'}
                        {import.meta.env.VITE_API_URL?.includes('localhost') || import.meta.env.VITE_API_URL?.includes('10.0.2.2') || !import.meta.env.VITE_API_URL ? (
                            <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-medium">LOCAL</span>
                        ) : import.meta.env.VITE_API_URL?.includes('-dev') ? (
                            <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded text-[10px] font-medium">DEV</span>
                        ) : (
                            <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[10px] font-medium">PROD</span>
                        )}
                    </p>
                    <p>
                        Built: {new Date(__BUILD_TIMESTAMP__).toLocaleString()}
                    </p>
                    <p>
                        Commit: {__GIT_HASH__}
                        {__GIT_BRANCH__ !== 'main' && __GIT_BRANCH__ !== 'unknown' && (
                            <span className="ml-2 text-slate-300">({__GIT_BRANCH__})</span>
                        )}
                    </p>
                </div>
            </section>

            {/* Typical Week Modal */}
            <TypicalWeekModal
                isOpen={showTypicalWeekModal}
                onClose={() => setShowTypicalWeekModal(false)}
                onSave={handleSaveTypicalWeek}
                initialData={typicalWeek}
            />
        </div>
    );
}
