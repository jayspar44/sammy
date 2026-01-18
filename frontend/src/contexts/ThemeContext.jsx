import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
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
    const getSystemPreference = useCallback(() => {
        if (typeof window === 'undefined') return 'light'; // SSR fallback
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }, []);

    // Resolve effective theme (system -> dark/light)
    const resolveTheme = useCallback((themeValue) => {
        if (themeValue === 'system') {
            return getSystemPreference();
        }
        return themeValue;
    }, [getSystemPreference]);

    // Helper: Apply theme to DOM
    const applyThemeToDOM = useCallback((effectiveTheme) => {
        const root = document.documentElement;
        if (effectiveTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, []);

    // Helper: Update StatusBar with error handling
    const updateStatusBar = useCallback((effectiveTheme) => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            if (effectiveTheme === 'dark') {
                // Dark mode: light/white icons on dark background
                StatusBar.setStyle({ style: Style.Dark });
                StatusBar.setBackgroundColor({ color: '#1e293b' }); // slate-800
            } else {
                // Light mode: dark/black icons on light blue background
                StatusBar.setStyle({ style: Style.Light });
                StatusBar.setBackgroundColor({ color: '#0ea5e9' }); // sky-500
            }
        } catch (err) {
            // StatusBar may not be available on all devices/platforms
            console.warn('Failed to update StatusBar:', err);
        }
    }, []);

    // Apply theme to DOM and StatusBar
    useEffect(() => {
        const effectiveTheme = resolveTheme(theme);
        applyThemeToDOM(effectiveTheme);
        updateStatusBar(effectiveTheme);
    }, [theme, resolveTheme, applyThemeToDOM, updateStatusBar]);

    // Listen for system preference changes when theme is 'system'
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            const effectiveTheme = resolveTheme('system');
            applyThemeToDOM(effectiveTheme);
            updateStatusBar(effectiveTheme);
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
    }, [theme, resolveTheme, applyThemeToDOM, updateStatusBar]);

    // Re-check system preference when app resumes from background (Android fix)
    useEffect(() => {
        if (theme !== 'system' || !Capacitor.isNativePlatform()) return;

        const listener = App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                const effectiveTheme = resolveTheme('system');
                applyThemeToDOM(effectiveTheme);
                updateStatusBar(effectiveTheme);
            }
        });

        return () => listener.remove();
    }, [theme, resolveTheme, applyThemeToDOM, updateStatusBar]);

    // Persist theme to localStorage
    useEffect(() => {
        localStorage.setItem('sammy_pref_theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            if (prev === 'light') return 'dark';
            if (prev === 'dark') return 'system';
            return 'light'; // system -> light
        });
    }, []);

    // Memoize context value to prevent unnecessary re-renders
    const value = useMemo(() => {
        const effectiveTheme = resolveTheme(theme);
        return {
            theme, // 'light', 'dark', or 'system'
            effectiveTheme, // resolved to 'light' or 'dark'
            setTheme,
            toggleTheme,
            isDark: effectiveTheme === 'dark'
        };
    }, [theme, resolveTheme, toggleTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
