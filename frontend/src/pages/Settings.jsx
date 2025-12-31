import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { User, Code, LogOut, Save } from 'lucide-react';
import { cn } from '../utils/cn';
import { api } from '../api/services';

export default function Settings() {
    const { logout } = useAuth();
    const {
        firstName,
        saveFirstName,
        avgDrinkCost,
        avgDrinkCals,
        updateProfileConfig,
        profileLoading,
        chatHistoryEnabled,
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

    useEffect(() => {
        console.log("[DEBUG] Settings Sync:", { firstName, avgDrinkCost, avgDrinkCals });
        setNameInput(firstName || '');
        setCostInput(avgDrinkCost || 10);
        setCalsInput(avgDrinkCals || 150);
    }, [firstName, avgDrinkCost, avgDrinkCals]);

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
            console.error("Logout failed", error);
        }
    };

    return (
        <div className="p-6 pb-24 space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">Settings</h2>

            {/* Profile Section */}
            <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Profile</h3>
                <Card className="p-4 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-sky-100 p-2 rounded-full text-sky-600">
                            <User className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-slate-700">Personal Info</span>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">First Name</label>
                        <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Your Name"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Avg Cost ($)</label>
                            <input
                                type="number"
                                value={costInput}
                                onChange={(e) => setCostInput(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="10"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Avg Calories</label>
                            <input
                                type="number"
                                value={calsInput}
                                onChange={(e) => setCalsInput(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="150"
                            />
                        </div>
                    </div>

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

            {/* Privacy Section */}
            <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Privacy & Data</h3>
                <Card className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-semibold text-slate-700 block text-sm">Chat History</span>
                            <span className="text-xs text-slate-400">Save conversations for 7 days</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={chatHistoryEnabled}
                                onChange={(e) => updateProfileConfig({ chatHistoryEnabled: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                        </label>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <Button
                            variant="outline"
                            className="w-full text-red-500 border-red-100 hover:bg-red-50"
                            onClick={async () => {
                                if (window.confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
                                    try {
                                        await api.clearChatHistory();
                                        // Optional: show toast
                                    } catch (err) {
                                        console.error("Failed to clear history", err);
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
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Advanced</h3>
                <Card className="p-4 space-y-4 border-amber-100/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-full transition-colors", developerMode ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500")}>
                                <Code className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="font-semibold text-slate-700 block">Developer Mode</span>
                                <span className="text-xs text-slate-400">Unlock advanced testing tools</span>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={developerMode} onChange={(e) => setDeveloperMode(e.target.checked)} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                    </div>

                    {developerMode && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-slideUp">
                            {/* Spoof DB */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-600">Spoof Database</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={spoofDb} onChange={(e) => setSpoofDb(e.target.checked)} />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                                </label>
                            </div>

                            {/* Manual Date */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Simulate Date</label>
                                <input
                                    type="date"
                                    value={manualDate || ''}
                                    onChange={(e) => setManualDate(e.target.value)}
                                    className="w-full bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-900"
                                />
                                {manualDate && (
                                    <button onClick={() => setManualDate(null)} className="text-xs text-amber-600 underline mt-1">Reset to Today</button>
                                )}
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
        </div >
    );
}
