import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/services';
import { useAuth } from './AuthContext';

const UserPreferencesContext = createContext();

export const useUserPreferences = () => useContext(UserPreferencesContext);

export const UserPreferencesProvider = ({ children }) => {
    const { user } = useAuth();

    // -- Local Preferences --
    // Developer Mode Master Switch
    const [developerMode, setDeveloperMode] = useState(() => {
        return localStorage.getItem('sammy_pref_devMode') === 'true';
    });

    // Spoof DB (only active if devMode is on)
    const [spoofDb, setSpoofDb] = useState(() => {
        return localStorage.getItem('sammy_pref_spoofDb') === 'true';
    });

    // Manual Date (for testing "future/past" logic)
    const [manualDate, setManualDate] = useState(null);

    // -- Backend User Profile --
    const [firstName, setFirstName] = useState('');
    const [registeredDate, setRegisteredDate] = useState(null);
    const [avgDrinkCost, setAvgDrinkCost] = useState(10);
    const [avgDrinkCals, setAvgDrinkCals] = useState(150);
    const [chatHistoryEnabled, setChatHistoryEnabled] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);

    // Persistence Effects
    useEffect(() => {
        localStorage.setItem('sammy_pref_devMode', developerMode);
        // If turning off dev mode, assume we want to turn off spoofing too to prevent confusion?
        // Let's keep them independent for now, but UI should hide 'spoofDb' if !developerMode
    }, [developerMode]);

    useEffect(() => {
        if (developerMode) {
            localStorage.setItem('sammy_pref_spoofDb', spoofDb);
        } else {
            // Optional: reset spoofing when dev mode disabled?
            // localStorage.removeItem('sammy_pref_spoofDb'); 
            // For now, let's leave it so it remembers state when toggled back on.
        }
    }, [spoofDb, developerMode]);

    // Fetch Profile on Load / Auth Change
    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                try {
                    setProfileLoading(true);
                    console.log("[DEBUG] Fetching User Profile...");
                    const data = await api.getUserProfile();
                    console.log("[DEBUG] Profile Data Received:", data);

                    if (data) {
                        if (data.firstName !== undefined) setFirstName(data.firstName);
                        if (data.registeredDate) setRegisteredDate(data.registeredDate);
                        if (data.avgDrinkCost !== undefined) setAvgDrinkCost(data.avgDrinkCost);
                        if (data.avgDrinkCals !== undefined) setAvgDrinkCals(data.avgDrinkCals);
                        if (data.chatHistoryEnabled !== undefined) setChatHistoryEnabled(data.chatHistoryEnabled);
                    }
                } catch (error) {
                    console.error("Failed to load user profile", error);
                } finally {
                    setProfileLoading(false);
                }
            } else {
                setFirstName('');
                setRegisteredDate(null);
            }
        };

        fetchProfile();
    }, [user, spoofDb]); // re-fetch if spoofDb Toggled

    const saveFirstName = async (name) => {
        try {
            await api.updateUserProfile({ firstName: name });
            setFirstName(name);
            return true;
        } catch (e) {
            console.error("Failed to save name", e);
            throw e;
        }
    };

    const updateProfileConfig = async (updates) => {
        try {
            await api.updateUserProfile(updates);
            if (updates.firstName !== undefined) setFirstName(updates.firstName);
            if (updates.registeredDate !== undefined) setRegisteredDate(updates.registeredDate);
            if (updates.avgDrinkCost !== undefined) setAvgDrinkCost(updates.avgDrinkCost);
            if (updates.avgDrinkCals !== undefined) setAvgDrinkCals(updates.avgDrinkCals);
            if (updates.chatHistoryEnabled !== undefined) setChatHistoryEnabled(updates.chatHistoryEnabled);
            return true;
        } catch (e) {
            console.error("Failed to save config", e);
            throw e;
        }
    };

    const value = {
        developerMode,
        setDeveloperMode,
        spoofDb,
        setSpoofDb,
        manualDate,
        setManualDate,
        firstName,
        registeredDate,
        saveFirstName,
        avgDrinkCost,
        avgDrinkCals,
        chatHistoryEnabled,
        updateProfileConfig,
        profileLoading
    };

    return (
        <UserPreferencesContext.Provider value={value}>
            {children}
        </UserPreferencesContext.Provider>
    );
};
