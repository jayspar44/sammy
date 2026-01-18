import React, { createContext, useContext, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // Initialize theme from localStorage, default to 'system'
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('sammy_pref_theme') || 'system';
    });

    // Get system preference
    const getSystemPreference = () => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    // Resolve effective theme (system -> dark/light)
    const resolveTheme = (themeValue) => {
        if (themeValue === 'system') {
            return getSystemPreference();
        }
        return themeValue;
    };

    // Apply theme to document root
    useEffect(() => {
        const root = document.documentElement;
        const effectiveTheme = resolveTheme(theme);

        if (effectiveTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    // Listen for system preference changes when theme is 'system'
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            const root = document.documentElement;
            const effectiveTheme = resolveTheme('system');

            if (effectiveTheme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            // Fallback for older browsers
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, [theme]);

    // Re-check system preference when app resumes from background (Android fix)
    useEffect(() => {
        if (theme !== 'system' || !Capacitor.isNativePlatform()) return;

        const listener = App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                // Force re-evaluation when app becomes active
                const root = document.documentElement;
                const effectiveTheme = resolveTheme('system');

                // Update CSS class
                if (effectiveTheme === 'dark') {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }

                // Update StatusBar
                if (effectiveTheme === 'dark') {
                    StatusBar.setStyle({ style: Style.Dark });
                    StatusBar.setBackgroundColor({ color: '#1e293b' });
                } else {
                    StatusBar.setStyle({ style: Style.Light });
                    StatusBar.setBackgroundColor({ color: '#0ea5e9' });
                }
            }
        });

        return () => listener.remove();
    }, [theme]);

    // Update StatusBar based on theme (Android/iOS)
    // Note: Style.Dark = light/white icons, Style.Light = dark/black icons
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            const effectiveTheme = resolveTheme(theme);
            if (effectiveTheme === 'dark') {
                // Dark mode: light icons on dark background
                StatusBar.setStyle({ style: Style.Dark });
                StatusBar.setBackgroundColor({ color: '#1e293b' }); // slate-800
            } else {
                // Light mode: dark icons on light blue background
                StatusBar.setStyle({ style: Style.Light });
                StatusBar.setBackgroundColor({ color: '#0ea5e9' }); // sky-500
            }
        }
    }, [theme]);

    // Persist theme to localStorage
    useEffect(() => {
        localStorage.setItem('sammy_pref_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => {
            if (prev === 'light') return 'dark';
            if (prev === 'dark') return 'system';
            return 'light'; // system -> light
        });
    };

    const effectiveTheme = resolveTheme(theme);

    const value = {
        theme, // 'light', 'dark', or 'system'
        effectiveTheme, // resolved to 'light' or 'dark'
        setTheme,
        toggleTheme,
        isDark: effectiveTheme === 'dark'
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
