import { createContext, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [theme, setTheme] = useState('dark'); // Default

    useEffect(() => {
        if (user && user.preferences && user.preferences.theme) {
            setTheme(user.preferences.theme);
        } else {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) setTheme(savedTheme);
        }
    }, [user]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const changeTheme = (newTheme) => {
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, changeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
